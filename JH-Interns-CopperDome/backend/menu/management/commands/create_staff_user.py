"""Create (or reset) a staff account and print its API token.

The floor view, kitchen display, and analytics are staff-only under scope 5.6. This gives
a trial venue one command to hand a briefed server working credentials.
"""

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from rest_framework.authtoken.models import Token


class Command(BaseCommand):
    help = 'Create or update a staff user and print their API token.'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='floor')
        parser.add_argument('--password', required=True)
        parser.add_argument('--email', default='')

    def handle(self, *args, **options):
        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=options['username'],
            defaults={'email': options['email'], 'is_staff': True},
        )
        user.is_staff = True
        user.set_password(options['password'])
        user.save()

        # Reissue on every run so a rotated password never leaves an old token valid.
        Token.objects.filter(user=user).delete()
        token = Token.objects.create(user=user)

        self.stdout.write(self.style.SUCCESS(
            f"{'Created' if created else 'Updated'} staff user '{user.username}'."
        ))
        self.stdout.write(f'API token: {token.key}')
        self.stdout.write('Staff can also sign in at /staff with the username and password.')
