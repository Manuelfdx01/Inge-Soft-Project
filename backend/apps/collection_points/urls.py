from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CollectionPointViewSet, WasteTypeViewSet

router = DefaultRouter()
router.register(r'waste-types', WasteTypeViewSet, basename='waste-types')
router.register(r'', CollectionPointViewSet, basename='collection-points')

urlpatterns = [
    path('', include(router.urls)),
]