from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone


class ChatConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        user = self.scope.get('user')
        if not user or not user.is_authenticated:
            await self.close()
            return

        self.user = user
        self.conversation_id = self.scope['url_route']['kwargs']['conversation_id']
        self.room_group_name = f'chat_{self.conversation_id}'

        # Verify the user is a participant before accepting
        is_participant = await self._is_participant()
        if not is_participant:
            await self.close()
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive_json(self, content):
        message_type = content.get('type')

        if message_type == 'chat_message':
            message = await self.save_message(content['message'])
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': message,
                    'sender_id': self.user.user_id,
                    'sender_name': self.user.username,
                }
            )
        elif message_type == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_indicator',
                    'user_id': self.user.user_id,
                    'is_typing': content.get('is_typing', False),
                }
            )

    async def chat_message(self, event):
        await self.send_json({
            'type': 'chat_message',
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
        })

    async def typing_indicator(self, event):
        await self.send_json({
            'type': 'typing',
            'user_id': event['user_id'],
            'is_typing': event['is_typing'],
        })

    @database_sync_to_async
    def _is_participant(self) -> bool:
        from .models import Conversation
        return Conversation.objects.filter(
            id=self.conversation_id,
            participants__user_id=self.user.user_id,
            is_deleted=False,
        ).exists()

    @database_sync_to_async
    def save_message(self, content: str) -> dict:
        from .models import Message, Conversation, UserSnapshot

        sender, _ = UserSnapshot.objects.get_or_create(
            user_id=self.user.user_id,
            defaults={'username': self.user.username},
        )
        conversation = Conversation.objects.get(id=self.conversation_id)
        message = Message.objects.create(
            conversation=conversation,
            sender=sender,
            content=content,
        )
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])
        return {
            'id': str(message.id),
            'content': message.content,
            'created_at': message.created_at.isoformat(),
        }
