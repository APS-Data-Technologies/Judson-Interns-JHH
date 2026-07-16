from django.db import models
from django.utils import timezone


class ServiceRequest(models.Model):
    REQUEST_TYPES = [
        ('call_server', 'call_server'),
        ('water', 'water'),
        ('check', 'check'),
        ('surprise_me', 'surprise_me'),
    ]
    STATUSES = [
        ('pending', 'pending'),
        ('acknowledged', 'acknowledged'),
        ('resolved', 'resolved'),
    ]

    session_id = models.CharField(max_length=255)
    table_number = models.CharField(max_length=32)
    request_type = models.CharField(max_length=32, choices=REQUEST_TYPES)
    status = models.CharField(max_length=16, choices=STATUSES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    resolved_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.request_type} @ table {self.table_number} ({self.status})"
