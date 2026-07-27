import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.logistics.models import CapacityLog

from .models import CollectionPoint, WasteType
from .serializers import (
    CollectionPointSerializer,
    CollectionPointPublicSerializer,
    WasteTypeSerializer,
)

logger = logging.getLogger(__name__)


class IsAdminGomi(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class IsCentroAcopio(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "CENTRO_ACOPIO"
        )


class IsAdminOrCentroAcopio(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ("ADMIN", "CENTRO_ACOPIO")
        )


class CollectionPointViewSet(viewsets.ModelViewSet):

    def get_serializer_class(self):
        if self.request and self.request.user.is_authenticated and self.request.user.role in ('ADMIN', 'CENTRO_ACOPIO'):
            return CollectionPointSerializer
        return CollectionPointPublicSerializer

    queryset = CollectionPoint.objects.exclude(
        status=CollectionPoint.Status.INACTIVO
    ).prefetch_related("waste_types")

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]

        if self.action in ["capacidad", "estado", "precios", "materiales"]:
            return [IsAdminOrCentroAcopio()]

        return [IsAdminGomi()]

    def get_queryset(self):
        status_filter = self.request.query_params.get("status")
        waste_type = self.request.query_params.get("waste_type")
        search_query = self.request.query_params.get("search")

        if status_filter and status_filter.upper() == 'INACTIVO':
            queryset = CollectionPoint.objects.filter(
                status=CollectionPoint.Status.INACTIVO
            ).prefetch_related("waste_types")
        elif status_filter and status_filter.upper() == 'TODOS':
            queryset = CollectionPoint.objects.all().prefetch_related("waste_types")
        else:
            queryset = CollectionPoint.objects.exclude(
                status=CollectionPoint.Status.INACTIVO
            ).prefetch_related("waste_types")

        if waste_type and waste_type.upper() != 'TODOS':
            queryset = queryset.filter(
                waste_types__name__iexact=waste_type
            )

        if status_filter and status_filter.upper() not in ['TODOS', 'INACTIVO']:
            queryset = queryset.filter(
                status=status_filter.upper()
            )

        if search_query:
            from django.db.models import Q
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(address__icontains=search_query)
            )

        # Si es Centro de Acopio, solo ve su propio centro
        if (self.request.user.is_authenticated
                and self.request.user.role == 'CENTRO_ACOPIO'):
            queryset = queryset.filter(admin=self.request.user)

        return queryset.distinct()

    def perform_destroy(self, instance):
        instance.status = CollectionPoint.Status.INACTIVO
        instance.save(update_fields=["status"])
        logger.info("Punto desactivado: %s", instance.name)

    # ─── Actualizar capacidad ───────────────────────────────────────────────
    @action(
        detail=True,
        methods=["patch"],
        url_path="capacidad",
        permission_classes=[permissions.IsAuthenticated],
    )
    def capacidad(self, request, pk=None):
        point = self.get_object()

        capacity = request.data.get("capacity_current")
        if capacity is None:
            return Response(
                {"error": "capacity_current es requerido."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            capacity = int(capacity)
        except (TypeError, ValueError):
            return Response(
                {"error": "capacity_current debe ser un número."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if capacity < 0 or capacity > point.capacity_max:
            return Response(
                {"error": f"capacity_current debe estar entre 0 y {point.capacity_max}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_status = point.status
        point.capacity_current = capacity
        point.update_status()

        CapacityLog.objects.create(
            point=point,
            reported_by=request.user,
            capacity_pct=point.capacity_pct,
            waste_type=request.data.get("waste_type", ""),
            notes=request.data.get("notes", ""),
        )

        from apps.logistics.services import generar_alerta_si_critico
        alerta = generar_alerta_si_critico(
            point=point,
            waste_type=request.data.get("waste_type", ""),
            reported_by=request.user,
        )

        # Notificar a recicladores si el centro está lleno
        if point.status in ('CRITICO', 'LLENO') and prev_status not in ('CRITICO', 'LLENO'):
            _notificar_recicladores_centro_lleno(point)

        try:
            from apps.gamification.services import otorgar_puntos_y_xp
            otorgar_puntos_y_xp(request.user, 'actualizar_capacidad')
        except Exception as e:
            logger.error(f'Error al otorgar puntos por capacidad: {e}')

        logger.info("Capacidad actualizada: %s → %s%%", point.name, point.capacity_pct)

        return Response({
            "id": point.id,
            "capacity_current": point.capacity_current,
            "capacity_pct": point.capacity_pct,
            "status": point.status,
            "alert_triggered": alerta is not None,
            "alert_id": alerta.id if alerta else None,
        })

    # ─── Cambiar estado manual (Disponible/Lleno/Mantenimiento) ───────────
    @action(
        detail=True,
        methods=["patch"],
        url_path="estado",
        permission_classes=[IsAdminOrCentroAcopio],
    )
    def estado(self, request, pk=None):
        point = self.get_object()
        new_status = request.data.get("status")
        allowed = [s[0] for s in CollectionPoint.Status.choices]
        if new_status not in allowed:
            return Response(
                {"error": f"Estado inválido. Opciones: {allowed}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        prev_status = point.status
        point.status = new_status
        point.save(update_fields=["status"])

        # Notificar a recicladores si el centro vuelve a estar disponible
        if new_status == 'DISPONIBLE' and prev_status != 'DISPONIBLE':
            _notificar_recicladores_centro_disponible(point)
        elif new_status in ('LLENO', 'MANTENIMIENTO') and prev_status not in ('LLENO', 'MANTENIMIENTO'):
            _notificar_recicladores_centro_lleno(point)

        logger.info("Estado de %s cambiado a %s por %s", point.name, new_status, request.user.username)
        return Response(CollectionPointSerializer(point).data)

    # ─── Actualizar precios por kilogramo ──────────────────────────────────
    @action(
        detail=True,
        methods=["patch"],
        url_path="precios",
        permission_classes=[IsAdminOrCentroAcopio],
    )
    def precios(self, request, pk=None):
        point = self.get_object()
        precios = request.data.get("precio_kg")
        if not isinstance(precios, dict):
            return Response(
                {"error": "precio_kg debe ser un objeto JSON con materiales y precios."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        point.precio_kg = precios
        point.save(update_fields=["precio_kg"])

        # Notificar a recicladores del cambio de precios
        _notificar_recicladores_precios(point)

        logger.info("Precios actualizados en %s por %s", point.name, request.user.username)
        return Response({"id": point.id, "precio_kg": point.precio_kg})

    # ─── Actualizar materiales aceptados ──────────────────────────────────
    @action(
        detail=True,
        methods=["patch"],
        url_path="materiales",
        permission_classes=[IsAdminOrCentroAcopio],
    )
    def materiales(self, request, pk=None):
        point = self.get_object()
        waste_type_ids = request.data.get("waste_type_ids", [])
        if not isinstance(waste_type_ids, list):
            return Response(
                {"error": "waste_type_ids debe ser una lista de IDs."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            types = WasteType.objects.filter(id__in=waste_type_ids)
            point.waste_types.set(types)
            point.save()
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        logger.info("Materiales actualizados en %s por %s", point.name, request.user.username)
        return Response(CollectionPointSerializer(point).data)

    # ─── Dashboard del Centro de Acopio ───────────────────────────────────
    @action(
        detail=False,
        methods=["get"],
        url_path="mi-centro/dashboard",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro_dashboard(self, request):
        """Dashboard del Centro de Acopio autenticado."""
        try:
            point = CollectionPoint.objects.get(admin=request.user)
        except CollectionPoint.DoesNotExist:
            return Response(
                {"error": "No tienes un centro de acopio asignado."},
                status=status.HTTP_404_NOT_FOUND,
            )

        ahora = timezone.now()
        ocupacion_semanal = []
        for i in range(6, -1, -1):
            dia = ahora - timedelta(days=i)
            dia_inicio = dia.replace(hour=0, minute=0, second=0, microsecond=0)
            dia_fin = dia.replace(hour=23, minute=59, second=59, microsecond=999999)
            logs = CapacityLog.objects.filter(
                point=point,
                recorded_at__range=(dia_inicio, dia_fin)
            )
            promedio = (
                sum(float(l.capacity_pct) for l in logs) / len(logs)
                if logs else 0
            )
            ocupacion_semanal.append({
                'dia': dia.strftime('%a'),
                'promedio_pct': round(promedio, 1),
            })

        from apps.reports.models import Review, Report
        from apps.logistics.models import LogisticsAlert

        calificaciones = Review.objects.filter(point=point).order_by('-created_at')[:5]
        avg_rating = None
        all_reviews = Review.objects.filter(point=point)
        if all_reviews.exists():
            avg_rating = round(sum(r.rating for r in all_reviews) / all_reviews.count(), 1)

        reportes = Report.objects.filter(point=point).order_by('-created_at')[:5]
        alertas_activas = LogisticsAlert.objects.filter(
            origin_point=point,
            status__in=['PENDIENTE', 'ACEPTADA', 'EN_PROCESO']
        ).count()

        return Response({
            'centro': CollectionPointSerializer(point).data,
            'ocupacion_semanal': ocupacion_semanal,
            'avg_rating': avg_rating,
            'total_reviews': all_reviews.count() if all_reviews.exists() else 0,
            'calificaciones_recientes': [
                {
                    'id': r.id,
                    'user': r.user.username,
                    'rating': r.rating,
                    'comment': r.comment,
                    'created_at': r.created_at,
                }
                for r in calificaciones
            ],
            'reportes_recientes': [
                {
                    'id': r.id,
                    'type': r.type,
                    'description': r.description,
                    'status': r.status,
                    'created_at': r.created_at,
                }
                for r in reportes
            ],
            'alertas_activas': alertas_activas,
        })

    # ─── Obtener mi centro ─────────────────────────────────────────────────
    @action(
        detail=False,
        methods=["get"],
        url_path="mi-centro",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro(self, request):
        try:
            point = CollectionPoint.objects.prefetch_related("waste_types").get(admin=request.user)
        except CollectionPoint.DoesNotExist:
            return Response(
                {"error": "No tienes un centro de acopio asignado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(CollectionPointSerializer(point).data)

    # ─── Consultar calificaciones de mi centro ─────────────────────────────
    @action(
        detail=False,
        methods=["get"],
        url_path="mi-centro/calificaciones",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro_calificaciones(self, request):
        try:
            point = CollectionPoint.objects.get(admin=request.user)
        except CollectionPoint.DoesNotExist:
            return Response(
                {"error": "No tienes un centro de acopio asignado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        from apps.reports.models import Review
        reviews = Review.objects.filter(point=point).order_by('-created_at')
        return Response([
            {
                'id': r.id,
                'user': r.user.username,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at,
            }
            for r in reviews
        ])

    # ─── Consultar reportes de mi centro ──────────────────────────────────
    @action(
        detail=False,
        methods=["get"],
        url_path="mi-centro/reportes",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro_reportes(self, request):
        try:
            point = CollectionPoint.objects.get(admin=request.user)
        except CollectionPoint.DoesNotExist:
            return Response(
                {"error": "No tienes un centro de acopio asignado."},
                status=status.HTTP_404_NOT_FOUND,
            )
        from apps.reports.models import Report
        reports = Report.objects.filter(point=point).order_by('-created_at')
        return Response([
            {
                'id': r.id,
                'type': r.type,
                'description': r.description,
                'status': r.status,
                'user': r.user.username,
                'created_at': r.created_at,
            }
            for r in reports
        ])

    # ─── Cambiar estado de un reporte ──────────────────────────────────────
    @action(
        detail=False,
        methods=["patch"],
        url_path="mi-centro/reportes/(?P<report_pk>[0-9]+)/estado",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro_reporte_estado(self, request, report_pk=None):
        from apps.reports.models import Report
        try:
            point = CollectionPoint.objects.get(admin=request.user)
            report = Report.objects.get(pk=report_pk, point=point)
        except (CollectionPoint.DoesNotExist, Report.DoesNotExist):
            return Response({"error": "Reporte no encontrado."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in [s[0] for s in Report.Status.choices]:
            return Response({"error": "Estado inválido."}, status=status.HTTP_400_BAD_REQUEST)
        report.status = new_status
        report.save()
        return Response({'id': report.id, 'status': report.status})


# ─── Helpers de notificación ──────────────────────────────────────────────────

def _notificar_recicladores_precios(point):
    try:
        from apps.users.models import User
        from apps.users.notifications import crear_notificacion
        recicladores = User.objects.filter(role='RECICLADOR', is_active=True)
        for user in recicladores:
            crear_notificacion(
                user=user,
                type='PRECIO_ACTUALIZADO',
                message=f'💰 El centro "{point.name}" actualizó sus precios por kilogramo.',
            )
    except Exception as e:
        logger.error(f'Error notificando precios: {e}')


def _notificar_recicladores_centro_lleno(point):
    try:
        from apps.users.models import User
        from apps.users.notifications import crear_notificacion
        recicladores = User.objects.filter(role='RECICLADOR', is_active=True)
        for user in recicladores:
            crear_notificacion(
                user=user,
                type='CENTRO_LLENO',
                message=f'🔴 El centro "{point.name}" está lleno o en mantenimiento.',
            )
    except Exception as e:
        logger.error(f'Error notificando centro lleno: {e}')


def _notificar_recicladores_centro_disponible(point):
    try:
        from apps.users.models import User
        from apps.users.notifications import crear_notificacion
        recicladores = User.objects.filter(role='RECICLADOR', is_active=True)
        for user in recicladores:
            crear_notificacion(
                user=user,
                type='CENTRO_DISPONIBLE',
                message=f'🟢 El centro "{point.name}" ya está disponible para recibir material.',
            )
    except Exception as e:
        logger.error(f'Error notificando centro disponible: {e}')


class WasteTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = WasteType.objects.all().order_by("name")
    serializer_class = WasteTypeSerializer
    permission_classes = [permissions.AllowAny]