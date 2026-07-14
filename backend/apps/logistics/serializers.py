from rest_framework import serializers
from .models import LogisticsAlert, CapacityLog


class CollectionPointBriefSerializer(serializers.Serializer):
    id           = serializers.IntegerField()
    name         = serializers.CharField()
    capacity_pct = serializers.IntegerField()
    address      = serializers.CharField()


class LogisticsAlertSerializer(serializers.ModelSerializer):
    origin_point = CollectionPointBriefSerializer(read_only=True)
    target_point = CollectionPointBriefSerializer(read_only=True)
    reciclador_username = serializers.CharField(
        source='reciclador.username', read_only=True
    )

    class Meta:
        model = LogisticsAlert
        fields = [
            'id', 'origin_point', 'target_point',
            'reciclador', 'reciclador_username',
            'waste_type', 'priority', 'status',
            'distance_km', 'created_at', 'resolved_at',
        ]
        read_only_fields = [
            'id', 'origin_point', 'target_point',
            'reciclador_username', 'created_at', 'resolved_at',
        ]


class CapacityLogSerializer(serializers.ModelSerializer):
    reported_by_username = serializers.CharField(
        source='reported_by.username', read_only=True
    )

    class Meta:
        model = CapacityLog
        fields = [
            'id', 'point', 'reported_by_username',
            'capacity_pct', 'waste_type', 'notes', 'recorded_at',
        ]
        read_only_fields = ['id', 'reported_by_username', 'recorded_at']
