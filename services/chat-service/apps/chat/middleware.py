import jwt
from channels.middleware import BaseMiddleware
from django.conf import settings
from urllib.parse import parse_qs


class SimplePrincipal:
    """Minimal WS principal — no DB lookup."""
    is_authenticated = True

    def __init__(self, payload: dict):
        self.user_id = str(payload.get('user_id', ''))
        self.username = payload.get('username', '')

    def __str__(self):
        return self.username


class _AnonymousUser:
    is_authenticated = False
    user_id = None
    username = ''


class JWTAuthMiddleware(BaseMiddleware):
    """Channels middleware: decode JWT from ?token= query param — no DB lookup."""

    async def __call__(self, scope, receive, send):
        if scope['type'] == 'websocket':
            query_string = scope.get('query_string', b'').decode()
            params = parse_qs(query_string)
            token = params.get('token', [None])[0]
            if token:
                try:
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                    scope['user'] = SimplePrincipal(payload)
                except jwt.InvalidTokenError:
                    scope['user'] = _AnonymousUser()
            else:
                scope['user'] = _AnonymousUser()
        return await super().__call__(scope, receive, send)
