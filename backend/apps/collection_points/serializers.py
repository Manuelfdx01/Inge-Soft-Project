from rest_framework import serializers
from .models import CollectionPoint, WasteType


class WasteTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = WasteType
        fields = ['id', 'name', 'description', 'icon', 'color']


class CollectionPointSerializer(serializers.ModelSerializer):
    waste_types  = WasteTypeSerializer(many=True, read_only=True)
    waste_type_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=WasteType.objects.all(),
        write_only=True,
        source='waste_types',
    )
    capacity_pct = serializers.ReadOnlyField()

    class Meta:
        model = CollectionPoint
        fields = [
            'id', 'name', 'address',
            'latitude', 'longitude',
            'capacity_max', 'capacity_current', 'capacity_pct',
            'waste_types', 'waste_type_ids',
            'status', 'admin',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']