"""Redis Pub/Sub event subscriber for the AI service.

Run: python manage.py subscribe_events
Docker Compose: ai-event-subscriber container.

Listens for community.group_approval_requested and dispatches Celery tasks.
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
    help = 'Subscribe to Redis Pub/Sub events for the AI service'

    def handle(self, *args, **options):
        import redis as redis_lib
        from apps.ai_assistant.event_handlers import EVENT_HANDLERS

        r = redis_lib.Redis.from_url(
            getattr(settings, 'REDIS_EVENT_BUS_URL', 'redis://localhost:6379/3')
        )
        pubsub = r.pubsub()

        channels = list(EVENT_HANDLERS.keys())
        pubsub.subscribe(*channels)

        self.stdout.write(
            self.style.SUCCESS(
                f'AI service subscribing to {len(channels)} channel(s): {", ".join(channels)}'
            )
        )

        def shutdown(sig, frame):
            self.stdout.write('Shutting down event subscriber...')
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
                # Run handler in a thread so the subscriber loop is never blocked
                threading.Thread(
                    target=handler,
                    args=(payload,),
                    daemon=True,
                    name=f'handler-{channel}',
                ).start()
            except Exception as exc:
                logger.error('Error processing event on %s: %s', channel, exc, exc_info=True)
