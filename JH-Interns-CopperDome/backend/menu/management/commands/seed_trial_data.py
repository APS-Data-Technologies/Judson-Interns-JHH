"""Generate realistic sessions so the analytics view can be demoed before a live trial.

Milestone 2's deliverable is that "analytics renders against seeded sessions". This walks
synthetic patrons through the same funnel the real PWA emits -- most browse, some ask the
concierge, fewer add to cart, fewer still check out -- so every metric has a believable,
non-zero value without waiting on real diners.
"""

import random
import uuid
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from concierge.models import ServiceRequest
from menu.models import EventLog, MenuItem, Order, OrderItem

REQUEST_TYPES = ['call_server', 'water', 'check', 'surprise_me']

SAMPLE_QUESTIONS = [
    'What do you recommend tonight?',
    'Anything gluten-free?',
    'What pairs well with the chowder?',
    'Something light to start?',
    'Surprise me.',
]


class Command(BaseCommand):
    help = 'Seed synthetic patron sessions, events, service requests, and orders for the analytics view.'

    def add_arguments(self, parser):
        parser.add_argument('--sessions', type=int, default=40, help='Number of sessions to generate.')
        parser.add_argument('--days', type=int, default=3, help='Spread sessions over this many past days.')
        parser.add_argument('--seed', type=int, default=20260805, help='RNG seed, for reproducible demos.')
        parser.add_argument('--clear', action='store_true', help='Delete existing synthetic trial data first.')

    def handle(self, *args, **options):
        rng = random.Random(options['seed'])
        menu_items = list(MenuItem.objects.select_related('kitchen').all())
        if not menu_items:
            self.stderr.write(self.style.ERROR('No menu items found. Run seed_menu_data first.'))
            return

        if options['clear']:
            deleted = EventLog.objects.filter(session_id__startswith='seed-').delete()[0]
            ServiceRequest.objects.filter(session_id__startswith='seed-').delete()
            Order.objects.filter(session_id__startswith='seed-').delete()
            self.stdout.write(f'Cleared {deleted} seeded events and their requests/orders.')

        now = timezone.now()
        totals = {'sessions': 0, 'events': 0, 'requests': 0, 'orders': 0}

        for _ in range(options['sessions']):
            session_id = f'seed-{uuid.uuid4()}'
            table_number = f'{rng.randint(1, 24):02d}'
            started = now - timedelta(
                days=rng.randint(0, max(0, options['days'] - 1)),
                minutes=rng.randint(0, 720),
            )
            clock = started

            def log(event_type, metadata=None, minutes=1):
                nonlocal clock
                clock = clock + timedelta(minutes=minutes, seconds=rng.randint(0, 45))
                EventLog.objects.create(
                    event_type=event_type,
                    session_id=session_id,
                    timestamp=clock,
                    metadata=metadata or {},
                )
                totals['events'] += 1

            log('session_started', {'table_number': table_number}, minutes=0)
            totals['sessions'] += 1

            # Nearly everyone opens the menu; a few bounce at the splash.
            if rng.random() > 0.06:
                log('menu_viewed', {'view': 'all_kitchens'})
                for _ in range(rng.randint(1, 4)):
                    item = rng.choice(menu_items)
                    log('menu_item_viewed', {'menu_item_id': item.id})

            # Concierge engagement -- the behaviour the trial is actually measuring.
            if rng.random() < 0.55:
                for _ in range(rng.randint(1, 4)):
                    log('ai_question_asked', {
                        'question': rng.choice(SAMPLE_QUESTIONS),
                        'stubbed': True,
                        'seeded': True,
                    })

            cart = []
            if rng.random() < 0.62:
                for _ in range(rng.randint(1, 3)):
                    item = rng.choice(menu_items)
                    quantity = rng.randint(1, 2)
                    cart.append((item, quantity))
                    log('item_added_to_cart', {
                        'menu_item_id': item.id,
                        'quantity': quantity,
                        'kitchen_id': item.kitchen_id,
                        'view': 'all_kitchens',
                    })

            if cart and rng.random() < 0.78:
                total = sum(float(item.price) * qty for item, qty in cart)
                log('mock_checkout_started', {'total': round(total, 2)})

                if rng.random() < 0.88:
                    log('mock_checkout_completed', {
                        'total': round(total, 2),
                        'item_count': sum(qty for _, qty in cart),
                    })
                    order = Order.objects.create(
                        session_id=session_id,
                        table_number=table_number,
                        status=rng.choice(['placed', 'preparing', 'ready', 'served']),
                        total=round(total, 2),
                        created_at=clock,
                    )
                    for item, quantity in cart:
                        OrderItem.objects.create(
                            order=order,
                            menu_item=item,
                            kitchen=item.kitchen,
                            kitchen_name=item.kitchen.name,
                            name=item.name,
                            price=item.price,
                            quantity=quantity,
                        )
                    totals['orders'] += 1

            if rng.random() < 0.42:
                request_type = rng.choice(REQUEST_TYPES)
                request = ServiceRequest.objects.create(
                    session_id=session_id,
                    table_number=table_number,
                    request_type=request_type,
                    status=rng.choice(['pending', 'acknowledged', 'resolved', 'resolved']),
                )
                # created_at has a default rather than auto_now_add, but it is still set on
                # save -- rewrite it so the row sits inside the session's window.
                ServiceRequest.objects.filter(pk=request.pk).update(created_at=clock)
                log('service_request_created', {
                    'request_type': request_type,
                    'table_number': table_number,
                    'service_request_id': request.pk,
                })
                totals['requests'] += 1

        self.stdout.write(self.style.SUCCESS(
            f"Seeded {totals['sessions']} sessions, {totals['events']} events, "
            f"{totals['requests']} service requests, {totals['orders']} orders."
        ))
