import csv
import datetime
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Q
from django.http import StreamingHttpResponse
from rest_framework import generics, status
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.users.models import ProfessionalApplication
from apps.community.models import Report, Post, Comment, CommunityGroup
from apps.videos.models import Video
from apps.videos.serializers import VideoSerializer
from apps.notifications.publisher import publish_notification
from .serializers import AdminUserSerializer, PendingProfessionalSerializer, ReportDetailSerializer, PendingGroupSerializer

User = get_user_model()


# ────────────────────────────────────────────────────────────────
# Stats
# ────────────────────────────────────────────────────────────────

class AdminStatsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        today = datetime.date.today()
        try:
            from apps.chat.models import Message
            total_messages = Message.objects.count()
        except Exception:
            total_messages = 0

        try:
            from apps.professionals.models import Booking
            active_sessions = Booking.objects.filter(
                scheduled_date=today, status='confirmed'
            ).count()
        except Exception:
            active_sessions = 0

        return Response({
            'total_users': User.objects.filter(is_active=True).count(),
            'new_users_today': User.objects.filter(
                date_joined__date=today
            ).count(),
            'total_professionals': User.objects.filter(is_professional=True).count(),
            'pending_professionals': ProfessionalApplication.objects.filter(
                status='pending'
            ).count(),
            'active_sessions_today': active_sessions,
            'total_messages': total_messages,
            'unresolved_reports': Report.objects.filter(is_resolved=False).count(),
        })


# ────────────────────────────────────────────────────────────────
# User Management
# ────────────────────────────────────────────────────────────────

class AdminUserListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AdminUserSerializer

    def get_queryset(self):
        qs = User.objects.all().order_by('-date_joined')
        search = self.request.query_params.get('search', '').strip()
        role = self.request.query_params.get('role', '').strip()

        if search:
            qs = qs.filter(
                Q(email__icontains=search) |
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(username__icontains=search)
            )
        if role == 'admin':
            qs = qs.filter(is_staff=True)
        elif role == 'professional':
            qs = qs.filter(is_professional=True, is_staff=False)
        elif role == 'user':
            qs = qs.filter(is_staff=False, is_professional=False)

        return qs


class AdminBanUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        user = User.objects.get(pk=pk)
        user.is_active = False
        user.save(update_fields=['is_active'])
        publish_notification(
            user_id=user.id,
            notification_type='system',
            title='Account suspended',
            message='Your account has been suspended by an administrator.',
        )
        return Response({'status': 'banned'})


class AdminActivateUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        user = User.objects.get(pk=pk)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'status': 'activated'})


class AdminExportUsersCSVView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        def rows():
            yield ['id', 'email', 'username', 'first_name', 'last_name',
                   'is_staff', 'is_professional', 'is_active', 'date_joined']
            for u in User.objects.all().iterator():
                yield [
                    str(u.id), u.email, u.username, u.first_name, u.last_name,
                    u.is_staff, u.is_professional, u.is_active,
                    u.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
                ]

        pseudo_buffer = _Echo()
        writer = csv.writer(pseudo_buffer)
        response = StreamingHttpResponse(
            (writer.writerow(row) for row in rows()),
            content_type='text/csv',
        )
        response['Content-Disposition'] = 'attachment; filename="users.csv"'
        return response


class _Echo:
    def write(self, value):
        return value


# ────────────────────────────────────────────────────────────────
# Professional Approvals
# ────────────────────────────────────────────────────────────────

class PendingProfessionalsView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = PendingProfessionalSerializer

    def get_queryset(self):
        return ProfessionalApplication.objects.filter(
            status='pending', is_deleted=False
        ).select_related('user').order_by('created_at')


class ApproveProfessionalView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        application = ProfessionalApplication.objects.get(pk=pk)
        application.approve(request.user)
        publish_notification(
            user_id=application.user_id,
            notification_type='professional',
            title='Application approved',
            message='Congratulations! Your professional application has been approved.',
        )
        send_mail(
            subject='MindBridge — Professional Application Approved',
            message=(
                f'Hello {application.user.get_full_name() or application.user.username},\n\n'
                'Your application to become a professional on MindBridge has been approved. '
                'You can now log in and start accepting bookings.\n\nThe MindBridge Team'
            ),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindbridge.com'),
            recipient_list=[application.user.email],
            fail_silently=True,
        )
        return Response({'status': 'approved'})


class RejectProfessionalView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        reason = request.data.get('reason', '').strip()
        application = ProfessionalApplication.objects.get(pk=pk)
        application.reject(request.user, reason)
        publish_notification(
            user_id=application.user_id,
            notification_type='professional',
            title='Application not approved',
            message=f'Your professional application was not approved. Reason: {reason or "Not specified."}',
        )
        send_mail(
            subject='MindBridge — Professional Application Update',
            message=(
                f'Hello {application.user.get_full_name() or application.user.username},\n\n'
                f'Unfortunately your application was not approved at this time.\n'
                f'Reason: {reason or "Not specified."}\n\nThe MindBridge Team'
            ),
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindbridge.com'),
            recipient_list=[application.user.email],
            fail_silently=True,
        )
        return Response({'status': 'rejected'})


# ────────────────────────────────────────────────────────────────
# Content Moderation
# ────────────────────────────────────────────────────────────────

class ReportListView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = ReportDetailSerializer

    def get_queryset(self):
        include_resolved = self.request.query_params.get('resolved') == 'true'
        qs = Report.objects.select_related(
            'reporter', 'post__author', 'comment__author'
        ).order_by('-created_at')
        if not include_resolved:
            qs = qs.filter(is_resolved=False)
        return qs


class DismissReportView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        Report.objects.filter(pk=pk).update(is_resolved=True)
        return Response({'status': 'dismissed'})


class DeleteReportContentView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        report = Report.objects.get(pk=pk)
        if report.post:
            report.post.is_deleted = True
            report.post.save(update_fields=['is_deleted'])
        elif report.comment:
            report.comment.is_deleted = True
            report.comment.save(update_fields=['is_deleted'])
        report.is_resolved = True
        report.save(update_fields=['is_resolved'])
        return Response({'status': 'content_deleted'})


class WarnReportedUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        report = Report.objects.select_related('post__author', 'comment__author').get(pk=pk)
        author = None
        if report.post:
            author = report.post.author
        elif report.comment:
            author = report.comment.author
        if author:
            publish_notification(
                user_id=author.id,
                notification_type='system',
                title='Content warning',
                message='A moderator has issued a warning regarding your recent content. Please review our community guidelines.',
            )
        report.is_resolved = True
        report.save(update_fields=['is_resolved'])
        return Response({'status': 'warned'})


class BanReportedUserView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        report = Report.objects.select_related('post__author', 'comment__author').get(pk=pk)
        author = None
        if report.post:
            author = report.post.author
        elif report.comment:
            author = report.comment.author
        if author:
            author.is_active = False
            author.save(update_fields=['is_active'])
            publish_notification(
                user_id=author.id,
                notification_type='system',
                title='Account suspended',
                message='Your account has been suspended due to a violation of community guidelines.',
            )
        report.is_resolved = True
        report.save(update_fields=['is_resolved'])
        return Response({'status': 'banned'})


# ────────────────────────────────────────────────────────────────
# Community Group Review
# ────────────────────────────────────────────────────────────────

class PendingGroupsView(generics.ListAPIView):
    """Groups awaiting admin review (AI score 50-79)."""
    permission_classes = [IsAdminUser]
    serializer_class = PendingGroupSerializer

    def get_queryset(self):
        return CommunityGroup.objects.filter(
            is_user_created=True,
            approval_status='pending',
            is_deleted=False,
        ).select_related('created_by').order_by('created_at')


class ApproveGroupView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        from django.utils import timezone
        group = CommunityGroup.objects.get(pk=pk)
        group.is_approved = True
        group.approval_status = 'approved'
        group.approved_by = request.user
        group.approved_at = timezone.now()
        group.save(update_fields=['is_approved', 'approval_status', 'approved_by', 'approved_at'])
        if group.created_by_id:
            publish_notification(
                user_id=group.created_by_id,
                notification_type='group_approved',
                title='Group Approved!',
                message=f'Your group "{group.name}" has been approved by an admin and is now live.',
                data={'group_id': str(group.id)},
            )
        return Response({'status': 'approved'})


class RejectGroupView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        reason = request.data.get('reason', '').strip()
        group = CommunityGroup.objects.get(pk=pk)
        group.is_approved = False
        group.approval_status = 'rejected'
        group.rejection_reason = reason or 'Did not meet community guidelines.'
        group.save(update_fields=['is_approved', 'approval_status', 'rejection_reason'])
        if group.created_by_id:
            publish_notification(
                user_id=group.created_by_id,
                notification_type='group_rejected',
                title='Group Not Approved',
                message=f'Your group "{group.name}" was not approved. Reason: {group.rejection_reason}',
                data={'group_id': str(group.id)},
            )
        return Response({'status': 'rejected'})


# ────────────────────────────────────────────────────────────────
# Video Management
# ────────────────────────────────────────────────────────────────

class AdminVideoCreateView(generics.CreateAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = VideoSerializer
    queryset = Video.objects.all()


class AdminVideoUpdateDeleteView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = VideoSerializer
    queryset = Video.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


# ────────────────────────────────────────────────────────────────
# Email Campaigns
# ────────────────────────────────────────────────────────────────

class EmailCampaignView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        subject = request.data.get('subject', '').strip()
        message = request.data.get('message', '').strip()
        segment = request.data.get('segment', 'all')

        if not subject or not message:
            return Response(
                {'error': 'subject and message are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        qs = User.objects.filter(is_active=True, email_notifications_enabled=True)

        if segment == 'professionals':
            qs = qs.filter(is_professional=True)
        elif segment.startswith('mood:'):
            try:
                mood_score = int(segment.split(':')[1])
                from apps.users.models import UserMood
                user_ids = UserMood.objects.filter(
                    mood_score=mood_score
                ).values_list('user_id', flat=True).distinct()
                qs = qs.filter(id__in=user_ids)
            except (ValueError, IndexError):
                pass

        emails = list(qs.values_list('email', flat=True))
        if not emails:
            return Response({'status': 'no_recipients', 'sent_to': 0})

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mindbridge.com'),
            recipient_list=emails,
            fail_silently=True,
        )
        return Response({'status': 'sent', 'sent_to': len(emails)})
