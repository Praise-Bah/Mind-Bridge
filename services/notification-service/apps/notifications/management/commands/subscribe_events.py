"""Redis Pub/Sub subscriber for the notification service.

Listens on:
  - mindbridge.events.notification.create        (all other services)
  - mindbridge.events.ai.group_evaluation_complete (AI service)

Run via: python manage.py subscribe_events
Docker:  notification-event-subscriber container
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
    help = 'Subscribe to Redis Pub/Sub events for the notification service'

    def handle(self, *args, **options):
        import redis as redis_lib
        from apps.notifications.event_handlers import EVENT_HANDLERS

        redis_url = getattr(settings, 'REDIS_EVENT_BUS_URL', 'redis://localhost:6379/3')
        r = redis_lib.Redis.from_url(redis_url)
        pubsub = r.pubsub()

        channels = list(EVENT_HANDLERS.keys())
        pubsub.subscribe(*channels)

        self.stdout.write(
            self.style.SUCCESS(
                f'Notification subscriber listening on: {", ".join(channels)}'
            )
        )

        def shutdown(sig, frame):
            self.stdout.write('Shutting down notification event subscriber...')
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
                    name=f'notif-handler-{channel}',
                ).start()
            except Exception:
                logger.exception('Error processing event on channel %s', channel)
