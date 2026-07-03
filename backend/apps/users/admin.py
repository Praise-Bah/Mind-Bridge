from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserMood, ProfessionalApplication


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


@admin.register(ProfessionalApplication)
class ProfessionalApplicationAdmin(admin.ModelAdmin):
    list_display = ['user', 'status', 'license_number', 'years_of_experience', 'created_at']
    list_filter = ['status']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'license_number']
    readonly_fields = ['user', 'created_at', 'reviewed_by', 'reviewed_at']
    fieldsets = (
        (None, {'fields': ('user', 'status', 'license_number', 'bio', 'specializations',
                           'years_of_experience', 'rejection_reason')}),
        ('Private Files', {
            'fields': ('credentials_document', 'cv'),
            'description': 'CV and credentials are private — visible only here and to the applicant.',
        }),
        ('Review Info', {'fields': ('reviewed_by', 'reviewed_at', 'created_at')}),
    )


@admin.register(UserMood)
class UserMoodAdmin(admin.ModelAdmin):
    list_display = ['user', 'mood_score', 'recorded_date', 'created_at']
    list_filter = ['mood_score', 'recorded_date']
    search_fields = ['user__email', 'user__username']
    ordering = ['-recorded_date']
