import datetime
from rest_framework import generics, filters, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Avg
from django_filters.rest_framework import DjangoFilterBackend
from mindbridge_common.events import publisher

from .models import UserSnapshot, ProfessionalProfile, Booking, Review, Availability, FavouriteProfessional, Specialization
from .serializers import (
    ProfessionalProfileSerializer, BookingSerializer,
    ReviewSerializer, AvailabilitySerializer,
    FavouriteProfessionalSerializer, SpecializationSerializer,
)


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


def _get_profile(user_id) -> ProfessionalProfile:
    return ProfessionalProfile.objects.get(user_id=str(user_id))


class SpecializationListView(generics.ListAPIView):
    serializer_class = SpecializationSerializer
    queryset = Specialization.objects.all()


class ProfessionalListView(generics.ListAPIView):
    serializer_class = ProfessionalProfileSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['gender']
    search_fields = ['user_full_name', 'title']

    def get_queryset(self):
        qs = ProfessionalProfile.objects.filter(
            status='approved', is_deleted=False
        ).prefetch_related('specializations')

        params = self.request.query_params

        spec = params.get('specialization')
        if spec:
            qs = qs.filter(specializations__slug=spec)

        language = params.get('language')
        if language:
            qs = qs.filter(languages__icontains=language)

        max_price = params.get('max_price')
        if max_price:
            qs = qs.filter(session_rate__lte=max_price)

        min_rating = params.get('min_rating')
        if min_rating:
            qs = qs.annotate(avg_rating=Avg('bookings__review__rating')).filter(
                avg_rating__gte=min_rating
            )

        available_today = params.get('available_today')
        if available_today:
            today_weekday = datetime.date.today().weekday()
            qs = qs.filter(availabilities__weekday=today_weekday, availabilities__is_available=True)

        return qs.distinct()


class ProfessionalDetailView(generics.RetrieveAPIView):
    serializer_class = ProfessionalProfileSerializer

    def get_queryset(self):
        return ProfessionalProfile.objects.filter(status='approved', is_deleted=False)


class ProfessionalAvailabilityView(generics.ListAPIView):
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        return Availability.objects.filter(
            professional_id=self.kwargs['professional_id'],
            is_available=True,
            is_deleted=False,
        ).order_by('weekday', 'start_time')


class MyAvailabilityListCreateView(generics.ListCreateAPIView):
    """Professionals manage their own availability slots."""
    serializer_class = AvailabilitySerializer

    def _get_profile(self):
        try:
            return ProfessionalProfile.objects.get(
                user_id=str(self.request.user.user_id), is_deleted=False
            )
        except ProfessionalProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('No professional profile found for this account.')

    def get_queryset(self):
        profile = self._get_profile()
        return Availability.objects.filter(
            professional=profile, is_deleted=False
        ).order_by('weekday', 'start_time')

    def perform_create(self, serializer):
        profile = self._get_profile()
        serializer.save(professional=profile)


class MyAvailabilityDetailView(generics.RetrieveUpdateDestroyAPIView):
    """Update or delete a single availability slot owned by the professional."""
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        try:
            profile = ProfessionalProfile.objects.get(
                user_id=str(self.request.user.user_id), is_deleted=False
            )
        except ProfessionalProfile.DoesNotExist:
            return Availability.objects.none()
        return Availability.objects.filter(professional=profile, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer

    def get_queryset(self):
        user_id = str(self.request.user.user_id)
        if getattr(self.request.user, 'is_professional', False):
            try:
                profile = _get_profile(user_id)
                return Booking.objects.filter(professional=profile)
            except ProfessionalProfile.DoesNotExist:
                pass
        return Booking.objects.filter(user_id=user_id)

    def perform_create(self, serializer):
        booking = serializer.save()
        _publish_notification(
            user_id=booking.professional.user_id,
            notification_type='booking_confirmed',
            title='New Session Booking',
            message=(
                f'{self.request.user.username} has booked a session with you on {booking.scheduled_date}.'
            ),
            data={'booking_id': str(booking.id)},
        )


class BookingDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(user_id=str(self.request.user.user_id))


class BookingCancelView(APIView):
    def post(self, request, pk):
        booking = Booking.objects.get(pk=pk, user_id=str(request.user.user_id))
        booking.status = 'cancelled'
        booking.save()
        return Response({'status': 'cancelled'})


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        booking = Booking.objects.get(
            id=self.kwargs['booking_id'], user_id=str(self.request.user.user_id)
        )
        serializer.save(booking=booking)


class ProfessionalReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        return Review.objects.filter(
            booking__professional_id=self.kwargs['professional_id'], is_deleted=False
        )


class FavouriteToggleView(APIView):
    def post(self, request, pk):
        professional = ProfessionalProfile.objects.get(pk=pk, status='approved')
        fav, created = FavouriteProfessional.objects.get_or_create(
            user_id=str(request.user.user_id), professional=professional
        )
        if not created:
            fav.delete()
            return Response({'is_favourite': False})
        return Response({'is_favourite': True})


class FavouriteListView(generics.ListAPIView):
    serializer_class = FavouriteProfessionalSerializer

    def get_queryset(self):
        return FavouriteProfessional.objects.filter(
            user_id=str(self.request.user.user_id)
        ).prefetch_related('professional__specializations')
