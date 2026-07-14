from django.db import models
from django.conf import settings


class RecyclingGuide(models.Model):
    title      = models.CharField(max_length=150)
    content    = models.TextField()
    waste_type = models.CharField(max_length=50)
    icon       = models.CharField(max_length=10, blank=True)
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
    name             = models.CharField(max_length=100, unique=True)
    description      = models.TextField()
    icon             = models.CharField(max_length=10)
    points_required  = models.IntegerField(default=0)
    condition_key    = models.CharField(max_length=50, blank=True)
    condition_value  = models.IntegerField(default=1)

    class Meta:
        verbose_name = 'Logro'
        verbose_name_plural = 'Logros'

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