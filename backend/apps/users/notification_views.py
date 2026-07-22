import logging
from rest_framework import permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet
from rest_framework import serializers
from apps.users.models import Notification

logger = logging.getLogger(__name__)


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'type', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'type', 'message', 'created_at']


class NotificationViewSet(ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ['get', 'patch']

    def get_queryset(self):
        return Notification.objects.filter(
            user=self.request.user
        ).order_by('-created_at')

    @action(detail=True, methods=['patch'], url_path='leer')
    def leer(self, request, pk=None):
        notif = self.get_object()
        notif.is_read = True
        notif.save()
        logger.info(f'Notificación {pk} leída por {request.user.username}')
        return Response(NotificationSerializer(notif).data)

    @action(detail=False, methods=['patch'], url_path='leer-todas')
    def leer_todas(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).update(is_read=True)
        logger.info(f'{request.user.username} marcó {count} notificaciones como leídas')
        return Response({'marked_as_read': count})

    @action(detail=False, methods=['get'], url_path='no-leidas')
    def no_leidas(self, request):
        count = Notification.objects.filter(
            user=request.user, is_read=False
        ).count()
        return Response({'unread_count': count})