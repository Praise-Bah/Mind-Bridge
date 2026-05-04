from django.db import models
from django.conf import settings
from apps.users.models import BaseModel


class Achievement(BaseModel):
    """Achievement/Badge definitions."""
    ACHIEVEMENT_TYPES = [
        ('streak_7', '7-Day Streak'),
        ('streak_30', '30-Day Streak'),
        ('first_session', 'First Session Booked'),
        ('community_helper', 'Community Helper'),
        ('journal_writer', 'Journal Writer'),
        ('video_watcher', 'Video Watcher'),
        ('mood_tracker', 'Mood Tracker'),
    ]

    name = models.CharField(max_length=100)
    description = models.TextField()
    achievement_type = models.CharField(max_length=30, choices=ACHIEVEMENT_TYPES, unique=True)
    icon = models.ImageField(upload_to='achievement_icons/', blank=True, null=True)
    points = models.PositiveIntegerField(default=10)
    requirement_count = models.PositiveIntegerField(default=1)

    class Meta:
        db_table = 'achievements'

    def __str__(self):
        return self.name


class UserAchievement(BaseModel):
    """User earned achievements."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='user_achievements')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_achievements'
        unique_together = ['user', 'achievement']

    def __str__(self):
        return f"{self.user.username} - {self.achievement.name}"


class UserStreak(BaseModel):
    """Track user daily streaks."""
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='streak')
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'user_streaks'

    def __str__(self):
        return f"{self.user.username} - {self.current_streak} days"
