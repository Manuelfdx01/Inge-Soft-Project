from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import RecyclingGuideViewSet, AchievementViewSet

router = DefaultRouter()
router.register(r'guides', RecyclingGuideViewSet, basename='guides')
router.register(r'achievements', AchievementViewSet, basename='achievements')

urlpatterns = [
    path('', include(router.urls)),
]
