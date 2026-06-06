"""Seed UserSnapshot table from auth-service internal API."""
import logging

import requests
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.community.models import UserSnapshot

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Seed UserSnapshot table from auth-service /internal/users/snapshots/'

    def add_arguments(self, parser):
        parser.add_argument(
            '--api-url',
            default=getattr(settings, 'AUTH_SERVICE_INTERNAL_URL', 'http://auth-service:8001'),
        )

    def handle(self, *args, **options):
        base_url = options['api_url'].rstrip('/')
        token = getattr(settings, 'INTERNAL_SERVICE_TOKEN', '')
        headers = {'X-Internal-Token': token}

        page = 1
        created = updated = 0

        while True:
            resp = requests.get(
                f'{base_url}/internal/users/snapshots/',
                headers=headers,
                params={'page': page},
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            results = data.get('results', data) if isinstance(data, dict) else data

            if not results:
                break

            for u in results:
                _, was_created = UserSnapshot.objects.update_or_create(
                    user_id=str(u['id']),
                    defaults={
                        'username': u.get('username', ''),
                        'avatar_url': u.get('avatar_url', ''),
                        'anonymous_mode': u.get('anonymous_mode', False),
                        'is_online': u.get('is_online', False),
                        'is_staff': u.get('is_staff', False),
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

            if not data.get('next'):
                break
            page += 1

        self.stdout.write(
            self.style.SUCCESS(f'Seeded {created} new + {updated} updated UserSnapshots.')
        )
