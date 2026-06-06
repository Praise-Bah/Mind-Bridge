from django.db import models
from mindbridge_common.models import BaseModel


class Achievement(BaseModel):
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


class UserAchievement(BaseModel):
    user_id = models.UUIDField(db_index=True)
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE, related_name='user_achievements')
    earned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'user_achievements'
        unique_together = ['user_id', 'achievement']


class UserStreak(BaseModel):
    user_id = models.UUIDField(unique=True, db_index=True)
    current_streak = models.PositiveIntegerField(default=0)
    longest_streak = models.PositiveIntegerField(default=0)
    last_activity_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = 'user_streaks'
