from rest_framework import serializers
from .models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email',
            'first_name', 'last_name',
            'role', 'phone', 'avatar',
            'points', 'is_available',
        ]
        read_only_fields = ['id', 'points', 'role']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'phone']

    def validate_role(self, value):
        allowed = [
            User.Role.CIUDADANO,
            User.Role.RECICLADOR,
            User.Role.CENTRO_ACOPIO,
        ]
        if value not in allowed:
            raise serializers.ValidationError(
                f'Rol no permitido en el registro. Roles válidos: {allowed}'
            )
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Este correo electrónico ya está registrado.')
        return value

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        if user.role == User.Role.CENTRO_ACOPIO:
            from apps.collection_points.models import CollectionPoint
            CollectionPoint.objects.create(
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
        return user


class PublicUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'is_available']

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):

    def validate(self, attrs):
        data = super().validate(attrs)

        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': self.user.role,
            'points': self.user.points,
            'is_available': self.user.is_available,
        }

        return data