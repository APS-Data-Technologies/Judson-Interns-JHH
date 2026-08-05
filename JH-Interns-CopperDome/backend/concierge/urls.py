from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import ConciergeAskView, ServiceRequestViewSet, StaffLoginView, StatusView

router = DefaultRouter()
router.register(r'service-requests', ServiceRequestViewSet, basename='service-request')

urlpatterns = [
    path('status/', StatusView.as_view(), name='status'),
    path('staff/login/', StaffLoginView.as_view(), name='staff-login'),
    path('concierge/ask/', ConciergeAskView.as_view(), name='concierge-ask'),
] + router.urls
