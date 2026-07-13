import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import User
from .serializers import UserSerializer, RegisterSerializer, PublicUserSerializer

logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action == 'register':
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            logger.info(f'Nuevo usuario registrado: {user.username} rol={user.role}')
            return Response(
                UserSerializer(user).data,
                status=status.HTTP_201_CREATED
            )
        logger.warning(f'Intento de registro fallido: {serializer.errors}')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get', 'patch'], url_path='me')
    def me(self, request):
        if request.method == 'GET':
            return Response(UserSerializer(request.user).data)
        serializer = UserSerializer(
            request.user, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['patch'], url_path='disponibilidad')
    def disponibilidad(self, request):
        if not request.user.is_reciclador:
            return Response(
                {'error': 'Solo recicladores pueden cambiar disponibilidad.'},
                status=status.HTTP_403_FORBIDDEN
            )
        request.user.is_available = not request.user.is_available
        request.user.save()
        logger.info(f'Reciclador {request.user.username} disponibilidad={request.user.is_available}')
        return Response({'is_available': request.user.is_available})

    @action(detail=False, methods=['get'], url_path='recicladores')
    def recicladores(self, request):
        if not request.user.is_admin_gomi:
            return Response(
                {'error': 'Solo administradores pueden ver esta lista.'},
                status=status.HTTP_403_FORBIDDEN
            )
        disponible = request.query_params.get('disponible')
        qs = User.objects.filter(role=User.Role.RECICLADOR)
        if disponible == 'true':
            qs = qs.filter(is_available=True)
        return Response(PublicUserSerializer(qs, many=True).data)