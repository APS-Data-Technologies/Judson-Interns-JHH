from django.contrib import admin
from .models import ServiceRequest


@admin.register(ServiceRequest)
class ServiceRequestAdmin(admin.ModelAdmin):
    list_display = ('request_type', 'table_number', 'status', 'created_at')
    list_filter = ('request_type', 'status')
    search_fields = ('session_id', 'table_number')
