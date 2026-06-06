import csv
import datetime
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db.models import Q
from django.http import StreamingHttpResponse
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import generics

from .models import ProfessionalApplication, UserMood

User = get_user_model()


def _publish(event_type, payload):
    try:
        from mindbridge_common.events import publisher
        publisher.publish(event_type, payload, service_origin='auth-service')
    except Exception:
        pass


class InternalTokenPermission(BasePermission):
    def has_permission(self, request, view):
        token = request.META.get('HTTP_X_INTERNAL_TOKEN', '')
        expected = getattr(settings, 'INTERNAL_SERVICE_TOKEN', '')
        return bool(token and expected and token == expected)


class _Echo:
    def write(self, value):
        return value


# ── Stats ────────────────────────────────────────────────────────

class InternalAdminStatsView(APIView):
    permission_classes = [InternalTokenPermission]

    def get(self, request):
        today = datetime.date.today()
        return Response({
            'total_users': User.objects.filter(is_active=True).count(),
            'new_users_today': User.objects.filter(date_joined__date=today).count(),
            'total_professionals': User.objects.filter(is_professional=True, is_active=True).count(),
            'pending_professionals': ProfessionalApplication.objects.filter(status='pending').count(),
        })


# ── User Management ──────────────────────────────────────────────

class InternalAdminUserListView(APIView):
    permission_classes = [InternalTokenPermission]

    def get(self, request):
        qs = User.objects.all().order_by('-date_joined')
        search = request.query_params.get('search', '').strip()
        role = request.query_params.get('role', '').strip()
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

        users = list(qs.values(
            'id', 'email', 'username', 'first_name', 'last_name',
            'is_staff', 'is_professional', 'is_verified', 'is_active', 'date_joined',
        ))
        for u in users:
            u['id'] = str(u['id'])
            u['date_joined'] = u['date_joined'].isoformat() if u['date_joined'] else None
            u['role'] = 'admin' if u['is_staff'] else ('professional' if u['is_professional'] else 'user')
            u['full_name'] = f"{u['first_name']} {u['last_name']}".strip() or u['username']
        return Response(users)


class InternalAdminUserExportView(APIView):
    permission_classes = [InternalTokenPermission]

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

        buf = _Echo()
        writer = csv.writer(buf)
        response = StreamingHttpResponse(
            (writer.writerow(row) for row in rows()),
            content_type='text/csv',
        )
        response['Content-Disposition'] = 'attachment; filename="users.csv"'
        return response


class InternalAdminBanUserView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        user.is_active = False
        user.save(update_fields=['is_active'])
        _publish('notification.create', {
            'user_id': str(user.id),
            'notification_type': 'system',
            'title': 'Account suspended',
            'message': 'Your account has been suspended by an administrator.',
        })
        return Response({'status': 'banned'})


class InternalAdminActivateUserView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        user.is_active = True
        user.save(update_fields=['is_active'])
        return Response({'status': 'activated'})


# ── Professional Applications ────────────────────────────────────

class InternalAdminPendingProfessionalsView(APIView):
    permission_classes = [InternalTokenPermission]

    def get(self, request):
        apps = ProfessionalApplication.objects.filter(
            status='pending', is_deleted=False
        ).select_related('user').order_by('created_at')
        data = []
        for a in apps:
            data.append({
                'id': str(a.id),
                'user_email': a.user.email,
                'user_name': a.user.get_full_name() or a.user.username,
                'bio': a.bio,
                'license_number': a.license_number,
                'years_of_experience': a.years_of_experience,
                'specializations': a.specializations,
                'status': a.status,
                'rejection_reason': a.rejection_reason,
                'created_at': a.created_at.isoformat(),
            })
        return Response(data)


class InternalAdminApproveProfessionalView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        try:
            application = ProfessionalApplication.objects.select_related('user').get(pk=pk)
        except ProfessionalApplication.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        application.approve(request.user if hasattr(request, 'user') and request.user else None)
        _publish('professional.application_approved', {
            'user_id': str(application.user.id),
            'email': application.user.email,
            'username': application.user.username,
            'first_name': application.user.first_name,
            'last_name': application.user.last_name,
        })
        _publish('notification.create', {
            'user_id': str(application.user.id),
            'notification_type': 'professional',
            'title': 'Application approved',
            'message': 'Congratulations! Your professional application has been approved.',
        })
        return Response({'status': 'approved', 'user_email': application.user.email, 'user_name': application.user.get_full_name() or application.user.username})


class InternalAdminRejectProfessionalView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request, pk):
        reason = request.data.get('reason', '').strip()
        try:
            application = ProfessionalApplication.objects.select_related('user').get(pk=pk)
        except ProfessionalApplication.DoesNotExist:
            return Response({'error': 'not found'}, status=404)
        application.reject(request.user if hasattr(request, 'user') and request.user else None, reason)
        _publish('notification.create', {
            'user_id': str(application.user.id),
            'notification_type': 'professional',
            'title': 'Application not approved',
            'message': f'Your professional application was not approved. Reason: {reason or "Not specified."}',
        })
        return Response({'status': 'rejected', 'user_email': application.user.email})


# ── Email Campaign ───────────────────────────────────────────────

class InternalAdminEmailCampaignView(APIView):
    permission_classes = [InternalTokenPermission]

    def post(self, request):
        from django.core.mail import send_mail

        subject = request.data.get('subject', '').strip()
        message = request.data.get('message', '').strip()
        segment = request.data.get('segment', 'all')

        if not subject or not message:
            return Response({'error': 'subject and message are required'}, status=400)

        qs = User.objects.filter(is_active=True, email_notifications_enabled=True)
        if segment == 'professionals':
            qs = qs.filter(is_professional=True)
        elif segment.startswith('mood:'):
            try:
                mood_score = int(segment.split(':')[1])
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
