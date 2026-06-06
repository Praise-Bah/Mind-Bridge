from django.urls import path
from .views import (
    AISessionListCreateView, AISessionDetailView, ChatView, ChatStreamView,
    RateMessageView, SessionSummaryView, MoodDetectionView, AvailableModelsView
)

urlpatterns = [
    path('sessions/', AISessionListCreateView.as_view(), name='ai_session_list'),
    path('sessions/<uuid:pk>/', AISessionDetailView.as_view(), name='ai_session_detail'),
    path('sessions/<uuid:pk>/summary/', SessionSummaryView.as_view(), name='ai_session_summary'),
    path('chat/', ChatView.as_view(), name='ai_chat'),
    path('chat/stream/', ChatStreamView.as_view(), name='ai_chat_stream'),
    path('messages/<uuid:pk>/rate/', RateMessageView.as_view(), name='ai_message_rate'),
    path('mood/detect/', MoodDetectionView.as_view(), name='ai_mood_detect'),
    path('models/', AvailableModelsView.as_view(), name='ai_available_models'),
]
