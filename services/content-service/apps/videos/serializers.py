from rest_framework import serializers
from .models import VideoCategory, Video, VideoBookmark, WatchHistory, VideoRating


class VideoCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoCategory
        fields = ['id', 'name', 'slug', 'mood_tags']


class VideoSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    is_bookmarked = serializers.SerializerMethodField()
    is_completed = serializers.SerializerMethodField()
    user_rating = serializers.SerializerMethodField()
    helpful_count = serializers.SerializerMethodField()
    not_helpful_count = serializers.SerializerMethodField()

    class Meta:
        model = Video
        fields = [
            'id', 'title', 'description', 'source_type', 'youtube_id',
            'video_file', 'thumbnail', 'duration_seconds', 'category',
            'category_name', 'mood_tags', 'is_featured', 'view_count',
            'is_bookmarked', 'is_completed', 'user_rating',
            'helpful_count', 'not_helpful_count', 'created_at',
        ]

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            return VideoBookmark.objects.filter(user_id=str(request.user.user_id), video=obj).exists()
        return False

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            return WatchHistory.objects.filter(user_id=str(request.user.user_id), video=obj, completed=True).exists()
        return False

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if request and hasattr(request.user, 'user_id'):
            rating = VideoRating.objects.filter(user_id=str(request.user.user_id), video=obj).first()
            if rating:
                return 'helpful' if rating.is_helpful else 'not_helpful'
        return None

    def get_helpful_count(self, obj):
        return obj.ratings.filter(is_helpful=True).count()

    def get_not_helpful_count(self, obj):
        return obj.ratings.filter(is_helpful=False).count()


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
