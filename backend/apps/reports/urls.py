from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ReviewViewSet, ProposalViewSet, ReportViewSet, CommunityPostViewSet

# Router principal: propuestas, reportes de incidencia y comunidad
router = DefaultRouter()
router.register(r'proposals', ProposalViewSet, basename='proposals')
router.register(r'reports', ReportViewSet, basename='reports')
router.register(r'community', CommunityPostViewSet, basename='community')

# Router anidado para calificaciones: se monta bajo collection-points/<point_pk>/
reviews_router = DefaultRouter()
reviews_router.register(r'reviews', ReviewViewSet, basename='reviews')

urlpatterns = [
    path('', include(router.urls)),
    # Reviews anidadas bajo collection-points/<point_pk>/
    path('', include(reviews_router.urls)),
]