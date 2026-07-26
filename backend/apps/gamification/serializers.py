from rest_framework import serializers
from apps.reports.models import Report, Proposal, Review
from apps.logistics.models import LogisticsAlert, CapacityLog
from .models import (
    RecyclingGuide, Achievement, UserAchievement,
    Reward, RewardRedemption, PointTransaction
)


class RecyclingGuideSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True
    )

    class Meta:
        model = RecyclingGuide
        fields = [
            'id', 'title', 'content', 'waste_type', 'category',
            'difficulty', 'tips', 'reading_time_min',
            'icon', 'created_by_username', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by_username', 'updated_at']


class AchievementSerializer(serializers.ModelSerializer):
    earned           = serializers.SerializerMethodField()
    earned_at        = serializers.SerializerMethodField()
    progress_current = serializers.SerializerMethodField()
    progress_pct     = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = [
            'id', 'name', 'description', 'icon', 'category',
            'points_reward', 'xp_reward', 'points_required',
            'condition_key', 'condition_value',
            'earned', 'earned_at', 'progress_current', 'progress_pct',
        ]

    def get_earned(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return UserAchievement.objects.filter(user=user, achievement=obj).exists()

    def get_earned_at(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return None
        ua = UserAchievement.objects.filter(user=user, achievement=obj).first()
        return ua.earned_at if ua else None

    def get_progress_current(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return 0
        cond_key = obj.condition_key
        if cond_key == 'capacidad_count':
            return CapacityLog.objects.filter(reported_by=user).count()
        elif cond_key == 'reportes_count':
            return Report.objects.filter(user=user).count()
        elif cond_key == 'propuestas_count':
            return Proposal.objects.filter(user=user).count()
        elif cond_key == 'opiniones_count':
            return Review.objects.filter(user=user).count()
        elif cond_key == 'traslados_count':
            return LogisticsAlert.objects.filter(reciclador=user, status='COMPLETADA').count()
        elif cond_key == 'streak_days':
            return user.streak_days
        elif cond_key == 'xp_total':
            return user.xp
        elif cond_key == 'puntos_total':
            return user.points
        return 0

    def get_progress_pct(self, obj):
        curr = self.get_progress_current(obj)
        target = obj.condition_value
        if target <= 0:
            return 100
        return min(100, int((curr / target) * 100))


class RewardSerializer(serializers.ModelSerializer):
    can_afford = serializers.SerializerMethodField()
    level_met  = serializers.SerializerMethodField()

    class Meta:
        model = Reward
        fields = [
            'id', 'title', 'description', 'icon', 'category',
            'points_cost', 'level_required', 'stock', 'is_active',
            'can_afford', 'level_met',
        ]

    def get_can_afford(self, obj):
        user = self.context['request'].user
        return user.is_authenticated and user.points >= obj.points_cost

    def get_level_met(self, obj):
        user = self.context['request'].user
        if not user.is_authenticated:
            return False
        return user.level_info['level'] >= obj.level_required


class RewardRedemptionSerializer(serializers.ModelSerializer):
    reward_title = serializers.CharField(source='reward.title', read_only=True)
    reward_icon  = serializers.CharField(source='reward.icon', read_only=True)

    class Meta:
        model = RewardRedemption
        fields = [
            'id', 'reward', 'reward_title', 'reward_icon',
            'code', 'points_spent', 'redeemed_at', 'status',
        ]


class PointTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointTransaction
        fields = ['id', 'points', 'xp', 'action_type', 'description', 'created_at']


class RankingUserSerializer(serializers.Serializer):
    position   = serializers.IntegerField()
    id         = serializers.IntegerField()
    username   = serializers.CharField()
    points     = serializers.IntegerField()
    xp         = serializers.IntegerField()
    level_info = serializers.DictField()
    avatar     = serializers.SerializerMethodField()

    def get_avatar(self, obj):
        return obj.avatar.url if getattr(obj, 'avatar', None) else None