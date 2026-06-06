from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.utils import timezone
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer


class NotificationListView(generics.ListAPIView):
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user, is_deleted=False)


class NotificationMarkReadView(APIView):
    def post(self, request, pk=None):
        if pk:
            Notification.objects.filter(pk=pk, user=request.user).update(
                is_read=True, read_at=timezone.now()
            )
        else:
            Notification.objects.filter(user=request.user, is_read=False).update(
                is_read=True, read_at=timezone.now()
            )
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'status': 'marked as read', 'unread_count': unread_count})


class NotificationDeleteView(APIView):
    def delete(self, request, pk):
        Notification.objects.filter(pk=pk, user=request.user).update(is_deleted=True)
        unread_count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'status': 'deleted', 'unread_count': unread_count}, status=status.HTTP_200_OK)


class UnreadCountView(APIView):
    def get(self, request):
        count = Notification.objects.filter(user=request.user, is_read=False).count()
        return Response({'unread_count': count})


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    serializer_class = NotificationPreferenceSerializer

    def get_object(self):
        obj, _ = NotificationPreference.objects.get_or_create(user=self.request.user)
        return obj
