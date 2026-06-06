from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Conversation, Message
from .serializers import ConversationSerializer, MessageSerializer


class ConversationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        from django.db.models import Count, Q, Prefetch
        from django.contrib.auth import get_user_model
        User = get_user_model()
        return (
            Conversation.objects.filter(participants=self.request.user, is_deleted=False)
            .prefetch_related(
                Prefetch('participants', queryset=User.objects.only('id', 'username', 'avatar', 'is_online')),
                Prefetch(
                    'messages',
                    queryset=Message.objects.filter(is_deleted=False).select_related('sender').order_by('-created_at'),
                    to_attr='prefetched_messages',
                ),
            )
            .annotate(
                unread_count_ann=Count(
                    'messages',
                    filter=Q(messages__is_read=False, messages__is_deleted=False)
                           & ~Q(messages__sender=self.request.user),
                )
            )
            .order_by('-last_message_at', '-created_at')
        )

    def create(self, request, *args, **kwargs):
        participant_ids = request.data.get('participants', [])

        # For 1:1 chats, find or return existing conversation
        if len(participant_ids) == 1:
            other_user_id = participant_ids[0]
            # Avoid inflated counts from chained M2M filter JOINs by checking
            # participant count in Python after fetching candidates.
            candidates = list(
                Conversation.objects.filter(
                    is_group=False,
                    is_deleted=False,
                    participants=request.user,
                ).filter(
                    participants=other_user_id,
                ).distinct()
            )
            exact = [c for c in candidates if c.participants.count() == 2]

            if exact:
                # Clean up any extra duplicates (soft-delete older ones)
                exact.sort(key=lambda c: c.created_at, reverse=True)
                for dup in exact[1:]:
                    dup.is_deleted = True
                    dup.save(update_fields=['is_deleted'])
                serializer = self.get_serializer(exact[0])
                return Response(serializer.data, status=status.HTTP_200_OK)

        # Create new conversation
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        conversation = serializer.save()
        conversation.participants.add(request.user)

        serializer = self.get_serializer(conversation)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ConversationDetailView(generics.RetrieveDestroyAPIView):
    serializer_class = ConversationSerializer

    def get_queryset(self):
        return Conversation.objects.filter(
            participants=self.request.user,
            is_deleted=False
        )

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class MessageListCreateView(generics.ListCreateAPIView):
    serializer_class = MessageSerializer

    def get_queryset(self):
        conversation_id = self.kwargs['conversation_id']
        return Message.objects.filter(
            conversation_id=conversation_id,
            conversation__participants=self.request.user,
            is_deleted=False
        )

    def perform_create(self, serializer):
        conversation_id = self.kwargs['conversation_id']
        conversation = Conversation.objects.get(id=conversation_id)
        serializer.save(sender=self.request.user, conversation=conversation)
        conversation.last_message_at = timezone.now()
        conversation.save()


class MarkMessagesReadView(APIView):
    def post(self, request, conversation_id):
        Message.objects.filter(
            conversation_id=conversation_id,
            is_read=False
        ).exclude(sender=request.user).update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({'status': 'messages marked as read'})
