from django.db import models
from mindbridge_common.models import BaseModel


class VideoCategory(BaseModel):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    mood_tags = models.JSONField(default=list)

    class Meta:
        db_table = 'video_categories'
        verbose_name_plural = 'Video Categories'


class Video(BaseModel):
    SOURCE_TYPES = [('youtube', 'YouTube'), ('local', 'Local Upload')]

    title = models.CharField(max_length=255)
    description = models.TextField()
    source_type = models.CharField(max_length=10, choices=SOURCE_TYPES)
    youtube_id = models.CharField(max_length=20, blank=True)
    video_file = models.FileField(upload_to='videos/', blank=True, null=True)
    thumbnail = models.URLField(blank=True, default='')
    duration_seconds = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(VideoCategory, on_delete=models.SET_NULL, null=True, related_name='videos')
    mood_tags = models.JSONField(default=list)
    is_featured = models.BooleanField(default=False)
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = 'videos'
        ordering = ['-created_at']


class VideoBookmark(BaseModel):
    user_id = models.UUIDField(db_index=True)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='bookmarks')

    class Meta:
        db_table = 'video_bookmarks'
        unique_together = ['user_id', 'video']


class WatchHistory(BaseModel):
    user_id = models.UUIDField(db_index=True)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='watch_records')
    watched_at = models.DateTimeField(auto_now=True)
    watch_duration_seconds = models.PositiveIntegerField(default=0)
    completed = models.BooleanField(default=False)

    class Meta:
        db_table = 'watch_history'
        ordering = ['-watched_at']


class VideoRating(BaseModel):
    user_id = models.UUIDField(db_index=True)
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='ratings')
    is_helpful = models.BooleanField()

    class Meta:
        db_table = 'video_ratings'
        unique_together = ['user_id', 'video']
