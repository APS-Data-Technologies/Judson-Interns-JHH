from django.contrib import admin
from .models import Guest


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ('first_name', 'last_name', 'email', 'checked_in')
    list_filter = ('checked_in',)
    search_fields = ('first_name', 'last_name', 'email')
