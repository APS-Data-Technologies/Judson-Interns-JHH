from rest_framework import viewsets

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
