import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Review, Proposal, Report
from .serializers import (
    ReviewSerializer, ProposalSerializer,
    ProposalStatusSerializer, ReportSerializer,
)

logger = logging.getLogger(__name__)


class IsAdminGomi(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'ADMIN'


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


class ProposalViewSet(viewsets.ModelViewSet):
    serializer_class = ProposalSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Proposal.objects.all().order_by('-created_at')
        return Proposal.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        logger.info(f'Nueva propuesta de {self.request.user.username}')

    @action(detail=True, methods=['patch'], url_path='estado',
            permission_classes=[IsAdminGomi])
    def estado(self, request, pk=None):
        proposal = self.get_object()
        serializer = ProposalStatusSerializer(proposal, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            logger.info(f'Propuesta {pk} cambió a estado {proposal.status}')
            return Response(ProposalSerializer(proposal).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Report.objects.all().order_by('-created_at')
        return Report.objects.filter(user=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
        logger.info(f'Nuevo reporte de {self.request.user.username}')

    @action(detail=True, methods=['patch'], url_path='estado',
            permission_classes=[IsAdminGomi])
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
        logger.info(f'Reporte {pk} cambió a {new_status}')
        return Response(ReportSerializer(report).data)