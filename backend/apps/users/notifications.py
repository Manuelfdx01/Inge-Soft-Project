import logging
from .models import Notification

logger = logging.getLogger(__name__)


def crear_notificacion(user, type, message):
    """Crea una notificación para un usuario."""
    notif = Notification.objects.create(
        user=user,
        type=type,
        message=message,
    )
    logger.info(f'[NOTIF] {type} → {user.username}: {message}')
    return notif


def notificar_punto_critico(point):
    """
    Notifica a todos los usuarios que tienen
    el punto como favorito o que están cerca.
    Por ahora notifica a todos los ciudadanos activos.
    """
    from apps.users.models import User
    ciudadanos = User.objects.filter(
        role='CIUDADANO',
        is_active=True,
    )
    for user in ciudadanos:
        crear_notificacion(
            user=user,
            type='PUNTO_CRITICO',
            message=f'⚠️ El punto "{point.name}" está al {point.capacity_pct}% de capacidad.',
        )


def notificar_propuesta_actualizada(proposal):
    """Notifica al usuario cuando su propuesta cambia de estado."""
    crear_notificacion(
        user=proposal.user,
        type='PROPUESTA',
        message=f'Tu propuesta "{proposal.title}" cambió a estado: {proposal.status}.',
    )


def notificar_alerta_asignada(alert):
    """Notifica al reciclador cuando se le asigna una alerta."""
    if not alert.reciclador:
        return
    crear_notificacion(
        user=alert.reciclador,
        type='ALERTA_ASIGNADA',
        message=(
            f'Se te asignó un traslado de {alert.origin_point.name} '
            f'→ {alert.target_point.name}.'
        ),
    )