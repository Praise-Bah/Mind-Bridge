from django.contrib import admin
from .models import CommunityGroup, GroupMembership, Post, Comment, Reaction


@admin.register(CommunityGroup)
class CommunityGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'group_type', 'is_active', 'created_at']
    list_filter = ['group_type', 'is_active']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ['id', 'group', 'author', 'is_anonymous', 'is_pinned', 'is_reported', 'created_at']
    list_filter = ['is_anonymous', 'is_pinned', 'is_reported', 'group']
    search_fields = ['content', 'author__email']


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'author', 'is_anonymous', 'created_at']
    list_filter = ['is_anonymous']
    search_fields = ['content']


@admin.register(Reaction)
class ReactionAdmin(admin.ModelAdmin):
    list_display = ['id', 'post', 'user', 'reaction_type', 'created_at']
    list_filter = ['reaction_type']
