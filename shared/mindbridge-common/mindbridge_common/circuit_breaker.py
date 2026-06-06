import time
import logging
from enum import Enum

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    CLOSED = 'closed'        # Normal: requests pass through
    OPEN = 'open'            # Failing: requests rejected immediately
    HALF_OPEN = 'half_open'  # Testing: one request allowed through


class CircuitBreaker:
    """Redis-backed circuit breaker for cross-service calls.

    States:
    - CLOSED: all calls pass through
    - OPEN (after failure_threshold failures): calls return fallback immediately
    - HALF_OPEN (after recovery_timeout seconds): one call is allowed through to test
    """

    def __init__(self, service_name: str, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.key_prefix = f'circuit:{service_name}'
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout

    def _cache(self):
        from django.core.cache import cache
        return cache

    def is_available(self) -> bool:
        cache = self._cache()
        state = cache.get(f'{self.key_prefix}:state', CircuitState.CLOSED.value)
        if state == CircuitState.CLOSED.value:
            return True
        if state == CircuitState.OPEN.value:
            opened_at = cache.get(f'{self.key_prefix}:opened_at', 0)
            if time.time() - opened_at > self.recovery_timeout:
                cache.set(f'{self.key_prefix}:state', CircuitState.HALF_OPEN.value, timeout=300)
                return True
            return False
        return True  # HALF_OPEN: allow one through

    def _record_success(self):
        cache = self._cache()
        cache.delete(f'{self.key_prefix}:failures')
        cache.set(f'{self.key_prefix}:state', CircuitState.CLOSED.value, timeout=None)

    def _record_failure(self):
        cache = self._cache()
        failures = int(cache.get(f'{self.key_prefix}:failures', 0)) + 1
        cache.set(f'{self.key_prefix}:failures', failures, timeout=300)
        if failures >= self.failure_threshold:
            logger.warning('Circuit breaker OPEN for %s after %d failures', self.key_prefix, failures)
            cache.set(f'{self.key_prefix}:state', CircuitState.OPEN.value, timeout=self.recovery_timeout)
            cache.set(f'{self.key_prefix}:opened_at', time.time(), timeout=300)

    def call(self, func, *args, fallback=None, **kwargs):
        """Call func with circuit breaker protection.

        If the circuit is open, returns fallback() if provided, else None.
        On success, resets failure count. On failure, records failure and
        opens the circuit if threshold is exceeded.
        """
        if not self.is_available():
            return fallback() if fallback is not None else None
        try:
            result = func(*args, **kwargs)
            self._record_success()
            return result
        except Exception as exc:
            self._record_failure()
            logger.error('Circuit breaker recorded failure: %s', exc, exc_info=True)
            return fallback() if fallback is not None else None
