from django.urls import path
from .views import (
    AdminStatsView,
    AdminUserListView, AdminUserExportView, AdminBanUserView, AdminActivateUserView,
    PendingProfessionalsView, ApproveProfessionalView, RejectProfessionalView,
    PendingGroupsView, ApproveGroupView, RejectGroupView,
    ReportListView, DismissReportView, DeleteReportContentView,
    WarnReportedUserView, BanReportedUserView,
    AdminVideoListCreateView, AdminVideoDetailView,
    EmailCampaignView,
)

urlpatterns = [
    path('stats/', AdminStatsView.as_view()),

    path('users/', AdminUserListView.as_view()),
    path('users/export/', AdminUserExportView.as_view()),
    path('users/<uuid:pk>/ban/', AdminBanUserView.as_view()),
    path('users/<uuid:pk>/activate/', AdminActivateUserView.as_view()),

    path('professionals/pending/', PendingProfessionalsView.as_view()),
    path('professionals/<uuid:pk>/approve/', ApproveProfessionalView.as_view()),
    path('professionals/<uuid:pk>/reject/', RejectProfessionalView.as_view()),

    path('groups/pending/', PendingGroupsView.as_view()),
    path('groups/<uuid:pk>/approve/', ApproveGroupView.as_view()),
    path('groups/<uuid:pk>/reject/', RejectGroupView.as_view()),

    path('reports/', ReportListView.as_view()),
    path('reports/<uuid:pk>/dismiss/', DismissReportView.as_view()),
    path('reports/<uuid:pk>/delete-content/', DeleteReportContentView.as_view()),
    path('reports/<uuid:pk>/warn-user/', WarnReportedUserView.as_view()),
    path('reports/<uuid:pk>/ban-user/', BanReportedUserView.as_view()),

    path('videos/', AdminVideoListCreateView.as_view()),
    path('videos/<uuid:pk>/', AdminVideoDetailView.as_view()),

    path('email-campaign/', EmailCampaignView.as_view()),
]
