from django.core.management.base import BaseCommand
from apps.collection_points.models import CollectionPoint, WasteType


WASTE_TYPES_DATA = [
    {'name': 'PLASTICO', 'description': 'Botellas y envases de PET y plásticos limpios', 'icon': '🟠', 'color': '#FF6B2B'},
    {'name': 'VIDRIO',   'description': 'Botellas y frascos de vidrio (no rotos)',       'icon': '🔵', 'color': '#1565C0'},
    {'name': 'PAPEL',    'description': 'Papel, cartón, periódicos y revistas secos',    'icon': '🟣', 'color': '#9C27B0'},
    {'name': 'METAL',    'description': 'Latas de aluminio y conservas',                 'icon': '⚪', 'color': '#757575'},
    {'name': 'ORGANICO', 'description': 'Restos de comida y orgánicos compostables',     'icon': '🟢', 'color': '#2E7D32'},
]

# 12 puntos distribuidos por Bogotá con todos los estados:
# NORMAL (capacidad < 61%), ALERTA (61-85%), CRITICO (> 85%), INACTIVO
POINTS_DATA = [
    # ── NORMAL (<61%) ──────────────────────────────────────
    {
        'name': 'Punto Limpio Parque Bavaria',
        'address': 'Cra. 13 #28-01, Santa Fe, Bogotá',
        'latitude': 4.6185, 'longitude': -74.0698,
        'capacity_max': 120, 'capacity_current': 42,
        'waste_types': ['PLASTICO', 'PAPEL', 'VIDRIO'],
    },
    {
        'name': 'Contenedor Inteligente Unicentro',
        'address': 'Av. 15 #124-30, Usaquén, Bogotá',
        'latitude': 4.7015, 'longitude': -74.0322,
        'capacity_max': 150, 'capacity_current': 25,
        'waste_types': ['PLASTICO', 'PAPEL', 'METAL', 'ORGANICO'],
    },
    {
        'name': 'Punto Limpio Plaza Bolívar',
        'address': 'Carrera 7 #11-10, La Candelaria, Bogotá',
        'latitude': 4.5981, 'longitude': -74.0760,
        'capacity_max': 80, 'capacity_current': 30,
        'waste_types': ['PAPEL', 'VIDRIO'],
    },
    {
        'name': 'Punto Verde Titan Plaza',
        'address': 'Av. Boyacá #80-94, Engativá, Bogotá',
        'latitude': 4.6958, 'longitude': -74.0865,
        'capacity_max': 140, 'capacity_current': 45,
        'waste_types': ['PLASTICO', 'PAPEL', 'ORGANICO'],
    },
    # ── ALERTA (61-85%) ────────────────────────────────────
    {
        'name': 'Estación de Reciclaje Zona G',
        'address': 'Cra. 5 #69-12, Chapinero, Bogotá',
        'latitude': 4.6542, 'longitude': -74.0558,
        'capacity_max': 100, 'capacity_current': 78,
        'waste_types': ['VIDRIO', 'METAL'],
    },
    {
        'name': 'Ecopunto Parque de la 93',
        'address': 'Calle 93A #13-25, Chapinero, Bogotá',
        'latitude': 4.6768, 'longitude': -74.0482,
        'capacity_max': 110, 'capacity_current': 75,
        'waste_types': ['PLASTICO', 'PAPEL', 'VIDRIO'],
    },
    {
        'name': 'Ecopunto Portal Suba',
        'address': 'Av. Suba #145-10, Suba, Bogotá',
        'latitude': 4.7431, 'longitude': -74.0840,
        'capacity_max': 130, 'capacity_current': 95,
        'waste_types': ['PLASTICO', 'METAL'],
    },
    # ── CRITICO (>85%) ─────────────────────────────────────
    {
        'name': 'Ecopunto Parque Virrey',
        'address': 'Calle 87 #15-30, Chapinero, Bogotá',
        'latitude': 4.6724, 'longitude': -74.0545,
        'capacity_max': 100, 'capacity_current': 96,
        'waste_types': ['PLASTICO', 'VIDRIO'],
    },
    {
        'name': 'Punto Verde Salitre Plaza',
        'address': 'Cra. 68B #24-39, Fontibón, Bogotá',
        'latitude': 4.6521, 'longitude': -74.1105,
        'capacity_max': 90, 'capacity_current': 88,
        'waste_types': ['PLASTICO', 'ORGANICO'],
    },
    {
        'name': 'Centro de Acopio Universidad Nacional',
        'address': 'Av. Cra 30 #45-03, Teusaquillo, Bogotá',
        'latitude': 4.6382, 'longitude': -74.0841,
        'capacity_max': 200, 'capacity_current': 190,
        'waste_types': ['PLASTICO', 'PAPEL', 'METAL', 'ORGANICO', 'VIDRIO'],
    },
    # ── INACTIVO (en mantenimiento) ────────────────────────
    {
        'name': 'Ecopunto Marly (En Mantenimiento)',
        'address': 'Cra. 13 #48-20, Chapinero, Bogotá',
        'latitude': 4.6360, 'longitude': -74.0670,
        'capacity_max': 100, 'capacity_current': 0,
        'force_status': 'INACTIVO',
        'waste_types': ['PLASTICO', 'VIDRIO'],
    },
    {
        'name': 'Punto Temporal Restrepo (Inactivo)',
        'address': 'Calle 18 Sur #16-24, Antonio Nariño, Bogotá',
        'latitude': 4.5820, 'longitude': -74.0980,
        'capacity_max': 90, 'capacity_current': 0,
        'force_status': 'INACTIVO',
        'waste_types': ['PAPEL', 'METAL'],
    },
]


class Command(BaseCommand):
    help = 'Seed collection points and waste types (skips if data already exists)'

    def handle(self, *args, **options):
        # ── Waste types (always upsert so icons/colors stay current) ──
        waste_map = {}
        for wt_info in WASTE_TYPES_DATA:
            wt, _ = WasteType.objects.get_or_create(
                name=wt_info['name'],
                defaults={k: v for k, v in wt_info.items() if k != 'name'},
            )
            waste_map[wt_info['name']] = wt

        # ── Collection points (skip if any already exist) ─────────────
        if CollectionPoint.objects.exists():
            self.stdout.write('ℹ️  Puntos de acopio ya existen — omitiendo seed.')
            return

        created_count = 0
        for p_info in POINTS_DATA:
            w_names = p_info.pop('waste_types')
            force_status = p_info.pop('force_status', None)

            point, _ = CollectionPoint.objects.get_or_create(
                name=p_info['name'],
                defaults=p_info,
            )

            # Set status
            if force_status:
                point.status = force_status
                point.save(update_fields=['status'])
            else:
                point.update_status()   # derives NORMAL / ALERTA / CRITICO from capacity

            # Attach waste types
            point.waste_types.set([waste_map[n] for n in w_names if n in waste_map])

            created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Seed completado: {created_count} puntos de acopio creados.'
            )
        )
