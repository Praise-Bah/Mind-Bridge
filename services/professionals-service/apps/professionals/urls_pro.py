from django.urls import path
from .views_pro import (
    TodaySessionsView, PatientListView,
    ProAvailabilityListCreateView, ProAvailabilityDetailView, BlockTimeSlotView,
    EarningsView, RequestPayoutView,
    SessionNoteListCreateView, SessionNoteDetailView,
    ProProfileView, IncomingBookingsView, BookingActionView,
)

urlpatterns = [
    path('profile/', ProProfileView.as_view(), name='pro_profile'),
    path('today-sessions/', TodaySessionsView.as_view(), name='today_sessions'),
    path('patients/', PatientListView.as_view(), name='patient_list'),
    path('availability/', ProAvailabilityListCreateView.as_view(), name='pro_availability_list'),
    path('availability/<uuid:pk>/', ProAvailabilityDetailView.as_view(), name='pro_availability_detail'),
    path('availability/block/', BlockTimeSlotView.as_view(), name='block_slot'),
    path('earnings/', EarningsView.as_view(), name='earnings'),
    path('earnings/payout/', RequestPayoutView.as_view(), name='request_payout'),
    path('notes/', SessionNoteListCreateView.as_view(), name='session_notes'),
    path('notes/<uuid:pk>/', SessionNoteDetailView.as_view(), name='session_note_detail'),
    path('bookings/', IncomingBookingsView.as_view(), name='incoming_bookings'),
    path('bookings/<uuid:pk>/<str:action>/', BookingActionView.as_view(), name='booking_action'),
]
