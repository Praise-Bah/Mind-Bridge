from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY')

DEBUG = config('DEBUG', default=False, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='').split(',')

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'rest_framework',
    'django_filters',
    'apps.community',
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
        'NAME': config('POSTGRES_DB', default='community_db'),
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

# JWT — same SECRET_KEY as auth-service so tokens decode correctly
SIMPLE_JWT = {
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.community.authentication.ServiceJWTAuthentication',
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

# Redis
REDIS_URL = config('REDIS_URL', default='redis://localhost:6379/0')
REDIS_EVENT_BUS_URL = config('REDIS_EVENT_BUS_URL', default='redis://redis:6379/3')
REDIS_CACHE_URL = config('REDIS_CACHE_URL', default='redis://redis:6379/2')

# Celery
CELERY_BROKER_URL = REDIS_URL
CELERY_RESULT_BACKEND = REDIS_URL
CELERY_TASK_SERIALIZER = 'json'
CELERY_ACCEPT_CONTENT = ['json']

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': REDIS_CACHE_URL,
        'KEY_PREFIX': 'community',
        'OPTIONS': {'IGNORE_EXCEPTIONS': True},
    }
}

# OpenRouter — for AI question generation
OPENROUTER_API_KEY = config('OPENROUTER_API_KEY', default='')
OPENROUTER_MODEL = config('OPENROUTER_MODEL', default='anthropic/claude-sonnet-4')
OPENROUTER_MODELS = {
    'claude_sonnet': {'id': 'anthropic/claude-sonnet-4', 'weight': 0.30, 'name': 'Claude Sonnet'},
    'gpt4':          {'id': 'openai/gpt-4',              'weight': 0.25, 'name': 'GPT-4'},
    'gemini':        {'id': 'google/gemini-pro',          'weight': 0.25, 'name': 'Gemini Pro'},
    'llama3':        {'id': 'meta-llama/llama-3-70b-instruct', 'weight': 0.20, 'name': 'Llama 3'},
}

SITE_URL = config('SITE_URL', default='http://localhost:3000')

# Internal service communication
INTERNAL_SERVICE_TOKEN = config('INTERNAL_SERVICE_TOKEN', default='')
AUTH_SERVICE_INTERNAL_URL = config('AUTH_SERVICE_INTERNAL_URL', default='http://auth-service:8001')
