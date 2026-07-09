from django.test import TestCase
from rest_framework.test import APIClient

from .models import EventLog, Kitchen, MenuItem, Venue


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
        response = self.client.post(
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
