from django.urls import path
from .views import (
    NotificationListView, NotificationMarkReadView,
    NotificationDeleteView, UnreadCountView, NotificationPreferenceView
)

urlpatterns = [
    path('', NotificationListView.as_view(), name='notification_list'),
    path('unread-count/', UnreadCountView.as_view(), name='unread_count'),
    path('mark-read/', NotificationMarkReadView.as_view(), name='mark_all_read'),
    path('<uuid:pk>/mark-read/', NotificationMarkReadView.as_view(), name='mark_read'),
    path('<uuid:pk>/delete/', NotificationDeleteView.as_view(), name='notification_delete'),
    path('preferences/', NotificationPreferenceView.as_view(), name='preferences'),
]
