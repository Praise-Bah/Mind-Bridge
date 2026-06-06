import datetime
import hashlib
from django.core.cache import cache
from django.db.models import Avg, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.notifications.publisher import publish_notification
from .models import ProfessionalProfile, Booking, Review, Availability, FavouriteProfessional, Specialization
from .serializers import (
    ProfessionalProfileSerializer, BookingSerializer,
    ReviewSerializer, AvailabilitySerializer,
    FavouriteProfessionalSerializer, SpecializationSerializer,
)

_PROF_CACHE_TTL = 120  # 2 minutes


class SpecializationListView(generics.ListAPIView):
    serializer_class = SpecializationSerializer
    queryset = Specialization.objects.all()

    def list(self, request, *args, **kwargs):
        cached = cache.get('professionals:specializations')
        if cached is not None:
            return Response(cached)
        response = super().list(request, *args, **kwargs)
        cache.set('professionals:specializations', response.data, timeout=3600)
        return response


def _base_professional_qs():
    return (
        ProfessionalProfile.objects.filter(status='approved', is_deleted=False)
        .select_related('user')
        .prefetch_related('specializations')
        .annotate(
            avg_rating_ann=Avg('bookings__review__rating'),
            review_count_ann=Count('bookings__review', distinct=True),
        )
    )


class ProfessionalListView(generics.ListAPIView):
    serializer_class = ProfessionalProfileSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['gender']
    search_fields = ['user__first_name', 'user__last_name', 'title']

    def get_queryset(self):
        qs = _base_professional_qs()
        params = self.request.query_params

        if spec := params.get('specialization'):
            qs = qs.filter(specializations__slug=spec)
        if language := params.get('language'):
            qs = qs.filter(languages__icontains=language)
        if max_price := params.get('max_price'):
            qs = qs.filter(session_rate__lte=max_price)
        if min_rating := params.get('min_rating'):
            qs = qs.filter(avg_rating_ann__gte=min_rating)
        if params.get('available_today'):
            today_weekday = datetime.date.today().weekday()
            qs = qs.filter(availabilities__weekday=today_weekday, availabilities__is_available=True)

        return qs.distinct()

    def list(self, request, *args, **kwargs):
        anon = not request.user.is_authenticated
        cache_key = None
        if anon:
            params_str = '&'.join(f'{k}={v}' for k, v in sorted(request.query_params.items()))
            cache_key = f'professionals:list:{hashlib.md5(params_str.encode()).hexdigest()}'
            cached = cache.get(cache_key)
            if cached is not None:
                return Response(cached)

        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        items = page if page is not None else list(queryset)

        context = self.get_serializer_context()
        if request.user.is_authenticated:
            prof_ids = [p.id for p in items]
            context['favourite_ids'] = set(
                FavouriteProfessional.objects.filter(user=request.user, professional_id__in=prof_ids)
                .values_list('professional_id', flat=True)
            )

        serializer = ProfessionalProfileSerializer(items, many=True, context=context)
        if page is not None:
            response = self.get_paginated_response(serializer.data)
        else:
            response = Response(serializer.data)

        if cache_key:
            cache.set(cache_key, response.data, timeout=_PROF_CACHE_TTL)
        return response


class ProfessionalDetailView(generics.RetrieveAPIView):
    serializer_class = ProfessionalProfileSerializer

    def get_queryset(self):
        return _base_professional_qs()


class ProfessionalAvailabilityView(generics.ListAPIView):
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        professional_id = self.kwargs['professional_id']
        return Availability.objects.filter(
            professional_id=professional_id, is_available=True, is_deleted=False
        ).order_by('weekday', 'start_time')


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'professional_profile'):
            return Booking.objects.filter(professional=user.professional_profile)
        return Booking.objects.filter(user=user)

    def perform_create(self, serializer):
        booking = serializer.save(user=self.request.user)
        publish_notification(
            user_id=booking.professional.user_id,
            notification_type='booking_confirmed',
            title='New Session Booking',
            message=f'{self.request.user.get_full_name() or self.request.user.username} has booked a session with you on {booking.scheduled_date}.',
            data={'booking_id': str(booking.id)},
        )


class BookingDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = BookingSerializer

    def get_queryset(self):
        return Booking.objects.filter(user=self.request.user)


class BookingCancelView(APIView):
    def post(self, request, pk):
        booking = Booking.objects.get(pk=pk, user=request.user)
        booking.status = 'cancelled'
        booking.save()
        return Response({'status': 'cancelled'})


class ReviewCreateView(generics.CreateAPIView):
    serializer_class = ReviewSerializer

    def perform_create(self, serializer):
        booking_id = self.kwargs['booking_id']
        booking = Booking.objects.get(id=booking_id, user=self.request.user)
        serializer.save(booking=booking)


class ProfessionalReviewsView(generics.ListAPIView):
    serializer_class = ReviewSerializer

    def get_queryset(self):
        professional_id = self.kwargs['professional_id']
        return Review.objects.filter(
            booking__professional_id=professional_id, is_deleted=False
        )


class FavouriteToggleView(APIView):
    def post(self, request, pk):
        professional = ProfessionalProfile.objects.get(pk=pk, status='approved')
        fav, created = FavouriteProfessional.objects.get_or_create(
            user=request.user, professional=professional
        )
        if not created:
            fav.delete()
            return Response({'is_favourite': False})
        return Response({'is_favourite': True})


class FavouriteListView(generics.ListAPIView):
    serializer_class = FavouriteProfessionalSerializer

    def get_queryset(self):
        return FavouriteProfessional.objects.filter(
            user=self.request.user
        ).select_related('professional__user').prefetch_related('professional__specializations')
