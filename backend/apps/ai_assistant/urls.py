from django.urls import path
from .views import AISessionListCreateView, AISessionDetailView, ChatView, ChatStreamView

urlpatterns = [
    path('sessions/', AISessionListCreateView.as_view(), name='ai_session_list'),
    path('sessions/<uuid:pk>/', AISessionDetailView.as_view(), name='ai_session_detail'),
    path('chat/', ChatView.as_view(), name='ai_chat'),
    path('chat/stream/', ChatStreamView.as_view(), name='ai_chat_stream'),
]
