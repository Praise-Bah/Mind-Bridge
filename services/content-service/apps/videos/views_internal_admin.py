from django.conf import settings
from rest_framework import generics
from rest_framework.permissions import BasePermission

from .models import Video
from .serializers import VideoSerializer


class InternalTokenPermission(BasePermission):
    def has_permission(self, request, view):
        token = request.META.get('HTTP_X_INTERNAL_TOKEN', '')
        expected = getattr(settings, 'INTERNAL_SERVICE_TOKEN', '')
        return bool(token and expected and token == expected)


class InternalAdminVideoListCreateView(generics.ListCreateAPIView):
    permission_classes = [InternalTokenPermission]
    serializer_class = VideoSerializer
    queryset = Video.objects.filter(is_deleted=False).order_by('-created_at')


class InternalAdminVideoDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [InternalTokenPermission]
    serializer_class = VideoSerializer
    queryset = Video.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save(update_fields=['is_deleted'])
