from rest_framework.routers import DefaultRouter

from .views import EventLogViewSet, KitchenViewSet, MenuItemViewSet, VenueViewSet

router = DefaultRouter()
router.register(r'venues', VenueViewSet, basename='venue')
router.register(r'kitchens', KitchenViewSet, basename='kitchen')
router.register(r'menu-items', MenuItemViewSet, basename='menu-item')
router.register(r'events', EventLogViewSet, basename='event')

urlpatterns = router.urls
