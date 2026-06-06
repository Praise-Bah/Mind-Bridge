import jwt
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.conf import settings


class SimplePrincipal:
    """Minimal user-like object populated from JWT claims.

    Satisfies DRF's IsAuthenticated check and exposes user_id for queryset
    filtering without any database access.
    """
    is_authenticated = True
    is_active = True

    def __init__(self, payload: dict):
        self.user_id = str(payload.get('user_id', ''))
        self.username = payload.get('username', '')
        self.is_staff = bool(payload.get('is_staff', False))

    def __str__(self):
        return self.username


class ServiceJWTAuthentication(BaseAuthentication):
    """Decode JWT signed with SECRET_KEY — no DB lookup, no session."""

    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token has expired.')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token.')
        return (SimplePrincipal(payload), token)
