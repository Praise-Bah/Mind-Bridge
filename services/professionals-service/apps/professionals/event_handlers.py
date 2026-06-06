"""Professionals service inbound event handlers."""
import logging

logger = logging.getLogger(__name__)


def handle_user_registered(payload: dict):
    from apps.professionals.models import UserSnapshot
    user_id = payload.get('user_id')
    if not user_id:
        return
    UserSnapshot.objects.update_or_create(
        user_id=str(user_id),
        defaults={
            'username': payload.get('username', ''),
            'first_name': payload.get('first_name', ''),
            'last_name': payload.get('last_name', ''),
            'email': payload.get('email', ''),
            'avatar_url': payload.get('avatar_url', ''),
            'is_professional': payload.get('is_professional', False),
            'is_online': payload.get('is_online', False),
        },
    )
    logger.debug('Upserted UserSnapshot for user %s', user_id)


def handle_user_profile_updated(payload: dict):
    handle_user_registered(payload)
    # Also update denormalized data on ProfessionalProfile if this user is a professional
    from apps.professionals.models import ProfessionalProfile
    user_id = payload.get('user_id')
    if not user_id:
        return
    first_name = payload.get('first_name', '')
    last_name = payload.get('last_name', '')
    full_name = f'{first_name} {last_name}'.strip()
    ProfessionalProfile.objects.filter(user_id=str(user_id)).update(
        user_full_name=full_name,
        user_avatar_url=payload.get('avatar_url', ''),
        user_is_online=payload.get('is_online', False),
    )


def handle_professional_application_approved(payload: dict):
    """Create ProfessionalProfile when auth-service approves a professional application."""
    from apps.professionals.models import ProfessionalProfile
    user_id = payload.get('user_id')
    if not user_id:
        return
    first_name = payload.get('first_name', '')
    last_name = payload.get('last_name', '')
    full_name = f'{first_name} {last_name}'.strip() or payload.get('username', '')
    profile, created = ProfessionalProfile.objects.get_or_create(
        user_id=str(user_id),
        defaults={
            'user_full_name': full_name,
            'user_email': payload.get('email', ''),
            'title': '',
            'bio': payload.get('bio', ''),
            'credentials': '',
            'years_of_experience': payload.get('years_of_experience', 0),
            'status': 'approved',
        },
    )
    if not created:
        profile.user_full_name = full_name
        profile.user_email = payload.get('email', '')
        profile.status = 'approved'
        profile.save(update_fields=['user_full_name', 'user_email', 'status'])
    logger.info('ProfessionalProfile %s for user %s', 'created' if created else 'updated', user_id)


EVENT_HANDLERS = {
    'mindbridge.events.user.registered': handle_user_registered,
    'mindbridge.events.user.profile_updated': handle_user_profile_updated,
    'mindbridge.events.professional.application_approved': handle_professional_application_approved,
}
