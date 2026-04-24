from django.urls import path
from .views import (
    VideoCategoryListView, VideoListView, VideoDetailView,
    VideoBookmarkToggleView, UserBookmarksView, WatchHistoryView, RecordWatchView
)

urlpatterns = [
    path('categories/', VideoCategoryListView.as_view(), name='video_categories'),
    path('', VideoListView.as_view(), name='video_list'),
    path('<uuid:pk>/', VideoDetailView.as_view(), name='video_detail'),
    path('<uuid:video_id>/bookmark/', VideoBookmarkToggleView.as_view(), name='bookmark_toggle'),
    path('<uuid:video_id>/watch/', RecordWatchView.as_view(), name='record_watch'),
    path('bookmarks/', UserBookmarksView.as_view(), name='user_bookmarks'),
    path('history/', WatchHistoryView.as_view(), name='watch_history'),
]
