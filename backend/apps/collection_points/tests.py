from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from apps.users.models import User
from .models import CollectionPoint, WasteType


class CollectionPointTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()
        self.admin = User.objects.create_user(
            username='admintest',
            password='admin1234pass',
            role='ADMIN',
        )
        self.ciudadano = User.objects.create_user(
            username='ciudadanotest',
            password='test1234pass',
            role='CIUDADANO',
        )
        self.waste_type = WasteType.objects.create(
            name='PLASTICO', icon='🟠', color='#FF6B2B'
        )
        self.punto = CollectionPoint.objects.create(
            name='Punto de prueba',
            address='Calle 1 #1-1, Bogotá',
            latitude=4.7110,
            longitude=-74.0721,
            capacity_max=100,
            capacity_current=30,
        )
        self.punto.waste_types.add(self.waste_type)

    def test_listar_puntos_publico(self):
        """Cualquier usuario puede listar los puntos sin autenticación."""
        res = self.client.get('/api/collection-points/')
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res.data), 1)

    def test_crear_punto_requiere_admin(self):
        """Un ciudadano no puede crear puntos de reciclaje."""
        self.client.force_authenticate(user=self.ciudadano)
        res = self.client.post('/api/collection-points/', {
            'name': 'Nuevo punto',
            'address': 'Calle 2 #2-2',
            'latitude': 4.720,
            'longitude': -74.060,
            'capacity_max': 100,
            'waste_type_ids': [self.waste_type.id],
        })
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_crear_punto_como_admin(self):
        """Un admin puede crear puntos de reciclaje."""
        self.client.force_authenticate(user=self.admin)
        res = self.client.post('/api/collection-points/', {
            'name': 'Nuevo punto admin',
            'address': 'Calle 3 #3-3',
            'latitude': 4.730,
            'longitude': -74.070,
            'capacity_max': 150,
            'waste_type_ids': [self.waste_type.id],
        })
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_capacity_pct_calculado(self):
        """El porcentaje de capacidad se calcula correctamente."""
        self.assertEqual(self.punto.capacity_pct, 30)

    def test_actualizar_capacidad_genera_estado(self):
        """Al superar 85% el estado cambia a CRITICO."""
        self.client.force_authenticate(user=self.ciudadano)
        self.punto.capacity_current = 90
        self.punto.update_status()
        self.assertEqual(self.punto.status, 'CRITICO')

    def test_actualizar_capacidad_genera_alerta(self):
        """Al actualizar capacidad a >85% se genera una alerta logística."""
        segundo_punto = CollectionPoint.objects.create(
            name='Punto destino',
            address='Calle 5 #5-5',
            latitude=4.7150,
            longitude=-74.0700,
            capacity_max=100,
            capacity_current=10,
        )
        self.client.force_authenticate(user=self.ciudadano)
        res = self.client.patch(
            f'/api/collection-points/{self.punto.id}/capacidad/',
            {'capacity_current': 90, 'waste_type': 'PLASTICO'},
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data['alert_triggered'])