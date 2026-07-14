from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import User


class AuthTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.ciudadano = User.objects.create_user(
            username='testciudadano',
            email='ciudadano@test.com',
            password='test1234pass',
            role='CIUDADANO',
        )
        self.reciclador = User.objects.create_user(
            username='testreciclador',
            email='reciclador@test.com',
            password='test1234pass',
            role='RECICLADOR',
        )

    def test_registro_exitoso(self):
        """Un usuario puede registrarse con datos válidos."""
        res = self.client.post('/api/users/register/', {
            'username': 'nuevousuario',
            'email': 'nuevo@test.com',
            'password': 'password123',
            'role': 'CIUDADANO',
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn('username', res.data)

    def test_registro_email_duplicado(self):
        """No se puede registrar dos usuarios con el mismo email."""
        res = self.client.post('/api/users/register/', {
            'username': 'otro',
            'email': 'ciudadano@test.com',
            'password': 'password123',
            'role': 'CIUDADANO',
        })
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_exitoso(self):
        """Un usuario puede hacer login con credenciales válidas."""
        res = self.client.post('/api/auth/login/', {
            'username': 'testciudadano',
            'password': 'test1234pass',
        })
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn('access', res.data)
        self.assertIn('refresh', res.data)

    def test_login_credenciales_incorrectas(self):
        """Login con contraseña incorrecta devuelve 401."""
        res = self.client.post('/api/auth/login/', {
            'username': 'testciudadano',
            'password': 'wrongpassword',
        })
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_perfil_requiere_autenticacion(self):
        """El endpoint /me/ requiere token JWT."""
        res = self.client.get('/api/users/me/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_perfil_autenticado(self):
        """Un usuario autenticado puede ver su perfil."""
        self.client.force_authenticate(user=self.ciudadano)
        res = self.client.get('/api/users/me/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['username'], 'testciudadano')

    def test_toggle_disponibilidad_solo_reciclador(self):
        """Solo un reciclador puede cambiar su disponibilidad."""
        self.client.force_authenticate(user=self.ciudadano)
        res = self.client.patch('/api/users/disponibilidad/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_toggle_disponibilidad_reciclador(self):
        """Un reciclador puede cambiar su disponibilidad."""
        self.client.force_authenticate(user=self.reciclador)
        res = self.client.patch('/api/users/disponibilidad/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['is_available'], True)