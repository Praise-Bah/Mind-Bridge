"""
MindBridge URL Configuration
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from apps.users.views import InternalUserSnapshotView

urlpatterns = [
    path('admin/', admin.site.urls),

    # Internal service-to-service endpoint — NOT routed through Nginx
    path('internal/users/snapshots/', InternalUserSnapshotView.as_view(), name='internal_user_snapshots'),
    
    # API v1 endpoints
    path('api/v1/', include([
        path('auth/', include('apps.users.urls')),
        path('users/', include('apps.users.urls_users')),
        path('chat/', include('apps.chat.urls')),
        path('community/', include('apps.community.urls')),
        path('professionals/', include('apps.professionals.urls')),
        path('videos/', include('apps.videos.urls')),
        path('notifications/', include('apps.notifications.urls')),
        path('ai/', include('apps.ai_assistant.urls')),
        path('journals/', include('apps.journals.urls')),
        path('achievements/', include('apps.achievements.urls')),
        path('health/', include('apps.users.urls_health')),
        path('admin-panel/', include('apps.admin_panel.urls')),
        path('pro/', include('apps.professionals.urls_pro')),
        path('landing/', include('apps.landing.urls')),
    ])),
    
    # API Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    
    # Debug Toolbar
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns
