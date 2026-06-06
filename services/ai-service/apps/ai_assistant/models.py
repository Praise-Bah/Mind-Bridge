import uuid
from django.db import models


class BaseModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_deleted = models.BooleanField(default=False)

    class Meta:
        abstract = True


class AISession(BaseModel):
    # user_id is a UUID from the JWT — no FK to User model in this service
    user_id = models.UUIDField(db_index=True)
    title = models.CharField(max_length=255, default='New Chat')
    is_active = models.BooleanField(default=True)
    summary = models.TextField(blank=True)
    message_count = models.PositiveIntegerField(default=0)
    total_distress_indicators = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'ai_sessions'
        ordering = ['-updated_at']

    def update_message_count(self):
        self.message_count = self.messages.count()
        self.save(update_fields=['message_count'])


class AIMessage(BaseModel):
    ROLE_CHOICES = [('user', 'User'), ('assistant', 'Assistant')]
    RATING_CHOICES = [(1, 'Thumbs Up'), (-1, 'Thumbs Down')]

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
