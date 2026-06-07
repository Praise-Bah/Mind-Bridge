from django.urls import path, include
from mindbridge_common.health import ServiceHealthView
from apps.videos.views_internal_admin import (
    InternalAdminVideoListCreateView,
    InternalAdminVideoDetailView,
)


class ContentHealthView(ServiceHealthView):
    service_name = 'content-service'


urlpatterns = [
    path('', include('django_prometheus.urls')),
    # Internal admin endpoints (called by admin-service only)
    path('internal/admin/videos/', InternalAdminVideoListCreateView.as_view()),
    path('internal/admin/videos/<uuid:pk>/', InternalAdminVideoDetailView.as_view()),

    path('api/v1/journals/', include('apps.journals.urls')),
    path('api/v1/videos/', include('apps.videos.urls')),
    path('api/v1/achievements/', include('apps.achievements.urls')),
    path('api/v1/health/', ContentHealthView.as_view(), name='health'),
]
