from rest_framework import serializers
from .models import Conversation, Message, UserSnapshot


class ParticipantSerializer(serializers.ModelSerializer):
    id = serializers.UUIDField(source='user_id', read_only=True)
    avatar = serializers.CharField(source='avatar_url', read_only=True)

    class Meta:
        model = UserSnapshot
        fields = ['id', 'username', 'avatar', 'is_online']


class MessageSerializer(serializers.ModelSerializer):
    # Use sender.user_id (auth-service UUID) not the UserSnapshot PK so the
    # frontend isOwn check (message.sender === currentUserId) works correctly.
    sender = serializers.UUIDField(source='sender.user_id', read_only=True)
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_avatar = serializers.CharField(source='sender.avatar_url', read_only=True)

    class Meta:
        model = Message
        fields = [
            'id', 'conversation', 'sender', 'sender_name', 'sender_avatar',
            'content', 'message_type', 'attachment', 'is_read', 'read_at', 'created_at',
        ]
        read_only_fields = ['id', 'conversation', 'sender', 'is_read', 'read_at', 'created_at']


class ConversationSerializer(serializers.ModelSerializer):
    participants_detail = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            'id', 'participants_detail', 'is_group', 'name',
            'last_message', 'unread_count', 'last_message_at', 'created_at',
        ]
        read_only_fields = ['id', 'last_message_at', 'created_at']

    def get_participants_detail(self, obj):
        return ParticipantSerializer(obj.participants.all(), many=True).data

    def get_name(self, obj):
        if obj.name:
            return obj.name
        request = self.context.get('request')
        if request and not obj.is_group:
            others = obj.participants.exclude(user_id=request.user.user_id)
            first = others.first()
            if first:
                return first.username
        return 'Conversation'

    def get_last_message(self, obj):
        message = obj.messages.filter(is_deleted=False).order_by('created_at').last()
        return MessageSerializer(message).data if message else None

    def get_unread_count(self, obj):
        request = self.context.get('request')
        if not request:
            return 0
        return obj.messages.filter(
            is_deleted=False, is_read=False
        ).exclude(sender__user_id=request.user.user_id).count()
