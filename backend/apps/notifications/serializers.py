from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    sender_avatar = serializers.SerializerMethodField()

    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'data',
                  'sender_name', 'sender_avatar', 'is_read', 'read_at', 'created_at']
        read_only_fields = ['id', 'created_at']

    def get_sender_name(self, obj):
        return obj.data.get('sender_name') if obj.data else None

    def get_sender_avatar(self, obj):
        return obj.data.get('sender_avatar') if obj.data else None


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['email_new_message', 'email_booking', 'email_reminder',
                  'email_community', 'email_digest', 'push_new_message',
                  'push_booking', 'push_reminder', 'push_community']
