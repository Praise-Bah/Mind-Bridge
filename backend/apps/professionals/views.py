from rest_framework import generics, status, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from .models import ProfessionalProfile, Booking, Review, Availability
from .serializers import (
    ProfessionalProfileSerializer, BookingSerializer, 
    ReviewSerializer, AvailabilitySerializer
)


class ProfessionalListView(generics.ListAPIView):
    serializer_class = ProfessionalProfileSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['specializations', 'languages']
    search_fields = ['user__first_name', 'user__last_name', 'title']

    def get_queryset(self):
        return ProfessionalProfile.objects.filter(
            status='approved', is_deleted=False
        ).select_related('user').prefetch_related('specializations')


class ProfessionalDetailView(generics.RetrieveAPIView):
    serializer_class = ProfessionalProfileSerializer
    
    def get_queryset(self):
        return ProfessionalProfile.objects.filter(status='approved', is_deleted=False)


class ProfessionalAvailabilityView(generics.ListAPIView):
    serializer_class = AvailabilitySerializer

    def get_queryset(self):
        professional_id = self.kwargs['professional_id']
        return Availability.objects.filter(
            professional_id=professional_id, is_available=True, is_deleted=False
        )


class BookingListCreateView(generics.ListCreateAPIView):
    serializer_class = BookingSerializer

    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'professional_profile'):
            return Booking.objects.filter(professional=user.professional_profile)
        return Booking.objects.filter(user=user)


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
