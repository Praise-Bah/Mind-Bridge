from django.urls import path
from .views import (
    CommunityGroupListView, CommunityGroupDetailView, JoinGroupView,
    PostListCreateView, PostDetailView, CommentListCreateView, ReactionToggleView
)

urlpatterns = [
    path('groups/', CommunityGroupListView.as_view(), name='group_list'),
    path('groups/<slug:slug>/', CommunityGroupDetailView.as_view(), name='group_detail'),
    path('groups/<slug:slug>/join/', JoinGroupView.as_view(), name='join_group'),
    path('groups/<slug:group_slug>/posts/', PostListCreateView.as_view(), name='post_list'),
    path('posts/<uuid:pk>/', PostDetailView.as_view(), name='post_detail'),
    path('posts/<uuid:post_id>/comments/', CommentListCreateView.as_view(), name='comment_list'),
    path('posts/<uuid:post_id>/react/', ReactionToggleView.as_view(), name='react'),
]
