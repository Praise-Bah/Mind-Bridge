"""
Per-service circuit breakers used by admin-service views.
Uses an in-process simple implementation since admin-service has no Redis cache configured
(it has no Django cache backend). Falls back gracefully when a service is unavailable.
"""
import time
from threading import Lock


class _SimpleCircuitBreaker:
    CLOSED = 'closed'
    OPEN = 'open'
    HALF_OPEN = 'half_open'

    def __init__(self, name: str, failure_threshold: int = 5, recovery_timeout: int = 60):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self._failures = 0
        self._state = self.CLOSED
        self._opened_at = 0.0
        self._lock = Lock()

    def is_available(self) -> bool:
        with self._lock:
            if self._state == self.CLOSED:
                return True
            if self._state == self.OPEN:
                if time.time() - self._opened_at > self.recovery_timeout:
                    self._state = self.HALF_OPEN
                    return True
                return False
            return True  # HALF_OPEN

    def record_success(self):
        with self._lock:
            self._failures = 0
            self._state = self.CLOSED

    def record_failure(self):
        with self._lock:
            self._failures += 1
            if self._failures >= self.failure_threshold:
                self._state = self.OPEN
                self._opened_at = time.time()


auth_cb = _SimpleCircuitBreaker('auth-service')
community_cb = _SimpleCircuitBreaker('community-service')
professionals_cb = _SimpleCircuitBreaker('professionals-service')
chat_cb = _SimpleCircuitBreaker('chat-service')
content_cb = _SimpleCircuitBreaker('content-service')
