from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, ProposalViewSet, ReportViewSet

router = DefaultRouter()
router.register(r'proposals', ProposalViewSet, basename='proposals')
router.register(r'reports', ReportViewSet, basename='reports')

reviews_router = DefaultRouter()
reviews_router.register(r'reviews', ReviewViewSet, basename='reviews')

urlpatterns = [
    path('', include(router.urls)),
]