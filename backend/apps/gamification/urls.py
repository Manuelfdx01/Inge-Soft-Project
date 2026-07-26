from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RecyclingGuideViewSet, AchievementViewSet,
    RewardViewSet, GamificationSummaryViewSet
)

router = DefaultRouter()
router.register(r'guides', RecyclingGuideViewSet, basename='guides')
router.register(r'achievements', AchievementViewSet, basename='achievements')
router.register(r'rewards', RewardViewSet, basename='rewards')
router.register(r'user', GamificationSummaryViewSet, basename='gamification-summary')

urlpatterns = [
    path('', include(router.urls)),
]
