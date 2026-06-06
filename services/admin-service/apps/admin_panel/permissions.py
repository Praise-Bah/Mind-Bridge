from rest_framework.permissions import BasePermission


class IsAdminPrincipal(BasePermission):
    """Requires is_staff=True embedded in the JWT."""
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, 'is_staff', False)
        )
