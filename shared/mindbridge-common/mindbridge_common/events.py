import json
import uuid
import logging
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class EventPublisher:
    """Publishes domain events to Redis Pub/Sub.

    Channel naming: mindbridge.events.<event_type>
    e.g. mindbridge.events.user.profile_updated

    Failures are logged but never propagate to the caller — event loss
    is preferable to a failed HTTP request.
    """

    def __init__(self):
        self._redis = None

    @property
    def redis(self):
        if self._redis is None:
            import redis as redis_lib
            from django.conf import settings
            self._redis = redis_lib.Redis.from_url(
                getattr(settings, 'REDIS_EVENT_BUS_URL', 'redis://localhost:6379/3')
            )
        return self._redis

    def publish(self, event_type: str, payload: dict, service_origin: str) -> None:
        envelope = {
            'event_id': str(uuid.uuid4()),
            'event_type': event_type,
            'service_origin': service_origin,
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'schema_version': '1',
            'payload': payload,
        }
        channel = f'mindbridge.events.{event_type}'
        try:
            self.redis.publish(channel, json.dumps(envelope))
        except Exception:
            logger.error('Failed to publish event %s', event_type, exc_info=True)


publisher = EventPublisher()
