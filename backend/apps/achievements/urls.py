from django.urls import path
from .views import AchievementListView, UserAchievementListView, UserStreakView, UserProgressView

urlpatterns = [
    path('', AchievementListView.as_view(), name='achievement_list'),
    path('my-achievements/', UserAchievementListView.as_view(), name='user_achievements'),
    path('streak/', UserStreakView.as_view(), name='user_streak'),
    path('progress/', UserProgressView.as_view(), name='user_progress'),
]
