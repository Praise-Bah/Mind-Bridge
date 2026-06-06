from rest_framework import serializers
from .models import JournalEntry, JournalPrompt


class JournalEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ['id', 'title', 'content', 'mood_score', 'tags', 'is_private', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def create(self, validated_data):
        validated_data['user_id'] = str(self.context['request'].user.user_id)
        return super().create(validated_data)


class JournalPromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalPrompt
        fields = ['id', 'prompt_text', 'category']
