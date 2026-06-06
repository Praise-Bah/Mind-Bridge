from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import Notification, NotificationPreference
from .serializers import NotificationSerializer, NotificationPreferenceSerializer
from .authentication import ServiceJWTAuthentication


class NotificationListView(generics.ListAPIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        return Notification.objects.filter(
            user_id=self.request.user.user_id,
            is_deleted=False,
        )


class NotificationMarkReadView(APIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def post(self, request, pk=None):
        user_id = request.user.user_id
        if pk:
            Notification.objects.filter(pk=pk, user_id=user_id).update(
                is_read=True, read_at=timezone.now()
            )
        else:
            Notification.objects.filter(user_id=user_id, is_read=False).update(
                is_read=True, read_at=timezone.now()
            )
        unread_count = Notification.objects.filter(user_id=user_id, is_read=False).count()
        return Response({'status': 'marked as read', 'unread_count': unread_count})


class NotificationDeleteView(APIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        user_id = request.user.user_id
        Notification.objects.filter(pk=pk, user_id=user_id).update(is_deleted=True)
        unread_count = Notification.objects.filter(user_id=user_id, is_read=False).count()
        return Response({'status': 'deleted', 'unread_count': unread_count}, status=status.HTTP_200_OK)


class UnreadCountView(APIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Notification.objects.filter(user_id=request.user.user_id, is_read=False).count()
        return Response({'unread_count': count})


class NotificationPreferenceView(generics.RetrieveUpdateAPIView):
    authentication_classes = [ServiceJWTAuthentication]
    permission_classes = [IsAuthenticated]
    serializer_class = NotificationPreferenceSerializer

    def get_object(self):
        obj, _ = NotificationPreference.objects.get_or_create(user_id=self.request.user.user_id)
        return obj
