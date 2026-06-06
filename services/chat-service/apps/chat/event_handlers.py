"""Chat service inbound event handlers.

Keeps the UserSnapshot table in sync with auth service events so the
chat service never needs a cross-service DB query at request time.
"""
import logging
from .models import UserSnapshot

logger = logging.getLogger(__name__)


def handle_user_registered(payload: dict):
    """Create a UserSnapshot when a new user registers."""
    user_id = payload.get('user_id')
    if not user_id:
        return
    snap, created = UserSnapshot.objects.update_or_create(
        user_id=user_id,
        defaults={
            'username': payload.get('username', ''),
            'avatar_url': payload.get('avatar_url', ''),
            'is_online': False,
        },
    )
    action = 'Created' if created else 'Updated'
    logger.debug('%s UserSnapshot for user_id=%s', action, user_id)


def handle_user_profile_updated(payload: dict):
    """Update the UserSnapshot when a user changes their profile."""
    user_id = payload.get('user_id')
    if not user_id:
        return
    updated = UserSnapshot.objects.filter(user_id=user_id).update(
        username=payload.get('username', ''),
        avatar_url=payload.get('avatar_url', ''),
        is_online=payload.get('is_online', False),
    )
    if not updated:
        # Snapshot doesn't exist yet — create it so future messages work
        UserSnapshot.objects.create(
            user_id=user_id,
            username=payload.get('username', ''),
            avatar_url=payload.get('avatar_url', ''),
            is_online=payload.get('is_online', False),
        )
    logger.debug('Synced UserSnapshot for user_id=%s', user_id)


EVENT_HANDLERS = {
    'mindbridge.events.user.registered': handle_user_registered,
    'mindbridge.events.user.profile_updated': handle_user_profile_updated,
}
