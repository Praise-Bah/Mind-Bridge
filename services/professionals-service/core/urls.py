from django.urls import path, include
from mindbridge_common.health import ServiceHealthView
from apps.professionals.views_internal import InternalAdminStatsView


class ProfessionalsHealthView(ServiceHealthView):
    service_name = 'professionals-service'


urlpatterns = [
    path('internal/admin/stats/', InternalAdminStatsView.as_view()),

    path('api/v1/professionals/', include('apps.professionals.urls')),
    path('api/v1/pro/', include('apps.professionals.urls_pro')),
    path('api/v1/health/', ProfessionalsHealthView.as_view(), name='health'),
]
