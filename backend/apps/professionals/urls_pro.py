from django.urls import path
from .views_pro import (
    TodaySessionsView,
    PatientListView,
    ProAvailabilityListCreateView, ProAvailabilityDetailView, BlockTimeSlotView,
    EarningsView, RequestPayoutView,
    SessionNoteListCreateView, SessionNoteDetailView,
    ProProfileView,
    IncomingBookingsView, BookingActionView,
)

urlpatterns = [
    path('today-sessions/', TodaySessionsView.as_view(), name='pro_today_sessions'),
    path('patients/', PatientListView.as_view(), name='pro_patients'),

    path('availability/', ProAvailabilityListCreateView.as_view(), name='pro_availability_list'),
    path('availability/<uuid:pk>/', ProAvailabilityDetailView.as_view(), name='pro_availability_detail'),
    path('availability/block/', BlockTimeSlotView.as_view(), name='pro_block_slot'),

    path('earnings/', EarningsView.as_view(), name='pro_earnings'),
    path('earnings/request-payout/', RequestPayoutView.as_view(), name='pro_request_payout'),

    path('session-notes/', SessionNoteListCreateView.as_view(), name='pro_session_notes'),
    path('session-notes/<uuid:pk>/', SessionNoteDetailView.as_view(), name='pro_session_note_detail'),

    path('profile/', ProProfileView.as_view(), name='pro_profile'),

    path('bookings/', IncomingBookingsView.as_view(), name='pro_incoming_bookings'),
    path('bookings/<uuid:pk>/approve/', BookingActionView.as_view(), {'action': 'approve'}, name='pro_booking_approve'),
    path('bookings/<uuid:pk>/reject/', BookingActionView.as_view(), {'action': 'reject'}, name='pro_booking_reject'),
]
