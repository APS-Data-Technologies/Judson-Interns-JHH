import anthropic
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import permissions, status, viewsets
from rest_framework.authtoken.models import Token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.response import Response
from rest_framework.views import APIView

from backend.authentication import IsPatron, IsStaff, PatronSessionUser
from menu.models import EventLog

from .claude_client import ask_concierge, is_stubbed
from .consumers import STAFF_FEED_GROUP
from .models import ServiceRequest
from .serializers import ServiceRequestSerializer


def broadcast(event_name, instance):
    """Push a request to the staff feed.

    Never let a transport failure turn a patron's request into a 500 -- the staff
    view polls as a fallback, so a dropped frame is recoverable but a failed POST
    is not.
    """
    channel_layer = get_channel_layer()
    if channel_layer is None:
        return
    try:
        async_to_sync(channel_layer.group_send)(
            STAFF_FEED_GROUP,
            {
                'type': 'staff.request',
                'payload': {'event': event_name, 'request': ServiceRequestSerializer(instance).data},
            },
        )
    except Exception:
        pass


class StatusView(APIView):
    """Health check — deliberately public so uptime probes need no credential."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'message': 'Copper Dome Concierge API is available.'})


class StaffLoginView(ObtainAuthToken):
    """Exchange staff credentials for an API token (scope 5.6)."""

    authentication_classes = []
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        if not user.is_staff:
            return Response(
                {'error': 'This account is not authorised for the staff views.'},
                status=status.HTTP_403_FORBIDDEN,
            )

        token, _ = Token.objects.get_or_create(user=user)
        return Response({'token': token.key, 'username': user.get_username()})


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_permissions(self):
        # Patrons raise requests for their own table; staff see and clear every table's.
        if self.request.method == 'POST' and self.action == 'create':
            return [IsPatron()]
        return [IsStaff()]

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if isinstance(user, PatronSessionUser):
            # Trust the token, not the body — a patron cannot raise a request for
            # someone else's table.
            instance = serializer.save(
                session_id=user.session_id,
                table_number=user.session.table_number or serializer.validated_data.get('table_number', ''),
            )
        else:
            instance = serializer.save()

        # The request itself always reaches the floor — service is never withheld. Only
        # the trial event is gated on consent.
        metadata = {
            'request_type': instance.request_type,
            'table_number': instance.table_number,
            'service_request_id': instance.id,
        }
        if isinstance(user, PatronSessionUser):
            user.session.log_event('service_request_created', metadata)
        else:
            EventLog.objects.create(
                event_type='service_request_created',
                session_id=instance.session_id,
                metadata=metadata,
            )

        broadcast('service_request_created', instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        broadcast('service_request_updated', instance)


class ConciergeAskView(APIView):
    permission_classes = [IsPatron]

    def post(self, request):
        user = request.user
        # The session comes from the token, so AI usage is always attributed correctly.
        session_id = user.session_id if isinstance(user, PatronSessionUser) else request.data.get('session_id')
        message = request.data.get('message')
        history = request.data.get('history') or []

        if not message:
            return Response({'error': 'message is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            reply = ask_concierge(message, history)
        except anthropic.APIError:
            return Response(
                {'error': 'The concierge is unavailable right now. Please ask your server.'},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        # `stubbed` marks answers served by the local fallback rather than Claude, so the
        # findings memo can separate them from real model responses. The question text is
        # only ever stored for a patron who opted in.
        metadata = {'question': message, 'stubbed': is_stubbed()}
        if isinstance(user, PatronSessionUser):
            user.session.log_event('ai_question_asked', metadata)
        else:
            EventLog.objects.create(
                event_type='ai_question_asked', session_id=session_id, metadata=metadata
            )

        return Response({'reply': reply, 'stubbed': is_stubbed()})
