"""
AI Service base settings.

Phase 1: this service is a pure event worker — no HTTP endpoints, no DB migrations.
Phase 4: add AISession/AIMessage models, own PostgreSQL DB, /api/v1/ai/* HTTP endpoints.
"""
from pathlib import Path
from decouple import config

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = config('SECRET_KEY', default='ai-service-insecure-dev-key')
DEBUG = False
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='localhost,127.0.0.1',
    cast=lambda v: [s.strip() for s in v.split(',')],
)

from mindbridge_common.sentry import init_sentry
init_sentry(
    service_name='ai-service',
    dsn=config('SENTRY_DSN', default=''),
    environment=config('SENTRY_ENVIRONMENT', default='production'),
)

INSTALLED_APPS = [
    'django.contrib.contenttypes',
    'django.contrib.auth',
    'rest_framework',
    'django_celery_beat',
    'django_celery_results',
    'apps.ai_assistant',
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
        'NAME': config('POSTGRES_DB', default='ai_db'),
        'USER': config('POSTGRES_USER', default='mindbridge'),
        'PASSWORD': config('POSTGRES_PASSWORD', default=''),
        'HOST': config('POSTGRES_HOST', default='localhost'),
        'PORT': config('POSTGRES_PORT', default='5432'),
        'CONN_MAX_AGE': 60,
        'CONN_HEALTH_CHECKS': True,
    }
}

# Cache — Redis DB 2
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_CACHE_URL', default='redis://localhost:6379/2'),
        'KEY_PREFIX': 'ai',
    }
}

# Celery
CELERY_BROKER_URL = config('REDIS_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = 'django-db'
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_BEAT_SCHEDULER = 'django_celery_beat.schedulers:DatabaseScheduler'
CELERY_TASK_QUEUES = {
    'ai_tasks': {'exchange': 'ai_tasks'},
}
CELERY_TASK_DEFAULT_QUEUE = 'ai_tasks'

# Event bus
REDIS_EVENT_BUS_URL = config('REDIS_EVENT_BUS_URL', default='redis://localhost:6379/3')

# AI APIs
OPENROUTER_API_KEY = config('OPENROUTER_API_KEY', default='')
OPENROUTER_MODEL = config('OPENROUTER_MODEL', default='anthropic/claude-sonnet-4')
SITE_URL = config('SITE_URL', default='http://localhost:3000')

# Available models for group evaluation (multi-model consensus)
OPENROUTER_MODELS = {
    'claude_sonnet': {
        'id': 'anthropic/claude-sonnet-4',
        'weight': 0.30,
        'name': 'Claude Sonnet',
    },
    'gpt4': {
        'id': 'openai/gpt-4',
        'weight': 0.25,
        'name': 'GPT-4',
    },
    'gemini': {
        'id': 'google/gemini-pro',
        'weight': 0.25,
        'name': 'Gemini Pro',
    },
    'llama3': {
        'id': 'meta-llama/llama-3-70b-instruct',
        'weight': 0.20,
        'name': 'Llama 3',
    },
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'apps.ai_assistant.authentication.ServiceJWTAuthentication',
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
USE_TZ = True
TIME_ZONE = 'UTC'

STATIC_URL = '/static/'
