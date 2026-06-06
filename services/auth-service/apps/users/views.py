from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

from .serializers import (
    UserRegistrationSerializer, UserSerializer, UserProfileUpdateSerializer,
    UserMoodSerializer, PasswordChangeSerializer, VerifyEmailSerializer,
    ResendOTPSerializer, ForgotPasswordSerializer, VerifyResetCodeSerializer,
    ResetPasswordSerializer, GoogleAuthSerializer, ProfessionalApplicationSerializer,
    PrivacySettingsSerializer, AppearanceSettingsSerializer, NotificationSettingsSerializer,
    UserSessionSerializer, DeactivateAccountSerializer, DeleteAccountSerializer,
    UserGoalSerializer,
)
from .models import UserMood, ProfessionalApplication, UserSession, UserGoal
from .services import (
    create_verification_code, create_password_reset_token,
    send_verification_email, send_password_reset_email,
)

User = get_user_model()


def _publish(event_type, payload):
    try:
        from mindbridge_common.events import publisher
        publisher.publish(event_type, payload, service_origin='auth-service')
    except Exception:
        pass


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [permissions.AllowAny]
    serializer_class = UserRegistrationSerializer

    def perform_create(self, serializer):
        user = serializer.save()
        verification = create_verification_code(user)
        send_verification_email(user, verification.code)
        return user


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        verification = serializer.validated_data['verification']

        verification.is_used = True
        verification.save()
        user.is_verified = True
        user.save()

        _publish('user.registered', {
            'user_id': str(user.id),
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'avatar_url': user.avatar.url if user.avatar else '',
            'is_professional': user.is_professional,
            'email_notifications_enabled': user.email_notifications_enabled,
        })

        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Email verified successfully.',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })


class ResendOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = User.objects.get(email=serializer.validated_data['email'])
        verification = create_verification_code(user)
        send_verification_email(user, verification.code)
        return Response({'message': 'Verification code sent.'})


class ForgotPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = User.objects.get(email=serializer.validated_data['email'])
            reset_token = create_password_reset_token(user)
            send_password_reset_email(user, reset_token.code)
        except User.DoesNotExist:
            pass
        return Response({'message': 'If an account exists with this email, a reset code has been sent.'})


class VerifyResetCodeView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VerifyResetCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'message': 'Reset code is valid.', 'valid': True})


class ResetPasswordView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        reset_token = serializer.validated_data['reset_token']
        reset_token.is_used = True
        reset_token.save()
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({'message': 'Password reset successfully.'})


class GoogleAuthView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = GoogleAuthSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        token = serializer.validated_data['token']
        role = serializer.validated_data['role']

        try:
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(), settings.GOOGLE_CLIENT_ID
            )
            email = idinfo['email']
            user, created = User.objects.get_or_create(
                email=email,
                defaults={
                    'username': email.split('@')[0],
                    'first_name': idinfo.get('given_name', ''),
                    'last_name': idinfo.get('family_name', ''),
                    'is_verified': True,
                },
            )
            if created and role == 'professional':
                ProfessionalApplication.objects.create(user=user)
            refresh = RefreshToken.for_user(user)
            return Response({
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data,
                'created': created,
            })
        except ValueError:
            return Response({'error': 'Invalid Google token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfessionalApplicationListView(generics.ListAPIView):
    serializer_class = ProfessionalApplicationSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_queryset(self):
        qs = ProfessionalApplication.objects.all()
        s = self.request.query_params.get('status')
        return qs.filter(status=s) if s else qs


class ProfessionalApplicationDetailView(generics.RetrieveAPIView):
    serializer_class = ProfessionalApplicationSerializer
    permission_classes = [permissions.IsAdminUser]
    queryset = ProfessionalApplication.objects.all()


class MyApplicationView(APIView):
    def get(self, request):
        try:
            application = ProfessionalApplication.objects.get(user=request.user)
            return Response({
                'exists': True,
                'status': application.status,
                'rejection_reason': application.rejection_reason,
                'created_at': application.created_at,
            })
        except ProfessionalApplication.DoesNotExist:
            return Response({'exists': False})


class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return UserProfileUpdateSerializer
        return UserSerializer

    def perform_update(self, serializer):
        user = serializer.save()
        _publish('user.profile_updated', {
            'user_id': str(user.id),
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'avatar_url': user.avatar.url if user.avatar else '',
            'is_online': user.is_online,
            'anonymous_mode': user.anonymous_mode,
            'email_notifications_enabled': user.email_notifications_enabled,
        })


class PasswordChangeView(APIView):
    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            return Response({'message': 'Password updated successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserMoodListCreateView(generics.ListCreateAPIView):
    serializer_class = UserMoodSerializer

    def get_queryset(self):
        return UserMood.objects.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        instance = serializer.save()
        _publish('user.mood_recorded', {
            'user_id': str(self.request.user.id),
            'mood_score': instance.mood_score,
            'recorded_date': instance.recorded_date.isoformat(),
        })


class UserMoodDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserMoodSerializer

    def get_queryset(self):
        return UserMood.objects.filter(user=self.request.user, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class PrivacySettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = PrivacySettingsSerializer

    def get_object(self):
        return self.request.user


class AppearanceSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = AppearanceSettingsSerializer

    def get_object(self):
        return self.request.user


class NotificationSettingsView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationSettingsSerializer

    def get_object(self):
        return self.request.user


class UserSessionListView(generics.ListAPIView):
    serializer_class = UserSessionSerializer

    def get_queryset(self):
        return UserSession.objects.filter(user=self.request.user, is_active=True)

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


class RevokeSessionView(APIView):
    def delete(self, request, pk):
        try:
            session = UserSession.objects.get(pk=pk, user=request.user)
            session.is_active = False
            session.save()
            return Response({'status': 'Session revoked'})
        except UserSession.DoesNotExist:
            return Response({'error': 'Session not found.'}, status=status.HTTP_404_NOT_FOUND)


class DeactivateAccountView(APIView):
    def post(self, request):
        serializer = DeactivateAccountSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.is_deactivated = True
            user.deactivated_at = timezone.now()
            user.save()
            return Response({'message': 'Account deactivated successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DeleteAccountView(APIView):
    def post(self, request):
        serializer = DeleteAccountSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.is_deleted = True
            user.email = f'deleted_{user.id}@deleted.com'
            user.username = f'deleted_{user.id}'
            user.save()
            return Response({'message': 'Account deleted successfully.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProfileOverviewView(APIView):
    """Aggregated profile data. Only user, mood, and goal data lives in auth_db.
    Achievements, bookings, and saved content return empty defaults here —
    admin-service will aggregate from all services in Phase 6.
    """

    def get(self, request):
        user = request.user
        user_data = {
            'id': user.id,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'avatar': user.avatar.url if user.avatar else None,
            'bio': user.bio or '',
            'joined_date': user.created_at,
            'is_professional': user.is_professional,
        }
        goals_total = UserGoal.objects.filter(user=user, is_deleted=False).count()
        goals_completed = UserGoal.objects.filter(user=user, is_deleted=False, is_completed=True).count()
        recent_moods = list(
            UserMood.objects.filter(user=user, is_deleted=False)
            .order_by('-recorded_date')[:30]
            .values('recorded_date', 'mood_score')
        )
        return Response({
            'user': user_data,
            'streak': {'current_streak': 0, 'longest_streak': 0},
            'achievements': {'earned': 0, 'total': 0},
            'bookings': [],
            'saved_content': {'videos': 0, 'posts': 0},
            'goals': {'total': goals_total, 'completed': goals_completed},
            'recent_moods': recent_moods,
        })


class UserMoodCalendarView(APIView):
    def get(self, request):
        from datetime import date, timedelta
        from calendar import monthrange
        year = int(request.GET.get('year', timezone.now().year))
        month = int(request.GET.get('month', timezone.now().month))
        start_date = date(year, month, 1)
        end_date = date(year, month, monthrange(year, month)[1])
        mood_entries = UserMood.objects.filter(
            user=request.user,
            recorded_date__gte=start_date,
            recorded_date__lt=end_date,
            is_deleted=False,
        ).values('recorded_date', 'mood_score')
        calendar_data = {}
        current_date = start_date
        while current_date < end_date:
            calendar_data[current_date.isoformat()] = {
                'date': current_date.isoformat(), 'mood_score': None, 'has_entry': False
            }
            current_date += timedelta(days=1)
        for entry in mood_entries:
            date_str = entry['recorded_date'].isoformat()
            if date_str in calendar_data:
                calendar_data[date_str]['mood_score'] = entry['mood_score']
                calendar_data[date_str]['has_entry'] = True
        return Response(list(calendar_data.values()))


class UserGoalListCreateView(generics.ListCreateAPIView):
    serializer_class = UserGoalSerializer

    def get_queryset(self):
        return UserGoal.objects.filter(user=self.request.user, is_deleted=False)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class UserGoalDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = UserGoalSerializer

    def get_queryset(self):
        return UserGoal.objects.filter(user=self.request.user, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class HealthCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'status': 'healthy', 'service': 'auth-service'})


class InternalUserSnapshotView(APIView):
    """Bulk user data for other services to seed their UserSnapshot tables.
    Protected by X-Internal-Token header — never routed through Nginx.
    """
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        token = request.META.get('HTTP_X_INTERNAL_TOKEN', '')
        if token != settings.INTERNAL_SERVICE_TOKEN:
            return Response({'detail': 'Forbidden.'}, status=403)
        users = User.objects.filter(is_active=True).values(
            'id', 'username', 'avatar', 'is_online',
            'first_name', 'last_name', 'email', 'is_professional',
            'email_notifications_enabled',
        )
        data = [
            {
                'user_id': str(u['id']),
                'username': u['username'],
                'first_name': u['first_name'],
                'last_name': u['last_name'],
                'email': u['email'],
                'avatar_url': u['avatar'] or '',
                'is_online': u['is_online'],
                'is_professional': u['is_professional'],
                'email_notifications_enabled': u['email_notifications_enabled'],
            }
            for u in users
        ]
        return Response(data)


class AdminNotificationMixin:
    def _create_professional_notification(self, user, notif_status, reason=''):
        from apps.notifications.publisher import publish_notification
        if notif_status == 'approved':
            publish_notification(
                user_id=user.id,
                notification_type='professional_approved',
                title='Professional Application Approved!',
                message='Your application to become a MindBridge professional has been approved.',
                data={'status': 'approved'},
            )
        elif notif_status == 'rejected':
            reason_text = f'\n\nReason: {reason}' if reason else ''
            publish_notification(
                user_id=user.id,
                notification_type='professional_rejected',
                title='Professional Application Update',
                message=(
                    f'Thank you for your interest in becoming a MindBridge professional. '
                    f'After review, we are unable to approve your application at this time.{reason_text}'
                ),
                data={'status': 'rejected', 'reason': reason},
            )


class ApproveProfessionalView(AdminNotificationMixin, APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            application = ProfessionalApplication.objects.get(pk=pk)
        except ProfessionalApplication.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
        if application.status != 'pending':
            return Response({'error': 'Application has already been processed.'}, status=status.HTTP_400_BAD_REQUEST)
        application.approve(request.user)
        self._create_professional_notification(application.user, 'approved')
        return Response({
            'message': 'Professional application approved.',
            'application': ProfessionalApplicationSerializer(application).data,
        })


class RejectProfessionalView(AdminNotificationMixin, APIView):
    permission_classes = [permissions.IsAdminUser]

    def post(self, request, pk):
        try:
            application = ProfessionalApplication.objects.get(pk=pk)
        except ProfessionalApplication.DoesNotExist:
            return Response({'error': 'Application not found.'}, status=status.HTTP_404_NOT_FOUND)
        if application.status != 'pending':
            return Response({'error': 'Application has already been processed.'}, status=status.HTTP_400_BAD_REQUEST)
        reason = request.data.get('reason', '')
        application.reject(request.user, reason)
        self._create_professional_notification(application.user, 'rejected', reason)
        return Response({
            'message': 'Professional application rejected.',
            'application': ProfessionalApplicationSerializer(application).data,
        })
