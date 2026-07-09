from django.db import models
from django.utils import timezone


class Venue(models.Model):
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    configuration = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = 'venues'

    def __str__(self):
        return self.name


class Kitchen(models.Model):
    venue = models.ForeignKey(Venue, related_name='kitchens', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    cuisine_type = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class MenuItem(models.Model):
    kitchen = models.ForeignKey(Kitchen, related_name='menu_items', on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2)
    category = models.CharField(max_length=100)
    dietary_tags = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class EventLog(models.Model):
    EVENT_TYPES = [
        ('session_started', 'session_started'),
        ('menu_viewed', 'menu_viewed'),
        ('menu_item_viewed', 'menu_item_viewed'),
        ('ai_question_asked', 'ai_question_asked'),
        ('item_added_to_cart', 'item_added_to_cart'),
        ('mock_checkout_started', 'mock_checkout_started'),
        ('mock_checkout_completed', 'mock_checkout_completed'),
        ('service_request_created', 'service_request_created'),
    ]

    event_type = models.CharField(max_length=64, choices=EVENT_TYPES)
    session_id = models.CharField(max_length=255, blank=True, null=True)
    timestamp = models.DateTimeField(default=timezone.now)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.event_type} @ {self.timestamp:%Y-%m-%d %H:%M}"
