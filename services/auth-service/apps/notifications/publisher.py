import logging
from mindbridge_common.events import publisher

logger = logging.getLogger(__name__)


def publish_notification(user_id, notification_type, title, message, data=None):
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
            service_origin='auth-service',
        )
    except Exception:
        logger.exception('Failed to publish notification event for user %s', user_id)
