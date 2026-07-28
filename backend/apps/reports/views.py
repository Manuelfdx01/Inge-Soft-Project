import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Review, Proposal, Report, CommunityPost, PostComment
from .serializers import (
    ReviewSerializer, ProposalSerializer,
    ProposalStatusSerializer, ReportSerializer,
    CommunityPostSerializer, PostCommentSerializer,
)

logger = logging.getLogger(__name__)


class IsCentroAcopio(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'CENTRO_ACOPIO'


class IsReciclador(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'RECICLADOR'


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        point_id = self.kwargs.get('point_pk')
        return Review.objects.filter(point_id=point_id)

    def perform_create(self, serializer):
        point_id = self.kwargs.get('point_pk')
        serializer.save(user=self.request.user, point_id=point_id)
        logger.info(f'Nueva opinión de {self.request.user.username} en punto {point_id}')
        try:
            from apps.gamification.services import otorgar_puntos_y_xp
            otorgar_puntos_y_xp(self.request.user, 'crear_opinion')
        except Exception as e:
            logger.error(f'Error al otorgar puntos por opinión: {e}')

        # Notificar al Centro de Acopio
        try:
            from apps.collection_points.models import CollectionPoint
            point = CollectionPoint.objects.get(pk=point_id)
            if point.admin and point.admin.role == 'CENTRO_ACOPIO':
                from apps.users.notifications import crear_notificacion
                crear_notificacion(
                    user=point.admin,
                    type='GENERAL',
                    message=f'⭐ {self.request.user.username} calificó tu centro con {serializer.instance.rating} estrellas.',
                )
        except Exception as e:
            logger.error(f'Error al notificar calificación al centro: {e}')


class ProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'CENTRO_ACOPIO':
            return Proposal.objects.all().order_by('-created_at')
        return Proposal.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        logger.info(f'Nueva propuesta de {self.request.user.username}')
        try:
            from apps.gamification.services import otorgar_puntos_y_xp
            otorgar_puntos_y_xp(self.request.user, 'crear_propuesta')
        except Exception as e:
            logger.error(f'Error al otorgar puntos por propuesta: {e}')

    @action(detail=True, methods=['patch'], url_path='estado',
            permission_classes=[IsCentroAcopio])
    def estado(self, request, pk=None):
        proposal = self.get_object()
        serializer = ProposalStatusSerializer(proposal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            try:
                from apps.users.notifications import notificar_propuesta_actualizada
                notificar_propuesta_actualizada(proposal)
            except Exception as e:
                logger.error(f'Error al notificar propuesta: {e}')

            logger.info(f'Propuesta {pk} cambió a estado {proposal.status}')
            return Response(ProposalSerializer(proposal).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        point_filter = self.request.query_params.get('point')

        if user.role == 'CENTRO_ACOPIO':
            from apps.collection_points.models import CollectionPoint
            try:
                points = CollectionPoint.objects.filter(admin=user)
                if points.exists():
                    qs = Report.objects.filter(point__in=points).order_by('-created_at')
                    if point_filter:
                        qs = qs.filter(point_id=point_filter)
                    return qs
            except Exception:
                pass
            return Report.objects.all().order_by('-created_at')

        qs = Report.objects.filter(user=user).order_by('-created_at')
        if point_filter:
            qs = qs.filter(point_id=point_filter)
        return qs

    def perform_create(self, serializer):
        report = serializer.save(user=self.request.user)
        logger.info(f'Nuevo reporte de {self.request.user.username}')

        try:
            from apps.gamification.services import otorgar_puntos_y_xp
            otorgar_puntos_y_xp(self.request.user, 'crear_reporte')
        except Exception as e:
            logger.error(f'Error al otorgar puntos por reporte: {e}')

        # Notificar al Centro de Acopio
        try:
            from apps.users.notifications import notificar_reporte_nuevo_a_centro
            notificar_reporte_nuevo_a_centro(report)
        except Exception as e:
            logger.error(f'Error al notificar reporte al centro: {e}')

    @action(detail=True, methods=['patch'], url_path='estado',
            permission_classes=[IsCentroAcopio])
    def estado(self, request, pk=None):
        report = self.get_object()
        new_status = request.data.get('status')
        if new_status not in [s[0] for s in Report.Status.choices]:
            return Response(
                {'error': 'Status inválido.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        report.status = new_status
        report.save()

        try:
            from apps.users.notifications import notificar_reporte_actualizado
            notificar_reporte_actualizado(report)
        except Exception as e:
            logger.error(f'Error al notificar reporte actualizado: {e}')

        logger.info(f'Reporte {pk} cambió a {new_status}')
        return Response(ReportSerializer(report).data)


class CommunityPostViewSet(viewsets.ModelViewSet):
    """Feed de comunidad exclusivo para recicladores."""
    serializer_class = CommunityPostSerializer
    permission_classes = [IsReciclador]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = CommunityPost.objects.select_related('author').prefetch_related('comments__author')
        tag = self.request.query_params.get('tag')
        if tag and tag != 'Todos':
            qs = qs.filter(tags__contains=tag)
        return qs

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
        logger.info(f'Nueva publicación de comunidad por {self.request.user.username}')

    def perform_destroy(self, instance):
        # Solo el propio autor puede eliminar
        if instance.author != self.request.user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Solo el autor puede eliminar esta publicación.')
        instance.delete()

    @action(detail=True, methods=['post'], url_path='comentar')
    def comentar(self, request, pk=None):
        post = self.get_object()
        content = request.data.get('content', '').strip()
        if not content:
            return Response({'error': 'El comentario no puede estar vacío.'}, status=status.HTTP_400_BAD_REQUEST)
        comment = PostComment.objects.create(post=post, author=request.user, content=content)
        return Response(PostCommentSerializer(comment, context={'request': request}).data, status=status.HTTP_201_CREATED)