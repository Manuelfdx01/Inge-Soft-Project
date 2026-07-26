from django.core.management.base import BaseCommand
from apps.gamification.services import inicializar_gamification_data


class Command(BaseCommand):
    help = 'Seed gamification achievements and rewards if empty'

    def handle(self, *args, **options):
        inicializar_gamification_data()
        self.stdout.write(
            self.style.SUCCESS('✅ Gamification seed completed successfully.')
        )
