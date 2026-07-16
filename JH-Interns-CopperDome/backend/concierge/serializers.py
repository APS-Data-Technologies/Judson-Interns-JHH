from rest_framework import serializers
from .models import ServiceRequest


class ServiceRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRequest
        fields = ['id', 'session_id', 'table_number', 'request_type', 'status', 'created_at', 'resolved_at']
        read_only_fields = ['id', 'created_at', 'resolved_at']
