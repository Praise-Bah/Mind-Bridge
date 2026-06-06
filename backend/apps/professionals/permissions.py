from rest_framework.permissions import BasePermission


class IsProfessional(BasePermission):
    """Allow access only to approved professional users."""

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.is_professional):
            return False
        # Auto-create profile for approved professionals who don't have one yet
        from apps.professionals.models import ProfessionalProfile
        ProfessionalProfile.objects.get_or_create(
            user=request.user,
            defaults={
                'title': '',
                'bio': '',
                'credentials': '',
                'years_of_experience': 0,
                'session_rate': 0,
                'status': 'approved',
            }
        )
        return True
