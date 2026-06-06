from .base import *  # noqa: F401, F403

DEBUG = False
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
USE_X_FORWARDED_HOST = True

# CORS is handled by Nginx in production — disable Django-level CORS to avoid duplicate headers.
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = []

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {'console': {'class': 'logging.StreamHandler'}},
    'root': {'handlers': ['console'], 'level': 'INFO'},
}
