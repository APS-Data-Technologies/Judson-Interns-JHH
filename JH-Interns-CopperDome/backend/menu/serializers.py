from rest_framework import serializers

from .models import EventLog, Kitchen, MenuItem, Order, OrderItem, Venue


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


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'menu_item', 'kitchen', 'kitchen_name', 'name', 'price', 'quantity']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ['id', 'session_id', 'table_number', 'status', 'total', 'created_at', 'items']
        read_only_fields = ['created_at']
        # Derived from the patron's token in the view — see OrderViewSet.perform_create.
        extra_kwargs = {
            'session_id': {'required': False},
            'table_number': {'required': False},
        }

    def create(self, validated_data):
        items = validated_data.pop('items', [])
        order = Order.objects.create(**validated_data)
        for item in items:
            # Snapshot the kitchen name so a ticket stays readable if the menu changes.
            kitchen = item.get('kitchen')
            item.setdefault('kitchen_name', kitchen.name if kitchen else '')
            OrderItem.objects.create(order=order, **item)
        return order
