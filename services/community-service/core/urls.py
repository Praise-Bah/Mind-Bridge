from django.urls import path, include
from mindbridge_common.health import ServiceHealthView
from apps.community.views_internal_admin import (
    InternalAdminStatsView,
    InternalAdminPendingGroupsView, InternalAdminApproveGroupView, InternalAdminRejectGroupView,
    InternalAdminReportListView, InternalAdminDismissReportView,
    InternalAdminDeleteReportContentView, InternalAdminWarnReportedUserView,
    InternalAdminBanReportedUserView,
)


class CommunityHealthView(ServiceHealthView):
    service_name = 'community-service'


urlpatterns = [
    path('', include('django_prometheus.urls')),
    # Internal admin endpoints (called by admin-service only)
    path('internal/admin/stats/', InternalAdminStatsView.as_view()),
    path('internal/admin/groups/pending/', InternalAdminPendingGroupsView.as_view()),
    path('internal/admin/groups/<uuid:pk>/approve/', InternalAdminApproveGroupView.as_view()),
    path('internal/admin/groups/<uuid:pk>/reject/', InternalAdminRejectGroupView.as_view()),
    path('internal/admin/reports/', InternalAdminReportListView.as_view()),
    path('internal/admin/reports/<uuid:pk>/dismiss/', InternalAdminDismissReportView.as_view()),
    path('internal/admin/reports/<uuid:pk>/delete-content/', InternalAdminDeleteReportContentView.as_view()),
    path('internal/admin/reports/<uuid:pk>/warn-user/', InternalAdminWarnReportedUserView.as_view()),
    path('internal/admin/reports/<uuid:pk>/ban-user/', InternalAdminBanReportedUserView.as_view()),

    path('api/v1/community/', include('apps.community.urls')),
    path('api/v1/health/', CommunityHealthView.as_view(), name='health'),
]
