from decouple import config

SECRET_KEY = config('SECRET_KEY')
DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='*').split(',')

from mindbridge_common.sentry import init_sentry
init_sentry(
    service_name='admin-service',
    dsn=config('SENTRY_DSN', default=''),
    environment=config('SENTRY_ENVIRONMENT', default='production'),
)

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'apps.admin_panel',
    'apps.landing',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'core.urls'
WSGI_APPLICATION = 'core.wsgi.application'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {'context_processors': [
            'django.template.context_processors.request',
        ]},
    },
]

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True
STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# No database — admin-service is a pure aggregator.
DATABASES = {}

# Redis for event publishing (ban notifications etc.)
REDIS_EVENT_BUS_URL = config('REDIS_EVENT_BUS_URL', default='redis://redis:6379/3')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.admin_panel.authentication.ServiceJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'apps.admin_panel.permissions.IsAdminPrincipal',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

CORS_ALLOW_ALL_ORIGINS = config('CORS_ALLOW_ALL_ORIGINS', default=True, cast=bool)

# Internal service URLs (all container-internal, not routed through Nginx)
AUTH_SERVICE_INTERNAL_URL = config('AUTH_SERVICE_INTERNAL_URL', default='http://auth-service:8001')
COMMUNITY_SERVICE_INTERNAL_URL = config('COMMUNITY_SERVICE_INTERNAL_URL', default='http://community-service:8003')
PROFESSIONALS_SERVICE_INTERNAL_URL = config('PROFESSIONALS_SERVICE_INTERNAL_URL', default='http://professionals-service:8004')
CHAT_SERVICE_INTERNAL_URL = config('CHAT_SERVICE_INTERNAL_URL', default='http://chat-service:8002')
CONTENT_SERVICE_INTERNAL_URL = config('CONTENT_SERVICE_INTERNAL_URL', default='http://content-service:8007')

INTERNAL_SERVICE_TOKEN = config('INTERNAL_SERVICE_TOKEN')

# Timeouts for internal calls (seconds)
INTERNAL_CALL_TIMEOUT = 10
