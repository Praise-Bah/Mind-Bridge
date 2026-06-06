"""Professional-only views (require IsProfessional permission)."""
import datetime
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import serializers as drf_serializers
from mindbridge_common.events import publisher

from .models import UserSnapshot, ProfessionalProfile, Booking, Availability, SessionNote, Specialization
from .permissions import IsProfessional
from .serializers import AvailabilitySerializer, BookingSerializer, ProfessionalProfileSerializer


def _publish_notification(user_id, notification_type, title, message, data=None):
    try:
        publisher.publish('notification.create', {
            'user_id': str(user_id),
            'notification_type': notification_type,
            'title': title,
            'message': message,
            'data': data or {},
        }, service_origin='professionals-service')
    except Exception:
        pass


def _get_profile(request) -> ProfessionalProfile:
    return ProfessionalProfile.objects.get(user_id=str(request.user.user_id))


# ── Inline serializers ────────────────────────────────────────────────────────

class ProBookingSerializer(BookingSerializer):
    patient_name = drf_serializers.SerializerMethodField()
    patient_avatar = drf_serializers.SerializerMethodField()
    patient_id = drf_serializers.UUIDField(source='user_id', read_only=True)

    class Meta(BookingSerializer.Meta):
        fields = BookingSerializer.Meta.fields + ['patient_name', 'patient_avatar', 'patient_id']

    def get_patient_name(self, obj):
        snap = UserSnapshot.objects.filter(user_id=obj.user_id).first()
        return snap.get_full_name() if snap else str(obj.user_id)[:8]

    def get_patient_avatar(self, obj):
        snap = UserSnapshot.objects.filter(user_id=obj.user_id).first()
        return snap.avatar_url if snap else None


class SessionNoteSerializer(drf_serializers.ModelSerializer):
    patient_name = drf_serializers.SerializerMethodField()
    patient_avatar = drf_serializers.SerializerMethodField()

    class Meta:
        model = SessionNote
        fields = ['id', 'patient_id', 'patient_name', 'patient_avatar', 'content', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_patient_name(self, obj):
        snap = UserSnapshot.objects.filter(user_id=obj.patient_id).first()
        return snap.get_full_name() if snap else str(obj.patient_id)[:8]

    def get_patient_avatar(self, obj):
        snap = UserSnapshot.objects.filter(user_id=obj.patient_id).first()
        return snap.avatar_url if snap else None


class PatientEntrySerializer(drf_serializers.Serializer):
    user_id = drf_serializers.UUIDField()
    user_name = drf_serializers.CharField()
    user_avatar = drf_serializers.CharField(allow_null=True)
    last_session_date = drf_serializers.DateField(allow_null=True)
    mood_trend = drf_serializers.ListField(child=drf_serializers.IntegerField())


# ── Views ─────────────────────────────────────────────────────────────────────

class TodaySessionsView(generics.ListAPIView):
    permission_classes = [IsProfessional]
    serializer_class = ProBookingSerializer

    def get_queryset(self):
        profile = _get_profile(self.request)
        return Booking.objects.filter(
            professional=profile,
            scheduled_date=datetime.date.today(),
            is_deleted=False,
        ).order_by('scheduled_time')


class PatientListView(APIView):
    permission_classes = [IsProfessional]

    def get(self, request):
        profile = _get_profile(request)
        bookings = Booking.objects.filter(
            professional=profile, is_deleted=False
        ).order_by('user_id', '-scheduled_date')

        seen = {}
        for b in bookings:
            uid = str(b.user_id)
            if uid not in seen:
                seen[uid] = {'user_id': uid, 'last_session_date': b.scheduled_date}

        result = []
        for uid, entry in seen.items():
            snap = UserSnapshot.objects.filter(user_id=uid).first()
            result.append({
                'user_id': uid,
                'user_name': snap.get_full_name() if snap else uid[:8],
                'user_avatar': snap.avatar_url if snap else None,
                'last_session_date': entry['last_session_date'],
                'mood_trend': [],  # mood data lives in content-service
            })

        return Response(result)


class ProAvailabilityListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsProfessional]
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(
            professional=_get_profile(self.request), is_deleted=False,
        ).order_by('weekday', 'start_time')

    def perform_create(self, serializer):
        serializer.save(professional=_get_profile(self.request))


class ProAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsProfessional]
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(
            professional=_get_profile(self.request), is_deleted=False,
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
        profile = _get_profile(request)
        slot, _ = Availability.objects.get_or_create(
            professional=profile, weekday=weekday, start_time=start_time,
            defaults={'end_time': end_time, 'is_available': False},
        )
        slot.is_available = False
        slot.save(update_fields=['is_available'])
        return Response(AvailabilitySerializer(slot).data, status=status.HTTP_201_CREATED)


class EarningsView(APIView):
    permission_classes = [IsProfessional]

    def get(self, request):
        profile = _get_profile(request)
        now = datetime.date.today()
        month_start = now.replace(day=1)

        completed_qs = Booking.objects.filter(professional=profile, status='completed', is_deleted=False)
        this_month_qs = completed_qs.filter(scheduled_date__gte=month_start)
        sessions_this_month = this_month_qs.count()
        total_earned = float(profile.session_rate) * completed_qs.count()
        pending_payout = float(profile.session_rate) * this_month_qs.count()

        monthly = []
        for i in range(5, -1, -1):
            m_date = (now.replace(day=1) - datetime.timedelta(days=i * 28)).replace(day=1)
            m_end = (m_date.replace(day=28) + datetime.timedelta(days=4)).replace(day=1)
            count = completed_qs.filter(scheduled_date__gte=m_date, scheduled_date__lt=m_end).count()
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
        profile = _get_profile(request)
        profile.payout_requested = True
        profile.save(update_fields=['payout_requested'])
        return Response({'status': 'requested', 'payout_requested': True})


class SessionNoteListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsProfessional]
    serializer_class = SessionNoteSerializer

    def get_queryset(self):
        qs = SessionNote.objects.filter(
            professional=_get_profile(self.request), is_deleted=False,
        )
        patient_id = self.request.query_params.get('patient')
        if patient_id:
            qs = qs.filter(patient_id=patient_id)
        return qs

    def perform_create(self, serializer):
        serializer.save(professional=_get_profile(self.request))


class SessionNoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsProfessional]
    serializer_class = SessionNoteSerializer

    def get_queryset(self):
        return SessionNote.objects.filter(
            professional=_get_profile(self.request), is_deleted=False,
        )

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


class ProProfileView(APIView):
    permission_classes = [IsProfessional]

    def get(self, request):
        profile = _get_profile(request)
        serializer = ProfessionalProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def patch(self, request):
        profile = _get_profile(request)
        data = request.data
        updatable = ['title', 'bio', 'credentials', 'years_of_experience',
                     'languages', 'session_rate', 'gender']
        for field in updatable:
            if field in data:
                setattr(profile, field, data[field])
        if 'intro_video' in request.FILES:
            profile.intro_video = request.FILES['intro_video']
        if 'specialization_ids' in data:
            ids = data.getlist('specialization_ids') if hasattr(data, 'getlist') else data['specialization_ids']
            profile.specializations.set(Specialization.objects.filter(id__in=ids))
        profile.save()
        return Response(ProfessionalProfileSerializer(profile, context={'request': request}).data)


class IncomingBookingsView(generics.ListAPIView):
    permission_classes = [IsProfessional]
    serializer_class = ProBookingSerializer

    def get_queryset(self):
        profile = _get_profile(self.request)
        qs = Booking.objects.filter(professional=profile, is_deleted=False).order_by('scheduled_date', 'scheduled_time')
        status_filter = self.request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs


class BookingActionView(APIView):
    permission_classes = [IsProfessional]

    def post(self, request, pk, action):
        try:
            booking = Booking.objects.get(
                pk=pk, professional=_get_profile(request), is_deleted=False
            )
        except Booking.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        if booking.status != 'pending':
            return Response({'detail': 'Only pending bookings can be actioned.'}, status=status.HTTP_400_BAD_REQUEST)

        pro_name = request.user.username

        if action == 'approve':
            booking.status = 'confirmed'
            booking.save(update_fields=['status'])
            _publish_notification(
                user_id=booking.user_id,
                notification_type='booking_confirmed',
                title='Booking Confirmed',
                message=f'Your session with {pro_name} on {booking.scheduled_date} has been confirmed.',
                data={'booking_id': str(booking.id)},
            )
        elif action == 'reject':
            booking.status = 'cancelled'
            booking.save(update_fields=['status'])
            _publish_notification(
                user_id=booking.user_id,
                notification_type='system',
                title='Booking Declined',
                message=f'Your booking request with {pro_name} on {booking.scheduled_date} was not accepted.',
                data={'booking_id': str(booking.id)},
            )
        else:
            return Response({'detail': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'status': booking.status})
