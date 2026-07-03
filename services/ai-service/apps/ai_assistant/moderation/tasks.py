"""Celery tasks for async content moderation."""
import json
import logging

import redis
from celery import shared_task
from django.conf import settings

from .classifiers import ContentModerationPipeline

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    queue='ai_tasks',
)
def moderate_content_task(self, content_type, content_id, content_text, group_name='General'):
    """Run the 4-classifier moderation pipeline on a post or comment.

    Args:
        content_type: 'post' or 'comment'
        content_id: UUID of the content item
        content_text: The text to moderate
        group_name: The community group name for context
    """
    try:
        pipeline = ContentModerationPipeline()
        result = pipeline.evaluate(content_text, group_name=group_name)

        logger.info(
            f"Moderation result for {content_type} {content_id}: "
            f"status={result['status']}, weighted_score={result['weighted_score']}"
        )

        # Publish the result via event bus so the community service can update the record
        _publish_moderation_result(content_type, content_id, result)

        return result

    except Exception as exc:
        logger.error(f"Moderation task failed for {content_type} {content_id}: {exc}")
        raise self.retry(exc=exc)


def _publish_moderation_result(content_type, content_id, result):
    """Publish moderation result to the event bus for the community service."""
    try:
        redis_url = getattr(settings, 'REDIS_EVENT_BUS_URL', 'redis://localhost:6379/3')
        r = redis.from_url(redis_url)

        event = {
            'type': 'moderation.result',
            'data': {
                'content_type': content_type,
                'content_id': str(content_id),
                'status': result['status'],
                'scores': result['scores'],
                'reasons': result['reasons'],
                'weighted_score': result['weighted_score'],
            },
        }
        r.publish('mindbridge.events.moderation.result', json.dumps(event))
    except Exception as e:
        logger.error(f"Failed to publish moderation result: {e}")
