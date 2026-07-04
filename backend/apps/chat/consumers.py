import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        self.user = self.scope['user']
        if not self.user.is_authenticated:
            await self.close()
            return

        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name,
                self.channel_name
            )

    async def receive_json(self, content):
        message_type = content.get('type')

        if message_type == 'chat_message':
            message = await self.save_message(content['message'])
            sender_name, sender_avatar = await self._get_sender_display()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': str(self.user.id),
                    'sender_name': sender_name,
                    'sender_avatar': sender_avatar,
                }
            )
        elif message_type == 'typing':
            sender_name, _ = await self._get_sender_display()
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user_id': str(self.user.id),
                    'username': sender_name,
                    'is_typing': content.get('is_typing', False),
                }
            )

    async def chat_message(self, event):
        await self.send_json({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'sender_avatar': event.get('sender_avatar'),
        })

    async def typing_indicator(self, event):
        await self.send_json({
            'type': 'typing',
            'user_id': event['user_id'],
            'username': event.get('username', ''),
            'is_typing': event['is_typing'],
        })

    @database_sync_to_async
    def _get_sender_display(self):
        """Return (display_name, avatar_url) — anonymous pseudonym for community group chats."""
        from .models import Conversation
        conversation = Conversation.objects.select_related('community_group').get(id=self.conversation_id)
        if conversation.community_group:
            from apps.community.anonymous import generate_anonymous_name
            name = generate_anonymous_name(str(self.user.id), str(conversation.community_group.id))
            return name, None
        avatar = self.user.avatar.url if self.user.avatar else None
        return self.user.username, avatar

    @database_sync_to_async
    def save_message(self, content):
        from .models import Message, Conversation
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=self.user,
            content=content
        )
        conversation.last_message_at = timezone.now()
        conversation.save()
        return {
            'id': str(message.id),
            'content': message.content,
            'created_at': message.created_at.isoformat(),
        }
