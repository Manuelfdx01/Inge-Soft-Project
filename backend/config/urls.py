from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/collection-points/', include('apps.collection_points.urls')),
    path('api/logistics/', include('apps.logistics.urls')),
    path('api/gamification/', include('apps.gamification.urls')),
    path('api/reports/', include('apps.reports.urls')),
]
