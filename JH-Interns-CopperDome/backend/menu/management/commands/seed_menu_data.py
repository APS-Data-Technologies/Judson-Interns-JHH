from django.core.management.base import BaseCommand

from menu.models import Kitchen, MenuItem, Venue


class Command(BaseCommand):
    help = 'Seed the Copper Dome Concierge venue with kitchens and menu items.'

    def handle(self, *args, **options):
        venue, created = Venue.objects.get_or_create(
            name='Copper Dome Concierge',
            defaults={
                'address': '123 Main Street, Charleston, SC',
                'configuration': {'theme': 'coastal', 'single_venue': True},
            },
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created venue'))
        else:
            self.stdout.write('Venue already exists')

        kitchens = [
            {
                'name': 'The Copper Rail Kitchen',
                'cuisine_type': 'American coastal comfort',
                'description': 'Grilled, smoked and wood-fired comfort food.',
                'items': [
                    {
                        'name': 'Smoked Clam Chowder',
                        'description': 'House-smoked clams, roasted corn, potato, sourdough croutons',
                        'price': '9.00',
                        'category': 'Starters',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Grilled Artichoke',
                        'description': 'Charred artichoke, lemon aioli, herb salad',
                        'price': '11.00',
                        'category': 'Starters',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Crab Cake Sliders',
                        'description': 'Mini crab cakes, pickled slaw, lemon remoulade',
                        'price': '14.00',
                        'category': 'Starters',
                        'dietary_tags': [],
                    },
                    {
                        'name': 'Cedar Plank Salmon',
                        'description': 'Cedar-roasted salmon, fennel slaw, citrus glaze',
                        'price': '22.00',
                        'category': 'Mains',
                        'dietary_tags': ['GF'],
                    },
                    {
                        'name': 'Smoked Half Chicken',
                        'description': 'Slow-smoked chicken, herb jus, charred lemon',
                        'price': '20.00',
                        'category': 'Mains',
                        'dietary_tags': ['GF'],
                    },
                    {
                        'name': 'Rail Burger',
                        'description': 'House beef burger, cheddar, pickle, tomato jam',
                        'price': '18.00',
                        'category': 'Mains',
                        'dietary_tags': [],
                    },
                    {
                        'name': 'Mushroom & Brie Melt',
                        'description': 'Roasted mushrooms, brie, caramelized onion, sourdough',
                        'price': '16.00',
                        'category': 'Mains',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Wood-fired Fries',
                        'description': 'Crisp fries, smoked sea salt, parsley aioli',
                        'price': '6.00',
                        'category': 'Sides',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Roasted Corn Elote',
                        'description': 'Roasted corn, cotija, lime, chile',
                        'price': '5.00',
                        'category': 'Sides',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Draft Craft Beer',
                        'description': 'Local draft selection',
                        'price': '8.00',
                        'category': 'Drinks',
                        'dietary_tags': [],
                    },
                    {
                        'name': 'Sparkling Lemonade',
                        'description': 'Fresh lemon, mint, sparkling water',
                        'price': '5.00',
                        'category': 'Drinks',
                        'dietary_tags': ['V', 'GF'],
                    },
                ],
            },
            {
                'name': 'Dome Garden Kitchen',
                'cuisine_type': 'Globally inspired plant-forward',
                'description': 'Bowls, wraps and small plates with bold flavor.',
                'items': [
                    {
                        'name': 'Crispy Chickpea Bites',
                        'description': 'Crispy chickpeas, tahini drizzle, pickled onion',
                        'price': '8.00',
                        'category': 'Small Plates',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Miso Edamame Hummus',
                        'description': 'Creamy edamame hummus, sesame, cucumber ribbons',
                        'price': '10.00',
                        'category': 'Small Plates',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Cauliflower Shawarma Bites',
                        'description': 'Crispy cauliflower, shawarma spice, herb yogurt',
                        'price': '11.00',
                        'category': 'Small Plates',
                        'dietary_tags': ['V', 'GF', 'SP'],
                    },
                    {
                        'name': 'Golden Grain Bowl',
                        'description': 'Herbed grains, roasted vegetables, tahini, pickles',
                        'price': '15.00',
                        'category': 'Bowls & Wraps',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Thai Peanut Wrap',
                        'description': 'Crispy tofu, peanut sauce, cabbage slaw',
                        'price': '14.00',
                        'category': 'Bowls & Wraps',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Mediterranean Chicken Bowl',
                        'description': 'Herb chicken, rice, cucumber, tomato, feta',
                        'price': '17.00',
                        'category': 'Bowls & Wraps',
                        'dietary_tags': ['GF'],
                    },
                    {
                        'name': 'Korean BBQ Mushroom Bowl',
                        'description': 'Glazed mushrooms, rice, scallions, sesame greens',
                        'price': '15.00',
                        'category': 'Bowls & Wraps',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Miso Soup',
                        'description': 'Traditional miso broth with tofu and scallions',
                        'price': '4.00',
                        'category': 'Sides',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Kimchi Side',
                        'description': 'House kimchi with sesame and chili',
                        'price': '3.00',
                        'category': 'Sides',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Matcha Latte',
                        'description': 'Fresh matcha with steamed milk',
                        'price': '6.00',
                        'category': 'Drinks',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Hibiscus Agua Fresca',
                        'description': 'Bright hibiscus, lime, sparkling water',
                        'price': '5.00',
                        'category': 'Drinks',
                        'dietary_tags': ['V', 'GF'],
                    },
                ],
            },
            {
                'name': 'Fiamma & Co.',
                'cuisine_type': 'Italian-influenced street bites',
                'description': 'Flatbreads, pasta and dolci with a street-food spin.',
                'items': [
                    {
                        'name': 'Burrata & Heirloom Tomato',
                        'description': 'Creamy burrata, heirloom tomato, basil, olive oil',
                        'price': '13.00',
                        'category': 'Starters',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Arancini (x3)',
                        'description': 'Crispy risotto balls with parmesan and tomato basil sauce',
                        'price': '10.00',
                        'category': 'Starters',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Charcuterie Mista',
                        'description': 'Assorted cured meats, pickled vegetables, olives',
                        'price': '16.00',
                        'category': 'Starters',
                        'dietary_tags': [],
                    },
                    {
                        'name': 'Margherita',
                        'description': 'Tomato sauce, mozzarella, basil, olive oil',
                        'price': '14.00',
                        'category': 'Flatbreads',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Speck & Fig',
                        'description': 'Speck, fig jam, mozzarella, arugula',
                        'price': '17.00',
                        'category': 'Flatbreads',
                        'dietary_tags': ['SP'],
                    },
                    {
                        'name': 'White Truffle Bianca',
                        'description': 'Garlic cream, mozzarella, white truffle oil',
                        'price': '18.00',
                        'category': 'Flatbreads',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Cacio e Pepe',
                        'description': 'Roman-style pasta with pecorino and black pepper',
                        'price': '16.00',
                        'category': 'Pasta',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': "Rigatoni all'Arrabbiata",
                        'description': 'Rigatoni in spicy tomato sauce with chili oil',
                        'price': '15.00',
                        'category': 'Pasta',
                        'dietary_tags': ['V', 'SP'],
                    },
                    {
                        'name': 'Tagliatelle Bolognese',
                        'description': 'Slow-simmered beef ragù, parmesan, herbs',
                        'price': '19.00',
                        'category': 'Pasta',
                        'dietary_tags': [],
                    },
                    {
                        'name': 'Tiramisu',
                        'description': 'Classic mascarpone dessert with espresso soak',
                        'price': '8.00',
                        'category': 'Dolci',
                        'dietary_tags': ['V'],
                    },
                    {
                        'name': 'Affogato',
                        'description': 'Vanilla gelato with hot espresso',
                        'price': '7.00',
                        'category': 'Dolci',
                        'dietary_tags': ['V', 'GF'],
                    },
                    {
                        'name': 'Aperol Spritz',
                        'description': 'Aperol, sparkling wine, orange twist',
                        'price': '12.00',
                        'category': 'Drinks',
                        'dietary_tags': [],
                    },
                    {
                        'name': 'San Pellegrino',
                        'description': 'Sparkling mineral water',
                        'price': '4.00',
                        'category': 'Drinks',
                        'dietary_tags': ['V', 'GF'],
                    },
                ],
            },
        ]

        for kitchen_data in kitchens:
            kitchen, _ = Kitchen.objects.get_or_create(
                venue=venue,
                name=kitchen_data['name'],
                defaults={
                    'cuisine_type': kitchen_data['cuisine_type'],
                    'description': kitchen_data['description'],
                },
            )
            for item_data in kitchen_data['items']:
                MenuItem.objects.get_or_create(
                    kitchen=kitchen,
                    name=item_data['name'],
                    defaults={
                        'description': item_data['description'],
                        'price': item_data['price'],
                        'category': item_data['category'],
                        'dietary_tags': item_data['dietary_tags'],
                    },
                )

        self.stdout.write(self.style.SUCCESS('Seeded menu data for Copper Dome Concierge'))
