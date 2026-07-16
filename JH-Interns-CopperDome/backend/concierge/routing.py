from django.urls import path

from .consumers import StaffFeedConsumer

websocket_urlpatterns = [
    path('ws/staff/', StaffFeedConsumer.as_asgi()),
]
