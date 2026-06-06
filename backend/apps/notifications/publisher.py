"""Thin wrapper that publishes notification.create events to the notification service.

All callers in the monolith (professionals, community, admin_panel, users) import
this instead of importing Notification from the DB model directly.
"""
import logging
from mindbridge_common.events import publisher

logger = logging.getLogger(__name__)


def publish_notification(
    user_id,
    notification_type: str,
    title: str,
    message: str,
    data: dict | None = None,
) -> None:
    """Fire-and-forget: publish a notification.create event to the notification service.

    Silently swallows all errors so that a Redis outage never breaks the calling
    request (booking creation, admin action, etc.).
    """
    try:
        publisher.publish(
            event_type='notification.create',
            payload={
                'user_id': str(user_id),
                'notification_type': notification_type,
                'title': title,
                'message': message,
                'data': data or {},
            },
            service_origin='monolith',
        )
    except Exception:
        logger.exception(
            'Failed to publish notification event for user_id=%s type=%s',
            user_id,
            notification_type,
        )
