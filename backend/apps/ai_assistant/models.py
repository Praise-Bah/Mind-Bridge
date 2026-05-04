from django.db import models
from django.conf import settings
from apps.users.models import BaseModel


class AISession(BaseModel):
    """AI chat session with Anthropic Claude."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ai_sessions')
    title = models.CharField(max_length=255, default='New Chat')
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'ai_sessions'
        ordering = ['-updated_at']

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class AIMessage(BaseModel):
    """Individual message in AI session."""
    ROLE_CHOICES = [
        ('user', 'User'),
        ('assistant', 'Assistant'),
    ]

    session = models.ForeignKey(AISession, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    content = models.TextField()

    class Meta:
        db_table = 'ai_messages'
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role}: {self.content[:50]}..."
