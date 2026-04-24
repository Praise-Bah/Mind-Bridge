from django.contrib import admin
from .models import VideoCategory, Video, VideoBookmark, WatchHistory


@admin.register(VideoCategory)
class VideoCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    list_display = ['title', 'source_type', 'category', 'is_featured', 'view_count']
    list_filter = ['source_type', 'category', 'is_featured']
    search_fields = ['title', 'description']
