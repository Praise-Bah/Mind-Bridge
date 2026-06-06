class ServiceUnavailableError(Exception):
    """Raised when a downstream service circuit breaker is open."""
    pass
