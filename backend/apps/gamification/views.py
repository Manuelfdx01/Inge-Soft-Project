import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import RecyclingGuide, Achievement
from .serializers import RecyclingGuideSerializer, AchievementSerializer, RankingSerializer
from apps.users.models import User

logger = logging.getLogger(__name__)


class IsAdminGomi(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class RecyclingGuideViewSet(viewsets.ModelViewSet):
    queryset = RecyclingGuide.objects.all()
    serializer_class = RecyclingGuideSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminGomi()]

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        logger.info(f'Guía creada por {self.request.user.username}')


class AchievementViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Achievement.objects.all()
    serializer_class = AchievementSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='ranking',
            permission_classes=[permissions.AllowAny])
    def ranking(self, request):
        top = User.objects.filter(
            role__in=['CIUDADANO', 'RECICLADOR']
        ).order_by('-points')[:10]

        data = [
            {'position': i + 1, 'username': u.username, 'points': u.points}
            for i, u in enumerate(top)
        ]
        return Response(data)