from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    class Role(models.TextChoices):
        CIUDADANO  = 'CIUDADANO',  'Ciudadano'
        RECICLADOR = 'RECICLADOR', 'Reciclador'
        ADMIN      = 'ADMIN',      'Administrador'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.CIUDADANO,
    )
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)
    points = models.IntegerField(default=0)
    xp = models.IntegerField(default=0)
    streak_days = models.IntegerField(default=0)
    max_streak = models.IntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)
    is_available = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Usuario'
        verbose_name_plural = 'Usuarios'

    def __str__(self):
        return f'{self.username} ({self.role})'

    @property
    def is_reciclador(self):
        return self.role == self.Role.RECICLADOR

    @property
    def is_ciudadano(self):
        return self.role == self.Role.CIUDADANO

    @property
    def is_admin_gomi(self):
        return self.role == self.Role.ADMIN

    @property
    def level_info(self):
        levels = [
            (1, 'Novato Verde', 0, '🌱'),
            (2, 'Reciclador Activo', 100, '🌿'),
            (3, 'Guardián Ecológico', 250, '🌳'),
            (4, 'Embajador Sostenible', 500, '⭐'),
            (5, 'Maestro del Reciclaje', 1000, '👑'),
            (6, 'Héroe del Planeta', 2000, '💎'),
        ]
        current_lvl = levels[0]
        next_lvl = None
        for i in range(len(levels)):
            if self.xp >= levels[i][2]:
                current_lvl = levels[i]
                if i + 1 < len(levels):
                    next_lvl = levels[i + 1]
                else:
                    next_lvl = None

        if next_lvl:
            xp_current_lvl = current_lvl[2]
            xp_next_lvl = next_lvl[2]
            needed = xp_next_lvl - xp_current_lvl
            progress = self.xp - xp_current_lvl
            pct = min(100, max(0, int((progress / needed) * 100))) if needed > 0 else 100
            xp_to_next = xp_next_lvl - self.xp
        else:
            pct = 100
            xp_to_next = 0

        return {
            'level': current_lvl[0],
            'title': current_lvl[1],
            'icon': current_lvl[3],
            'current_xp': self.xp,
            'current_level_min_xp': current_lvl[2],
            'next_level_xp': next_lvl[2] if next_lvl else current_lvl[2],
            'next_level_title': next_lvl[1] if next_lvl else 'Nivel Máximo',
            'xp_to_next': xp_to_next,
            'progress_pct': pct,
        }

class Notification(models.Model):
    class Type(models.TextChoices):
        PUNTO_CRITICO = 'PUNTO_CRITICO', 'Punto crítico'
        PROPUESTA = 'PROPUESTA', 'Propuesta actualizada'
        ALERTA_ASIGNADA = 'ALERTA_ASIGNADA', 'Alerta asignada'
        GENERAL = 'GENERAL', 'General'

    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='notifications',
    )
    type = models.CharField(max_length=20, choices=Type.choices)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.type} → {self.user.username}'
