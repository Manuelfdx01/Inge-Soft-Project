from django.db import models
from django.conf import settings


class WasteType(models.Model):
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=10, blank=True)
    color = models.CharField(max_length=7, default='#2E7D32')

    class Meta:
        verbose_name = 'Tipo de residuo'
        verbose_name_plural = 'Tipos de residuo'

    def __str__(self):
        return self.name


class CollectionPoint(models.Model):

    class Status(models.TextChoices):
        NORMAL   = 'NORMAL',   'Normal'
        ALERTA   = 'ALERTA',   'Alerta'
        CRITICO  = 'CRITICO',  'Crítico'
        INACTIVO = 'INACTIVO', 'Inactivo'

    name             = models.CharField(max_length=100)
    address          = models.TextField()
    latitude         = models.DecimalField(max_digits=9, decimal_places=6)
    longitude        = models.DecimalField(max_digits=9, decimal_places=6)
    capacity_max     = models.IntegerField(default=100)
    capacity_current = models.IntegerField(default=0)
    waste_types      = models.ManyToManyField(WasteType, related_name='points')
    status           = models.CharField(
        max_length=10,
        choices=Status.choices,
        default=Status.NORMAL,
    )
    admin            = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='managed_points',
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Punto de reciclaje'
        verbose_name_plural = 'Puntos de reciclaje'

    def __str__(self):
        return f'{self.name} ({self.status})'

    @property
    def capacity_pct(self):
        if self.capacity_max == 0:
            return 0
        return round((self.capacity_current / self.capacity_max) * 100)

    def update_status(self):
        pct = self.capacity_pct
        if pct >= 86:
            self.status = self.Status.CRITICO
        elif pct >= 61:
            self.status = self.Status.ALERTA
        else:
            self.status = self.Status.NORMAL
        self.save()