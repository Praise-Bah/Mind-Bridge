"""Shared Sentry initialization for all MindBridge services.

Each service calls init_sentry(service_name, dsn) early in settings/base.py.
No-op when dsn is empty OR malformed, so a bad SENTRY_DSN value degrades to
"no error tracking" instead of crash-looping the entire service at startup
(sentry_sdk.init raises BadDsn for non-empty values that aren't valid DSN URLs,
and that exception propagates out of settings loading before Django even starts).
"""
import logging

from decouple import config

logger = logging.getLogger(__name__)


def init_sentry(service_name: str, dsn: str, environment: str = 'production') -> None:
    if not dsn:
        return

    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration
    from sentry_sdk.integrations.celery import CeleryIntegration
    from sentry_sdk.integrations.redis import RedisIntegration

    try:
        sentry_sdk.init(
            dsn=dsn,
            integrations=[DjangoIntegration(), CeleryIntegration(), RedisIntegration()],
            environment=environment,
            server_name=service_name,
            traces_sample_rate=config('SENTRY_TRACES_SAMPLE_RATE', default=0.1, cast=float),
            send_default_pii=False,
        )
        sentry_sdk.set_tag('service', service_name)
    except Exception:
        logger.warning('Sentry init failed for %s — continuing without error tracking', service_name, exc_info=True)
