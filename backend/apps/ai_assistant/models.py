from django.db import models
from django.conf import settings
from apps.users.models import BaseModel


class AISession(BaseModel):
    """AI chat session with OpenRouter AI."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_sessions')
    title = models.CharField(max_length=255, default='New Chat')
    is_active = models.BooleanField(default=True)
    summary = models.TextField(blank=True)
    message_count = models.PositiveIntegerField(default=0)
    total_distress_indicators = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'ai_sessions'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"

    def update_message_count(self):
        self.message_count = self.messages.count()
        self.save(update_fields=['message_count'])


class AIMessage(BaseModel):
    """Individual message in AI session."""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]
    RATING_CHOICES = [
        (1, 'Thumbs Up'),
        (-1, 'Thumbs Down'),
    ]

    session = models.ForeignKey(AISession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()
    rating = models.IntegerField(choices=RATING_CHOICES, null=True, blank=True)
    detected_mood = models.CharField(max_length=50, blank=True)
    mood_score = models.FloatField(null=True, blank=True)
    distress_indicators = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'ai_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
