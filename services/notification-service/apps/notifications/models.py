from django.db import models
from mindbridge_common.models import BaseModel


class Notification(BaseModel):
    NOTIFICATION_TYPES = [
        ('message', 'New Message'),
        ('booking', 'Booking Confirmation'),
        ('booking_confirmed', 'Booking Confirmed'),
        ('reminder', 'Session Reminder'),
        ('reaction', 'Community Reaction'),
        ('comment', 'Comment on Post'),
        ('mention', 'Mentioned in Post'),
        ('professional', 'Professional Update'),
        ('professional_approved', 'Professional Approved'),
        ('professional_rejected', 'Professional Rejected'),
        ('follower', 'New Follower'),
        ('checkin', 'Daily Check-In Prompt'),
        ('ai_summary', 'AI Session Summary'),
        ('system', 'System Notification'),
        ('group_approved', 'Group Approved'),
        ('group_rejected', 'Group Rejected'),
        ('group_review_required', 'Group Requires Review'),
    ]

    # UUIDField instead of FK — no User model in this service
    user_id = models.UUIDField(db_index=True)
    notification_type = models.CharField(max_length=30, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    data = models.JSONField(default=dict, blank=True)
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user_id', 'is_read']),
        ]

    def __str__(self):
        return f"{self.notification_type}: {self.title}"


class NotificationPreference(BaseModel):
    user_id = models.UUIDField(unique=True)

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
