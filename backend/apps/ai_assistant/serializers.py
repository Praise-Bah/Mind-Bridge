from rest_framework import serializers
from .models import AISession, AIMessage


class AIMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AIMessage
        fields = ['id', 'role', 'content', 'rating', 'detected_mood', 'mood_score', 'distress_indicators', 'created_at']
        read_only_fields = ['id', 'role', 'detected_mood', 'mood_score', 'distress_indicators', 'created_at']


class AISessionSerializer(serializers.ModelSerializer):
    messages = AIMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AISession
        fields = ['id', 'title', 'is_active', 'summary', 'messages', 'message_count', 'total_distress_indicators', 'created_at', 'updated_at']
        read_only_fields = ['id', 'summary', 'message_count', 'total_distress_indicators', 'created_at', 'updated_at']


class AISessionListSerializer(serializers.ModelSerializer):
    message_count = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = AISession
        fields = ['id', 'title', 'is_active', 'message_count', 'last_message', 'created_at', 'updated_at']

    def get_message_count(self, obj):
        return obj.messages.count()

    def get_last_message(self, obj):
        last = obj.messages.last()
        if last:
            return {'role': last.role, 'content': last.content[:100]}
        return None


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=5000)
    session_id = serializers.UUIDField(required=False)


class RateMessageSerializer(serializers.Serializer):
    rating = serializers.ChoiceField(choices=['up', 'down'])


class MoodAnalysisSerializer(serializers.Serializer):
    message = serializers.CharField(max_length=2000)
