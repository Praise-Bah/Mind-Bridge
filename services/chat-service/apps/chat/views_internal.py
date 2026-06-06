from django.conf import settings
from rest_framework.permissions import BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Message


class InternalTokenPermission(BasePermission):
    def has_permission(self, request, view):
        token = request.META.get('HTTP_X_INTERNAL_TOKEN', '')
        expected = getattr(settings, 'INTERNAL_SERVICE_TOKEN', '')
        return bool(token and expected and token == expected)


class InternalAdminStatsView(APIView):
    permission_classes = [InternalTokenPermission]

    def get(self, request):
        return Response({
            'total_messages': Message.objects.count(),
        })
