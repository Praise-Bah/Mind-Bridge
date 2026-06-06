from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Conversation, Message

User = get_user_model()


class ParticipantSerializer(serializers.ModelSerializer):
    """Serializer for conversation participants."""
    class Meta:
        model = User
        fields = ['id', 'username', 'avatar', 'is_online']


class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.ImageField(source='sender.avatar', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'conversation', 'sender', 'sender_name', 'sender_avatar',
                  'content', 'message_type', 'attachment', 'is_read', 'read_at',
                  'created_at']
        read_only_fields = ['id', 'conversation', 'sender', 'is_read', 'read_at', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    participants = serializers.PrimaryKeyRelatedField(
        many=True, queryset=User.objects.all(), write_only=True
    )
    participants_detail = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ['id', 'participants', 'participants_detail', 'is_group', 'name', 
                  'last_message', 'unread_count', 'last_message_at', 'created_at']
        read_only_fields = ['id', 'last_message_at', 'created_at']

    def get_participants_detail(self, obj):
        return ParticipantSerializer(obj.participants.all(), many=True).data

    def get_name(self, obj):
        # If conversation has a custom name, use it
        if obj.name:
            return obj.name
        # For 1:1 chats, show the other participant's name
        request = self.context.get('request')
        if request and not obj.is_group:
            other_participants = obj.participants.exclude(id=request.user.id)
            if other_participants.exists():
                return other_participants.first().username
        return 'Conversation'

    def get_last_message(self, obj):
        prefetched = getattr(obj, 'prefetched_messages', None)
        if prefetched is not None:
            return MessageSerializer(prefetched[0]).data if prefetched else None
        msg = obj.messages.filter(is_deleted=False).select_related('sender').last()
        return MessageSerializer(msg).data if msg else None

    def get_unread_count(self, obj):
        ann = getattr(obj, 'unread_count_ann', None)
        if ann is not None:
            return ann
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(is_deleted=False, is_read=False).exclude(sender=request.user).count()
