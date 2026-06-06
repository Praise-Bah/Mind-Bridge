import jwt
from django.conf import settings
from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed


class SimplePrincipal:
    def __init__(self, payload: dict):
        self.user_id = payload.get('user_id') or payload.get('sub')
        self.username = payload.get('username', '')
        self.is_staff = payload.get('is_staff', False)
        self.is_professional = payload.get('is_professional', False)
        self.is_authenticated = True
        self.is_anonymous = False

    def __str__(self):
        return self.username


class ServiceJWTAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header[7:]
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed('Token expired.')
        except jwt.InvalidTokenError:
            raise AuthenticationFailed('Invalid token.')
        return (SimplePrincipal(payload), token)
