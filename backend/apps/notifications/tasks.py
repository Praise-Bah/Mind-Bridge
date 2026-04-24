from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model

User = get_user_model()


@shared_task
def send_daily_email_digest():
    """Send daily email digest to users with email_digest enabled."""
    from .models import NotificationPreference
    
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
    """Send session reminder notification."""
    from apps.professionals.models import Booking
    from .models import Notification
    
    booking = Booking.objects.select_related('user', 'professional__user').get(id=booking_id)
    
    Notification.objects.create(
        user=booking.user,
        notification_type='reminder',
        title='Session Reminder',
        message=f'Your session with {booking.professional.user.get_full_name()} is coming up.',
        data={'booking_id': str(booking.id)}
    )
