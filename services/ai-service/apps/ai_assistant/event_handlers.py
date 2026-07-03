"""Event handlers for the AI service.

Subscribes to events published by other services and dispatches Celery tasks.
"""
import logging
from .tasks import evaluate_group_task
from .moderation.tasks import moderate_content_task

logger = logging.getLogger(__name__)


def handle_group_approval_requested(payload: dict):
    """Dispatch AI evaluation when community service requests group approval."""
    group_id = payload.get('group_id')
    logger.info('Received group_approval_requested for group %s — dispatching evaluation', group_id)
    evaluate_group_task.delay(payload)


def handle_content_moderation_requested(payload: dict):
    """Dispatch 4-classifier moderation pipeline when community service requests it."""
    content_type = payload.get('content_type')
    content_id = payload.get('content_id')
    content_text = payload.get('content_text')
    group_name = payload.get('group_name', 'General')
    logger.info('Received content_moderation_requested for %s %s', content_type, content_id)
    moderate_content_task.delay(content_type, content_id, content_text, group_name)


# Map Redis channel name → handler function
EVENT_HANDLERS = {
    'mindbridge.events.community.group_approval_requested': handle_group_approval_requested,
    'mindbridge.events.community.content_moderation_requested': handle_content_moderation_requested,
}
