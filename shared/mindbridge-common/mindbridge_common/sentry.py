"""Shared Sentry initialization for all MindBridge services.

Each service calls init_sentry(service_name, dsn) early in settings/base.py.
No-op when dsn is empty, so local dev (no SENTRY_DSN configured) is unaffected.
"""
from decouple import config


def init_sentry(service_name: str, dsn: str, environment: str = 'production') -> None:
    if not dsn:
        return

    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    sentry_sdk.init(
        dsn=dsn,
        integrations=[DjangoIntegration(), CeleryIntegration(), RedisIntegration()],
        environment=environment,
        server_name=service_name,
        traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.1, cast=float),
        send_default_pii=False,
    )
    sentry_sdk.set_tag('service', service_name)
