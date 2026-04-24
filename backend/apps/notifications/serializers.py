from rest_framework import serializers
from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'notification_type', 'title', 'message', 'data', 
                  'is_read', 'read_at', 'created_at']
        read_only_fields = ['id', 'created_at']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificationPreference
        fields = ['email_new_message', 'email_booking', 'email_reminder',
                  'email_community', 'email_digest', 'push_new_message',
                  'push_booking', 'push_reminder', 'push_community']
