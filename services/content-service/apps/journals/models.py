from django.db import models
from mindbridge_common.models import BaseModel


class JournalEntry(BaseModel):
    user_id = models.UUIDField(db_index=True)
    title = models.CharField(max_length=255)
    content = models.TextField()
    mood_score = models.IntegerField(choices=[(i, i) for i in range(1, 6)], null=True, blank=True)
    tags = models.JSONField(default=list)
    is_private = models.BooleanField(default=True)

    class Meta:
        db_table = 'journal_entries'
        ordering = ['-created_at']
        verbose_name_plural = 'Journal Entries'


class JournalPrompt(BaseModel):
    prompt_text = models.TextField()
    category = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'journal_prompts'
