from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


@shared_task(queue='notification_tasks', acks_late=True)
def send_daily_email_digest():
    """Send daily email digest to users who have email_digest enabled.

    Iterates over NotificationPreference records — no cross-service User query needed.
    We pull the email from the notification data payload stored at creation time.
    """
    from .models import NotificationPreference, Notification
    from django.utils import timezone
    from datetime import timedelta

    yesterday = timezone.now() - timedelta(hours=24)
    prefs = NotificationPreference.objects.filter(email_digest=True)

    for pref in prefs:
        unread = Notification.objects.filter(
            user_id=pref.user_id,
            is_read=False,
            created_at__gte=yesterday,
            is_deleted=False,
        ).count()
        if unread == 0:
            continue

        email = _get_user_email(pref.user_id)
        if not email:
            continue

        try:
            send_mail(
                subject='Your Daily MindBridge Update',
                message=(
                    f'You have {unread} unread notification(s) from the past 24 hours. '
                    f'Log in to MindBridge to check them.\n\n{settings.SITE_URL}'
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=True,
            )
        except Exception:
            logger.exception('Failed sending digest to user_id=%s', pref.user_id)


@shared_task(bind=True, max_retries=3, queue='notification_tasks', acks_late=True)
def send_email_notification(self, user_id: str, subject: str, message: str, email: str):
    """Send a single transactional email. Called from event handlers."""
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
    except Exception as exc:
        countdown = 60 * (2 ** self.request.retries)
        raise self.retry(exc=exc, countdown=countdown)


def _get_user_email(user_id) -> str | None:
    """Return the email stored in the most recent notification data for the user.

    This avoids a cross-service call — the email is embedded in the notification
    payload when the publishing service includes it (e.g. booking notifications).
    Returns None if not available; the digest is skipped silently.
    """
    from .models import Notification
    notif = (
        Notification.objects.filter(user_id=user_id)
        .exclude(data__user_email=None)
        .order_by('-created_at')
        .values('data')
        .first()
    )
    if notif and notif.get('data'):
        return notif['data'].get('user_email')
    return None
