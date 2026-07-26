import logging
import random
import string
from datetime import date, timedelta

from django.db import transaction
from .models import (
    Achievement, UserAchievement, Reward,
    RewardRedemption, PointTransaction
)

logger = logging.getLogger(__name__)

ACTION_REWARDS = {
    'actualizar_capacidad': {'points': 25, 'xp': 30, 'desc': 'Reporte de capacidad en punto de acopio'},
    'crear_reporte':        {'points': 50, 'xp': 60, 'desc': 'Reporte de incidencia de residuos'},
    'crear_propuesta':      {'points': 40, 'xp': 50, 'desc': 'Propuesta de mejora ciudadana'},
    'crear_opinion':        {'points': 15, 'xp': 20, 'desc': 'Opinión registrada en punto de reciclaje'},
    'completar_traslado':   {'points': 100, 'xp': 120, 'desc': 'Traslado de recolección completado'},
    'streak_diario':        {'points': 10, 'xp': 10, 'desc': 'Bonus por racha diaria activa'},
}

DEFAULT_ACHIEVEMENTS = [
    {
        'name': 'Iniciador del cambio',
        'description': 'Actualizaste la capacidad de un punto de reciclaje',
        'icon': '🌱',
        'category': 'REPORTE',
        'points_reward': 50,
        'xp_reward': 50,
        'condition_key': 'capacidad_count',
        'condition_value': 1,
    },
    {
        'name': 'Defensor del reciclaje',
        'description': 'Has realizado 5 actualizaciones de capacidad',
        'icon': '📄',
        'category': 'REPORTE',
        'points_reward': 100,
        'xp_reward': 100,
        'condition_key': 'capacidad_count',
        'condition_value': 5,
    },
    {
        'name': 'Voz ciudadana',
        'description': 'Enviaste una propuesta de sostenibilidad urbana',
        'icon': '📢',
        'category': 'COMUNIDAD',
        'points_reward': 40,
        'xp_reward': 40,
        'condition_key': 'propuestas_count',
        'condition_value': 1,
    },
    {
        'name': 'Reseñador verde',
        'description': 'Dejaste tu primera opinión en un punto de acopio',
        'icon': '✍️',
        'category': 'COMUNIDAD',
        'points_reward': 25,
        'xp_reward': 25,
        'condition_key': 'opiniones_count',
        'condition_value': 1,
    },
    {
        'name': 'Guardián de la ciudad',
        'description': 'Creaste tu primer reporte de residuo o desborde',
        'icon': '🚨',
        'category': 'RECICLAJE',
        'points_reward': 50,
        'xp_reward': 50,
        'condition_key': 'reportes_count',
        'condition_value': 1,
    },
    {
        'name': 'Héroe de la logística',
        'description': 'Completaste tu primer traslado como reciclador',
        'icon': '♻️',
        'category': 'RECICLAJE',
        'points_reward': 100,
        'xp_reward': 100,
        'condition_key': 'traslados_count',
        'condition_value': 1,
    },
    {
        'name': 'Ecolíder',
        'description': 'Completaste 10 traslados de recolección',
        'icon': '🏆',
        'category': 'RECICLAJE',
        'points_reward': 250,
        'xp_reward': 250,
        'condition_key': 'traslados_count',
        'condition_value': 10,
    },
    {
        'name': 'Racha de fuego',
        'description': 'Mantuviste tu racha de reciclaje activa por 3 días',
        'icon': '🔥',
        'category': 'RACHA',
        'points_reward': 75,
        'xp_reward': 75,
        'condition_key': 'streak_days',
        'condition_value': 3,
    },
    {
        'name': 'Racha imparable',
        'description': 'Mantuviste tu racha de reciclaje por 7 días consecutivos',
        'icon': '⚡',
        'category': 'RACHA',
        'points_reward': 150,
        'xp_reward': 150,
        'condition_key': 'streak_days',
        'condition_value': 7,
    },
    {
        'name': 'Embajador Verde',
        'description': 'Alcanzaste 500 XP acumulados en la plataforma',
        'icon': '⭐',
        'category': 'GENERAL',
        'points_reward': 200,
        'xp_reward': 200,
        'condition_key': 'xp_total',
        'condition_value': 500,
    },
]

DEFAULT_REWARDS = [
    {
        'title': 'Bolsa Ecológica Reutilizable GOMI',
        'description': 'Bolsa de algodón orgánico super resistente para tus compras cotidianas.',
        'icon': '🛍️',
        'category': 'PRODUCTO_ECO',
        'points_cost': 150,
        'level_required': 1,
        'stock': 50,
    },
    {
        'title': '20% Descuento en Tienda Eco-Sostenible',
        'description': 'Cupón de 20% de descuento en la red de tiendas verdes aliadas.',
        'icon': '🎟️',
        'category': 'DESCUENTO',
        'points_cost': 200,
        'level_required': 1,
        'stock': 100,
    },
    {
        'title': 'Pasaje de Transporte Público Sostenible',
        'description': 'Ticket digital para un viaje gratis en el sistema de transporte masivo.',
        'icon': '🚌',
        'category': 'DESCUENTO',
        'points_cost': 250,
        'level_required': 2,
        'stock': 30,
    },
    {
        'title': 'Kit de Semillas y Maceta Biodegradable',
        'description': 'Kit completo con semillas orgánicas de huerta urbana y maceta de fibra.',
        'icon': '🪴',
        'category': 'PRODUCTO_ECO',
        'points_cost': 350,
        'level_required': 2,
        'stock': 25,
    },
    {
        'title': 'Certificado de Siembra de Árbol Nativo',
        'description': 'Financiamos y sembramos un árbol nativo en la reserva forestal a tu nombre.',
        'icon': '🌳',
        'category': 'DONACION',
        'points_cost': 450,
        'level_required': 3,
        'stock': 999,
    },
    {
        'title': 'Termo Térmico de Acero Inoxidable',
        'description': 'Termo ecológico para bebidas frías/calientes con aislamiento al vacío.',
        'icon': '☕',
        'category': 'PRODUCTO_ECO',
        'points_cost': 600,
        'level_required': 4,
        'stock': 15,
    },
]


def inicializar_gamification_data():
    """Inicializa logros y recompensas por defecto si no existen."""
    for ach in DEFAULT_ACHIEVEMENTS:
        Achievement.objects.get_or_create(
            name=ach['name'],
            defaults=ach,
        )

    for rwd in DEFAULT_REWARDS:
        Reward.objects.get_or_create(
            title=rwd['title'],
            defaults=rwd,
        )
    logger.info('🏆 Gamificación inicializada con logros y recompensas por defecto.')


def actualizar_racha(user):
    """Actualiza la racha de días consecutivos del usuario."""
    today = date.today()

    if not user.last_activity_date:
        user.streak_days = 1
        user.max_streak = max(user.max_streak, 1)
        user.last_activity_date = today
    elif user.last_activity_date == today:
        pass  # Ya se registró actividad hoy
    elif user.last_activity_date == today - timedelta(days=1):
        user.streak_days += 1
        user.max_streak = max(user.max_streak, user.streak_days)
        user.last_activity_date = today
        # Otorgar bonus diario
        PointTransaction.objects.create(
            user=user,
            points=10,
            xp=10,
            action_type='STREAK_BONUS',
            description=f'Bonus por racha activa de {user.streak_days} días',
        )
        user.points += 10
        user.xp += 10
    else:
        # Racha rota
        user.streak_days = 1
        user.last_activity_date = today


def otorgar_puntos_y_xp(user, action_type, custom_desc=None, custom_points=None, custom_xp=None):
    """
    Otorga puntos y XP automáticamente al usuario según la acción realizada,
    actualiza su racha y verifica si desbloquea nuevos logros.
    """
    config = ACTION_REWARDS.get(action_type, {'points': 10, 'xp': 10, 'desc': 'Acción realizada'})
    pts = custom_points if custom_points is not None else config['points']
    xp = custom_xp if custom_xp is not None else config['xp']
    desc = custom_desc or config['desc']

    with transaction.atomic():
        user.points += pts
        user.xp += xp
        actualizar_racha(user)
        user.save()

        PointTransaction.objects.create(
            user=user,
            points=pts,
            xp=xp,
            action_type=action_type,
            description=desc,
        )

        verificar_logros(user)

    logger.info(f'🎉 +{pts} pts, +{xp} XP para {user.username} por {action_type}')
    return pts, xp


def verificar_logros(user):
    """Verifica si el usuario cumple condiciones para desbloquear nuevos logros."""
    from apps.reports.models import Report, Proposal, Review
    from apps.logistics.models import LogisticsAlert, CapacityLog

    capacidad_count = CapacityLog.objects.filter(reported_by=user).count()
    reportes_count = Report.objects.filter(user=user).count()
    propuestas_count = Proposal.objects.filter(user=user).count()
    opiniones_count = Review.objects.filter(user=user).count()
    traslados_count = LogisticsAlert.objects.filter(reciclador=user, status='COMPLETADA').count()

    condiciones = {
        'capacidad_count':  capacidad_count,
        'reportes_count':   reportes_count,
        'propuestas_count': propuestas_count,
        'opiniones_count':  opiniones_count,
        'traslados_count':  traslados_count,
        'streak_days':      user.streak_days,
        'puntos_total':     user.points,
        'xp_total':         user.xp,
    }

    achievements = Achievement.objects.all()

    for ach in achievements:
        user_val = condiciones.get(ach.condition_key, 0)
        if user_val >= ach.condition_value:
            _, created = UserAchievement.objects.get_or_create(
                user=user,
                achievement=ach,
            )
            if created:
                # Otorgar recompensa de puntos/XP por desbloquear logro
                user.points += ach.points_reward
                user.xp += ach.xp_reward
                user.save(update_fields=['points', 'xp'])

                PointTransaction.objects.create(
                    user=user,
                    points=ach.points_reward,
                    xp=ach.xp_reward,
                    action_type='ACHIEVEMENT_UNLOCKED',
                    description=f'¡Logro desbloqueado: {ach.name}!',
                )
                logger.info(f'🏆 Logro "{ach.name}" desbloqueado por {user.username}')


def canjear_recompensa(user, reward_id):
    """Procesa el canje de una recompensa por parte del usuario."""
    with transaction.atomic():
        try:
            reward = Reward.objects.select_for_update().get(id=reward_id, is_active=True)
        except Reward.DoesNotExist:
            return False, 'La recompensa no existe o no está disponible.', None

        if reward.stock <= 0:
            return False, 'Agotado: No quedan unidades de esta recompensa.', None

        if user.points < reward.points_cost:
            return False, f'Puntos insuficientes. Necesitas {reward.points_cost} pts (tienes {user.points} pts).', None

        lvl_info = user.level_info
        if lvl_info['level'] < reward.level_required:
            return False, f'Nivel insuficiente. Requiere Nivel {reward.level_required} (tienes Nivel {lvl_info["level"]}).', None

        # Generar código único de canje
        random_suffix = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        code = f'GOMI-{random_suffix}'

        # Descontar puntos y stock
        user.points -= reward.points_cost
        user.save(update_fields=['points'])

        reward.stock -= 1
        reward.save(update_fields=['stock'])

        redemption = RewardRedemption.objects.create(
            user=user,
            reward=reward,
            code=code,
            points_spent=reward.points_cost,
        )

        PointTransaction.objects.create(
            user=user,
            points=-reward.points_cost,
            xp=0,
            action_type='REWARD_REDEEMED',
            description=f'Canje de recompensa: {reward.title}',
        )

        return True, '¡Canje realizado con éxito!', redemption