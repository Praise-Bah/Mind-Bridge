from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Conversation, Message, UserSnapshot
from .serializers import ConversationSerializer, MessageSerializer
from .authentication import ServiceJWTAuthentication


def _get_or_create_snapshot(user_id: str, username: str = '') -> UserSnapshot:
    """Return existing UserSnapshot or create a placeholder that events will fill in later."""
    snap, _ = UserSnapshot.objects.get_or_create(
        user_id=user_id,
        defaults={'username': username or str(user_id)[:20]},
    )
    return snap


class ConversationListCreateView(generics.ListCreateAPIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return (
            Conversation.objects
            .filter(participants__user_id=self.request.user.user_id, is_deleted=False)
            .prefetch_related('participants', 'messages')
            .order_by('-last_message_at', '-created_at')
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def create(self, request, *args, **kwargs):
        participant_ids = request.data.get('participants', [])
        my_snap = _get_or_create_snapshot(request.user.user_id, request.user.username)

        # For 1:1 chats, return existing conversation if one already exists
        if len(participant_ids) == 1:
            other_id = str(participant_ids[0])
            candidates = list(
                Conversation.objects
                .filter(is_group=False, is_deleted=False, participants__user_id=request.user.user_id)
                .filter(participants__user_id=other_id)
                .distinct()
            )
            exact = [c for c in candidates if c.participants.count() == 2]
            if exact:
                exact.sort(key=lambda c: c.created_at, reverse=True)
                for dup in exact[1:]:
                    dup.is_deleted = True
                    dup.save(update_fields=['is_deleted'])
                serializer = self.get_serializer(exact[0])
                return Response(serializer.data, status=status.HTTP_200_OK)

        is_group = len(participant_ids) > 1
        conversation = Conversation.objects.create(
            is_group=is_group,
            name=request.data.get('name', ''),
        )
        conversation.participants.add(my_snap)
        for uid in participant_ids:
            conversation.participants.add(_get_or_create_snapshot(str(uid)))

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(generics.RetrieveDestroyAPIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(
            participants__user_id=self.request.user.user_id,
            is_deleted=False,
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


class MessageListCreateView(generics.ListCreateAPIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = MessageSerializer

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants__user_id=self.request.user.user_id,
            is_deleted=False,
        )

    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = Conversation.objects.get(id=conversation_id)
        sender = _get_or_create_snapshot(self.request.user.user_id, self.request.user.username)
        message = serializer.save(sender=sender, conversation=conversation)
        conversation.last_message_at = timezone.now()
        conversation.save(update_fields=['last_message_at'])
        self._broadcast(message, sender)
        return message

    def _broadcast(self, message, sender):
        """Push the new message to all WebSocket participants of this conversation."""
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            payload = {
                'id': str(message.id),
                'conversation': str(message.conversation_id),
                'sender': str(sender.user_id),
                'sender_name': sender.username,
                'sender_avatar': sender.avatar_url,
                'content': message.content,
                'message_type': message.message_type,
                'attachment': None,
                'is_read': message.is_read,
                'read_at': None,
                'created_at': message.created_at.isoformat(),
            }
            async_to_sync(channel_layer.group_send)(
                f'chat_{message.conversation_id}',
                {'type': 'chat_message', 'message': payload},
            )
        except Exception:
            pass


class MarkMessagesReadView(APIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, conversation_id):
        Message.objects.filter(
            conversation_id=conversation_id,
            is_read=False,
        ).exclude(
            sender__user_id=request.user.user_id
        ).update(is_read=True, read_at=timezone.now())
        return Response({'status': 'messages marked as read'})
