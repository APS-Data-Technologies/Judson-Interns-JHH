from django.contrib import admin

from .models import EventLog, Kitchen, MenuItem, Venue


@admin.register(Venue)
class VenueAdmin(admin.ModelAdmin):
    list_display = ('name', 'address', 'created_at')
    search_fields = ('name', 'address')


@admin.register(Kitchen)
class KitchenAdmin(admin.ModelAdmin):
    list_display = ('name', 'venue', 'cuisine_type')
    list_filter = ('venue',)
    search_fields = ('name', 'cuisine_type')


@admin.register(MenuItem)
class MenuItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'kitchen', 'category', 'price')
    list_filter = ('kitchen', 'category')
    search_fields = ('name', 'description')


@admin.register(EventLog)
class EventLogAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'session_id', 'timestamp')
    list_filter = ('event_type',)
    search_fields = ('session_id',)
