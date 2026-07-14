from django.db import models
from django.conf import settings


class LogisticsAlert(models.Model):

    class Priority(models.TextChoices):
        ALTA   = 'ALTA',   'Alta'
        MEDIA  = 'MEDIA',  'Media'
        BAJA   = 'BAJA',   'Baja'

    class Status(models.TextChoices):
        PENDIENTE   = 'PENDIENTE',   'Pendiente'
        ACEPTADA    = 'ACEPTADA',    'Aceptada'
        EN_PROCESO  = 'EN_PROCESO',  'En proceso'
        COMPLETADA  = 'COMPLETADA',  'Completada'
        CANCELADA   = 'CANCELADA',   'Cancelada'

    origin_point = models.ForeignKey(
        'collection_points.CollectionPoint',
        on_delete=models.CASCADE,
        related_name='alerts_as_origin',
    )
    target_point = models.ForeignKey(
        'collection_points.CollectionPoint',
        on_delete=models.CASCADE,
        related_name='alerts_as_target',
    )
    reciclador = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='assigned_alerts',
    )
    waste_type   = models.CharField(max_length=50, blank=True)
    priority     = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.ALTA,
    )
    status       = models.CharField(
        max_length=15,
        choices=Status.choices,
        default=Status.PENDIENTE,
    )
    distance_km  = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    created_at   = models.DateTimeField(auto_now_add=True)
    resolved_at  = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Alerta logística'
        verbose_name_plural = 'Alertas logísticas'
        ordering = ['-created_at']

    def __str__(self):
        return f'Alerta {self.priority}: {self.origin_point.name} → {self.target_point.name}'


class CapacityLog(models.Model):
    point        = models.ForeignKey(
        'collection_points.CollectionPoint',
        on_delete=models.CASCADE,
        related_name='capacity_logs',
    )
    reported_by  = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='capacity_reports',
    )
    capacity_pct = models.DecimalField(max_digits=5, decimal_places=2)
    waste_type   = models.CharField(max_length=50, blank=True)
    notes        = models.TextField(blank=True)
    recorded_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Registro de capacidad'
        verbose_name_plural = 'Registros de capacidad'
        ordering = ['-recorded_at']

    def __str__(self):
        return f'{self.point.name} → {self.capacity_pct}% ({self.recorded_at})'