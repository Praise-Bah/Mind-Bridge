from django.contrib import admin
from .models import JournalEntry, JournalPrompt


@admin.register(JournalEntry)
class JournalEntryAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'mood_score', 'created_at']
    list_filter = ['mood_score', 'created_at']
    search_fields = ['user__email', 'title', 'content']


@admin.register(JournalPrompt)
class JournalPromptAdmin(admin.ModelAdmin):
    list_display = ['id', 'prompt_text', 'category', 'is_active']
    list_filter = ['category', 'is_active']
