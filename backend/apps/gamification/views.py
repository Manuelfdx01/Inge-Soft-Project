import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.users.models import User
from apps.reports.models import Report, Proposal, Review
from apps.logistics.models import LogisticsAlert, CapacityLog

from .models import (
    RecyclingGuide, Achievement, UserAchievement,
    Reward, RewardRedemption, PointTransaction
)
from .serializers import (
    RecyclingGuideSerializer, AchievementSerializer,
    RewardSerializer, RewardRedemptionSerializer,
    PointTransactionSerializer
)
from .services import canjear_recompensa, inicializar_gamification_data

logger = logging.getLogger(__name__)


class IsAdminGomi(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class RecyclingGuideViewSet(viewsets.ModelViewSet):
    serializer_class = RecyclingGuideSerializer

    def get_queryset(self):
        qs = RecyclingGuide.objects.all()
        waste_type = self.request.query_params.get('waste_type')
        search = self.request.query_params.get('search')
        if waste_type:
            qs = qs.filter(waste_type__iexact=waste_type)
        if search:
            qs = qs.filter(title__icontains=search) | qs.filter(content__icontains=search)
        return qs

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

    def list(self, request, *args, **kwargs):
        # Auto-inicializar si no existen logros
        if not Achievement.objects.exists():
            inicializar_gamification_data()
        return super().list(request, *args, **kwargs)


class RewardViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Reward.objects.filter(is_active=True)
    serializer_class = RewardSerializer
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request, *args, **kwargs):
        if not Reward.objects.exists():
            inicializar_gamification_data()
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['post'], url_path='redeem',
            permission_classes=[permissions.IsAuthenticated])
    def redeem(self, request, pk=None):
        user = request.user
        success, message, redemption = canjear_recompensa(user, pk)
        if not success:
            return Response({'error': message}, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': message,
            'redemption': RewardRedemptionSerializer(redemption).data,
            'user_points': user.points,
        }, status=status.HTTP_200_OK)


class GamificationSummaryViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        user = request.user
        # Auto-inicializar si es necesario
        if not Achievement.objects.exists() or not Reward.objects.exists():
            inicializar_gamification_data()

        capacity_reports = CapacityLog.objects.filter(reported_by=user).count()
        waste_reports = Report.objects.filter(user=user).count()
        proposals_count = Proposal.objects.filter(user=user).count()
        reviews_count = Review.objects.filter(user=user).count()
        transfers_count = LogisticsAlert.objects.filter(reciclador=user, status='COMPLETADA').count()

        total_actions = capacity_reports + waste_reports + proposals_count + reviews_count + transfers_count
        kg_recycled = round((capacity_reports * 5.0) + (transfers_count * 25.0) + (waste_reports * 2.0), 1)
        co2_saved = round(kg_recycled * 1.8, 1)

        # Ranking position
        higher_rank_users = User.objects.filter(
            role__in=['CIUDADANO', 'RECICLADOR'],
            xp__gt=user.xp
        ).count()
        ranking_position = higher_rank_users + 1

        recent_txs = PointTransaction.objects.filter(user=user)[:10]
        tx_data = PointTransactionSerializer(recent_txs, many=True).data

        redemptions = RewardRedemption.objects.filter(user=user)
        redemption_data = RewardRedemptionSerializer(redemptions, many=True).data

        unlocked_count = UserAchievement.objects.filter(user=user).count()
        total_achievements = Achievement.objects.count()

        return Response({
            'user_id': user.id,
            'username': user.username,
            'role': user.role,
            'points': user.points,
            'xp': user.xp,
            'level_info': user.level_info,
            'streak_days': user.streak_days,
            'max_streak': user.max_streak,
            'last_activity_date': user.last_activity_date,
            'statistics': {
                'capacity_reports': capacity_reports,
                'waste_reports': waste_reports,
                'proposals_count': proposals_count,
                'reviews_count': reviews_count,
                'transfers_count': transfers_count,
                'total_actions': total_actions,
                'kg_recycled': kg_recycled,
                'co2_saved_kg': co2_saved,
                'ranking_position': ranking_position,
            },
            'recent_transactions': tx_data,
            'redemptions': redemption_data,
            'unlocked_achievements_count': unlocked_count,
            'total_achievements_count': total_achievements,
        })

    @action(detail=False, methods=['get'], url_path='ranking',
            permission_classes=[permissions.AllowAny])
    def ranking(self, request):
        top_users = User.objects.filter(
            role__in=['CIUDADANO', 'RECICLADOR']
        ).order_by('-xp', '-points')[:10]

        data = []
        for i, u in enumerate(top_users):
            data.append({
                'position': i + 1,
                'id': u.id,
                'username': u.username,
                'role': u.role,
                'points': u.points,
                'xp': u.xp,
                'level_info': u.level_info,
                'avatar': u.avatar.url if u.avatar else None,
            })
        return Response(data)

    @action(detail=False, methods=['get'], url_path='history',
            permission_classes=[permissions.IsAuthenticated])
    def history(self, request):
        txs = PointTransaction.objects.filter(user=request.user)
        return Response(PointTransactionSerializer(txs, many=True).data)