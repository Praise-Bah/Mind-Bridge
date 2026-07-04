from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

User = get_user_model()


@shared_task
def send_daily_email_digest():
    """Send daily email digest to users with email_digest enabled."""
    users_with_digest = User.objects.filter(
        notification_preferences__email_digest=True,
        email_notifications_enabled=True
    )
    
    for user in users_with_digest:
        send_mail(
            subject='Your Daily MindBridge Update',
            message=f'Hello {user.first_name or user.username},\n\nHere is your daily wellness reminder...',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=True,
        )


@shared_task
def send_session_reminder(booking_id):
    """Send session reminder notification via the notification service."""
    from apps.professionals.models import Booking
    from apps.notifications.publisher import publish_notification

    booking = Booking.objects.select_related('professional__user').get(id=booking_id)
    publish_notification(
        user_id=booking.user_id,
        notification_type='reminder',
        title='Session Reminder',
        message=f'Your session with {booking.professional.user.get_full_name()} is coming up.',
        data={'booking_id': str(booking.id)},
    )


@shared_task
def send_daily_biblical_verse():
    """Send a daily biblical verse notification to all active users.

    The verse is selected deterministically based on the day of the year,
    so every user receives the same verse on a given day.
    """
    from apps.notifications.verses import BIBLICAL_VERSES
    from apps.notifications.models import Notification, NotificationPreference
    from apps.notifications.publisher import publish_notification

    day_of_year = timezone.now().timetuple().tm_yday
    verse = BIBLICAL_VERSES[day_of_year % len(BIBLICAL_VERSES)]

    title = f"Daily Verse: {verse['reference']}"
    message = f"{verse['text']}\n\n{verse['reflection']}"
    data = {
        'verse_reference': verse['reference'],
        'verse_text': verse['text'],
        'reflection': verse['reflection'],
        'sender_name': 'MindBot',
    }

    # Get users who have opted out of daily verse notifications
    opted_out_user_ids = set(
        NotificationPreference.objects.filter(
            push_daily_verse=False,
        ).values_list('user_id', flat=True)
    )

    active_users = User.objects.filter(is_active=True).only('id')

    for user in active_users:
        if user.id in opted_out_user_ids:
            continue
        publish_notification(
            user_id=user.id,
            notification_type='daily_verse',
            title=title,
            message=message,
            data=data,
        )
