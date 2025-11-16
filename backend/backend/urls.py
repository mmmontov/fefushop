from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularSwaggerView, SpectacularAPIView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # path('api/v1/drf-auth/', include('rest_framework.urls')),
    path('api/users/', include('users.urls')),
    path('api/items/', include('items.urls')),
    path('api/', include('favorites.urls')),
    path('api/', include('contacts.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('notifications.urls')),
]