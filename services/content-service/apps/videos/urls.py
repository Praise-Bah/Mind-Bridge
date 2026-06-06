from django.urls import path
from .views import (
    VideoCategoryListView, VideoListView, VideoDetailView,
    VideoBookmarkToggleView, UserBookmarksView, WatchHistoryView,
    RecordWatchView, VideoSearchView, VideoRateView,
)

urlpatterns = [
    path('categories/', VideoCategoryListView.as_view(), name='video_categories'),
    path('search/', VideoSearchView.as_view(), name='video_search'),
    path('bookmarks/', UserBookmarksView.as_view(), name='user_bookmarks'),
    path('history/', WatchHistoryView.as_view(), name='watch_history'),
    path('', VideoListView.as_view(), name='video_list'),
    path('<uuid:pk>/', VideoDetailView.as_view(), name='video_detail'),
    path('<uuid:video_id>/bookmark/', VideoBookmarkToggleView.as_view(), name='bookmark_toggle'),
    path('<uuid:video_id>/watch/', RecordWatchView.as_view(), name='record_watch'),
    path('<uuid:video_id>/rate/', VideoRateView.as_view(), name='video_rate'),
]
