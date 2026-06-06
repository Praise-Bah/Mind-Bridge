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
        fields = ['id', 'title', 'description', 'source_type', 'youtube_id',
                  'video_file', 'thumbnail', 'duration_seconds', 'category',
                  'category_name', 'mood_tags', 'is_featured', 'view_count',
                  'is_bookmarked', 'is_completed', 'user_rating',
                  'helpful_count', 'not_helpful_count', 'created_at']

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        bookmarked_ids = self.context.get('bookmarked_ids')
        if bookmarked_ids is not None:
            return obj.id in bookmarked_ids
        return VideoBookmark.objects.filter(user=request.user, video=obj).exists()

    def get_is_completed(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return False
        completed_ids = self.context.get('completed_ids')
        if completed_ids is not None:
            return obj.id in completed_ids
        return WatchHistory.objects.filter(user=request.user, video=obj, completed=True).exists()

    def get_user_rating(self, obj):
        request = self.context.get('request')
        if not (request and request.user.is_authenticated):
            return None
        user_ratings = self.context.get('user_ratings')
        if user_ratings is not None:
            val = user_ratings.get(obj.id)
            return ('helpful' if val else 'not_helpful') if val is not None else None
        rating = VideoRating.objects.filter(user=request.user, video=obj).first()
        return ('helpful' if rating.is_helpful else 'not_helpful') if rating else None

    def get_helpful_count(self, obj):
        ann = getattr(obj, 'helpful_count_ann', None)
        return ann if ann is not None else obj.ratings.filter(is_helpful=True).count()

    def get_not_helpful_count(self, obj):
        ann = getattr(obj, 'not_helpful_count_ann', None)
        return ann if ann is not None else obj.ratings.filter(is_helpful=False).count()


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


class VideoRatingSerializer(serializers.ModelSerializer):
    class Meta:
        model = VideoRating
        fields = ['id', 'is_helpful', 'created_at']
