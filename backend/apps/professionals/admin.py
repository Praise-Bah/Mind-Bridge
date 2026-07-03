from django.contrib import admin
from .models import Specialization, ProfessionalProfile, Availability, Booking, Review


@admin.register(Specialization)
class SpecializationAdmin(admin.ModelAdmin):
    list_display = ['name', 'slug']
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ProfessionalProfile)
class ProfessionalProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'title', 'status', 'session_rate', 'years_of_experience']
    list_filter = ['status', 'specializations']
    search_fields = ['user__email', 'user__first_name', 'user__last_name']
    readonly_fields = ['cv']
    fieldsets = (
        (None, {'fields': ('user', 'title', 'bio', 'credentials', 'years_of_experience',
                           'specializations', 'languages', 'session_rate', 'gender', 'status',
                           'rejection_reason', 'approved_at', 'payout_requested')}),
        ('Private Files', {
            'fields': ('cv', 'credential_documents', 'intro_video'),
            'description': 'CV is private — only visible here and to the professional.',
        }),
    )
    actions = ['approve_professionals', 'reject_professionals']

    def approve_professionals(self, request, queryset):
        queryset.update(status='approved')
    approve_professionals.short_description = "Approve selected professionals"

    def reject_professionals(self, request, queryset):
        queryset.update(status='rejected')
    reject_professionals.short_description = "Reject selected professionals"


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'professional', 'scheduled_date', 'status']
    list_filter = ['status', 'scheduled_date']
    search_fields = ['user__email', 'professional__user__email']


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ['id', 'booking', 'rating', 'created_at']
    list_filter = ['rating']
