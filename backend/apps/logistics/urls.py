from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    LogisticsAlertViewSet,
    CapacityLogViewSet,
    RecyclerDashboardView,
    AvailabilityView,
    RecyclerReportsView,
    CapacityUpdateView,
    MyZoneView,
)

router = DefaultRouter()

router.register(
    r'alerts',
    LogisticsAlertViewSet,
    basename='alerts'
)

router.register(
    r'dashboard',
    RecyclerDashboardView,
    basename='dashboard'
)

router.register(
    r'availability',
    AvailabilityView,
    basename='availability'
)

router.register(
    r'reports',
    RecyclerReportsView,
    basename='reports'
)

router.register(
    r'my-zone',
    MyZoneView,
    basename='my-zone'
)

router.register(
    r'points',
    CapacityUpdateView,
    basename='points'
)

router.register(
    r'historial',
    CapacityLogViewSet,
    basename='capacity-history'
)

urlpatterns = [
    path('', include(router.urls)),
]