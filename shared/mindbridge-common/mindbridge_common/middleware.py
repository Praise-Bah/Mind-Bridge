class RateLimitMiddleware:
    """Adds Retry-After header to 429 responses from django-ratelimit."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if getattr(response, 'status_code', None) == 429:
            response['Retry-After'] = '60'
            response['X-RateLimit-Reset'] = '60'
        return response


class ServiceJWTMiddleware:
    """Validates JWT tokens without hitting the auth service DB.

    Decodes the JWT using the shared SECRET_KEY and populates request.user_claims
    with {user_id, username, is_authenticated, is_professional, is_staff}.
    Used by chat-service and notification-service where the User model does not exist.

    Falls back gracefully — sets user_claims to None if token is missing/invalid
    so individual views can enforce authentication as needed.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        request.user_claims = None
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]
            try:
                from rest_framework_simplejwt.tokens import UntypedToken
                from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
                validated = UntypedToken(token)
                request.user_claims = {
                    'user_id': str(validated['user_id']),
                    'username': validated.get('username', ''),
                    'is_authenticated': True,
                    'is_professional': validated.get('is_professional', False),
                    'is_staff': validated.get('is_staff', False),
                }
            except Exception:
                pass
        return self.get_response(request)
