from django.contrib import admin
from .models import AISession, AIMessage


@admin.register(AISession)
class AISessionAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'title', 'is_active', 'created_at']
    list_filter = ['is_active']
    search_fields = ['user__email', 'title']


@admin.register(AIMessage)
class AIMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'session', 'role', 'created_at']
    list_filter = ['role']
