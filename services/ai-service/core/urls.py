from django.urls import path, include
from apps.ai_assistant.views import AIServiceHealthView

urlpatterns = [
    path('api/v1/health/', AIServiceHealthView.as_view(), name='health'),
    path('api/v1/ai/', include('apps.ai_assistant.urls')),
]
