from django.db import models
from django.conf import settings


class RecyclingGuide(models.Model):
    DIFFICULTY_CHOICES = [
        ('FACIL',  'Fácil'),
        ('MEDIO',  'Intermedio'),
        ('AVANZADO', 'Avanzado'),
    ]

    title            = models.CharField(max_length=150)
    content          = models.TextField()
    waste_type       = models.CharField(max_length=50)   # PLASTICO, PAPEL, VIDRIO…
    category         = models.CharField(max_length=80, blank=True)  # label visible
    difficulty       = models.CharField(
        max_length=10, choices=DIFFICULTY_CHOICES, default='FACIL'
    )
    tips             = models.JSONField(default=list, blank=True)
    reading_time_min = models.PositiveSmallIntegerField(default=2)
    icon             = models.CharField(max_length=10, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='guides',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Guía de reciclaje'
        verbose_name_plural = 'Guías de reciclaje'
        ordering = ['waste_type', 'title']

    def __str__(self):
        return f'{self.icon} {self.title}'


class Achievement(models.Model):
    CATEGORY_CHOICES = [
        ('GENERAL',   'General'),
        ('REPORTE',   'Reportes de Puntos'),
        ('RECICLAJE', 'Reciclaje & Novedades'),
        ('COMUNIDAD', 'Participación Ciudadana'),
        ('RACHA',     'Rachas Activas'),
    ]

    name             = models.CharField(max_length=100, unique=True)
    description      = models.TextField()
    icon             = models.CharField(max_length=10)
    category         = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='GENERAL')
    points_reward    = models.IntegerField(default=50)
    xp_reward        = models.IntegerField(default=50)
    points_required  = models.IntegerField(default=0)
    condition_key    = models.CharField(max_length=50, blank=True)
    condition_value  = models.IntegerField(default=1)

    class Meta:
        verbose_name = 'Logro'
        verbose_name_plural = 'Logros'
        ordering = ['id']

    def __str__(self):
        return f'{self.icon} {self.name}'


class UserAchievement(models.Model):
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='achievements',
    )
    achievement = models.ForeignKey(
        Achievement,
        on_delete=models.CASCADE,
        related_name='users',
    )
    earned_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Logro de usuario'
        unique_together = ('user', 'achievement')

    def __str__(self):
        return f'{self.user.username} → {self.achievement.name}'


class Reward(models.Model):
    CATEGORY_CHOICES = [
        ('DESCUENTO',    'Descuento o Cupón'),
        ('PRODUCTO_ECO', 'Producto Ecológico'),
        ('CERTIFICADO',   'Reconocimiento Eco'),
        ('DONACION',      'Donación Ambiental'),
    ]

    title          = models.CharField(max_length=120)
    description    = models.TextField()
    icon           = models.CharField(max_length=10, default='🎁')
    category       = models.CharField(max_length=30, choices=CATEGORY_CHOICES, default='DESCUENTO')
    points_cost    = models.IntegerField(default=100)
    level_required = models.IntegerField(default=1)
    stock          = models.IntegerField(default=100)
    is_active      = models.BooleanField(default=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Recompensa'
        verbose_name_plural = 'Recompensas'
        ordering = ['points_cost']

    def __str__(self):
        return f'{self.icon} {self.title} ({self.points_cost} pts)'


class RewardRedemption(models.Model):
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='redemptions',
    )
    reward      = models.ForeignKey(
        Reward,
        on_delete=models.CASCADE,
        related_name='redemptions',
    )
    code        = models.CharField(max_length=25, unique=True)
    points_spent= models.IntegerField()
    redeemed_at = models.DateTimeField(auto_now_add=True)
    status      = models.CharField(max_length=20, default='ACTIVO')

    class Meta:
        verbose_name = 'Canje de recompensa'
        verbose_name_plural = 'Canjes de recompensas'
        ordering = ['-redeemed_at']

    def __str__(self):
        return f'{self.user.username} - {self.reward.title} ({self.code})'


class PointTransaction(models.Model):
    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='point_transactions',
    )
    points      = models.IntegerField()
    xp          = models.IntegerField(default=0)
    action_type = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Transacción de puntos'
        verbose_name_plural = 'Transacciones de puntos'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.user.username}: {self.points} pts / {self.xp} XP ({self.action_type})'