from django.urls import path, include
from mindbridge_common.health import ServiceHealthView


class NotificationHealthView(ServiceHealthView):
    service_name = 'notification-service'


urlpatterns = [
    path('', include('django_prometheus.urls')),
    path('api/v1/notifications/', include('apps.notifications.urls')),
    path('api/v1/health/', NotificationHealthView.as_view()),
]
