import logging
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import LogisticsAlert, CapacityLog
from .serializers import (
    LogisticsAlertSerializer,
    CapacityLogSerializer,
    RecyclerDashboardSerializer,
    AvailabilitySerializer,
    RecyclerReportsSerializer,
)
from .services import generar_alerta_si_critico, registrar_capacidad
from apps.collection_points.models import CollectionPoint
from django.db.models import Sum
from datetime import timedelta

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

        # Actualizar capacidades de los puntos de reciclaje
        if alert.origin_point:
            alert.origin_point.capacity_current = max(0, alert.origin_point.capacity_current - 50)
            alert.origin_point.update_status()
        if alert.target_point:
            alert.target_point.capacity_current = min(
                alert.target_point.capacity_max,
                alert.target_point.capacity_current + 30
            )
            alert.target_point.update_status()

        # ── Otorgar puntos al reciclador ──
        try:
            from apps.gamification.services import otorgar_puntos_y_xp
            otorgar_puntos_y_xp(request.user, 'completar_traslado')
        except Exception as e:
            logger.error(f'Error al otorgar puntos por traslado: {e}')

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

class RecyclerDashboardView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        user = request.user

        if user.role != "RECICLADOR":
            return Response(
                {"error": "Solo recicladores."},
                status=status.HTTP_403_FORBIDDEN
            )

        hoy = timezone.localdate()

        # ==========================================================
        # Estadísticas
        # ==========================================================

        completed_today = LogisticsAlert.objects.filter(
            reciclador=user,
            status=LogisticsAlert.Status.COMPLETADA,
            resolved_at__date=hoy
        )

        completed_count = completed_today.count()

        distance_today = (
            completed_today.aggregate(
                total=Sum("distance_km")
            )["total"] or 0
        )

        pending_count = LogisticsAlert.objects.filter(
            status=LogisticsAlert.Status.PENDIENTE
        ).count()

        # ==========================================================
        # Traslado actual
        # ==========================================================

        current_trip = LogisticsAlert.objects.filter(
            reciclador=user,
            status__in=[
                LogisticsAlert.Status.ACEPTADA,
                LogisticsAlert.Status.EN_PROCESO,
            ]
        ).order_by("-created_at").first()

        # ==========================================================
        # Alertas pendientes
        # ==========================================================

        pending_alerts = LogisticsAlert.objects.filter(
            status=LogisticsAlert.Status.PENDIENTE
        ).order_by("-priority", "-created_at")[:5]

        # ==========================================================
        # Historial reciente
        # ==========================================================

        history = LogisticsAlert.objects.filter(
            reciclador=user,
            status=LogisticsAlert.Status.COMPLETADA
        ).order_by("-resolved_at")[:10]

        # ==========================================================
        # Puntos cercanos
        # ==========================================================

        nearby_points = [
            {
                "id": p.id,
                "name": p.name,
                "address": p.address,
                "capacity": p.capacity_pct,
                "status": p.status,
            }
            for p in CollectionPoint.objects.exclude(status=CollectionPoint.Status.INACTIVO)[:5]
        ]

        # ==========================================================
        # Dashboard
        # ==========================================================

        user_level = max(1, (user.points // 100) + 1)

        dashboard = {

            "is_available": user.is_available,

            "stats": {

                "completed_today": completed_count,

                "pending": pending_count,

                "distance_today": float(distance_today),

                "level": user_level,
            },

            "current_trip": (
                LogisticsAlertSerializer(current_trip).data
                if current_trip
                else None
            ),

            "pending_alerts": LogisticsAlertSerializer(
                pending_alerts,
                many=True
            ).data,

            "history": LogisticsAlertSerializer(
                history,
                many=True
            ).data,

            "nearby_points": nearby_points,
        }

        serializer = RecyclerDashboardSerializer(dashboard)

        return Response(serializer.data)


class CurrentTransferView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):

        traslado = LogisticsAlert.objects.filter(
            reciclador=request.user,
            status__in=[
                LogisticsAlert.Status.ACEPTADA,
                LogisticsAlert.Status.EN_PROCESO,
            ]
        ).first()

        if not traslado:
            return Response(None)

        serializer = LogisticsAlertSerializer(traslado)

        return Response(serializer.data)


class RecyclerHistoryView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):

        history = LogisticsAlert.objects.filter(
            reciclador=request.user,
            status=LogisticsAlert.Status.COMPLETADA
        ).order_by("-resolved_at")

        serializer = LogisticsAlertSerializer(
            history,
            many=True
        )

        return Response(serializer.data)


class MyZoneView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):

        puntos = CollectionPoint.objects.exclude(status=CollectionPoint.Status.INACTIVO)

        data = []

        for p in puntos:

            data.append({

                "id": p.id,

                "name": p.name,

                "address": p.address,

                "capacity": p.capacity_pct,

                "capacity_pct": p.capacity_pct,

                "status": p.status,

                "latitude": float(p.latitude),

                "longitude": float(p.longitude),

            })

        return Response(data)


class AvailabilityView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):
        return Response({
            "is_available": request.user.is_available
        })

    def create(self, request):
        return self._handle_update(request)

    def partial_update(self, request, pk=None):
        return self._handle_update(request)

    @action(detail=False, methods=["patch", "post"], url_path="")
    def update_availability(self, request):
        return self._handle_update(request)

    def _handle_update(self, request):
        is_avail = request.data.get("is_available")
        if is_avail is None:
            is_avail = not request.user.is_available
        else:
            is_avail = bool(is_avail)

        request.user.is_available = is_avail
        request.user.save(update_fields=["is_available"])

        return Response({
            "is_available": request.user.is_available
        })

class RecyclerReportsView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def list(self, request):

        user = request.user

        if user.role != "RECICLADOR":
            return Response(
                {"error": "Solo recicladores."},
                status=status.HTTP_403_FORBIDDEN
            )

        today = timezone.localdate()

        week = today - timedelta(days=7)

        month = today - timedelta(days=30)

        alerts = LogisticsAlert.objects.filter(
            reciclador=user,
            status=LogisticsAlert.Status.COMPLETADA
        )

        today_alerts = alerts.filter(
            resolved_at__date=today
        )

        week_alerts = alerts.filter(
            resolved_at__date__gte=week
        )

        month_alerts = alerts.filter(
            resolved_at__date__gte=month
        )

        serializer = RecyclerReportsSerializer({

            "today": {
                "transfers": today_alerts.count(),
                "distance": float(
                    today_alerts.aggregate(
                        total=Sum("distance_km")
                    )["total"] or 0
                ),
            },

            "week": {
                "transfers": week_alerts.count(),
                "distance": float(
                    week_alerts.aggregate(
                        total=Sum("distance_km")
                    )["total"] or 0
                ),
            },

            "month": {
                "transfers": month_alerts.count(),
                "distance": float(
                    month_alerts.aggregate(
                        total=Sum("distance_km")
                    )["total"] or 0
                ),
            },

        })

        return Response(serializer.data)
