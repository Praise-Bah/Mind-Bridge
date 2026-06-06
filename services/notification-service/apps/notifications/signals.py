from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Notification
from .serializers import NotificationSerializer


@receiver(post_save, sender=Notification)
def push_notification_to_websocket(sender, instance, created, **kwargs):
    """Push newly created notifications to the user's WebSocket channel group."""
    if not created:
        return
    try:
        channel_layer = get_channel_layer()
        if channel_layer is None:
            return
        serializer = NotificationSerializer(instance)
        async_to_sync(channel_layer.group_send)(
            f'notifications_{instance.user_id}',
            {
                'type': 'send_notification',
                'notification': serializer.data,
            }
        )
    except Exception:
        pass
