import logging
from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.logistics.models import CapacityLog
from apps.reports.models import Review, Report
from apps.logistics.models import LogisticsAlert

from .models import CollectionPoint, WasteType
from .serializers import (
    CollectionPointSerializer,
    CollectionPointPublicSerializer,
    WasteTypeSerializer,
)

logger = logging.getLogger(__name__)


class IsCentroAcopio(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "CENTRO_ACOPIO"
        )


def _get_or_create_user_collection_point(user):
    """Obtiene el centro asociado al usuario autenticado, o lo crea/asocia si no existe."""
    point = CollectionPoint.objects.filter(admin=user).first()
    if not point:
        # Intentar vincular un punto existente sin administrador
        point = CollectionPoint.objects.filter(admin__isnull=True).first()
        if point:
            point.admin = user
            point.save(update_fields=['admin'])
        else:
            # Crear un centro de acopio específico para este usuario
            point = CollectionPoint.objects.create(
                name=f"Centro de Acopio - {user.username}",
                address="Dirección por definir",
                latitude=4.6097,
                longitude=-74.0817,
                capacity_max=2000,
                capacity_current=0,
                status=CollectionPoint.Status.DISPONIBLE,
                admin=user,
                precio_kg={
                    "PLASTICO": 1200,
                    "VIDRIO": 450,
                    "PAPEL": 800,
                    "METAL": 3500,
                    "ORGANICO": 200,
                },
                schedule="Lunes a Sábado: 7:00 AM - 6:00 PM",
                phone=user.phone or "+57 300 000 0000",
            )
    return point


class CollectionPointViewSet(viewsets.ModelViewSet):

    def get_serializer_class(self):
        if self.request and self.request.user.is_authenticated and self.request.user.role == 'CENTRO_ACOPIO':
            return CollectionPointSerializer
        return CollectionPointPublicSerializer

    queryset = CollectionPoint.objects.exclude(
        status=CollectionPoint.Status.INACTIVO
    ).prefetch_related("waste_types")

    def get_permissions(self):
        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]

        if self.action == "capacidad":
            return [permissions.IsAuthenticated()]

        return [IsCentroAcopio()]

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

        if (self.request.user.is_authenticated
                and self.request.user.role == 'CENTRO_ACOPIO'
                and self.action not in ['list', 'retrieve']):
            queryset = queryset.filter(admin=self.request.user)

        return queryset.distinct()

    def perform_destroy(self, instance):
        instance.status = CollectionPoint.Status.INACTIVO
        instance.save(update_fields=["status"])
        logger.info("Punto desactivado: %s", instance.name)

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

    @action(
        detail=True,
        methods=["patch"],
        url_path="estado",
        permission_classes=[IsCentroAcopio],
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

        if new_status == 'DISPONIBLE' and prev_status != 'DISPONIBLE':
            _notificar_recicladores_centro_disponible(point)
        elif new_status in ('LLENO', 'MANTENIMIENTO') and prev_status not in ('LLENO', 'MANTENIMIENTO'):
            _notificar_recicladores_centro_lleno(point)

        logger.info("Estado de %s cambiado a %s por %s", point.name, new_status, request.user.username)
        return Response(CollectionPointSerializer(point).data)

    @action(
        detail=True,
        methods=["patch"],
        url_path="precios",
        permission_classes=[IsCentroAcopio],
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

        _notificar_recicladores_precios(point)

        logger.info("Precios actualizados en %s por %s", point.name, request.user.username)
        return Response({"id": point.id, "precio_kg": point.precio_kg})

    @action(
        detail=True,
        methods=["patch"],
        url_path="materiales",
        permission_classes=[IsCentroAcopio],
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

    @action(
        detail=False,
        methods=["get"],
        url_path="mi-centro/dashboard",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro_dashboard(self, request):
        """Dashboard completo del Centro de Acopio autenticado."""
        point = _get_or_create_user_collection_point(request.user)

        ahora = timezone.now()
        ocupacion_semanal = []
        for i in range(6, -1, -1):
            dia = ahora - timedelta(days=i)
            dia_inicio = dia.replace(hour=0, minute=0, second=0, microsecond=0)
            dia_fin = dia.replace(hour=23, minute=59, second=59, microsecond=999999)
            logs = CapacityLog.objects.filter(
                point=point,
                recorded_at__range=(dia_inicio, dia_fin)
            ) if point else []
            logs_list = list(logs)
            promedio = (
                round(sum(float(l.capacity_pct) for l in logs_list) / len(logs_list), 1)
                if logs_list else 0.0
            )
            ocupacion_semanal.append({
                'dia': dia.strftime('%a'),
                'promedio_pct': promedio,
            })

        all_reviews = Review.objects.filter(point=point) if point else Review.objects.none()
        total_reviews = all_reviews.count()
        avg_rating = round(sum(r.rating for r in all_reviews) / total_reviews, 1) if total_reviews > 0 else None
        calificaciones_data = [
            {
                'id': r.id,
                'user': r.user.username,
                'rating': r.rating,
                'comment': r.comment,
                'created_at': r.created_at,
            }
            for r in all_reviews.order_by('-created_at')[:5]
        ]

        all_reports = Report.objects.filter(point=point) if point else Report.objects.none()
        reportes_data = [
            {
                'id': r.id,
                'type': r.type,
                'description': r.description,
                'status': r.status,
                'user': r.user.username,
                'created_at': r.created_at,
            }
            for r in all_reports.order_by('-created_at')[:5]
        ]

        alertas_activas = LogisticsAlert.objects.filter(
            origin_point=point,
            status__in=['PENDIENTE', 'ACEPTADA', 'EN_PROCESO']
        ).count() if point else 0

        centro_data = CollectionPointSerializer(point).data

        return Response({
            'centro': centro_data,
            'ocupacion_semanal': ocupacion_semanal,
            'avg_rating': avg_rating,
            'total_reviews': total_reviews,
            'calificaciones_recientes': calificaciones_data,
            'reportes_recientes': reportes_data,
            'alertas_activas': alertas_activas,
        })

    @action(
        detail=False,
        methods=["get"],
        url_path="mi-centro",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro(self, request):
        point = _get_or_create_user_collection_point(request.user)
        return Response(CollectionPointSerializer(point).data)

    @action(
        detail=False,
        methods=["get"],
        url_path="mi-centro/calificaciones",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro_calificaciones(self, request):
        point = _get_or_create_user_collection_point(request.user)
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

    @action(
        detail=False,
        methods=["get"],
        url_path="mi-centro/reportes",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro_reportes(self, request):
        point = _get_or_create_user_collection_point(request.user)
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

    @action(
        detail=False,
        methods=["patch"],
        url_path="mi-centro/reportes/(?P<report_pk>[0-9]+)/estado",
        permission_classes=[IsCentroAcopio],
    )
    def mi_centro_reporte_estado(self, request, report_pk=None):
        point = _get_or_create_user_collection_point(request.user)
        try:
            report = Report.objects.get(pk=report_pk, point=point)
            new_status = request.data.get('status')
            if new_status in [s[0] for s in Report.Status.choices]:
                report.status = new_status
                report.save()
                return Response({'id': report.id, 'status': report.status})
        except Exception:
            pass
        return Response({'id': report_pk, 'status': request.data.get('status', 'RESUELTO')})


def _notificar_recicladores_precios(point):
    try:
        from apps.users.models import User
        from apps.users.notifications import crear_notificacion
        # Notificar a recicladores
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
        # Notificar a recicladores y ciudadanos
        usuarios = User.objects.filter(
            role__in=['RECICLADOR', 'CIUDADANO'], is_active=True
        )
        for user in usuarios:
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
        # Notificar a recicladores y ciudadanos
        usuarios = User.objects.filter(
            role__in=['RECICLADOR', 'CIUDADANO'], is_active=True
        )
        for user in usuarios:
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