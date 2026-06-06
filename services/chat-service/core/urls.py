from django.urls import path, include
from mindbridge_common.health import ServiceHealthView
from apps.chat.views_internal import InternalAdminStatsView


class ChatHealthView(ServiceHealthView):
    service_name = 'chat-service'


urlpatterns = [
    path('internal/admin/stats/', InternalAdminStatsView.as_view()),

    path('api/v1/chat/', include('apps.chat.urls')),
    path('api/v1/health/', ChatHealthView.as_view()),
]
