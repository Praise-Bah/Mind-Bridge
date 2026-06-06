import datetime
from django.contrib.auth import get_user_model
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers as drf_serializers

from apps.notifications.publisher import publish_notification
from .models import Booking, Availability, SessionNote
from .permissions import IsProfessional
from .serializers import AvailabilitySerializer, BookingSerializer

User = get_user_model()


# ────────────────────────────────────────────────────────────────
# Inline serializers (pro-specific)
# ────────────────────────────────────────────────────────────────

class ProBookingSerializer(BookingSerializer):
    patient_name = drf_serializers.SerializerMethodField()
    patient_avatar = drf_serializers.SerializerMethodField()
    patient_id = drf_serializers.CharField(source='user.id', read_only=True)

    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + ['patient_name', 'patient_avatar', 'patient_id']

    def get_patient_name(self, obj):
        return obj.user.get_full_name() or obj.user.username

    def get_patient_avatar(self, obj):
        request = self.context.get('request')
        if obj.user.avatar and request:
            return request.build_absolute_uri(obj.user.avatar.url)
        return None


class SessionNoteSerializer(drf_serializers.ModelSerializer):
    patient_name = drf_serializers.SerializerMethodField()
    patient_avatar = drf_serializers.SerializerMethodField()

    class Meta:
        model = SessionNote
        fields = ['id', 'patient', 'patient_name', 'patient_avatar', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        return obj.patient.get_full_name() or obj.patient.username

    def get_patient_avatar(self, obj):
        request = self.context.get('request')
        if obj.patient.avatar and request:
            return request.build_absolute_uri(obj.patient.avatar.url)
        return None


class PatientEntrySerializer(drf_serializers.Serializer):
    user_id = drf_serializers.UUIDField()
    user_name = drf_serializers.CharField()
    user_avatar = drf_serializers.CharField(allow_null=True)
    last_session_date = drf_serializers.DateField(allow_null=True)
    mood_trend = drf_serializers.ListField(child=drf_serializers.IntegerField())


# ────────────────────────────────────────────────────────────────
# Today's sessions
# ────────────────────────────────────────────────────────────────

class TodaySessionsView(generics.ListAPIView):
    permission_classes = [IsProfessional]
    serializer_class = ProBookingSerializer

    def get_queryset(self):
        today = datetime.date.today()
        profile = self.request.user.professional_profile
        return Booking.objects.filter(
            professional=profile,
            scheduled_date=today,
            is_deleted=False,
        ).select_related('user').order_by('scheduled_time')


# ────────────────────────────────────────────────────────────────
# Patient list
# ────────────────────────────────────────────────────────────────

class PatientListView(APIView):
    permission_classes = [IsProfessional]

    def get(self, request):
        from apps.users.models import UserMood
        profile = request.user.professional_profile
        bookings = Booking.objects.filter(
            professional=profile, is_deleted=False
        ).select_related('user').order_by('user', '-scheduled_date')

        seen = {}
        for b in bookings:
            uid = str(b.user_id)
            if uid not in seen:
                seen[uid] = {'user': b.user, 'last_session_date': b.scheduled_date}

        result = []
        for uid, entry in seen.items():
            u = entry['user']
            mood_scores = list(
                UserMood.objects.filter(user=u).order_by('-recorded_date').values_list('mood_score', flat=True)[:3]
            )
            avatar_url = None
            if u.avatar:
                try:
                    avatar_url = request.build_absolute_uri(u.avatar.url)
                except Exception:
                    pass
            result.append({
                'user_id': str(u.id),
                'user_name': u.get_full_name() or u.username,
                'user_avatar': avatar_url,
                'last_session_date': entry['last_session_date'],
                'mood_trend': mood_scores,
            })

        return Response(result)


# ────────────────────────────────────────────────────────────────
# Availability CRUD
# ────────────────────────────────────────────────────────────────

class ProAvailabilityListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsProfessional]
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(
            professional=self.request.user.professional_profile,
            is_deleted=False,
        ).order_by('weekday', 'start_time')

    def perform_create(self, serializer):
        serializer.save(professional=self.request.user.professional_profile)


class ProAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsProfessional]
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(
            professional=self.request.user.professional_profile,
            is_deleted=False,
        )

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


class BlockTimeSlotView(APIView):
    permission_classes = [IsProfessional]

    def post(self, request):
        weekday = request.data.get('weekday')
        start_time = request.data.get('start_time')
        end_time = request.data.get('end_time')
        profile = request.user.professional_profile
        slot, _ = Availability.objects.get_or_create(
            professional=profile,
            weekday=weekday,
            start_time=start_time,
            defaults={'end_time': end_time, 'is_available': False},
        )
        slot.is_available = False
        slot.save(update_fields=['is_available'])
        return Response(AvailabilitySerializer(slot).data, status=status.HTTP_201_CREATED)


# ────────────────────────────────────────────────────────────────
# Earnings
# ────────────────────────────────────────────────────────────────

class EarningsView(APIView):
    permission_classes = [IsProfessional]

    def get(self, request):
        profile = request.user.professional_profile
        now = datetime.date.today()
        month_start = now.replace(day=1)

        completed_qs = Booking.objects.filter(
            professional=profile, status='completed', is_deleted=False
        )
        this_month_qs = completed_qs.filter(scheduled_date__gte=month_start)
        sessions_this_month = this_month_qs.count()
        total_earned = float(profile.session_rate) * completed_qs.count()
        pending_payout = float(profile.session_rate) * this_month_qs.count()

        # Last 6 months bar chart data
        monthly = []
        for i in range(5, -1, -1):
            m_date = (now.replace(day=1) - datetime.timedelta(days=i * 28)).replace(day=1)
            m_end = (m_date.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
            count = completed_qs.filter(
                scheduled_date__gte=m_date, scheduled_date__lt=m_end
            ).count()
            monthly.append({
                'month': m_date.strftime('%b'),
                'sessions': count,
                'earnings': float(profile.session_rate) * count,
            })

        return Response({
            'sessions_this_month': sessions_this_month,
            'total_earnings': total_earned,
            'pending_payout': pending_payout,
            'payout_requested': profile.payout_requested,
            'monthly': monthly,
        })


class RequestPayoutView(APIView):
    permission_classes = [IsProfessional]

    def post(self, request):
        profile = request.user.professional_profile
        profile.payout_requested = True
        profile.save(update_fields=['payout_requested'])
        return Response({'status': 'requested', 'payout_requested': True})


# ────────────────────────────────────────────────────────────────
# Session Notes
# ────────────────────────────────────────────────────────────────

class SessionNoteListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsProfessional]
    serializer_class = SessionNoteSerializer

    def get_queryset(self):
        qs = SessionNote.objects.filter(
            professional=self.request.user.professional_profile,
            is_deleted=False,
        ).select_related('patient')
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(professional=self.request.user.professional_profile)


class SessionNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsProfessional]
    serializer_class = SessionNoteSerializer

    def get_queryset(self):
        return SessionNote.objects.filter(
            professional=self.request.user.professional_profile,
            is_deleted=False,
        )

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


# ────────────────────────────────────────────────────────────────
# Profile editor
# ────────────────────────────────────────────────────────────────

class ProProfileView(APIView):
    permission_classes = [IsProfessional]

    def get(self, request):
        from .serializers import ProfessionalProfileSerializer
        profile = request.user.professional_profile
        serializer = ProfessionalProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        profile = request.user.professional_profile
        data = request.data

        updatable = ['title', 'bio', 'credentials', 'years_of_experience',
                     'languages', 'session_rate', 'gender']
        for field in updatable:
            if field in data:
                setattr(profile, field, data[field])

        if 'intro_video' in request.FILES:
            profile.intro_video = request.FILES['intro_video']

        if 'avatar' in request.FILES:
            request.user.avatar = request.FILES['avatar']
            request.user.save(update_fields=['avatar'])

        if 'specialization_ids' in data:
            from .models import Specialization
            ids = data.getlist('specialization_ids') if hasattr(data, 'getlist') else data['specialization_ids']
            profile.specializations.set(Specialization.objects.filter(id__in=ids))

        profile.save()

        from .serializers import ProfessionalProfileSerializer
        return Response(ProfessionalProfileSerializer(profile, context={'request': request}).data)


# ────────────────────────────────────────────────────────────────
# Incoming booking requests
# ────────────────────────────────────────────────────────────────

class IncomingBookingsView(generics.ListAPIView):
    permission_classes = [IsProfessional]
    serializer_class = ProBookingSerializer

    def get_queryset(self):
        profile = self.request.user.professional_profile
        qs = Booking.objects.filter(
            professional=profile, is_deleted=False
        ).select_related('user').order_by('scheduled_date', 'scheduled_time')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class BookingActionView(APIView):
    permission_classes = [IsProfessional]

    def post(self, request, pk, action):
        try:
            booking = Booking.objects.select_related('user').get(
                pk=pk,
                professional=request.user.professional_profile,
                is_deleted=False,
            )
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status != 'pending':
            return Response({'detail': 'Only pending bookings can be actioned.'}, status=status.HTTP_400_BAD_REQUEST)

        pro_name = request.user.get_full_name() or request.user.username

        if action == 'approve':
            booking.status = 'confirmed'
            booking.save(update_fields=['status'])
            publish_notification(
                user_id=booking.user_id,
                notification_type='booking_confirmed',
                title='Booking Confirmed',
                message=f'Your session with {pro_name} on {booking.scheduled_date} has been confirmed.',
                data={'booking_id': str(booking.id)},
            )
        elif action == 'reject':
            booking.status = 'cancelled'
            booking.save(update_fields=['status'])
            publish_notification(
                user_id=booking.user_id,
                notification_type='system',
                title='Booking Declined',
                message=f'Your booking request with {pro_name} on {booking.scheduled_date} was not accepted.',
                data={'booking_id': str(booking.id)},
            )
        else:
            return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': booking.status})
