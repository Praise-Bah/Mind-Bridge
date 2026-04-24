from django.db import models
from django.conf import settings
from apps.users.models import BaseModel


class Notification(BaseModel):
    """User notifications."""
    NOTIFICATION_TYPES = [
        ('message', 'New Message'),
        ('booking', 'Booking Confirmation'),
        ('reminder', 'Session Reminder'),
        ('reaction', 'Community Reaction'),
        ('comment', 'Comment on Post'),
        ('mention', 'Mentioned in Post'),
        ('professional', 'Professional Update'),
        ('system', 'System Notification'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.notification_type}: {self.title}"


class NotificationPreference(BaseModel):
    """User notification preferences."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notification_preferences')
    
    email_new_message = models.BooleanField(default=True)
    email_booking = models.BooleanField(default=True)
    email_reminder = models.BooleanField(default=True)
    email_community = models.BooleanField(default=True)
    email_digest = models.BooleanField(default=True)
    
    push_new_message = models.BooleanField(default=True)
    push_booking = models.BooleanField(default=True)
    push_reminder = models.BooleanField(default=True)
    push_community = models.BooleanField(default=True)

    class Meta:
        db_table = 'notification_preferences'
