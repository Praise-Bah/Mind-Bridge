from django.urls import path, include
from apps.users.views import InternalUserSnapshotView, HealthCheckView
from apps.users.views_internal_admin import (
    InternalAdminStatsView,
    InternalAdminUserListView, InternalAdminUserExportView,
    InternalAdminBanUserView, InternalAdminActivateUserView,
    InternalAdminPendingProfessionalsView,
    InternalAdminApproveProfessionalView, InternalAdminRejectProfessionalView,
    InternalAdminEmailCampaignView,
)

urlpatterns = [
    path('', include('django_prometheus.urls')),
    # Internal service-to-service — NOT routed through Nginx
    path('internal/users/snapshots/', InternalUserSnapshotView.as_view(), name='internal_user_snapshots'),

    # Internal admin endpoints (called by admin-service only)
    path('internal/admin/stats/', InternalAdminStatsView.as_view()),
    path('internal/admin/users/', InternalAdminUserListView.as_view()),
    path('internal/admin/users/export/', InternalAdminUserExportView.as_view()),
    path('internal/admin/users/<uuid:pk>/ban/', InternalAdminBanUserView.as_view()),
    path('internal/admin/users/<uuid:pk>/activate/', InternalAdminActivateUserView.as_view()),
    path('internal/admin/professionals/pending/', InternalAdminPendingProfessionalsView.as_view()),
    path('internal/admin/professionals/<uuid:pk>/approve/', InternalAdminApproveProfessionalView.as_view()),
    path('internal/admin/professionals/<uuid:pk>/reject/', InternalAdminRejectProfessionalView.as_view()),
    path('internal/admin/email-campaign/', InternalAdminEmailCampaignView.as_view()),

    path('api/v1/', include([
        path('auth/', include('apps.users.urls')),
        path('users/', include('apps.users.urls_users')),
        path('health/', HealthCheckView.as_view(), name='health'),
    ])),
]
