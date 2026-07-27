from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('collection_points', '0001_initial'),
    ]

    operations = [
        # Ampliar max_length del campo status para soportar MANTENIMIENTO (13 chars)
        migrations.AlterField(
            model_name='collectionpoint',
            name='status',
            field=models.CharField(
                choices=[
                    ('NORMAL', 'Normal'),
                    ('ALERTA', 'Alerta'),
                    ('CRITICO', 'Crítico'),
                    ('INACTIVO', 'Inactivo'),
                    ('DISPONIBLE', 'Disponible'),
                    ('LLENO', 'Lleno'),
                    ('MANTENIMIENTO', 'Mantenimiento'),
                ],
                default='NORMAL',
                max_length=15,
            ),
        ),
        # Campo precio_kg: JSON para precios por tipo de material
        migrations.AddField(
            model_name='collectionpoint',
            name='precio_kg',
            field=models.JSONField(blank=True, default=dict),
        ),
        # Campo schedule: horario del centro
        migrations.AddField(
            model_name='collectionpoint',
            name='schedule',
            field=models.CharField(blank=True, max_length=200),
        ),
        # Campo phone: teléfono del centro
        migrations.AddField(
            model_name='collectionpoint',
            name='phone',
            field=models.CharField(blank=True, max_length=30),
        ),
        # waste_types: hacer opcional (blank=True)
        migrations.AlterField(
            model_name='collectionpoint',
            name='waste_types',
            field=models.ManyToManyField(
                blank=True,
                related_name='points',
                to='collection_points.wastetype',
            ),
        ),
    ]
