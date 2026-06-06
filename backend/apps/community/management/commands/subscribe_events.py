"""Redis Pub/Sub event subscriber for the community app (monolith).

Run alongside the monolith to receive AI evaluation results and update
CommunityGroup records accordingly.

Usage: python manage.py subscribe_events
Docker: community-event-subscriber container (defined in docker-compose.yml)
"""
import json
import signal
import sys
import threading
import logging
from django.core.management.base import BaseCommand
from django.conf import settings

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Subscribe to Redis Pub/Sub events for the community app'

    def handle(self, *args, **options):
        import redis as redis_lib
        from apps.community.event_handlers import EVENT_HANDLERS

        redis_url = getattr(settings, 'REDIS_EVENT_BUS_URL', 'redis://localhost:6379/3')
        r = redis_lib.Redis.from_url(redis_url)
        pubsub = r.pubsub()

        channels = list(EVENT_HANDLERS.keys())
        pubsub.subscribe(*channels)

        self.stdout.write(
            self.style.SUCCESS(
                f'Community subscriber listening on: {", ".join(channels)}'
            )
        )

        def shutdown(sig, frame):
            self.stdout.write('Shutting down community event subscriber...')
            pubsub.unsubscribe()
            pubsub.close()
            sys.exit(0)

        signal.signal(signal.SIGTERM, shutdown)
        signal.signal(signal.SIGINT, shutdown)

        for message in pubsub.listen():
            if message['type'] != 'message':
                continue
            channel = message['channel'].decode()
            handler = EVENT_HANDLERS.get(channel)
            if not handler:
                continue
            try:
                envelope = json.loads(message['data'])
                payload = envelope.get('payload', {})
                threading.Thread(
                    target=handler,
                    args=(payload,),
                    daemon=True,
                    name=f'community-handler-{channel}',
                ).start()
            except Exception as exc:
                logger.error('Error processing event on %s: %s', channel, exc, exc_info=True)
