from rest_framework import serializers
from .models import AISession, AIMessage


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'rating', 'detected_mood',
                  'mood_score', 'distress_indicators', 'crisis_level',
                  'detected_conditions', 'created_at']
        read_only_fields = ['id', 'created_at']


class AISessionSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AISession
        fields = ['id', 'title', 'is_active', 'summary', 'message_count',
                  'total_distress_indicators', 'initial_mood', 'initial_mood_score',
                  'mood_checkin_completed', 'feedback_rating', 'feedback_text',
                  'topic_tags', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'message_count', 'total_distress_indicators',
                            'created_at', 'updated_at']


class AISessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = AISession
        fields = ['id', 'title', 'is_active', 'message_count', 'topic_tags',
                  'mood_checkin_completed', 'feedback_rating', 'created_at', 'updated_at']
        read_only_fields = fields


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    session_id = serializers.UUIDField(required=False)


class RateMessageSerializer(serializers.Serializer):
    rating = serializers.ChoiceField(choices=['up', 'down'])


class MoodAnalysisSerializer(serializers.Serializer):
    message = serializers.CharField()


class MoodCheckinSerializer(serializers.Serializer):
    mood = serializers.CharField(max_length=50)
    mood_score = serializers.FloatField(min_value=0.0, max_value=1.0)


class SessionFeedbackSerializer(serializers.Serializer):
    rating = serializers.IntegerField(min_value=1, max_value=5)
    text = serializers.CharField(required=False, allow_blank=True, default='')
