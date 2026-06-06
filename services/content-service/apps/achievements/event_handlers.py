"""Content service inbound event handlers (achievements/streak logic)."""
import logging
from datetime import date

logger = logging.getLogger(__name__)


def handle_user_mood_recorded(payload: dict):
    """Update streak and award mood_tracker achievement when a mood entry is recorded."""
    from apps.achievements.services import update_streak, award_mood_tracker_achievement

    user_id = payload.get('user_id')
    recorded_date_str = payload.get('recorded_date')
    if not user_id or not recorded_date_str:
        return

    try:
        recorded_date = date.fromisoformat(recorded_date_str)
    except (ValueError, TypeError):
        recorded_date = date.today()

    try:
        update_streak(str(user_id), recorded_date)
        award_mood_tracker_achievement(str(user_id))
        logger.debug('Processed mood_recorded for user %s', user_id)
    except Exception:
        logger.exception('Error processing user.mood_recorded for user %s', user_id)


EVENT_HANDLERS = {
    'mindbridge.events.user.mood_recorded': handle_user_mood_recorded,
}
