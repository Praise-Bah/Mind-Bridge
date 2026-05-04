from django.db import models
from django.conf import settings
from apps.users.models import BaseModel


class JournalEntry(BaseModel):
    """User journal entries for self-reflection."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='journal_entries')
    title = models.CharField(max_length=255)
    content = models.TextField()
    mood_score = models.IntegerField(choices=[(i, i) for i in range(1, 6)], null=True, blank=True)
    tags = models.JSONField(default=list)
    is_private = models.BooleanField(default=True)

    class Meta:
        db_table = 'journal_entries'
        ordering = ['-created_at']
        verbose_name_plural = 'Journal Entries'

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class JournalPrompt(BaseModel):
    """Daily journal prompts for users."""
    prompt_text = models.TextField()
    category = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'journal_prompts'

    def __str__(self):
        return self.prompt_text[:50]
