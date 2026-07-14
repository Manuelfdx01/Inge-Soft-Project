import logging
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LogisticsAlert, CapacityLog
from .serializers import LogisticsAlertSerializer, CapacityLogSerializer
from .services import generar_alerta_si_critico, registrar_capacidad
from apps.collection_points.models import CollectionPoint

logger = logging.getLogger(__name__)


class LogisticsAlertViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LogisticsAlertSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = LogisticsAlert.objects.all()

        if user.role == 'RECICLADOR':
            qs = qs.filter(
                status__in=['PENDIENTE', 'ACEPTADA', 'EN_PROCESO']
            ) | qs.filter(reciclador=user)

        priority = self.request.query_params.get('priority')
        status_filter = self.request.query_params.get('status')
        if priority:
            qs = qs.filter(priority=priority)
        if status_filter:
            qs = qs.filter(status=status_filter)

        return qs.distinct().order_by('-created_at')

    @action(detail=True, methods=['patch'], url_path='aceptar')
    def aceptar(self, request, pk=None):
        if request.user.role != 'RECICLADOR':
            return Response(
                {'error': 'Solo recicladores pueden aceptar traslados.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        alert = self.get_object()
        if alert.status != LogisticsAlert.Status.PENDIENTE:
            return Response(
                {'error': 'Esta alerta ya fue aceptada por otro reciclador.'},
                status=status.HTTP_409_CONFLICT,
            )
        alert.reciclador = request.user
        alert.status = LogisticsAlert.Status.ACEPTADA
        alert.save()
        logger.info(f'Alerta {pk} aceptada por {request.user.username}')
        return Response(LogisticsAlertSerializer(alert).data)

    @action(detail=True, methods=['patch'], url_path='completar')
    def completar(self, request, pk=None):
        alert = self.get_object()
        if alert.reciclador != request.user and request.user.role != 'ADMIN':
            return Response(
                {'error': 'Solo el reciclador asignado puede completar este traslado.'},
                status=status.HTTP_403_FORBIDDEN,
            )
        alert.status = LogisticsAlert.Status.COMPLETADA
        alert.resolved_at = timezone.now()
        alert.save()
        logger.info(f'Alerta {pk} completada por {request.user.username}')
        return Response(LogisticsAlertSerializer(alert).data)


class CapacityUpdateView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=True, methods=['patch'], url_path='capacidad')
    def capacidad(self, request, pk=None):
        try:
            point = CollectionPoint.objects.get(pk=pk)
        except CollectionPoint.DoesNotExist:
            return Response(
                {'error': 'Punto no encontrado.'},
                status=status.HTTP_404_NOT_FOUND,
            )

        nueva_capacidad = request.data.get('capacity_current')
        waste_type = request.data.get('waste_type', '')
        notes = request.data.get('notes', '')

        if nueva_capacidad is None:
            return Response(
                {'error': 'capacity_current es requerido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        point.capacity_current = int(nueva_capacidad)
        point.update_status()

        registrar_capacidad(
            point=point,
            capacity_pct=point.capacity_pct,
            waste_type=waste_type,
            notes=notes,
            reported_by=request.user,
        )

        alerta = generar_alerta_si_critico(
            point=point,
            waste_type=waste_type,
            reported_by=request.user,
        )

        return Response({
            'id': point.id,
            'capacity_current': point.capacity_current,
            'capacity_pct': point.capacity_pct,
            'status': point.status,
            'alert_triggered': alerta is not None,
            'alert_id': alerta.id if alerta else None,
        })

class CapacityLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CapacityLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        point_id = self.kwargs.get('point_pk')
        days = self.request.query_params.get('days', 7)
        from django.utils import timezone
        from datetime import timedelta
        desde = timezone.now() - timedelta(days=int(days))
        return CapacityLog.objects.filter(
            point_id=point_id,
            recorded_at__gte=desde,
        ).order_by('-recorded_at')