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

    # Pre-session mood check-in (2.5)
    initial_mood = models.CharField(max_length=50, blank=True)
    initial_mood_score = models.FloatField(null=True, blank=True)
    mood_checkin_completed = models.BooleanField(default=False)

    # Post-session feedback (2.6)
    feedback_rating = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Session feedback rating 1-5"
    )
    feedback_text = models.TextField(blank=True)

    # Automatic topic tagging (2.7)
    topic_tags = models.JSONField(
        default=list, blank=True,
        help_text="Auto-classified topic tags for this session"
    )

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
    crisis_level = models.CharField(
        max_length=20,
        default='normal',
        choices=[
            ('normal', 'Normal'),
            ('mild_distress', 'Mild Distress'),
            ('moderate_distress', 'Moderate Distress'),
            ('crisis', 'Crisis'),
        ],
    )
    detected_conditions = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = 'ai_messages'
        ordering = ['created_at']
