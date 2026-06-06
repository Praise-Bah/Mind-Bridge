import os
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny

logger = logging.getLogger(__name__)


class ServiceHealthView(APIView):
    """Base health check view — override service_name in each service.

    Returns 200 when DB + Redis are reachable; 503 when degraded.
    Used by Docker Compose healthcheck: and K8s liveness/readiness probes.
    """
    permission_classes = [AllowAny]
    service_name = 'unknown'

    def get(self, request):
        checks = {}
        overall = 'healthy'

        try:
            from django.db import connection
            connection.ensure_connection()
            checks['database'] = 'ok'
        except Exception as exc:
            checks['database'] = f'error: {exc}'
            overall = 'degraded'
            logger.error('Health check: database unreachable', exc_info=True)

        try:
            from django.core.cache import cache
            cache.set('_health', '1', timeout=5)
            checks['redis'] = 'ok'
        except Exception as exc:
            checks['redis'] = f'error: {exc}'
            overall = 'degraded'
            logger.error('Health check: redis unreachable', exc_info=True)

        return Response(
            {
                'service': self.service_name,
                'status': overall,
                'checks': checks,
                'version': os.environ.get('SERVICE_VERSION', '1.0.0'),
            },
            status=200 if overall == 'healthy' else 503,
        )
