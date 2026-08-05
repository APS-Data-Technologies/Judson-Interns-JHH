from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    AnalyticsView,
    EventLogViewSet,
    KitchenDisplayView,
    KitchenViewSet,
    MenuItemViewSet,
    OrderViewSet,
    SessionConsentView,
    StartSessionView,
    TableStatusView,
    VenueViewSet,
)

router = DefaultRouter()
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'kitchens', KitchenViewSet, basename='kitchen')
router.register(r'menu-items', MenuItemViewSet, basename='menu-item')
router.register(r'events', EventLogViewSet, basename='event')
router.register(r'orders', OrderViewSet, basename='order')

urlpatterns = [
    path('sessions/start/', StartSessionView.as_view(), name='session-start'),
    path('sessions/consent/', SessionConsentView.as_view(), name='session-consent'),
    path('analytics/', AnalyticsView.as_view(), name='analytics'),
    path('tables/', TableStatusView.as_view(), name='table-status'),
    path('kitchen-display/', KitchenDisplayView.as_view(), name='kitchen-display'),
] + router.urls
