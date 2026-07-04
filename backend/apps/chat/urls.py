from django.urls import path
from .views import (
    ConversationListCreateView, ConversationDetailView,
    MessageListCreateView, MarkMessagesReadView,
    GroupChatView, GroupChatMessagesView
)

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='conversation_list'),
    path('conversations/<uuid:pk>/', ConversationDetailView.as_view(), name='conversation_detail'),
    path('conversations/<uuid:conversation_id>/messages/', MessageListCreateView.as_view(), name='message_list'),
    path('conversations/<uuid:conversation_id>/read/', MarkMessagesReadView.as_view(), name='mark_read'),
    path('group/<slug:slug>/', GroupChatView.as_view(), name='group_chat'),
    path('group/<slug:slug>/messages/', GroupChatMessagesView.as_view(), name='group_chat_messages'),
]
