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