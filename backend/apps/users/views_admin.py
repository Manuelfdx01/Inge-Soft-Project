import logging
from datetime import timedelta
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from apps.users.models import User
from apps.collection_points.models import CollectionPoint
from apps.logistics.models import LogisticsAlert, CapacityLog
from apps.reports.models import Report, Proposal

logger = logging.getLogger(__name__)


class IsAdminGomi(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


class AdminMetricsView(APIView):
    permission_classes = [IsAdminGomi]

    def get(self, request):
        ahora = timezone.now()
        inicio_mes = ahora.replace(day=1, hour=0, minute=0, second=0)

        total_usuarios = User.objects.count()
        total_puntos   = CollectionPoint.objects.exclude(status='INACTIVO').count()
        puntos_criticos = CollectionPoint.objects.filter(status='CRITICO').count()
        traslados_mes   = LogisticsAlert.objects.filter(
            status='COMPLETADA',
            resolved_at__gte=inicio_mes,
        ).count()

        ocupacion_semanal = []
        for i in range(6, -1, -1):
            dia = ahora - timedelta(days=i)
            dia_inicio = dia.replace(hour=0, minute=0, second=0)
            dia_fin = dia.replace(hour=23, minute=59, second=59)
            logs = CapacityLog.objects.filter(
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

        propuestas_recientes = Proposal.objects.order_by('-created_at')[:5].values(
            'id', 'title', 'votes', 'status'
        )
        reportes_recientes = Report.objects.order_by('-created_at')[:5].values(
            'id', 'type', 'status', 'point__name'
        )
        puntos_estado = CollectionPoint.objects.exclude(
            status='INACTIVO'
        ).order_by('-capacity_current').values(
            'id', 'name', 'capacity_pct', 'status'
        )[:10]

        logger.info(f'Métricas consultadas por {request.user.username}')

        return Response({
            'totales': {
                'usuarios':        total_usuarios,
                'puntos_activos':  total_puntos,
                'puntos_criticos': puntos_criticos,
                'traslados_mes':   traslados_mes,
            },
            'ocupacion_semanal':   list(ocupacion_semanal),
            'propuestas_recientes': list(propuestas_recientes),
            'reportes_recientes':   list(reportes_recientes),
            'puntos_estado':        list(puntos_estado),
        })
