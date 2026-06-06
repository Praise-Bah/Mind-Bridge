from django.urls import path
from .views import (
    CommunityGroupListView, CommunityGroupDetailView, JoinGroupView,
    FeedView, PostListCreateView, PostDetailView, PinPostView,
    CommentListCreateView, ReactionToggleView,
    ReportPostView, ReportCommentView, CreateGroupView,
    JoinGroupByInviteView, GenerateInviteView,
    SavePostView, SaveCommentView, GenerateQuestionsView,
    SubmitAnswersView, GroupReviewStatusView, SavedPostsView,
)

urlpatterns = [
    path('feed/', FeedView.as_view(), name='community_feed'),
    path('groups/', CommunityGroupListView.as_view(), name='group_list'),
    path('groups/create/', CreateGroupView.as_view(), name='create_group'),
    path('groups/<uuid:group_id>/questions/', GenerateQuestionsView.as_view(), name='generate_questions'),
    path('groups/<uuid:group_id>/answers/', SubmitAnswersView.as_view(), name='submit_answers'),
    path('groups/<uuid:group_id>/review-status/', GroupReviewStatusView.as_view(), name='review_status'),
    path('groups/<slug:slug>/', CommunityGroupDetailView.as_view(), name='group_detail'),
    path('groups/<slug:slug>/join/', JoinGroupView.as_view(), name='join_group'),
    path('groups/<slug:slug>/invite/', GenerateInviteView.as_view(), name='generate_invite'),
    path('join/<uuid:invite_code>/', JoinGroupByInviteView.as_view(), name='join_by_invite'),
    path('groups/<slug:group_slug>/posts/', PostListCreateView.as_view(), name='post_list'),
    path('posts/<uuid:pk>/', PostDetailView.as_view(), name='post_detail'),
    path('posts/<uuid:post_id>/pin/', PinPostView.as_view(), name='pin_post'),
    path('posts/<uuid:post_id>/react/', ReactionToggleView.as_view(), name='react'),
    path('posts/<uuid:post_id>/report/', ReportPostView.as_view(), name='report_post'),
    path('posts/<uuid:post_id>/save/', SavePostView.as_view(), name='save_post'),
    path('posts/<uuid:post_id>/comments/', CommentListCreateView.as_view(), name='comment_list'),
    path('comments/<uuid:comment_id>/save/', SaveCommentView.as_view(), name='save_comment'),
    path('comments/<uuid:comment_id>/report/', ReportCommentView.as_view(), name='report_comment'),
    path('saved-posts/', SavedPostsView.as_view(), name='saved_posts'),
]
