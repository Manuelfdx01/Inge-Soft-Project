from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from apps.collection_points.models import CollectionPoint
from .models import LogisticsAlert


class LogisticsAlertTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.reciclador = User.objects.create_user(
            username='recicladortest',
            password='test1234pass',
            role='RECICLADOR',
        )
        self.ciudadano = User.objects.create_user(
            username='ciudadanotest',
            password='test1234pass',
            role='CIUDADANO',
        )
        self.origin = CollectionPoint.objects.create(
            name='Origen', address='Calle 1', latitude=4.71,
            longitude=-74.07, capacity_max=100, capacity_current=90,
            status='CRITICO',
        )
        self.target = CollectionPoint.objects.create(
            name='Destino', address='Calle 2', latitude=4.72,
            longitude=-74.06, capacity_max=100, capacity_current=20,
            status='NORMAL',
        )
        self.alerta = LogisticsAlert.objects.create(
            origin_point=self.origin,
            target_point=self.target,
            priority='ALTA',
            status='PENDIENTE',
            distance_km=1.2,
        )

    def test_reciclador_puede_aceptar_alerta(self):
        """Un reciclador puede aceptar una alerta pendiente."""
        self.client.force_authenticate(user=self.reciclador)
        res = self.client.patch(f'/api/logistics/alerts/{self.alerta.id}/aceptar/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'ACEPTADA')

    def test_ciudadano_no_puede_aceptar_alerta(self):
        """Un ciudadano no puede aceptar alertas logísticas."""
        self.client.force_authenticate(user=self.ciudadano)
        res = self.client.patch(f'/api/logistics/alerts/{self.alerta.id}/aceptar/')
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_alerta_ya_aceptada_devuelve_conflict(self):
        """No se puede aceptar una alerta que ya fue aceptada."""
        self.alerta.status = 'ACEPTADA'
        self.alerta.reciclador = self.reciclador
        self.alerta.save()
        otro_reciclador = User.objects.create_user(
            username='otro_rec', password='test1234pass', role='RECICLADOR'
        )
        self.client.force_authenticate(user=otro_reciclador)
        res = self.client.patch(f'/api/logistics/alerts/{self.alerta.id}/aceptar/')
        self.assertEqual(res.status_code, status.HTTP_409_CONFLICT)

    def test_completar_traslado(self):
        """El reciclador asignado puede completar el traslado."""
        self.alerta.status = 'ACEPTADA'
        self.alerta.reciclador = self.reciclador
        self.alerta.save()
        self.client.force_authenticate(user=self.reciclador)
        res = self.client.patch(f'/api/logistics/alerts/{self.alerta.id}/completar/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['status'], 'COMPLETADA')