import jwt
from django.conf import settings
from urllib.parse import parse_qs


class SimplePrincipal:
    """WS-only principal (mirrors authentication.py SimplePrincipal but for async scope)."""
    is_authenticated = True
    is_active = True

    def __init__(self, payload: dict):
        self.user_id = str(payload.get('user_id', ''))
        self.username = payload.get('username', '')
        self.is_staff = bool(payload.get('is_staff', False))

    def __str__(self):
        return self.username


class JWTAuthMiddleware:
    """Channels ASGI middleware that authenticates WebSocket connections via query-param JWT.

    The frontend should connect with: ws://host/ws/notifications/?token=<access_token>
    Sets scope['user'] to SimplePrincipal so consumers can read scope['user'].user_id.
    """

    def __init__(self, inner):
        self.inner = inner

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

        return await self.inner(scope, receive, send)


class _AnonymousUser:
    is_authenticated = False
    user_id = None
