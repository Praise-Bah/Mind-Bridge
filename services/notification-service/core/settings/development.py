from .base import *  # noqa: F401, F403

DEBUG = True
ALLOWED_HOSTS = ['*']

DATABASES['default']['NAME'] = config('POSTGRES_DB', default='notifications_db')  # noqa: F405
