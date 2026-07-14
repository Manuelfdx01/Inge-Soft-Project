from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet
from .notification_views import NotificationViewSet

router = DefaultRouter()
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'', UserViewSet, basename='users')

urlpatterns = [
    path('', include(router.urls)),
]