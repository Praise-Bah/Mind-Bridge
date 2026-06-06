"""Notification service inbound event handlers.

Each handler receives the `payload` dict from the Redis event envelope and
creates Notification records in the notification service's own DB.

Two event sources:
  1. notification.create  — generic event published by any monolith service
                             when it needs to notify a user
  2. ai.group_evaluation_complete — subscribed directly so the notification
                             service creates group approval/rejection notifications
                             without the community service acting as a relay
"""
import logging
from .models import Notification

logger = logging.getLogger(__name__)


def handle_notification_create(payload: dict):
    """Create a single in-app notification from the generic notification.create event.

    Required payload keys: user_id, notification_type, title, message
    Optional: data (JSON dict)
    """
    user_id = payload.get('user_id')
    if not user_id:
        logger.warning('notification.create event missing user_id — skipped')
        return

    try:
        Notification.objects.create(
            user_id=user_id,
            notification_type=payload.get('notification_type', 'system'),
            title=payload.get('title', ''),
            message=payload.get('message', ''),
            data=payload.get('data', {}),
        )
        logger.debug(
            'Created notification for user_id=%s type=%s',
            user_id,
            payload.get('notification_type'),
        )
    except Exception:
        logger.exception('Failed to create notification for user_id=%s', user_id)


def handle_ai_group_evaluation_complete(payload: dict):
    """Create group outcome notifications by subscribing to the AI service result event.

    The community service handles the same event to update CommunityGroup DB state.
    The notification service handles it independently to create Notification records.
    Admin (manual review) notifications are published as individual notification.create
    events by the community service's event_handler — not duplicated here.
    """
    approval_status = payload.get('approval_status')
    group_id = str(payload.get('group_id', ''))
    group_name = payload.get('group_name', 'your group')
    creator_user_id = payload.get('creator_user_id')

    if not creator_user_id:
        return

    if approval_status == 'approved':
        Notification.objects.create(
            user_id=creator_user_id,
            notification_type='group_approved',
            title='Group Approved!',
            message=f'Your group "{group_name}" has been approved and is now live.',
            data={'group_id': group_id},
        )
        logger.info('Created group_approved notification for user_id=%s group=%s', creator_user_id, group_id)

    elif approval_status == 'rejected':
        rejection_reason = payload.get('rejection_reason', '')
        Notification.objects.create(
            user_id=creator_user_id,
            notification_type='group_rejected',
            title='Group Not Approved',
            message=f'Your group "{group_name}" was not approved. {rejection_reason}'.strip(),
            data={'group_id': group_id},
        )
        logger.info('Created group_rejected notification for user_id=%s group=%s', creator_user_id, group_id)

    # approval_status == 'pending' (manual review): admin notifications are
    # published as notification.create events by community/event_handlers.py


EVENT_HANDLERS = {
    'mindbridge.events.notification.create': handle_notification_create,
    'mindbridge.events.ai.group_evaluation_complete': handle_ai_group_evaluation_complete,
}
