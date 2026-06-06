from django.urls import path
from .views import (
    SpecializationListView,
    ProfessionalListView, ProfessionalDetailView, ProfessionalAvailabilityView,
    MyAvailabilityListCreateView, MyAvailabilityDetailView,
    BookingListCreateView, BookingDetailView, BookingCancelView,
    ReviewCreateView, ProfessionalReviewsView,
    FavouriteToggleView, FavouriteListView,
)

urlpatterns = [
    path('', ProfessionalListView.as_view(), name='professional_list'),
    path('specializations/', SpecializationListView.as_view(), name='specialization_list'),
    path('favourites/', FavouriteListView.as_view(), name='favourite_list'),
    # Professional manages their own availability
    path('my/availability/', MyAvailabilityListCreateView.as_view(), name='my_availability'),
    path('my/availability/<uuid:pk>/', MyAvailabilityDetailView.as_view(), name='my_availability_detail'),
    path('<uuid:pk>/', ProfessionalDetailView.as_view(), name='professional_detail'),
    path('<uuid:pk>/favourite/', FavouriteToggleView.as_view(), name='favourite_toggle'),
    path('<uuid:professional_id>/availability/', ProfessionalAvailabilityView.as_view(), name='availability'),
    path('<uuid:professional_id>/reviews/', ProfessionalReviewsView.as_view(), name='reviews'),
    path('bookings/', BookingListCreateView.as_view(), name='booking_list'),
    path('bookings/<uuid:pk>/', BookingDetailView.as_view(), name='booking_detail'),
    path('bookings/<uuid:pk>/cancel/', BookingCancelView.as_view(), name='booking_cancel'),
    path('bookings/<uuid:booking_id>/review/', ReviewCreateView.as_view(), name='create_review'),
]
