from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
    TokenBlacklistView,
)

urlpatterns = [
    path('admin/', admin.site.urls),

    # Auth JWT
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/logout/', TokenBlacklistView.as_view(), name='token_blacklist'),

    # Apps
    path('api/users/', include('apps.users.urls')),
    path('api/collection-points/', include('apps.collection_points.urls')),
    path('api/collection-points/<int:point_pk>/reviews/', include('apps.reports.urls')),
    path('api/collection-points/<int:point_pk>/historial/', include('apps.logistics.urls')),
    path('api/', include('apps.reports.urls')),
    path('api/logistics/', include('apps.logistics.urls')),
    path('api/gamification/', include('apps.gamification.urls')),
]