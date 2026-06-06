from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class MindBridgeTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Embed user_id, username, and is_staff into JWT payload.

    Other services decode this token locally (no DB lookup) using the shared
    SECRET_KEY and read these claims via SimplePrincipal.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['user_id'] = str(user.id)
        token['username'] = user.username
        token['is_staff'] = user.is_staff
        token['is_professional'] = user.is_professional
        return token
