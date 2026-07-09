from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('concierge.urls')),
    path('api/menu/', include('menu.urls')),
]
