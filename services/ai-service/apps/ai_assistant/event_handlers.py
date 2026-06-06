"""Event handlers for the AI service.

Subscribes to events published by other services and dispatches Celery tasks.
"""
import logging
from .tasks import evaluate_group_task

logger = logging.getLogger(__name__)


def handle_group_approval_requested(payload: dict):
    """Dispatch AI evaluation when community service requests group approval."""
    group_id = payload.get('group_id')
    logger.info('Received group_approval_requested for group %s — dispatching evaluation', group_id)
    evaluate_group_task.delay(payload)


# Map Redis channel name → handler function
EVENT_HANDLERS = {
    'mindbridge.events.community.group_approval_requested': handle_group_approval_requested,
}
