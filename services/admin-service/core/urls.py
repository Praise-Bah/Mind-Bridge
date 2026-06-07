from django.urls import path, include
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def health(request):
    return Response({'service': 'admin-service', 'status': 'healthy'})


urlpatterns = [
    path('', include('django_prometheus.urls')),
    path('api/v1/admin-panel/', include('apps.admin_panel.urls')),
    path('api/v1/landing/', include('apps.landing.urls')),
    path('api/v1/health/', health),
]
