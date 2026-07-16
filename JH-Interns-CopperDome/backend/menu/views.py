import statistics
from collections import Counter, defaultdict

from rest_framework import viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import EventLog, Kitchen, MenuItem, Venue
from .serializers import EventLogSerializer, KitchenSerializer, MenuItemSerializer, VenueSerializer


class VenueViewSet(viewsets.ModelViewSet):
    queryset = Venue.objects.all()
    serializer_class = VenueSerializer


class KitchenViewSet(viewsets.ModelViewSet):
    queryset = Kitchen.objects.select_related('venue').all()
    serializer_class = KitchenSerializer


class MenuItemViewSet(viewsets.ModelViewSet):
    serializer_class = MenuItemSerializer

    def get_queryset(self):
        queryset = MenuItem.objects.select_related('kitchen__venue').all()
        kitchen_id = self.request.query_params.get('kitchen')
        if kitchen_id:
            queryset = queryset.filter(kitchen_id=kitchen_id)
        return queryset


class EventLogViewSet(viewsets.ModelViewSet):
    queryset = EventLog.objects.all()
    serializer_class = EventLogSerializer


class AnalyticsView(APIView):
    """Aggregates EventLog rows into the engagement metrics called for by the scope doc:
    concierge-open rate, AI queries per session, request types by frequency, menu-to-cart
    drop-off, and median session duration. Computed in Python rather than the ORM since
    trial-scale event volume makes per-session grouping simpler than a SQL aggregation.
    """

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

        return Response({
            'total_sessions': total_sessions,
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
