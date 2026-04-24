from django.urls import path
from .views import (
    ConversationListCreateView, ConversationDetailView,
    MessageListCreateView, MarkMessagesReadView
)

urlpatterns = [
    path('conversations/', ConversationListCreateView.as_view(), name='conversation_list'),
    path('conversations/<uuid:pk>/', ConversationDetailView.as_view(), name='conversation_detail'),
    path('conversations/<uuid:conversation_id>/messages/', MessageListCreateView.as_view(), name='message_list'),
    path('conversations/<uuid:conversation_id>/read/', MarkMessagesReadView.as_view(), name='mark_read'),
]
