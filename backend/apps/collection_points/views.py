import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CollectionPoint, WasteType
from .serializers import CollectionPointSerializer, WasteTypeSerializer

logger = logging.getLogger(__name__)


class IsAdminGomi(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class CollectionPointViewSet(viewsets.ModelViewSet):
    queryset = CollectionPoint.objects.filter(
        status__in=['NORMAL', 'ALERTA', 'CRITICO']
    )
    serializer_class = CollectionPointSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.AllowAny()]
        return [IsAdminGomi()]

    def get_queryset(self):
        qs = super().get_queryset()
        waste_type = self.request.query_params.get('waste_type')
        status_filter = self.request.query_params.get('status')
        if waste_type:
            qs = qs.filter(waste_types__name__iexact=waste_type)
        if status_filter:
            qs = qs.filter(status__iexact=status_filter)
        return qs

    def perform_destroy(self, instance):
        instance.status = CollectionPoint.Status.INACTIVO
        instance.save()
        logger.info(f'Punto desactivado: {instance.name}')

    @action(detail=True, methods=['patch'], url_path='capacidad',
            permission_classes=[permissions.IsAuthenticated])
    def capacidad(self, request, pk=None):
        point = self.get_object()
        nueva = request.data.get('capacity_current')
        if nueva is None:
            return Response(
                {'error': 'capacity_current es requerido.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        point.capacity_current = int(nueva)
        point.update_status()
        logger.info(f'Capacidad actualizada: {point.name} → {point.capacity_pct}%')
        return Response({
            'id': point.id,
            'capacity_current': point.capacity_current,
            'capacity_pct': point.capacity_pct,
            'status': point.status,
        })


class WasteTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WasteType.objects.all()
    serializer_class = WasteTypeSerializer
    permission_classes = [permissions.AllowAny]