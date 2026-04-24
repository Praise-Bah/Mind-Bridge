from rest_framework import serializers
from .models import VideoCategory, Video, VideoBookmark, WatchHistory


class VideoCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoCategory
        fields = ['id', 'name', 'slug', 'mood_tags']


class VideoSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_bookmarked = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = ['id', 'title', 'description', 'source_type', 'youtube_id',
                  'video_file', 'thumbnail', 'duration_seconds', 'category',
                  'category_name', 'mood_tags', 'is_featured', 'view_count',
                  'is_bookmarked', 'created_at']

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return VideoBookmark.objects.filter(user=request.user, video=obj).exists()
        return False


class VideoBookmarkSerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)

    class Meta:
        model = VideoBookmark
        fields = ['id', 'video', 'created_at']


class WatchHistorySerializer(serializers.ModelSerializer):
    video = VideoSerializer(read_only=True)

    class Meta:
        model = WatchHistory
        fields = ['id', 'video', 'watched_at', 'watch_duration_seconds', 'completed']
