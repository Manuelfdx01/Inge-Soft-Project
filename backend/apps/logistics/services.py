import math
import logging
from .models import LogisticsAlert, CapacityLog

logger = logging.getLogger(__name__)


def calcular_distancia(lat1, lon1, lat2, lon2):
    """Fórmula de Haversine para calcular distancia en km."""
    R = 6371
    dlat = math.radians(float(lat2) - float(lat1))
    dlon = math.radians(float(lon2) - float(lon1))
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(float(lat1))) *
         math.cos(math.radians(float(lat2))) *
         math.sin(dlon / 2) ** 2)
    return round(R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a)), 2)


def encontrar_punto_destino(origin_point):
    """
    Encuentra el punto de reciclaje más cercano
    con menor ocupación para recibir el traslado.
    """
    from apps.collection_points.models import CollectionPoint

    candidatos = CollectionPoint.objects.filter(
        status='NORMAL'
    ).exclude(id=origin_point.id)

    if not candidatos.exists():
        logger.warning(f'No hay puntos destino disponibles para {origin_point.name}')
        return None

    mejor = None
    menor_score = float('inf')

    for punto in candidatos:
        distancia = calcular_distancia(
            origin_point.latitude, origin_point.longitude,
            punto.latitude, punto.longitude,
        )
        score = (punto.capacity_pct * 0.7) + (distancia * 0.3)
        if score < menor_score:
            menor_score = score
            mejor = (punto, distancia)

    return mejor


def generar_alerta_si_critico(point, waste_type='', reported_by=None):
    """
    Si el punto supera 85% de capacidad, genera
    una alerta logística automáticamente.
    """
    if point.capacity_pct < 85:
        return None

    alerta_existente = LogisticsAlert.objects.filter(
        origin_point=point,
        status__in=['PENDIENTE', 'ACEPTADA', 'EN_PROCESO'],
    ).first()

    if alerta_existente:
        logger.info(f'Ya existe alerta activa para {point.name}')
        return alerta_existente

    resultado = encontrar_punto_destino(point)
    if not resultado:
        return None

    target_point, distancia = resultado

    prioridad = (
        LogisticsAlert.Priority.ALTA
        if point.capacity_pct >= 90
        else LogisticsAlert.Priority.MEDIA
    )

    alerta = LogisticsAlert.objects.create(
        origin_point=point,
        target_point=target_point,
        waste_type=waste_type,
        priority=prioridad,
        distance_km=distancia,
    )

    logger.info(
        f'[ALERTA] {prioridad} generada: {point.name} '
        f'({point.capacity_pct}%) → {target_point.name} '
        f'({distancia} km)'
    )
    return alerta


def registrar_capacidad(point, capacity_pct, waste_type='', notes='', reported_by=None):
    """Guarda un registro histórico de capacidad."""
    return CapacityLog.objects.create(
        point=point,
        capacity_pct=capacity_pct,
        waste_type=waste_type,
        notes=notes,
        reported_by=reported_by,
    )