from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogisticsAlertViewSet, CapacityLogViewSet

router = DefaultRouter()
router.register(r'alerts', LogisticsAlertViewSet, basename='logistics-alerts')

capacity_router = DefaultRouter()
capacity_router.register(r'historial', CapacityLogViewSet, basename='capacity-logs')

urlpatterns = [
    path('', include(router.urls)),
]