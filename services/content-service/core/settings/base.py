from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

from mindbridge_common.sentry import init_sentry
init_sentry(
    service_name='content-service',
    dsn=config('SENTRY_DSN', default=''),
    environment=config('SENTRY_ENVIRONMENT', default='production'),
)

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'rest_framework',
    'django_filters',
    'apps.journals',
    'apps.videos',
    'apps.achievements',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'core.urls'

WSGI_APPLICATION = 'core.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': config('POSTGRES_DB', default='content_db'),
        'USER': config('POSTGRES_USER', default='mindbridge'),
        'PASSWORD': config('POSTGRES_PASSWORD', default=''),
        'HOST': config('POSTGRES_HOST', default='localhost'),
        'PORT': config('POSTGRES_PORT', default='5432'),
    }
}

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

STATIC_URL = '/static/'

SIMPLE_JWT = {
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.journals.authentication.ServiceJWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')
REDIS_EVENT_BUS_URL = config('REDIS_EVENT_BUS_URL', default='redis://redis:6379/3')
REDIS_CACHE_URL = config('REDIS_CACHE_URL', default='redis://redis:6379/2')

CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_CACHE_URL,
        'KEY_PREFIX': 'content',
        'OPTIONS': {'IGNORE_EXCEPTIONS': True},
    }
}

# OpenRouter (for journal insights AI)
OPENROUTER_API_KEY = config('OPENROUTER_API_KEY', default='')
OPENROUTER_MODEL = config('OPENROUTER_MODEL', default='anthropic/claude-sonnet-4')

YOUTUBE_API_KEY = config('YOUTUBE_API_KEY', default='')

SITE_URL = config('SITE_URL', default='http://localhost:3000')
