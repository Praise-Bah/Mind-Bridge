import requests
from django.conf import settings
from django.db.models import Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Video, VideoCategory, VideoBookmark, WatchHistory, VideoRating
from .serializers import VideoSerializer, VideoCategorySerializer, VideoBookmarkSerializer, WatchHistorySerializer


class VideoCategoryListView(generics.ListAPIView):
    queryset = VideoCategory.objects.filter(is_deleted=False)
    serializer_class = VideoCategorySerializer


class VideoListView(generics.ListAPIView):
    serializer_class = VideoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_featured']

    def get_queryset(self):
        qs = Video.objects.filter(is_deleted=False).select_related('category')
        mood = self.request.query_params.get('mood')
        if mood:
            qs = qs.filter(mood_tags__icontains=mood)
        return qs


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
        bookmark, created = VideoBookmark.objects.get_or_create(
            user_id=str(request.user.user_id), video=video
        )
        if not created:
            bookmark.delete()
            return Response({'status': 'removed'})
        return Response({'status': 'added'}, status=status.HTTP_201_CREATED)


class UserBookmarksView(generics.ListAPIView):
    serializer_class = VideoBookmarkSerializer

    def get_queryset(self):
        return VideoBookmark.objects.filter(
            user_id=str(self.request.user.user_id), is_deleted=False
        )


class WatchHistoryView(generics.ListAPIView):
    serializer_class = WatchHistorySerializer

    def get_queryset(self):
        return WatchHistory.objects.filter(user_id=str(self.request.user.user_id))


class RecordWatchView(APIView):
    def post(self, request, video_id):
        video = Video.objects.get(id=video_id)
        history, _ = WatchHistory.objects.update_or_create(
            user_id=str(request.user.user_id), video=video,
            defaults={
                'watch_duration_seconds': request.data.get('watch_duration_seconds', 0),
                'completed': request.data.get('completed', False),
            },
        )
        return Response({'status': 'recorded'})


class VideoSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        mood = request.query_params.get('mood', '').strip()
        youtube_key = getattr(settings, 'YOUTUBE_API_KEY', '')

        if query and youtube_key:
            search_term = f'{mood} {query} mental health wellbeing' if mood else f'{query} mental health'
            try:
                yt_resp = requests.get(
                    'https://www.googleapis.com/youtube/v3/search',
                    params={
                        'part': 'snippet', 'q': search_term, 'type': 'video',
                        'maxResults': 12, 'relevanceLanguage': 'en', 'safeSearch': 'strict',
                        'key': youtube_key,
                    },
                    timeout=5,
                )
                if yt_resp.ok:
                    for item in yt_resp.json().get('items', []):
                        yt_id = item['id']['videoId']
                        snippet = item['snippet']
                        Video.objects.get_or_create(
                            youtube_id=yt_id,
                            defaults={
                                'title': snippet.get('title', '')[:255],
                                'description': snippet.get('description', ''),
                                'source_type': 'youtube',
                                'mood_tags': [mood] if mood else [],
                                'thumbnail': snippet.get('thumbnails', {}).get('high', {}).get('url', ''),
                            },
                        )
            except Exception:
                pass

        qs = Video.objects.filter(is_deleted=False).select_related('category')
        if query:
            qs = qs.filter(Q(title__icontains=query) | Q(description__icontains=query))
        if mood:
            qs = qs.filter(mood_tags__icontains=mood)

        return Response(VideoSerializer(qs[:20], many=True, context={'request': request}).data)


class VideoRateView(APIView):
    def post(self, request, video_id):
        video = Video.objects.get(id=video_id)
        is_helpful = request.data.get('is_helpful')
        if is_helpful is None:
            return Response({'error': 'is_helpful required'}, status=status.HTTP_400_BAD_REQUEST)

        rating, created = VideoRating.objects.get_or_create(
            user_id=str(request.user.user_id), video=video,
            defaults={'is_helpful': is_helpful},
        )
        if not created:
            if rating.is_helpful == is_helpful:
                rating.delete()
                return Response({'status': 'removed'})
            rating.is_helpful = is_helpful
            rating.save(update_fields=['is_helpful'])

        return Response({
            'status': 'rated', 'is_helpful': is_helpful,
            'helpful_count': video.ratings.filter(is_helpful=True).count(),
            'not_helpful_count': video.ratings.filter(is_helpful=False).count(),
        })
