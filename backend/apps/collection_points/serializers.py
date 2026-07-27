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
        required=False,
    )
    capacity_pct = serializers.ReadOnlyField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = CollectionPoint
        fields = [
            'id', 'name', 'address',
            'latitude', 'longitude',
            'capacity_max', 'capacity_current', 'capacity_pct',
            'waste_types', 'waste_type_ids',
            'status', 'admin', 'distance_km',
            'precio_kg', 'schedule', 'phone',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_distance_km(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        user_lat = request.query_params.get('lat')
        user_lng = request.query_params.get('lng')
        if user_lat and user_lng:
            try:
                from apps.logistics.services import calcular_distancia
                return calcular_distancia(user_lat, user_lng, obj.latitude, obj.longitude)
            except Exception:
                return None
        return None


class CollectionPointPublicSerializer(serializers.ModelSerializer):
    """Serializer ligero para listas públicas (reciclador/ciudadano)."""
    waste_types = WasteTypeSerializer(many=True, read_only=True)
    capacity_pct = serializers.ReadOnlyField()
    latitude = serializers.FloatField()
    longitude = serializers.FloatField()
    distance_km = serializers.SerializerMethodField()

    class Meta:
        model = CollectionPoint
        fields = [
            'id', 'name', 'address',
            'latitude', 'longitude',
            'capacity_max', 'capacity_current', 'capacity_pct',
            'waste_types', 'status', 'distance_km',
            'precio_kg', 'schedule', 'phone',
        ]

    def get_distance_km(self, obj):
        request = self.context.get('request')
        if not request:
            return None
        user_lat = request.query_params.get('lat')
        user_lng = request.query_params.get('lng')
        if user_lat and user_lng:
            try:
                from apps.logistics.services import calcular_distancia
                return calcular_distancia(user_lat, user_lng, obj.latitude, obj.longitude)
            except Exception:
                return None
        return None