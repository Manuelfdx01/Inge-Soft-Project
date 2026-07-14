import logging
from .models import Achievement, UserAchievement

logger = logging.getLogger(__name__)

PUNTOS_POR_ACCION = {
    'primer_reporte':     50,
    'cinco_reportes':    100,
    'primera_propuesta':  30,
    'primer_traslado':    80,
    'diez_traslados':    200,
}

LOGROS = [
    {
        'name': 'Iniciador del cambio',
        'description': 'Hiciste tu primer reporte',
        'icon': '🌱',
        'points_required': 50,
        'condition_key': 'primer_reporte',
        'condition_value': 1,
    },
    {
        'name': 'Defensor del papel',
        'description': 'Hiciste 5 reportes',
        'icon': '📄',
        'points_required': 100,
        'condition_key': 'cinco_reportes',
        'condition_value': 5,
    },
    {
        'name': 'Voz ciudadana',
        'description': 'Enviaste tu primera propuesta',
        'icon': '📢',
        'points_required': 30,
        'condition_key': 'primera_propuesta',
        'condition_value': 1,
    },
    {
        'name': 'Primer traslado',
        'description': 'Completaste tu primer traslado como reciclador',
        'icon': '♻️',
        'points_required': 80,
        'condition_key': 'primer_traslado',
        'condition_value': 1,
    },
    {
        'name': 'Guardián del vidrio',
        'description': 'Completaste 10 traslados',
        'icon': '🏆',
        'points_required': 200,
        'condition_key': 'diez_traslados',
        'condition_value': 10,
    },
]


def inicializar_logros():
    """
    Crea los logros base en la BD si no existen.
    Llamar una vez al arrancar o desde el admin.
    """
    for data in LOGROS:
        Achievement.objects.get_or_create(
            name=data['name'],
            defaults=data,
        )
    logger.info('Logros inicializados correctamente')


def otorgar_puntos(user, accion):
    """Suma puntos al usuario según la acción realizada."""
    puntos = PUNTOS_POR_ACCION.get(accion, 0)
    if puntos == 0:
        return
    user.points += puntos
    user.save(update_fields=['points'])
    logger.info(f'+{puntos} pts a {user.username} por {accion}')
    verificar_logros(user)


def verificar_logros(user):
    """
    Revisa si el usuario cumple condiciones para
    obtener nuevos logros y se los otorga.
    """
    from apps.reports.models import Report, Proposal
    from apps.logistics.models import LogisticsAlert

    condiciones = {
        'primer_reporte':     Report.objects.filter(user=user).count() >= 1,
        'cinco_reportes':     Report.objects.filter(user=user).count() >= 5,
        'primera_propuesta':  Proposal.objects.filter(user=user).count() >= 1,
        'primer_traslado':    LogisticsAlert.objects.filter(
                                  reciclador=user, status='COMPLETADA'
                              ).count() >= 1,
        'diez_traslados':     LogisticsAlert.objects.filter(
                                  reciclador=user, status='COMPLETADA'
                              ).count() >= 10,
    }

    for logro in Achievement.objects.all():
        cumple = condiciones.get(logro.condition_key, False)
        if cumple:
            _, created = UserAchievement.objects.get_or_create(
                user=user,
                achievement=logro,
            )
            if created:
                logger.info(f'🏆 Logro "{logro.name}" otorgado a {user.username}')