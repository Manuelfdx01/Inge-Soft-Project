from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    user  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    point = models.ForeignKey(
        'collection_points.CollectionPoint',
        on_delete=models.CASCADE,
        related_name='reviews',
    )
    rating     = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment    = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Opinión'
        verbose_name_plural = 'Opiniones'
        unique_together = ('user', 'point')

    def __str__(self):
        return f'{self.user.username} → {self.point.name} ({self.rating}★)'


class Proposal(models.Model):

    class Status(models.TextChoices):
        RECIBIDA   = 'RECIBIDA',   'Recibida'
        EN_REVISION = 'EN_REVISION', 'En revisión'
        APROBADA   = 'APROBADA',   'Aprobada'
        RECHAZADA  = 'RECHAZADA',  'Rechazada'

    user           = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='proposals',
    )
    title          = models.CharField(max_length=150)
    description    = models.TextField()
    status         = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.RECIBIDA,
    )
    admin_response = models.TextField(blank=True)
    votes          = models.IntegerField(default=0)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Propuesta'
        verbose_name_plural = 'Propuestas'

    def __str__(self):
        return f'{self.title} ({self.status})'


class Report(models.Model):

    class Type(models.TextChoices):
        DANO           = 'DANO',           'Daño en contenedor'
        MAL_USO        = 'MAL_USO',        'Mal uso'
        DESBORDAMIENTO = 'DESBORDAMIENTO', 'Desbordamiento'
        OTRO           = 'OTRO',           'Otro'

    class Status(models.TextChoices):
        PENDIENTE   = 'PENDIENTE',   'Pendiente'
        EN_REVISION = 'EN_REVISION', 'En revisión'
        RESUELTO    = 'RESUELTO',    'Resuelto'

    user        = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='reports',
    )
    point       = models.ForeignKey(
        'collection_points.CollectionPoint',
        on_delete=models.CASCADE,
        related_name='reports',
    )
    type        = models.CharField(max_length=20, choices=Type.choices)
    description = models.TextField()
    photo       = models.ImageField(upload_to='reports/', blank=True, null=True)
    status      = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDIENTE,
    )
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Reporte'
        verbose_name_plural = 'Reportes'

    def __str__(self):
        return f'{self.type} en {self.point.name} ({self.status})'