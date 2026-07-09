from django.urls import path
from .views import StatusView, GuestListView

urlpatterns = [
    path('status/', StatusView.as_view(), name='status'),
    path('guests/', GuestListView.as_view(), name='guest-list'),
]
