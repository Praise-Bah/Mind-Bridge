from django.urls import path
from .views import (
    AdminStatsView,
    AdminUserListView, AdminBanUserView, AdminActivateUserView, AdminExportUsersCSVView,
    PendingProfessionalsView, ApproveProfessionalView, RejectProfessionalView,
    PendingGroupsView, ApproveGroupView, RejectGroupView,
    ReportListView, DismissReportView, DeleteReportContentView,
    WarnReportedUserView, BanReportedUserView,
    AdminVideoCreateView, AdminVideoUpdateDeleteView,
    EmailCampaignView,
)

urlpatterns = [
    path('stats/', AdminStatsView.as_view(), name='admin_stats'),

    path('users/', AdminUserListView.as_view(), name='admin_user_list'),
    path('users/export/', AdminExportUsersCSVView.as_view(), name='admin_user_export'),
    path('users/<uuid:pk>/ban/', AdminBanUserView.as_view(), name='admin_ban_user'),
    path('users/<uuid:pk>/activate/', AdminActivateUserView.as_view(), name='admin_activate_user'),

    path('professionals/pending/', PendingProfessionalsView.as_view(), name='admin_pending_professionals'),
    path('professionals/<uuid:pk>/approve/', ApproveProfessionalView.as_view(), name='admin_approve_professional'),
    path('professionals/<uuid:pk>/reject/', RejectProfessionalView.as_view(), name='admin_reject_professional'),

    path('groups/pending/', PendingGroupsView.as_view(), name='admin_pending_groups'),
    path('groups/<uuid:pk>/approve/', ApproveGroupView.as_view(), name='admin_approve_group'),
    path('groups/<uuid:pk>/reject/', RejectGroupView.as_view(), name='admin_reject_group'),

    path('reports/', ReportListView.as_view(), name='admin_report_list'),
    path('reports/<uuid:pk>/dismiss/', DismissReportView.as_view(), name='admin_dismiss_report'),
    path('reports/<uuid:pk>/delete-content/', DeleteReportContentView.as_view(), name='admin_delete_content'),
    path('reports/<uuid:pk>/warn-user/', WarnReportedUserView.as_view(), name='admin_warn_user'),
    path('reports/<uuid:pk>/ban-user/', BanReportedUserView.as_view(), name='admin_ban_reported_user'),

    path('videos/', AdminVideoCreateView.as_view(), name='admin_video_create'),
    path('videos/<uuid:pk>/', AdminVideoUpdateDeleteView.as_view(), name='admin_video_detail'),

    path('email-campaign/', EmailCampaignView.as_view(), name='admin_email_campaign'),
]
