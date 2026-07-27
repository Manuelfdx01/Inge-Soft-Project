from django.db import migrations, models

def convert_admin_to_centro_acopio(apps, schema_editor):
    User = apps.get_model('users', 'User')
    User.objects.filter(role='ADMIN').update(role='CENTRO_ACOPIO')

def reverse_func(apps, schema_editor):
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0003_centro_acopio_role'),
    ]

    operations = [
        migrations.RunPython(convert_admin_to_centro_acopio, reverse_func),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('CIUDADANO', 'Ciudadano'),
                    ('RECICLADOR', 'Reciclador'),
                    ('CENTRO_ACOPIO', 'Centro de Acopio'),
                ],
                default='CIUDADANO',
                max_length=20,
            ),
        ),
    ]
