from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_avatar',
                  'content', 'message_type', 'attachment', 'is_read', 'read_at',
                  'created_at']
        read_only_fields = ['id', 'sender', 'is_read', 'read_at', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all()
    )
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'is_group', 'name', 'last_message',
                  'unread_count', 'last_message_at', 'created_at']
        read_only_fields = ['id', 'last_message_at', 'created_at']

    def get_last_message(self, obj):
        message = obj.messages.filter(is_deleted=False).last()
        if message:
            return MessageSerializer(message).data
        return None

    def get_unread_count(self, obj):
        user = self.context.get('request').user
        return obj.messages.filter(is_deleted=False, is_read=False).exclude(sender=user).count()
