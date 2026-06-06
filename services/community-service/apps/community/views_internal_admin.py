from django.conf import settings
from django.utils import timezone
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import CommunityGroup, Report, Post, Comment


def _publish(event_type, payload):
    try:
        from mindbridge_common.events import publisher
        publisher.publish(event_type, payload, service_origin='community-service')
    except Exception:
        pass


class InternalTokenPermission(BasePermission):
    def has_permission(self, request, view):
        token = request.META.get('HTTP_X_INTERNAL_TOKEN', '')
        expected = getattr(settings, 'INTERNAL_SERVICE_TOKEN', '')
        return bool(token and expected and token == expected)


# ── Stats ────────────────────────────────────────────────────────

class InternalAdminStatsView(APIView):
    permission_classes = [InternalTokenPermission]

    def get(self, request):
        return Response({
            'unresolved_reports': Report.objects.filter(is_resolved=False).count(),
            'pending_groups': CommunityGroup.objects.filter(
                is_user_created=True, approval_status='pending', is_deleted=False
            ).count(),
        })


# ── Community Group Review ───────────────────────────────────────

class InternalAdminPendingGroupsView(APIView):
    permission_classes = [InternalTokenPermission]

    def get(self, request):
        groups = CommunityGroup.objects.filter(
            is_user_created=True, approval_status='pending', is_deleted=False
        ).select_related('created_by').order_by('created_at')
        data = []
        for g in groups:
            data.append({
                'id': str(g.id),
                'name': g.name,
                'slug': g.slug,
                'description': g.description,
                'group_type': g.group_type,
                'custom_type': g.custom_type,
                'visibility': g.visibility,
                'creation_reason': g.creation_reason,
                'created_by_username': g.created_by.username if g.created_by else None,
                'ai_total_score': g.ai_total_score,
                'ai_review_summary': g.ai_review_summary,
                'ai_review_scores': g.ai_review_scores,
                'approval_status': g.approval_status,
                'rejection_reason': g.rejection_reason,
                'review_step': g.review_step,
                'created_at': g.created_at.isoformat(),
            })
        return Response(data)


class InternalAdminApproveGroupView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        try:
            group = CommunityGroup.objects.get(pk=pk)
        except CommunityGroup.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        group.is_approved = True
        group.approval_status = 'approved'
        group.approved_at = timezone.now()
        group.save(update_fields=['is_approved', 'approval_status', 'approved_at'])
        if group.created_by_id:
            _publish('notification.create', {
                'user_id': str(group.created_by.user_id),
                'notification_type': 'group_approved',
                'title': 'Group Approved!',
                'message': f'Your group "{group.name}" has been approved by an admin and is now live.',
                'data': {'group_id': str(group.id)},
            })
        return Response({'status': 'approved'})


class InternalAdminRejectGroupView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        reason = request.data.get('reason', '').strip()
        try:
            group = CommunityGroup.objects.get(pk=pk)
        except CommunityGroup.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        group.is_approved = False
        group.approval_status = 'rejected'
        group.rejection_reason = reason or 'Did not meet community guidelines.'
        group.save(update_fields=['is_approved', 'approval_status', 'rejection_reason'])
        if group.created_by_id:
            _publish('notification.create', {
                'user_id': str(group.created_by.user_id),
                'notification_type': 'group_rejected',
                'title': 'Group Not Approved',
                'message': f'Your group "{group.name}" was not approved. Reason: {group.rejection_reason}',
                'data': {'group_id': str(group.id)},
            })
        return Response({'status': 'rejected'})


# ── Reports ──────────────────────────────────────────────────────

class InternalAdminReportListView(APIView):
    permission_classes = [InternalTokenPermission]

    def get(self, request):
        include_resolved = request.query_params.get('resolved') == 'true'
        qs = Report.objects.select_related(
            'reporter', 'post__author', 'comment__author'
        ).order_by('-created_at')
        if not include_resolved:
            qs = qs.filter(is_resolved=False)

        data = []
        for r in qs:
            post_content = r.post.content[:200] if r.post else None
            comment_content = r.comment.content[:200] if r.comment else None
            if r.post:
                author = r.post.author
                content_author = author.username if author else None
                content_author_id = str(author.user_id) if author else None
            elif r.comment:
                author = r.comment.author
                content_author = author.username if author else None
                content_author_id = str(author.user_id) if author else None
            else:
                content_author = None
                content_author_id = None
            data.append({
                'id': str(r.id),
                'reporter_name': r.reporter.username if r.reporter else None,
                'reason': r.reason,
                'details': r.details,
                'is_resolved': r.is_resolved,
                'post': str(r.post_id) if r.post_id else None,
                'comment': str(r.comment_id) if r.comment_id else None,
                'post_content': post_content,
                'comment_content': comment_content,
                'content_author': content_author,
                'content_author_id': content_author_id,
                'created_at': r.created_at.isoformat(),
            })
        return Response(data)


class InternalAdminDismissReportView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        Report.objects.filter(pk=pk).update(is_resolved=True)
        return Response({'status': 'dismissed'})


class InternalAdminDeleteReportContentView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        try:
            report = Report.objects.get(pk=pk)
        except Report.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        if report.post:
            report.post.is_deleted = True
            report.post.save(update_fields=['is_deleted'])
        elif report.comment:
            report.comment.is_deleted = True
            report.comment.save(update_fields=['is_deleted'])
        report.is_resolved = True
        report.save(update_fields=['is_resolved'])
        return Response({'status': 'content_deleted'})


class InternalAdminWarnReportedUserView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        try:
            report = Report.objects.select_related('post__author', 'comment__author').get(pk=pk)
        except Report.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        author_user_id = None
        if report.post and report.post.author:
            author_user_id = str(report.post.author.user_id)
        elif report.comment and report.comment.author:
            author_user_id = str(report.comment.author.user_id)
        if author_user_id:
            _publish('notification.create', {
                'user_id': author_user_id,
                'notification_type': 'system',
                'title': 'Content warning',
                'message': 'A moderator has issued a warning regarding your recent content. Please review our community guidelines.',
            })
        report.is_resolved = True
        report.save(update_fields=['is_resolved'])
        return Response({'status': 'warned', 'user_id': author_user_id})


class InternalAdminBanReportedUserView(APIView):
    """
    Returns the user_id so the admin-service can call auth-service to actually ban the user.
    Community-service only marks the report as resolved — it doesn't own user account state.
    """
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        try:
            report = Report.objects.select_related('post__author', 'comment__author').get(pk=pk)
        except Report.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        author_user_id = None
        if report.post and report.post.author:
            author_user_id = str(report.post.author.user_id)
        elif report.comment and report.comment.author:
            author_user_id = str(report.comment.author.user_id)
        report.is_resolved = True
        report.save(update_fields=['is_resolved'])
        return Response({'status': 'report_resolved', 'user_id': author_user_id})
