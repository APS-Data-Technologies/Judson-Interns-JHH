from rest_framework import serializers
from .models import ServiceRequest


class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = ['id', 'session_id', 'table_number', 'request_type', 'status', 'created_at', 'resolved_at']
        read_only_fields = ['id', 'created_at', 'resolved_at']
        # The view fills these from the patron's token rather than trusting the body,
        # so a client no longer has to send them (and can't spoof them).
        extra_kwargs = {
            'session_id': {'required': False},
            'table_number': {'required': False},
        }
