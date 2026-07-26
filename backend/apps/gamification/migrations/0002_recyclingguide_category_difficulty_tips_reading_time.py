from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('gamification', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='recyclingguide',
            name='category',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='recyclingguide',
            name='difficulty',
            field=models.CharField(
                choices=[('FACIL', 'Fácil'), ('MEDIO', 'Intermedio'), ('AVANZADO', 'Avanzado')],
                default='FACIL',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='recyclingguide',
            name='tips',
            field=models.JSONField(blank=True, default=list),
        ),
        migrations.AddField(
            model_name='recyclingguide',
            name='reading_time_min',
            field=models.PositiveSmallIntegerField(default=2),
        ),
    ]
