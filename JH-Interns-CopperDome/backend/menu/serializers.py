from rest_framework import serializers

from .models import EventLog, Kitchen, MenuItem, Venue


class VenueSerializer(serializers.ModelSerializer):
    class Meta:
        model = Venue
        fields = ['id', 'name', 'address', 'configuration']


class KitchenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Kitchen
        fields = ['id', 'venue', 'name', 'cuisine_type', 'description']


class MenuItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MenuItem
        fields = ['id', 'kitchen', 'name', 'description', 'price', 'category', 'dietary_tags']


class EventLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventLog
        fields = ['id', 'event_type', 'session_id', 'timestamp', 'metadata']
