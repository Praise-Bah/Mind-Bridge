from django.contrib import admin
from .models import CommunityGroup, Post, Comment, Reaction
from apps.notifications.publisher import publish_notification


@admin.register(CommunityGroup)
class CommunityGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'group_type', 'approval_status', 'ai_total_score', 'is_user_created', 'created_by', 'created_at']
    list_filter = ['approval_status', 'group_type', 'is_user_created', 'is_active', 'visibility']
    search_fields = ['name', 'description', 'created_by__email']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['ai_questions', 'ai_answers', 'ai_review_scores', 'ai_total_score', 'ai_review_summary', 'review_step', 'created_at', 'updated_at']
    actions = ['approve_groups', 'reject_groups']

    def approve_groups(self, request, queryset):
        from django.utils import timezone
        updated = 0
        for group in queryset.filter(is_user_created=True):
            group.is_approved = True
            group.approval_status = 'approved'
            group.approved_by = request.user
            group.approved_at = timezone.now()
            group.save()
            if group.created_by_id:
                publish_notification(
                    user_id=group.created_by_id,
                    notification_type='group_approved',
                    title='Group Approved!',
                    message=f'Your group "{group.name}" has been approved and is now live.',
                    data={'group_id': str(group.id)},
                )
            updated += 1
        self.message_user(request, f'{updated} group(s) approved.')
    approve_groups.short_description = 'Approve selected groups'

    def reject_groups(self, request, queryset):
        updated = 0
        for group in queryset.filter(is_user_created=True):
            group.is_approved = False
            group.approval_status = 'rejected'
            group.rejection_reason = 'Rejected by admin.'
            group.save()
            if group.created_by_id:
                publish_notification(
                    user_id=group.created_by_id,
                    notification_type='group_rejected',
                    title='Group Not Approved',
                    message=f'Your group "{group.name}" was not approved by an admin.',
                    data={'group_id': str(group.id)},
                )
            updated += 1
        self.message_user(request, f'{updated} group(s) rejected.')
    reject_groups.short_description = 'Reject selected groups'


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
