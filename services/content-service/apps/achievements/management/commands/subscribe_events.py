"""Redis Pub/Sub event subscriber daemon for content-service."""
import json
import logging
import signal
import sys
import threading

import redis
from django.conf import settings
from django.core.management.base import BaseCommand

from apps.achievements.event_handlers import EVENT_HANDLERS

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Subscribe to Redis event bus and dispatch handlers.'

    def handle(self, *args, **options):
        r = redis.Redis.from_url(settings.REDIS_EVENT_BUS_URL, decode_responses=True)
        pubsub = r.pubsub()
        pubsub.subscribe(*EVENT_HANDLERS.keys())

        self.stdout.write('content-service event subscriber started.')

        def shutdown(sig, frame):
            pubsub.unsubscribe()
            pubsub.close()
            sys.exit(0)

        signal.signal(signal.SIGTERM, shutdown)
        signal.signal(signal.SIGINT, shutdown)

        for message in pubsub.listen():
            if message['type'] != 'message':
                continue
            channel = message['channel']
            handler = EVENT_HANDLERS.get(channel)
            if not handler:
                continue
            try:
                envelope = json.loads(message['data'])
                payload = envelope.get('payload', {})
                threading.Thread(target=handler, args=(payload,), daemon=True).start()
            except Exception as exc:
                logger.error('Error dispatching %s: %s', channel, exc, exc_info=True)
