import statistics
from collections import Counter, defaultdict
from datetime import timedelta

from django.utils import timezone

from rest_framework import permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.authentication import IsPatron, IsStaff, IsStaffOrReadOnly, PatronSessionUser

from rest_framework.decorators import action

from .models import EventLog, Kitchen, MenuItem, Order, PatronSession, Venue
from .serializers import (
    EventLogSerializer,
    KitchenSerializer,
    MenuItemSerializer,
    OrderSerializer,
    VenueSerializer,
)


class StartSessionView(APIView):
    """Mint a patron session + bearer token for a QR-scanned table.

    Public by necessity — this is what a patron calls before they have any credential.
    It hands out nothing but an opaque token bound to a fresh session.
    """

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        table_number = str(request.data.get('table_number') or '').strip()[:32]
        # Consent is explicit: absent means declined, never assumed (scope, Live Trial).
        opt_in = request.data.get('analytics_opt_in') is True
        session = PatronSession.issue(table_number, analytics_opt_in=opt_in)
        venue = Venue.objects.first()

        # No-ops when the patron declined, so an opted-out table leaves no trace.
        session.log_event(
            'session_started',
            {'table_number': session.table_number, 'venue_id': venue.id if venue else None},
        )

        return Response(
            {
                'session_id': session.session_id,
                'token': session.token,
                'table_number': session.table_number,
                'analytics_opt_in': session.analytics_opt_in,
                'venue_id': venue.id if venue else None,
                'venue_name': venue.name if venue else 'Copper Dome',
            },
            status=201,
        )


class SessionConsentView(APIView):
    """Let a patron change their mind about the trial, either way.

    Consent that cannot be withdrawn isn't really consent, and a patron who declined at
    the splash screen has no other way to join once they see what the app does.
    """

    permission_classes = [IsPatron]

    def get(self, request):
        session = request.user.session
        return Response({
            'analytics_opt_in': session.analytics_opt_in,
            'event_count': EventLog.objects.filter(session_id=session.session_id).count(),
        })

    def post(self, request):
        session = request.user.session
        opt_in = request.data.get('analytics_opt_in')
        if not isinstance(opt_in, bool):
            return Response({'error': 'analytics_opt_in must be true or false.'}, status=400)

        was_opted_in = session.analytics_opt_in
        session.analytics_opt_in = opt_in
        session.consent_recorded_at = timezone.now()
        session.save(update_fields=['analytics_opt_in', 'consent_recorded_at'])

        removed = 0
        if was_opted_in and not opt_in:
            # Withdrawing means the data goes too, not just that collection stops.
            removed, _ = EventLog.objects.filter(session_id=session.session_id).delete()
        elif not was_opted_in and opt_in:
            # Backfill the session's start so a late opt-in still has a session to anchor
            # its metrics to, rather than events with no beginning.
            session.log_event('session_started', {'table_number': session.table_number, 'late_opt_in': True})

        return Response({
            'analytics_opt_in': session.analytics_opt_in,
            'events_removed': removed,
            'event_count': EventLog.objects.filter(session_id=session.session_id).count(),
        })


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer
    permission_classes = [IsStaffOrReadOnly]


class KitchenViewSet(viewsets.ModelViewSet):
    queryset = Kitchen.objects.select_related('venue').all()
    serializer_class = KitchenSerializer
    permission_classes = [IsStaffOrReadOnly]


class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer
    permission_classes = [IsStaffOrReadOnly]

    def get_queryset(self):
        queryset = MenuItem.objects.select_related('kitchen__venue').all()
        kitchen_id = self.request.query_params.get('kitchen')
        if kitchen_id:
            queryset = queryset.filter(kitchen_id=kitchen_id)
        return queryset


class EventLogViewSet(viewsets.ModelViewSet):
    queryset = EventLog.objects.all()
    serializer_class = EventLogSerializer
    # Patrons write their own events; only staff may read or delete the trial log.
    http_method_names = ['get', 'post', 'head', 'options']

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsPatron()]
        return [IsStaff()]

    def create(self, request, *args, **kwargs):
        """Pin the row to the authenticated session, and honour the patron's consent.

        A patron who declined instrumentation gets a 204 rather than an error — the app
        keeps working, it just leaves no trace.
        """
        user = request.user
        if isinstance(user, PatronSessionUser) and not user.session.analytics_opt_in:
            return Response(status=204)
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        user = self.request.user
        if isinstance(user, PatronSessionUser):
            serializer.save(session_id=user.session_id)
        else:
            serializer.save()


# Ticket flow for the mock kitchen display. Nothing is charged at any step.
NEXT_ORDER_STATUS = {'placed': 'preparing', 'preparing': 'ready', 'ready': 'served'}


class OrderViewSet(viewsets.ModelViewSet):
    """Simulated orders. Stands in for the Toast/Incentivio integration that is out of
    scope in phase 1 (scope 4) so the kitchen display has real tickets to show.
    """

    serializer_class = OrderSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        # A patron places and reads their own orders; the kitchen sees and advances all.
        if self.action in ('create', 'mine'):
            return [IsPatron()]
        return [IsStaff()]

    @action(detail=False, methods=['get'])
    def mine(self, request):
        """This session's orders, newest first.

        Scoped to the token's session rather than a query parameter, so one table can
        never read another's order history.
        """
        user = request.user
        if not isinstance(user, PatronSessionUser):
            return Response([])
        orders = (
            Order.objects.filter(session_id=user.session_id)
            .prefetch_related('items')
            .order_by('-created_at')
        )
        return Response(self.get_serializer(orders, many=True).data)

    def perform_create(self, serializer):
        user = self.request.user
        if isinstance(user, PatronSessionUser):
            serializer.save(session_id=user.session_id, table_number=user.session.table_number)
        else:
            serializer.save()

    def get_queryset(self):
        queryset = Order.objects.prefetch_related('items').all()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        table = self.request.query_params.get('table_number')
        if table:
            queryset = queryset.filter(table_number=table)
        return queryset

    @action(detail=True, methods=['post'])
    def advance(self, request, pk=None):
        """Move a ticket to the next state: placed -> preparing -> ready -> served."""
        order = self.get_object()
        if order.status == 'declined':
            return Response({'error': 'A declined order cannot be prepared.'}, status=400)
        next_status = NEXT_ORDER_STATUS.get(order.status)
        if next_status is None:
            return Response({'error': 'Order is already served.'}, status=400)
        order.status = next_status
        order.save(update_fields=['status', 'updated_at'])
        return Response(self.get_serializer(order).data)


class KitchenDisplayView(APIView):
    """Mock kitchen-display: open tickets grouped by the kitchen that has to cook them.

    A single patron order spans up to three kitchens, so each kitchen sees only its own
    lines -- the same split a real KDS would show.
    """

    permission_classes = [IsStaff]

    def get(self, request):
        # A declined order was never paid for, so it must never reach a cook.
        open_orders = (
            Order.objects.filter(status__in=Order.ACTIVE_STATUSES)
            .prefetch_related('items__kitchen')
            .order_by('created_at')
        )

        stations = {}
        for kitchen in Kitchen.objects.all():
            stations[kitchen.id] = {'kitchen_id': kitchen.id, 'kitchen_name': kitchen.name, 'tickets': []}

        for order in open_orders:
            by_kitchen = defaultdict(list)
            for item in order.items.all():
                by_kitchen[item.kitchen_id].append(
                    {'name': item.name, 'quantity': item.quantity}
                )
            for kitchen_id, lines in by_kitchen.items():
                station = stations.get(kitchen_id)
                if station is None:
                    continue
                station['tickets'].append({
                    'order_id': order.id,
                    'table_number': order.table_number,
                    'status': order.status,
                    'placed_at': order.created_at,
                    'lines': lines,
                })

        return Response({'stations': list(stations.values())})


class TableStatusView(APIView):
    """Per-table state for the floor view -- the "and table status" half of scope 3.4.

    There is no table registry in phase 1, so tables are derived from the activity that
    references them: open service requests, open orders, and recent session events.
    """

    permission_classes = [IsStaff]

    # A table with no activity for this long is treated as free again.
    IDLE_AFTER = timedelta(minutes=90)

    def get(self, request):
        from concierge.models import ServiceRequest

        now = timezone.now()
        tables = defaultdict(
            lambda: {
                'table_number': '',
                'status': 'free',
                'open_requests': 0,
                'oldest_request_at': None,
                'open_orders': 0,
                'order_status': None,
                'last_activity': None,
            }
        )

        def touch(table_number, when):
            entry = tables[table_number]
            entry['table_number'] = table_number
            if entry['last_activity'] is None or (when and when > entry['last_activity']):
                entry['last_activity'] = when
            return entry

        for req in ServiceRequest.objects.exclude(status='resolved'):
            entry = touch(req.table_number, req.created_at)
            entry['open_requests'] += 1
            if entry['oldest_request_at'] is None or req.created_at < entry['oldest_request_at']:
                entry['oldest_request_at'] = req.created_at

        for order in Order.objects.filter(status__in=Order.ACTIVE_STATUSES):
            entry = touch(order.table_number, order.created_at)
            entry['open_orders'] += 1
            entry['order_status'] = order.status

        # Sessions carry the table number on the session_started event only.
        for event in EventLog.objects.filter(event_type='session_started'):
            table_number = (event.metadata or {}).get('table_number')
            if table_number:
                touch(str(table_number), event.timestamp)

        results = []
        for entry in tables.values():
            if entry['open_requests']:
                entry['status'] = 'needs_attention'
            elif entry['open_orders']:
                entry['status'] = 'order_open'
            elif entry['last_activity'] and now - entry['last_activity'] < self.IDLE_AFTER:
                entry['status'] = 'seated'
            else:
                entry['status'] = 'free'
            results.append(entry)

        # Longest-waiting tables first so a server sees the urgent ones without scrolling.
        order_rank = {'needs_attention': 0, 'order_open': 1, 'seated': 2, 'free': 3}
        results.sort(key=lambda t: (order_rank[t['status']], t['table_number']))
        return Response({'tables': results})


class AnalyticsView(APIView):
    """Aggregates EventLog rows into the engagement metrics called for by the scope doc:
    concierge-open rate, AI queries per session, request types by frequency, menu-to-cart
    drop-off, and median session duration. Computed in Python rather than the ORM since
    trial-scale event volume makes per-session grouping simpler than a SQL aggregation.
    """

    permission_classes = [IsStaff]

    def get(self, request):
        events_by_session = defaultdict(list)
        for event in EventLog.objects.all().order_by('timestamp'):
            events_by_session[event.session_id].append(event)

        sessions = [session_id for session_id in events_by_session if session_id]
        total_sessions = len(sessions)

        sessions_with_ai_question = 0
        ai_question_counts = []
        sessions_with_menu_viewed = 0
        sessions_with_menu_viewed_no_cart_add = 0
        durations_seconds = []
        request_type_counter = Counter()

        for session_id in sessions:
            session_events = events_by_session[session_id]
            event_types = [e.event_type for e in session_events]

            ai_question_count = event_types.count('ai_question_asked')
            ai_question_counts.append(ai_question_count)
            if ai_question_count > 0:
                sessions_with_ai_question += 1

            if 'menu_viewed' in event_types:
                sessions_with_menu_viewed += 1
                if 'item_added_to_cart' not in event_types:
                    sessions_with_menu_viewed_no_cart_add += 1

            timestamps = [e.timestamp for e in session_events]
            duration = (max(timestamps) - min(timestamps)).total_seconds()
            durations_seconds.append(duration)

        for event in EventLog.objects.filter(event_type='service_request_created'):
            request_type = event.metadata.get('request_type', 'unknown')
            request_type_counter[request_type] += 1

        # Success criterion: "all eight event types fire correctly end to end". Report
        # per-type counts so the trial can evidence coverage rather than assert it.
        event_counts = {event_type: 0 for event_type, _ in EventLog.EVENT_TYPES}
        for event_type, count in Counter(EventLog.objects.values_list('event_type', flat=True)).items():
            if event_type in event_counts:
                event_counts[event_type] = count

        # Consent rate for the trial record: how many patrons agreed to be instrumented.
        # Sessions that declined contribute no events, so they are invisible in every
        # metric above — this is the only place their existence is counted.
        issued_sessions = PatronSession.objects.count()
        opted_in_sessions = PatronSession.objects.filter(analytics_opt_in=True).count()

        return Response({
            'total_sessions': total_sessions,
            'sessions_issued': issued_sessions,
            'sessions_opted_in': opted_in_sessions,
            'opt_in_rate': (opted_in_sessions / issued_sessions) if issued_sessions else 0,
            'event_counts': event_counts,
            'event_types_fired': sum(1 for count in event_counts.values() if count > 0),
            'event_types_total': len(event_counts),
            'concierge_open_rate': (sessions_with_ai_question / total_sessions) if total_sessions else 0,
            'ai_queries_per_session': (sum(ai_question_counts) / total_sessions) if total_sessions else 0,
            'request_types_by_frequency': dict(request_type_counter),
            'menu_to_cart_drop_off': (
                sessions_with_menu_viewed_no_cart_add / sessions_with_menu_viewed
            ) if sessions_with_menu_viewed else 0,
            'median_session_duration_seconds': (
                statistics.median(durations_seconds) if durations_seconds else 0
            ),
        })
