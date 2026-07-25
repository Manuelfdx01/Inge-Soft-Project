from rest_framework import serializers
from .models import LogisticsAlert, CapacityLog


class CollectionPointBriefSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    capacity_pct = serializers.IntegerField()
    address = serializers.CharField()


class LogisticsAlertSerializer(serializers.ModelSerializer):
    origin_point = CollectionPointBriefSerializer(read_only=True)
    target_point = CollectionPointBriefSerializer(read_only=True)
    reciclador_username = serializers.CharField(
        source="reciclador.username",
        read_only=True
    )

    class Meta:
        model = LogisticsAlert
        fields = [
            "id",
            "origin_point",
            "target_point",
            "reciclador",
            "reciclador_username",
            "waste_type",
            "priority",
            "status",
            "distance_km",
            "created_at",
            "resolved_at",
        ]
        read_only_fields = [
            "id",
            "origin_point",
            "target_point",
            "reciclador_username",
            "created_at",
            "resolved_at",
        ]


class CapacityLogSerializer(serializers.ModelSerializer):
    reported_by_username = serializers.CharField(
        source="reported_by.username",
        read_only=True
    )

    class Meta:
        model = CapacityLog
        fields = [
            "id",
            "point",
            "reported_by_username",
            "capacity_pct",
            "waste_type",
            "notes",
            "recorded_at",
        ]
        read_only_fields = [
            "id",
            "reported_by_username",
            "recorded_at",
        ]


# ==========================================================
# Dashboard del reciclador
# ==========================================================

class RecyclerStatsSerializer(serializers.Serializer):
    completed_today = serializers.IntegerField()
    pending = serializers.IntegerField()
    distance_today = serializers.FloatField()
    level = serializers.IntegerField()


class NearbyPointSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    name = serializers.CharField()
    capacity = serializers.IntegerField()
    status = serializers.CharField()
    address = serializers.CharField()


class RecyclerDashboardSerializer(serializers.Serializer):

    is_available = serializers.BooleanField()

    stats = RecyclerStatsSerializer()

    current_trip = LogisticsAlertSerializer(
        allow_null=True,
        required=False
    )

    pending_alerts = LogisticsAlertSerializer(
        many=True,
        required=False
    )

    history = LogisticsAlertSerializer(
        many=True,
        required=False
    )

    nearby_points = NearbyPointSerializer(
        many=True,
        required=False
    )


class AvailabilitySerializer(serializers.Serializer):
    is_available = serializers.BooleanField()

class ReportPeriodSerializer(serializers.Serializer):
    transfers = serializers.IntegerField()
    distance = serializers.FloatField()

class RecyclerReportsSerializer(serializers.Serializer):
    today = ReportPeriodSerializer()
    week = ReportPeriodSerializer()
    month = ReportPeriodSerializer()
