from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_user_last_activity_date_user_max_streak_and_more'),
    ]

    operations = [
        # Ampliar max_length del campo role para soportar CENTRO_ACOPIO (13 chars)
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('CIUDADANO', 'Ciudadano'),
                    ('RECICLADOR', 'Reciclador'),
                    ('ADMIN', 'Administrador'),
                    ('CENTRO_ACOPIO', 'Centro de Acopio'),
                ],
                default='CIUDADANO',
                max_length=20,
            ),
        ),
        # Ampliar max_length del campo type en Notification para soportar nuevos tipos
        migrations.AlterField(
            model_name='notification',
            name='type',
            field=models.CharField(
                choices=[
                    ('PUNTO_CRITICO', 'Punto crítico'),
                    ('PROPUESTA', 'Propuesta actualizada'),
                    ('ALERTA_ASIGNADA', 'Alerta asignada'),
                    ('GENERAL', 'General'),
                    ('PRECIO_ACTUALIZADO', 'Precio actualizado'),
                    ('CENTRO_LLENO', 'Centro lleno'),
                    ('CENTRO_DISPONIBLE', 'Centro disponible'),
                    ('REPORTE_NUEVO', 'Reporte nuevo'),
                ],
                max_length=25,
            ),
        ),
    ]
