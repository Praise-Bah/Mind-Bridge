from django.urls import path
from .views import (
    ProfessionalListView, ProfessionalDetailView, ProfessionalAvailabilityView,
    BookingListCreateView, BookingDetailView, BookingCancelView,
    ReviewCreateView, ProfessionalReviewsView
)

urlpatterns = [
    path('', ProfessionalListView.as_view(), name='professional_list'),
    path('<uuid:pk>/', ProfessionalDetailView.as_view(), name='professional_detail'),
    path('<uuid:professional_id>/availability/', ProfessionalAvailabilityView.as_view(), name='availability'),
    path('<uuid:professional_id>/reviews/', ProfessionalReviewsView.as_view(), name='reviews'),
    path('bookings/', BookingListCreateView.as_view(), name='booking_list'),
    path('bookings/<uuid:pk>/', BookingDetailView.as_view(), name='booking_detail'),
    path('bookings/<uuid:pk>/cancel/', BookingCancelView.as_view(), name='booking_cancel'),
    path('bookings/<uuid:booking_id>/review/', ReviewCreateView.as_view(), name='create_review'),
]
