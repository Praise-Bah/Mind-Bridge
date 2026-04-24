from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Video, VideoCategory, VideoBookmark, WatchHistory
from .serializers import VideoSerializer, VideoCategorySerializer, VideoBookmarkSerializer, WatchHistorySerializer


class VideoCategoryListView(generics.ListAPIView):
    queryset = VideoCategory.objects.filter(is_deleted=False)
    serializer_class = VideoCategorySerializer


class VideoListView(generics.ListAPIView):
    serializer_class = VideoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'mood_tags', 'is_featured']

    def get_queryset(self):
        return Video.objects.filter(is_deleted=False).select_related('category')


class VideoDetailView(generics.RetrieveAPIView):
    serializer_class = VideoSerializer
    queryset = Video.objects.filter(is_deleted=False)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        return super().retrieve(request, *args, **kwargs)


class VideoBookmarkToggleView(APIView):
    def post(self, request, video_id):
        video = Video.objects.get(id=video_id)
        bookmark, created = VideoBookmark.objects.get_or_create(user=request.user, video=video)
        if not created:
            bookmark.delete()
            return Response({'status': 'removed'})
        return Response({'status': 'added'}, status=status.HTTP_201_CREATED)


class UserBookmarksView(generics.ListAPIView):
    serializer_class = VideoBookmarkSerializer

    def get_queryset(self):
        return VideoBookmark.objects.filter(user=self.request.user, is_deleted=False)


class WatchHistoryView(generics.ListAPIView):
    serializer_class = WatchHistorySerializer

    def get_queryset(self):
        return WatchHistory.objects.filter(user=self.request.user)


class RecordWatchView(APIView):
    def post(self, request, video_id):
        video = Video.objects.get(id=video_id)
        watch_duration = request.data.get('watch_duration_seconds', 0)
        completed = request.data.get('completed', False)
        
        history, _ = WatchHistory.objects.update_or_create(
            user=request.user, video=video,
            defaults={'watch_duration_seconds': watch_duration, 'completed': completed}
        )
        return Response({'status': 'recorded'})
