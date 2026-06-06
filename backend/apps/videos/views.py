import requests
from django.conf import settings
from django.core.cache import cache
from django.db.models import Count, Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import Video, VideoCategory, VideoBookmark, WatchHistory, VideoRating
from .serializers import VideoSerializer, VideoCategorySerializer, VideoBookmarkSerializer, WatchHistorySerializer

_VIDEO_CACHE_TTL = 300  # 5 minutes


class VideoCategoryListView(generics.ListAPIView):
    serializer_class = VideoCategorySerializer

    def get_queryset(self):
        return VideoCategory.objects.filter(is_deleted=False)

    def list(self, request, *args, **kwargs):
        cached = cache.get('videos:categories')
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set('videos:categories', response.data, timeout=3600)
        return response


def _annotated_video_qs():
    return (
        Video.objects.filter(is_deleted=False)
        .select_related('category')
        .annotate(
            helpful_count_ann=Count('ratings', filter=Q(ratings__is_helpful=True), distinct=True),
            not_helpful_count_ann=Count('ratings', filter=Q(ratings__is_helpful=False), distinct=True),
        )
    )


def _enrich_context(context, request, items):
    """Bulk-fetch per-user video flags in 3 queries instead of 3N."""
    if not (request and request.user.is_authenticated):
        return context
    video_ids = [v.id for v in items]
    context['bookmarked_ids'] = set(
        VideoBookmark.objects.filter(user=request.user, video_id__in=video_ids)
        .values_list('video_id', flat=True)
    )
    context['completed_ids'] = set(
        WatchHistory.objects.filter(user=request.user, video_id__in=video_ids, completed=True)
        .values_list('video_id', flat=True)
    )
    context['user_ratings'] = dict(
        VideoRating.objects.filter(user=request.user, video_id__in=video_ids)
        .values_list('video_id', 'is_helpful')
    )
    return context


class VideoListView(generics.ListAPIView):
    serializer_class = VideoSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['category', 'is_featured']

    def get_queryset(self):
        qs = _annotated_video_qs()
        mood = self.request.query_params.get('mood')
        if mood:
            qs = qs.filter(mood_tags__icontains=mood)
        return qs

    def list(self, request, *args, **kwargs):
        # Cache anonymous list pages; skip cache for authenticated (per-user flags differ)
        if not request.user.is_authenticated:
            page = request.query_params.get('page', '1')
            feat = request.query_params.get('is_featured', '')
            cat = request.query_params.get('category', '')
            mood = request.query_params.get('mood', '')
            cache_key = f'videos:list:{feat}:{cat}:{mood}:{page}'
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)
            response = super().list(request, *args, **kwargs)
            cache.set(cache_key, response.data, timeout=_VIDEO_CACHE_TTL)
            return response

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        items = page if page is not None else list(queryset)
        context = _enrich_context(self.get_serializer_context(), request, items)
        serializer = VideoSerializer(items, many=True, context=context)
        if page is not None:
            return self.get_paginated_response(serializer.data)
        return Response(serializer.data)


class VideoDetailView(generics.RetrieveAPIView):
    serializer_class = VideoSerializer

    def get_queryset(self):
        return _annotated_video_qs()

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count += 1
        instance.save(update_fields=['view_count'])
        context = _enrich_context(self.get_serializer_context(), request, [instance])
        serializer = VideoSerializer(instance, context=context)
        return Response(serializer.data)


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


class VideoSearchView(APIView):
    def get(self, request):
        query = request.query_params.get('q', '').strip()
        mood = request.query_params.get('mood', '').strip()
        youtube_key = getattr(settings, 'YOUTUBE_API_KEY', '')

        if query and youtube_key:
            search_term = f"{query} mental health" if mood not in query else query
            if mood:
                search_term = f"{mood} {query} mental health wellbeing"
            try:
                yt_resp = requests.get(
                    'https://www.googleapis.com/youtube/v3/search',
                    params={
                        'part': 'snippet',
                        'q': search_term,
                        'type': 'video',
                        'maxResults': 12,
                        'relevanceLanguage': 'en',
                        'safeSearch': 'strict',
                        'key': youtube_key,
                    },
                    timeout=5,
                )
                if yt_resp.ok:
                    items = yt_resp.json().get('items', [])
                    for item in items:
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
                            }
                        )
            except Exception:
                pass

        qs = Video.objects.filter(is_deleted=False).select_related('category')
        if query:
            qs = qs.filter(Q(title__icontains=query) | Q(description__icontains=query) | Q(mood_tags__icontains=query))
        if mood:
            qs = qs.filter(mood_tags__icontains=mood)

        serializer = VideoSerializer(qs[:20], many=True, context={'request': request})
        return Response(serializer.data)


class VideoRateView(APIView):
    def post(self, request, video_id):
        video = Video.objects.get(id=video_id)
        is_helpful = request.data.get('is_helpful')
        if is_helpful is None:
            return Response({'error': 'is_helpful required'}, status=status.HTTP_400_BAD_REQUEST)

        rating, created = VideoRating.objects.get_or_create(
            user=request.user, video=video,
            defaults={'is_helpful': is_helpful}
        )
        if not created:
            if rating.is_helpful == is_helpful:
                rating.delete()
                return Response({'status': 'removed'})
            rating.is_helpful = is_helpful
            rating.save(update_fields=['is_helpful'])

        return Response({
            'status': 'rated',
            'is_helpful': is_helpful,
            'helpful_count': video.ratings.filter(is_helpful=True).count(),
            'not_helpful_count': video.ratings.filter(is_helpful=False).count(),
        })
