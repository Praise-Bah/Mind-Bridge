"""One-time seeding command: populate UserSnapshot from the monolith's internal endpoint.

Run once at deploy time (before Nginx cut-over) so all existing users are
present in the chat service's DB before it starts serving traffic.

Usage:
  python manage.py seed_snapshots
  python manage.py seed_snapshots --api-url http://monolith:8000
"""
import logging
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Seed UserSnapshot table from the monolith internal API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--api-url',
            default=None,
            help='Base URL of the monolith (default: settings.MONOLITH_INTERNAL_URL)',
        )
        parser.add_argument(
            '--batch-size',
            type=int,
            default=500,
            help='Records per upsert batch',
        )

    def handle(self, *args, **options):
        import requests
        from apps.chat.models import UserSnapshot

        base_url = options['api_url'] or getattr(settings, 'MONOLITH_INTERNAL_URL', 'http://localhost:8000')
        token = settings.INTERNAL_SERVICE_TOKEN
        url = f'{base_url}/internal/users/snapshots/'

        self.stdout.write(f'Fetching snapshots from {url} …')
        try:
            resp = requests.get(
                url,
                headers={'X-Internal-Token': token},
                timeout=30,
            )
            resp.raise_for_status()
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'Failed to fetch snapshots: {exc}'))
            return

        records = resp.json()
        batch_size = options['batch_size']
        created = updated = 0

        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]
            for r in batch:
                _, was_created = UserSnapshot.objects.update_or_create(
                    user_id=r['user_id'],
                    defaults={
                        'username': r.get('username', ''),
                        'avatar_url': r.get('avatar_url', ''),
                        'is_online': r.get('is_online', False),
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Done. Created: {created}  Updated: {updated}  Total: {len(records)}'
            )
        )
