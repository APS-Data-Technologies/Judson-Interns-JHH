import anthropic
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from menu.models import EventLog

from .claude_client import ask_concierge
from .consumers import STAFF_FEED_GROUP
from .models import ServiceRequest
from .serializers import ServiceRequestSerializer


class StatusView(APIView):
    def get(self, request):
        return Response({'message': 'Copper Dome Concierge API is available.'})


class ServiceRequestViewSet(viewsets.ModelViewSet):
    queryset = ServiceRequest.objects.all()
    serializer_class = ServiceRequestSerializer
    http_method_names = ['get', 'post', 'patch', 'head', 'options']

    def get_queryset(self):
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def perform_create(self, serializer):
        instance = serializer.save()

        EventLog.objects.create(
            event_type='service_request_created',
            session_id=instance.session_id,
            metadata={
                'request_type': instance.request_type,
                'table_number': instance.table_number,
                'service_request_id': instance.id,
            },
        )

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            STAFF_FEED_GROUP,
            {
                'type': 'staff.request',
                'payload': {
                    'event': 'service_request_created',
                    'request': ServiceRequestSerializer(instance).data,
                },
            },
        )

    def perform_update(self, serializer):
        instance = serializer.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            STAFF_FEED_GROUP,
            {
                'type': 'staff.request',
                'payload': {
                    'event': 'service_request_updated',
                    'request': ServiceRequestSerializer(instance).data,
                },
            },
        )


class ConciergeAskView(APIView):
    def post(self, request):
        session_id = request.data.get('session_id')
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

        EventLog.objects.create(
            event_type='ai_question_asked',
            session_id=session_id,
            metadata={'question': message},
        )

        return Response({'reply': reply})
