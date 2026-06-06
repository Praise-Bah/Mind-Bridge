from datetime import date, timedelta
from .models import UserStreak, Achievement, UserAchievement


def update_streak(user, recorded_date: date) -> UserStreak:
    """
    Update the user's daily check-in streak.
    Only acts when recorded_date == today to prevent manipulation via backdated entries.
    Awards streak-based achievements at milestones.
    """
    today = date.today()
    if recorded_date != today:
        return None

    streak, _ = UserStreak.objects.get_or_create(user=user)

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

    _award_streak_achievements(user, streak.current_streak)

    return streak


def _award_streak_achievements(user, current_streak: int) -> None:
    """Award streak milestone achievements (idempotent — uses get_or_create)."""
    milestones = {
        7:  'streak_7',
        30: 'streak_30',
    }
    for days, ach_type in milestones.items():
        if current_streak >= days:
            try:
                achievement = Achievement.objects.get(achievement_type=ach_type, is_deleted=False)
                UserAchievement.objects.get_or_create(user=user, achievement=achievement)
            except Achievement.DoesNotExist:
                pass


def award_mood_tracker_achievement(user) -> None:
    """
    Award the 'mood_tracker' achievement when the user logs their first mood entry.
    Call this after any successful mood creation.
    """
    try:
        achievement = Achievement.objects.get(achievement_type='mood_tracker', is_deleted=False)
        UserAchievement.objects.get_or_create(user=user, achievement=achievement)
    except Achievement.DoesNotExist:
        pass
