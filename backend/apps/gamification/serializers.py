from rest_framework import serializers
from .models import RecyclingGuide, Achievement, UserAchievement


class RecyclingGuideSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(
        source='created_by.username', read_only=True
    )

    class Meta:
        model = RecyclingGuide
        fields = [
            'id', 'title', 'content', 'waste_type',
            'icon', 'created_by_username', 'updated_at',
        ]
        read_only_fields = ['id', 'created_by_username', 'updated_at']


class AchievementSerializer(serializers.ModelSerializer):
    earned      = serializers.SerializerMethodField()
    earned_at   = serializers.SerializerMethodField()

    class Meta:
        model = Achievement
        fields = [
            'id', 'name', 'description', 'icon',
            'points_required', 'earned', 'earned_at',
        ]

    def get_earned(self, obj):
        user = self.context['request'].user
        return UserAchievement.objects.filter(
            user=user, achievement=obj
        ).exists()

    def get_earned_at(self, obj):
        user = self.context['request'].user
        ua = UserAchievement.objects.filter(
            user=user, achievement=obj
        ).first()
        return ua.earned_at if ua else None


class RankingSerializer(serializers.Serializer):
    position = serializers.IntegerField()
    username = serializers.CharField()
    points   = serializers.IntegerField()