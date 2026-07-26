import logging

from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.logistics.models import CapacityLog

from .models import CollectionPoint, WasteType
from .serializers import (
    CollectionPointSerializer,
    WasteTypeSerializer,
)

logger = logging.getLogger(__name__)


class IsAdminGomi(permissions.BasePermission):

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == "ADMIN"
        )


class CollectionPointViewSet(viewsets.ModelViewSet):

    serializer_class = CollectionPointSerializer

    queryset = CollectionPoint.objects.exclude(
        status=CollectionPoint.Status.INACTIVO
    ).prefetch_related("waste_types")

    def get_permissions(self):

        if self.action in ["list", "retrieve"]:
            return [permissions.AllowAny()]

        if self.action == "capacidad":
            return [permissions.IsAuthenticated()]

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

        return queryset.distinct()

    def perform_destroy(self, instance):

        instance.status = CollectionPoint.Status.INACTIVO
        instance.save(update_fields=["status"])

        logger.info(
            "Punto desactivado: %s",
            instance.name
        )

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
                {
                    "error": "capacity_current es requerido."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            capacity = int(capacity)

        except (TypeError, ValueError):

            return Response(
                {
                    "error": "capacity_current debe ser un número."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if capacity < 0 or capacity > point.capacity_max:

            return Response(
                {
                    "error": (
                        f"capacity_current debe estar entre "
                        f"0 y {point.capacity_max}."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

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

        try:
            from apps.gamification.services import otorgar_puntos_y_xp
            otorgar_puntos_y_xp(request.user, 'actualizar_capacidad')
        except Exception as e:
            logger.error(f'Error al otorgar puntos por capacidad: {e}')

        logger.info(
            "Capacidad actualizada: %s → %s%%",
            point.name,
            point.capacity_pct,
        )

        return Response(
            {
                "id": point.id,
                "capacity_current": point.capacity_current,
                "capacity_pct": point.capacity_pct,
                "status": point.status,
                "alert_triggered": alerta is not None,
                "alert_id": alerta.id if alerta else None,
            }
        )


class WasteTypeViewSet(viewsets.ReadOnlyModelViewSet):

    queryset = WasteType.objects.all().order_by("name")
    serializer_class = WasteTypeSerializer
    permission_classes = [permissions.AllowAny]