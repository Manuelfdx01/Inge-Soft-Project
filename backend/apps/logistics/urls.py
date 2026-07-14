from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LogisticsAlertViewSet

router = DefaultRouter()
router.register(r'alerts', LogisticsAlertViewSet, basename='logistics-alerts')

urlpatterns = [
    path('', include(router.urls)),
]