from datetime import date, timedelta
from .models import UserStreak, Achievement, UserAchievement


def update_streak(user_id: str, recorded_date: date) -> UserStreak:
    """Update user's daily check-in streak. Only acts when recorded_date == today."""
    today = date.today()
    if recorded_date != today:
        return None

    streak, _ = UserStreak.objects.get_or_create(user_id=str(user_id))

    if streak.last_activity_date == today:
        return streak

    if streak.last_activity_date == today - timedelta(days=1):
        streak.current_streak += 1
    else:
        streak.current_streak = 1

    streak.last_activity_date = today

    if streak.current_streak > streak.longest_streak:
        streak.longest_streak = streak.current_streak

    streak.save(update_fields=['current_streak', 'longest_streak', 'last_activity_date', 'updated_at'])

    _award_streak_achievements(user_id, streak.current_streak)
    return streak


def _award_streak_achievements(user_id: str, current_streak: int) -> None:
    milestones = {7: 'streak_7', 30: 'streak_30'}
    for days, ach_type in milestones.items():
        if current_streak >= days:
            try:
                achievement = Achievement.objects.get(achievement_type=ach_type, is_deleted=False)
                UserAchievement.objects.get_or_create(user_id=str(user_id), achievement=achievement)
            except Achievement.DoesNotExist:
                pass


def award_mood_tracker_achievement(user_id: str) -> None:
    """Award the 'mood_tracker' achievement on first mood entry."""
    try:
        achievement = Achievement.objects.get(achievement_type='mood_tracker', is_deleted=False)
        UserAchievement.objects.get_or_create(user_id=str(user_id), achievement=achievement)
    except Achievement.DoesNotExist:
        pass
