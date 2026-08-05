from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from concierge.models import ServiceRequest

from .models import EventLog, Kitchen, MenuItem, Order, OrderItem, PatronSession, Venue


def staff_client():
    """An APIClient authenticated as a staff account."""
    user = get_user_model().objects.create_user(
        username=f'floor-{PatronSession.objects.count()}-{EventLog.objects.count()}',
        password='pw',
        is_staff=True,
    )
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Token {Token.objects.create(user=user).key}')
    return client


def patron_client(table_number='04', analytics_opt_in=True):
    """An APIClient authenticated as a patron session. Returns (client, session)."""
    session = PatronSession.issue(table_number, analytics_opt_in=analytics_opt_in)
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f'Patron {session.token}')
    return client, session


class TrialConsentTests(TestCase):
    """Scope, Live Trial: "Real patrons opt in; event logging is on".

    A patron who declines must still get the full experience, and leave no trace.
    """

    def setUp(self):
        self.anon = APIClient()
        Venue.objects.create(name='Copper Dome', address='123 Main St')

    def test_consent_defaults_to_declined_when_not_asked(self):
        response = self.anon.post('/api/menu/sessions/start/', {'table_number': '04'}, format='json')

        self.assertFalse(response.json()['analytics_opt_in'])
        # Silence is not consent — no session_started row for a patron who never agreed.
        self.assertEqual(EventLog.objects.count(), 0)

    def test_opting_in_starts_the_event_log(self):
        response = self.anon.post(
            '/api/menu/sessions/start/',
            {'table_number': '04', 'analytics_opt_in': True},
            format='json',
        )

        self.assertTrue(response.json()['analytics_opt_in'])
        self.assertEqual(EventLog.objects.filter(event_type='session_started').count(), 1)

    def test_declined_session_writes_no_events(self):
        client, _ = patron_client(analytics_opt_in=False)

        response = client.post('/api/menu/events/', {'event_type': 'menu_viewed'}, format='json')

        # 204, not an error — the app keeps working, it just records nothing.
        self.assertEqual(response.status_code, 204)
        self.assertEqual(EventLog.objects.count(), 0)

    def test_declined_patron_still_gets_service(self):
        client, _ = patron_client(analytics_opt_in=False)

        response = client.post(
            '/api/service-requests/', {'request_type': 'water'}, format='json'
        )

        # Service is never withheld for declining — only the trial event is suppressed.
        self.assertEqual(response.status_code, 201)
        self.assertEqual(ServiceRequest.objects.count(), 1)
        self.assertEqual(EventLog.objects.filter(event_type='service_request_created').count(), 0)

    def test_declined_patron_can_still_use_the_concierge_without_being_logged(self):
        client, _ = patron_client(analytics_opt_in=False)

        with patch('concierge.views.ask_concierge', return_value='Try the chowder.'):
            response = client.post('/api/concierge/ask/', {'message': 'What is good?'}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertEqual(EventLog.objects.filter(event_type='ai_question_asked').count(), 0)

    def test_patron_can_opt_in_later(self):
        client, session = patron_client(analytics_opt_in=False)

        response = client.post('/api/menu/sessions/consent/', {'analytics_opt_in': True}, format='json')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()['analytics_opt_in'])
        # A late opt-in backfills session_started so the metrics have an anchor.
        self.assertEqual(EventLog.objects.filter(event_type='session_started').count(), 1)
        # And events now record.
        self.assertEqual(
            client.post('/api/menu/events/', {'event_type': 'menu_viewed'}, format='json').status_code, 201
        )

    def test_withdrawing_consent_deletes_the_session_data(self):
        client, session = patron_client(analytics_opt_in=True)
        client.post('/api/menu/events/', {'event_type': 'menu_viewed'}, format='json')
        client.post('/api/menu/events/', {'event_type': 'menu_item_viewed'}, format='json')
        self.assertEqual(EventLog.objects.filter(session_id=session.session_id).count(), 2)

        response = client.post('/api/menu/sessions/consent/', {'analytics_opt_in': False}, format='json')

        # Withdrawing removes the data, not just future collection.
        self.assertEqual(response.json()['events_removed'], 2)
        self.assertEqual(EventLog.objects.filter(session_id=session.session_id).count(), 0)
        self.assertEqual(
            client.post('/api/menu/events/', {'event_type': 'menu_viewed'}, format='json').status_code, 204
        )

    def test_consent_endpoint_reports_current_state(self):
        client, session = patron_client(analytics_opt_in=True)
        client.post('/api/menu/events/', {'event_type': 'menu_viewed'}, format='json')

        payload = client.get('/api/menu/sessions/consent/').json()

        self.assertTrue(payload['analytics_opt_in'])
        self.assertEqual(payload['event_count'], 1)

    def test_consent_endpoint_rejects_a_non_boolean(self):
        client, _ = patron_client()

        response = client.post('/api/menu/sessions/consent/', {'analytics_opt_in': 'yes'}, format='json')

        self.assertEqual(response.status_code, 400)

    def test_analytics_reports_the_opt_in_rate(self):
        PatronSession.issue('01', analytics_opt_in=True)
        PatronSession.issue('02', analytics_opt_in=False)

        payload = staff_client().get('/api/menu/analytics/').json()

        self.assertEqual(payload['sessions_issued'], 2)
        self.assertEqual(payload['sessions_opted_in'], 1)
        self.assertEqual(payload['opt_in_rate'], 0.5)


class MenuApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.venue = Venue.objects.create(
            name='Copper Dome Concierge',
            address='123 Main St',
            configuration={'theme': 'coastal'},
        )
        self.kitchen = Kitchen.objects.create(
            venue=self.venue,
            name='The Copper Rail Kitchen',
            cuisine_type='American coastal comfort',
            description='Grilled, smoked, and wood-fired comfort food.',
        )
        self.menu_item = MenuItem.objects.create(
            kitchen=self.kitchen,
            name='Smoked Clam Chowder',
            description='House-smoked clams, roasted corn, potato, sourdough croutons',
            price='9.00',
            category='Starters',
            dietary_tags=['V', 'GF'],
        )

    def test_menu_items_endpoint_filters_by_kitchen(self):
        response = self.client.get('/api/menu/menu-items/', {'kitchen': self.kitchen.id})

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(len(payload), 1)
        self.assertEqual(payload[0]['name'], 'Smoked Clam Chowder')

    def test_event_log_endpoint_accepts_supported_events(self):
        client, session = patron_client()
        response = client.post(
            '/api/menu/events/',
            {
                'event_type': 'menu_viewed',
                'session_id': 'session-123',
                'timestamp': '2026-07-08T12:00:00Z',
                'metadata': {'source': 'home'},
            },
            format='json',
        )

        self.assertEqual(response.status_code, 201)
        self.assertEqual(EventLog.objects.count(), 1)
        self.assertEqual(EventLog.objects.get().event_type, 'menu_viewed')
        # The row is pinned to the token's session, not the body's claim.
        self.assertEqual(EventLog.objects.get().session_id, session.session_id)


class EndpointAuthTests(TestCase):
    """Scope 5.6: authenticated endpoints. These lock the contract in place."""

    def setUp(self):
        self.anon = APIClient()

    def test_menu_reads_stay_public_for_the_splash_screen(self):
        for path in ['/api/menu/venues/', '/api/menu/kitchens/', '/api/menu/menu-items/', '/api/status/']:
            self.assertEqual(self.anon.get(path).status_code, 200, path)

    def test_staff_surfaces_reject_anonymous_callers(self):
        for path in ['/api/menu/analytics/', '/api/menu/tables/', '/api/menu/kitchen-display/',
                     '/api/menu/orders/', '/api/menu/events/', '/api/service-requests/']:
            self.assertIn(self.anon.get(path).status_code, (401, 403), path)

    def test_staff_surfaces_reject_a_patron_token(self):
        client, _ = patron_client()
        for path in ['/api/menu/analytics/', '/api/menu/tables/', '/api/menu/kitchen-display/',
                     '/api/menu/events/', '/api/service-requests/']:
            self.assertEqual(client.get(path).status_code, 403, path)

    def test_anonymous_cannot_write_events_or_requests(self):
        self.assertIn(
            self.anon.post('/api/menu/events/', {'event_type': 'menu_viewed'}, format='json').status_code,
            (401, 403),
        )
        self.assertIn(
            self.anon.post(
                '/api/service-requests/',
                {'session_id': 'x', 'table_number': '04', 'request_type': 'water'},
                format='json',
            ).status_code,
            (401, 403),
        )
        self.assertEqual(EventLog.objects.count(), 0)
        self.assertEqual(ServiceRequest.objects.count(), 0)

    def test_anonymous_cannot_delete_the_menu(self):
        venue = Venue.objects.create(name='Copper Dome', address='123 Main St')
        kitchen = Kitchen.objects.create(venue=venue, name='Rail', cuisine_type='American')
        item = MenuItem.objects.create(kitchen=kitchen, name='Chowder', price='9.00', category='Starters')

        self.assertIn(self.anon.delete(f'/api/menu/menu-items/{item.id}/').status_code, (401, 403))
        self.assertTrue(MenuItem.objects.filter(pk=item.pk).exists())

    def test_expired_patron_token_is_rejected(self):
        client, session = patron_client()
        PatronSession.objects.filter(pk=session.pk).update(
            created_at=timezone.now() - PatronSession.TOKEN_TTL - timedelta(minutes=1)
        )

        response = client.post('/api/menu/events/', {'event_type': 'menu_viewed'}, format='json')

        # 401, not 403: the credential itself is no longer valid, so the patron should
        # rescan the table QR rather than be told they lack permission.
        self.assertEqual(response.status_code, 401)
        self.assertIn('expired', response.json()['detail'].lower())

    def test_session_start_is_public_and_issues_a_usable_token(self):
        Venue.objects.create(name='Copper Dome', address='123 Main St')

        started = self.anon.post(
            '/api/menu/sessions/start/',
            {'table_number': '12', 'analytics_opt_in': True},
            format='json',
        )

        self.assertEqual(started.status_code, 201)
        payload = started.json()
        self.assertEqual(payload['table_number'], '12')

        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Patron {payload['token']}")
        self.assertEqual(
            client.post('/api/menu/events/', {'event_type': 'menu_viewed'}, format='json').status_code, 201
        )
        # Starting a session records session_started server-side.
        self.assertEqual(EventLog.objects.filter(event_type='session_started').count(), 1)

    def test_non_staff_account_cannot_obtain_a_staff_token(self):
        get_user_model().objects.create_user(username='diner', password='pw')

        response = self.anon.post(
            '/api/staff/login/', {'username': 'diner', 'password': 'pw'}, format='json'
        )

        self.assertEqual(response.status_code, 403)


class AnalyticsApiTests(TestCase):
    def setUp(self):
        self.client = staff_client()

    def test_analytics_computes_engagement_metrics(self):
        EventLog.objects.create(
            event_type='session_started', session_id='s1', timestamp='2026-07-08T12:00:00Z'
        )
        EventLog.objects.create(
            event_type='menu_viewed', session_id='s1', timestamp='2026-07-08T12:00:10Z'
        )
        EventLog.objects.create(
            event_type='ai_question_asked', session_id='s1', timestamp='2026-07-08T12:00:20Z'
        )
        EventLog.objects.create(
            event_type='item_added_to_cart', session_id='s1', timestamp='2026-07-08T12:00:30Z'
        )
        EventLog.objects.create(
            event_type='session_started', session_id='s2', timestamp='2026-07-08T12:05:00Z'
        )
        EventLog.objects.create(
            event_type='menu_viewed', session_id='s2', timestamp='2026-07-08T12:05:10Z'
        )
        EventLog.objects.create(
            event_type='service_request_created',
            session_id='s2',
            timestamp='2026-07-08T12:05:20Z',
            metadata={'request_type': 'water', 'table_number': '02'},
        )

        response = self.client.get('/api/menu/analytics/')

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual(payload['total_sessions'], 2)
        self.assertEqual(payload['concierge_open_rate'], 0.5)
        self.assertEqual(payload['request_types_by_frequency'], {'water': 1})
        self.assertEqual(payload['menu_to_cart_drop_off'], 0.5)

    def test_analytics_reports_event_type_coverage(self):
        EventLog.objects.create(
            event_type='session_started', session_id='s1', timestamp='2026-07-08T12:00:00Z'
        )

        payload = self.client.get('/api/menu/analytics/').json()

        # Every one of the eight schema types is reported, fired or not, so the trial can
        # evidence the "all eight event types fire" criterion rather than assert it.
        self.assertEqual(payload['event_types_total'], 8)
        self.assertEqual(len(payload['event_counts']), 8)
        self.assertEqual(payload['event_types_fired'], 1)
        self.assertEqual(payload['event_counts']['session_started'], 1)
        self.assertEqual(payload['event_counts']['ai_question_asked'], 0)


class OrderAndKitchenDisplayTests(TestCase):
    def setUp(self):
        self.client = staff_client()
        self.patron, self.patron_session = patron_client()
        venue = Venue.objects.create(name='Copper Dome', address='123 Main St')
        self.rail = Kitchen.objects.create(venue=venue, name='The Copper Rail Kitchen', cuisine_type='American')
        self.garden = Kitchen.objects.create(venue=venue, name='Dome Garden Kitchen', cuisine_type='Plant-forward')
        self.chowder = MenuItem.objects.create(
            kitchen=self.rail, name='Smoked Clam Chowder', price='9.00', category='Starters'
        )
        self.chickpeas = MenuItem.objects.create(
            kitchen=self.garden, name='Crispy Chickpea Bites', price='8.00', category='Small Plates'
        )

    def _create_order(self):
        # Orders are placed by the patron, not by staff.
        return self.patron.post(
            '/api/menu/orders/',
            {
                'session_id': 'session-abc',
                'table_number': '04',
                'total': '17.00',
                'items': [
                    {'menu_item': self.chowder.id, 'kitchen': self.rail.id, 'name': 'Smoked Clam Chowder',
                     'price': '9.00', 'quantity': 1},
                    {'menu_item': self.chickpeas.id, 'kitchen': self.garden.id, 'name': 'Crispy Chickpea Bites',
                     'price': '8.00', 'quantity': 2},
                ],
            },
            format='json',
        )

    def test_create_order_persists_lines_and_snapshots_kitchen_name(self):
        response = self._create_order()

        self.assertEqual(response.status_code, 201)
        self.assertEqual(Order.objects.count(), 1)
        self.assertEqual(OrderItem.objects.count(), 2)
        self.assertEqual(
            OrderItem.objects.get(name='Crispy Chickpea Bites').kitchen_name, 'Dome Garden Kitchen'
        )

    def test_kitchen_display_splits_one_order_across_its_kitchens(self):
        self._create_order()

        payload = self.client.get('/api/menu/kitchen-display/').json()
        by_name = {s['kitchen_name']: s for s in payload['stations']}

        # One patron order, two kitchens â€” each sees only the lines it has to cook.
        self.assertEqual(len(by_name['The Copper Rail Kitchen']['tickets']), 1)
        self.assertEqual(len(by_name['Dome Garden Kitchen']['tickets']), 1)
        self.assertEqual(by_name['The Copper Rail Kitchen']['tickets'][0]['lines'],
                         [{'name': 'Smoked Clam Chowder', 'quantity': 1}])

    def test_advance_walks_the_ticket_to_served_then_refuses(self):
        order = Order.objects.create(session_id='s1', table_number='04')

        for expected in ['preparing', 'ready', 'served']:
            response = self.client.post(f'/api/menu/orders/{order.id}/advance/')
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json()['status'], expected)

        self.assertEqual(self.client.post(f'/api/menu/orders/{order.id}/advance/').status_code, 400)

    def test_served_orders_leave_the_kitchen_display(self):
        self._create_order()
        Order.objects.update(status='served')

        payload = self.client.get('/api/menu/kitchen-display/').json()

        self.assertEqual(sum(len(s['tickets']) for s in payload['stations']), 0)


class TableStatusTests(TestCase):
    def setUp(self):
        self.client = staff_client()

    def _tables(self):
        return {t['table_number']: t for t in self.client.get('/api/menu/tables/').json()['tables']}

    def test_open_request_marks_the_table_as_needing_attention(self):
        ServiceRequest.objects.create(session_id='s1', table_number='04', request_type='water')

        table = self._tables()['04']

        self.assertEqual(table['status'], 'needs_attention')
        self.assertEqual(table['open_requests'], 1)

    def test_resolved_request_does_not_hold_the_table(self):
        ServiceRequest.objects.create(
            session_id='s1', table_number='04', request_type='water', status='resolved'
        )

        self.assertEqual(self._tables(), {})

    def test_open_order_marks_the_table_as_cooking(self):
        Order.objects.create(session_id='s1', table_number='09', status='preparing')

        table = self._tables()['09']

        self.assertEqual(table['status'], 'order_open')
        self.assertEqual(table['order_status'], 'preparing')

    def test_recent_session_marks_the_table_seated(self):
        EventLog.objects.create(
            event_type='session_started',
            session_id='s1',
            timestamp=timezone.now(),
            metadata={'table_number': '11'},
        )

        self.assertEqual(self._tables()['11']['status'], 'seated')

    def test_needs_attention_outranks_a_cooking_order_on_the_same_table(self):
        Order.objects.create(session_id='s1', table_number='07', status='preparing')
        ServiceRequest.objects.create(session_id='s1', table_number='07', request_type='check')

        table = self._tables()['07']

        self.assertEqual(table['status'], 'needs_attention')
        self.assertEqual(table['open_orders'], 1)

