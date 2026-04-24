from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserMood


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'username', 'first_name', 'last_name', 
                    'is_professional', 'is_verified', 'is_active']
    list_filter = ['is_professional', 'is_verified', 'is_active', 'is_staff']
    search_fields = ['email', 'username', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('Profile', {'fields': ('avatar', 'bio', 'date_of_birth', 'phone_number')}),
        ('Preferences', {'fields': ('timezone', 'daily_notification_time', 
                                    'email_notifications_enabled', 
                                    'push_notifications_enabled')}),
        ('Status', {'fields': ('is_professional', 'is_verified', 'is_online', 'last_seen')}),
    )


@admin.register(UserMood)
class UserMoodAdmin(admin.ModelAdmin):
    list_display = ['user', 'mood_score', 'recorded_date', 'created_at']
    list_filter = ['mood_score', 'recorded_date']
    search_fields = ['user__email', 'user__username']
    ordering = ['-recorded_date']
