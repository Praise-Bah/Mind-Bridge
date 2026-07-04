from django.db import models
from django.conf import settings
from apps.users.models import BaseModel


class Notification(BaseModel):
    """User notifications."""
    NOTIFICATION_TYPES = [
        ('message', 'New Message'),
        ('booking', 'Booking Confirmation'),
        ('booking_confirmed', 'Booking Confirmed'),
        ('reminder', 'Session Reminder'),
        ('reaction', 'Community Reaction'),
        ('comment', 'Comment on Post'),
        ('mention', 'Mentioned in Post'),
        ('professional', 'Professional Update'),
        ('follower', 'New Follower'),
        ('checkin', 'Daily Check-In Prompt'),
        ('ai_summary', 'AI Session Summary'),
        ('system', 'System Notification'),
        ('daily_verse', 'Daily Biblical Verse'),
        ('group_approved', 'Group Approved'),
        ('group_rejected', 'Group Rejected'),
        ('group_review_required', 'Group Requires Review'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'is_read'], name='notification_user_read_idx'),
            models.Index(fields=['user', 'is_read', 'created_at'], name='notification_user_read_at_idx'),
        ]

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
    push_daily_verse = models.BooleanField(default=True)

    class Meta:
        db_table = 'notification_preferences'
