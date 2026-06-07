from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='chat-service-insecure-dev-key')
DEBUG = False
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=lambda v: [s.strip() for s in v.split(',')],
)

from mindbridge_common.sentry import init_sentry
init_sentry(
    service_name='chat-service',
    dsn=config('SENTRY_DSN', default=''),
    environment=config('SENTRY_ENVIRONMENT', default='production'),
)

INSTALLED_APPS = [
    'daphne',
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'rest_framework',
    'channels',
    'apps.chat',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'core.urls'
ASGI_APPLICATION = 'core.asgi.application'
WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='chat_db'),
        'USER': config('POSTGRES_USER', default='mindbridge'),
        'PASSWORD': config('POSTGRES_PASSWORD', default=''),
        'HOST': config('POSTGRES_HOST', default='localhost'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
    }
}

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_CACHE_URL', default='redis://localhost:6379/2'),
        'KEY_PREFIX': 'chat',
        'TIMEOUT': 300,
    }
}

CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [config('REDIS_URL', default='redis://localhost:6379/0')],
        },
    },
}

REDIS_EVENT_BUS_URL = config('REDIS_EVENT_BUS_URL', default='redis://localhost:6379/3')

# Token protecting the internal /internal/users/snapshots/ endpoint on the monolith
INTERNAL_SERVICE_TOKEN = config('INTERNAL_SERVICE_TOKEN', default='dev-internal-token-change-in-prod')
MONOLITH_INTERNAL_URL = config('MONOLITH_INTERNAL_URL', default='http://localhost:8000')

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.chat.authentication.ServiceJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = False
USE_TZ = True

STATIC_URL = '/static/'

# File uploads — shared storage (S3 in prod, local in dev)
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'
