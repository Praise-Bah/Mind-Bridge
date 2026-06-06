from rest_framework import serializers
from .models import AISession, AIMessage


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'rating', 'detected_mood',
                  'mood_score', 'distress_indicators', 'created_at']
        read_only_fields = ['id', 'created_at']


class AISessionSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AISession
        fields = ['id', 'title', 'is_active', 'summary', 'message_count',
                  'total_distress_indicators', 'messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'message_count', 'total_distress_indicators',
                            'created_at', 'updated_at']


class AISessionListSerializer(serializers.ModelSerializer):
    class Meta:
        model = AISession
        fields = ['id', 'title', 'is_active', 'message_count', 'created_at', 'updated_at']
        read_only_fields = fields


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField()
    session_id = serializers.UUIDField(required=False)


class RateMessageSerializer(serializers.Serializer):
    rating = serializers.ChoiceField(choices=['up', 'down'])


class MoodAnalysisSerializer(serializers.Serializer):
    message = serializers.CharField()
