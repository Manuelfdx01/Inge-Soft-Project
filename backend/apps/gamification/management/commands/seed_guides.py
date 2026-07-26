"""
Management command to seed RecyclingGuide data with rich content.
Usage: python manage.py seed_guides
"""
from django.core.management.base import BaseCommand
from apps.gamification.models import RecyclingGuide


GUIDES_DATA = [
    {
        'title': 'Cómo reciclar plástico correctamente',
        'waste_type': 'PLASTICO',
        'category': 'Plástico',
        'icon': '🟠',
        'difficulty': 'FACIL',
        'reading_time_min': 2,
        'content': (
            'El plástico es uno de los materiales más comunes pero también más difíciles de reciclar '
            'correctamente. No todos los plásticos son iguales: los números 1 (PET) y 2 (HDPE) son '
            'los más reciclados en Colombia. Busca el símbolo de reciclaje en el fondo del envase '
            'para identificar el tipo. Antes de depositarlos, asegúrate de limpiarlos bien para '
            'evitar la contaminación del lote completo.'
        ),
        'tips': [
            'Lava los envases con agua y jabón antes de depositarlos.',
            'Retira las tapas y deposítalas por separado o en el mismo punto si lo permiten.',
            'Aplana botellas y envases para ahorrar espacio en el contenedor.',
            'Solo plásticos marcados 1, 2 y 5 son reciclables en la mayoría de puntos.',
            'Nunca deposites plásticos con restos de comida o aceite.',
        ],
    },
    {
        'title': 'Separación del papel y cartón',
        'waste_type': 'PAPEL',
        'category': 'Papel y cartón',
        'icon': '🟣',
        'difficulty': 'FACIL',
        'reading_time_min': 2,
        'content': (
            'El papel y el cartón son materiales altamente reciclables, pero su calidad depende de '
            'cómo los gestionemos. Un papel húmedo o contaminado con grasa no puede reciclarse. '
            'Aplana siempre las cajas de cartón para optimizar el espacio en los contenedores. '
            'Recuerda que el papel encerado, el papel carbón y el papel de aluminio no son reciclables '
            'en los puntos convencionales.'
        ),
        'tips': [
            'El papel debe estar limpio y completamente seco.',
            'Aplana las cajas de cartón antes de depositarlas.',
            'Retira las grapas metálicas y cintas adhesivas cuando sea posible.',
            'No incluyas papel mojado, papel carbón ni papel encerado.',
            'Las cajas de pizza con grasa van a la basura general.',
        ],
    },
    {
        'title': 'Reciclaje de vidrio paso a paso',
        'waste_type': 'VIDRIO',
        'category': 'Vidrio',
        'icon': '🔵',
        'difficulty': 'FACIL',
        'reading_time_min': 2,
        'content': (
            'El vidrio es 100 % reciclable de forma indefinida sin perder calidad. Lavar los envases '
            'es fundamental para evitar malos olores y contaminación. No mezcles vidrio roto con '
            'vidrio entero, ya que el vidrio roto supone un riesgo para los recicladores. El vidrio '
            'de ventanas, espejos y cristalería tiene una composición diferente y no debe depositarse '
            'en los puntos convencionales.'
        ),
        'tips': [
            'Lava frascos y botellas antes de depositarlos.',
            'Retira las tapas metálicas o plásticas.',
            'Deposita el vidrio roto en una caja o bolsa resistente debidamente señalizada.',
            'No incluyas vidrio de ventanas, espejos, bombillas ni cerámica.',
            'Agrupa envases del mismo color cuando el punto lo requiera.',
        ],
    },
    {
        'title': 'Gestión de residuos orgánicos',
        'waste_type': 'ORGANICO',
        'category': 'Orgánicos',
        'icon': '🟢',
        'difficulty': 'MEDIO',
        'reading_time_min': 3,
        'content': (
            'Los residuos orgánicos representan más del 50 % de los desechos domésticos. Cuando se '
            'gestionan correctamente se convierten en compost, un valioso fertilizante natural. '
            'Puedes compostar en casa con un recipiente hermético o buscar puntos especializados en '
            'tu barrio. Evita incluir carnes, lácteos y aceites en el compostaje casero, ya que '
            'atraen plagas y generan olores.'
        ),
        'tips': [
            'Incluye restos de frutas, verduras, cáscaras y posos de café.',
            'Evita carnes, lácteos y aceites en el compostaje doméstico.',
            'Usa un recipiente con tapa para evitar malos olores.',
            'Mezcla residuos húmedos con material seco (cartón, hojas) para equilibrar la humedad.',
            'Busca puntos de compostaje comunitario en parques y plazas de mercado.',
        ],
    },
    {
        'title': 'Residuos electrónicos y pilas',
        'waste_type': 'ELECTRONICO',
        'category': 'Electrónicos',
        'icon': '🖥️',
        'difficulty': 'AVANZADO',
        'reading_time_min': 4,
        'content': (
            'Los residuos electrónicos (RAEE) contienen materiales peligrosos como mercurio, plomo '
            'y cadmio que pueden contaminar el suelo y el agua durante décadas. Nunca los deposites '
            'en la basura común. En Colombia, los fabricantes están obligados por ley a recoger sus '
            'equipos al final de su vida útil. Las pilas deben depositarse en los puntos habilitados '
            'en supermercados, droguerías y tiendas de electrónica.'
        ),
        'tips': [
            'Nunca deposites pilas ni baterías en la basura común.',
            'Busca puntos de recolección de RAEE en tiendas y supermercados.',
            'Borra tus datos antes de entregar dispositivos con memoria.',
            'Las bombillas LED y fluorescentes también son RAEE y requieren punto especial.',
            'Pregunta al fabricante por su programa de devolución al comprar equipos nuevos.',
        ],
    },
    {
        'title': 'Residuos peligrosos del hogar',
        'waste_type': 'PELIGROSO',
        'category': 'Peligrosos',
        'icon': '⚠️',
        'difficulty': 'AVANZADO',
        'reading_time_min': 4,
        'content': (
            'Los residuos peligrosos del hogar incluyen pinturas, solventes, pesticidas, aceites '
            'de motor y medicamentos vencidos. Estos materiales no deben mezclarse con la basura '
            'ordinaria ya que representan un grave riesgo para la salud y el medio ambiente. '
            'Muchos municipios organizan jornadas de recolección periódicas. Los medicamentos '
            'vencidos deben entregarse en farmacias o droguerías certificadas.'
        ),
        'tips': [
            'Nunca viertas pinturas, aceites ni solventes por el desagüe.',
            'Entrega medicamentos vencidos en farmacias o droguerías certificadas.',
            'Conserva los residuos peligrosos en sus envases originales y bien cerrados.',
            'Busca las jornadas municipales de recolección de residuos peligrosos.',
            'Reduce el riesgo: compra solo la cantidad que necesitas.',
        ],
    },
    {
        'title': 'Metales y latas: reciclaje fácil',
        'waste_type': 'METAL',
        'category': 'Metal',
        'icon': '⚙️',
        'difficulty': 'FACIL',
        'reading_time_min': 2,
        'content': (
            'El aluminio es uno de los materiales más valiosos para el reciclaje. Reciclar una lata '
            'de aluminio ahorra el 95 % de la energía necesaria para producir aluminio virgen. Las '
            'latas de conservas y refrescos deben enjuagarse antes de depositarlas. El acero y el '
            'hierro también son reciclables. Muchos recicladores de oficio compran estos materiales '
            'directamente, lo que les genera un ingreso valioso.'
        ),
        'tips': [
            'Enjuaga las latas antes de depositarlas.',
            'Aplana las latas para ahorrar espacio.',
            'Retira las tapas y deposítalas junto con la lata.',
            'Las tapas de metal de frascos de vidrio pueden reciclarse con los metales.',
            'El papel de aluminio limpio también es reciclable.',
        ],
    },
    {
        'title': 'Textiles y ropa usada',
        'waste_type': 'TEXTIL',
        'category': 'Textiles',
        'icon': '👕',
        'difficulty': 'MEDIO',
        'reading_time_min': 3,
        'content': (
            'La industria textil es una de las más contaminantes del mundo. Donar o reutilizar ropa '
            'es siempre la primera opción. Cuando la ropa ya no sirve para donar, existen puntos '
            'de recolección de textiles donde se transforma en trapos industriales, aislantes o '
            'nuevo hilo. Nunca quemes ropa ni la deposites en la basura si aún tiene algún uso posible.'
        ),
        'tips': [
            'Dona ropa en buen estado a fundaciones y tiendas de segunda mano.',
            'Los textiles muy deteriorados sirven como trapos de limpieza.',
            'Busca marcas con programas de devolución de ropa usada.',
            'Separa ropa por uso: donar, reutilizar, reciclar.',
            'Evita comprar ropa de moda rápida que se descarta rápidamente.',
        ],
    },
]


class Command(BaseCommand):
    help = 'Seed the database with rich recycling guide data (skips if data already exists)'

    def handle(self, *args, **options):
        if RecyclingGuide.objects.exists():
            self.stdout.write('ℹ️  Guías ya existen — omitiendo seed.')
            return

        created = 0
        for data in GUIDES_DATA:
            _, was_created = RecyclingGuide.objects.get_or_create(
                title=data['title'],
                defaults=data,
            )
            if was_created:
                created += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Seed completado: {created} guías creadas.'
            )
        )
