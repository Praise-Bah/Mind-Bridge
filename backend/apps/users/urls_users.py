from django.urls import path
from .views import UserProfileView, UserMoodListCreateView, UserMoodDetailView, UserGoalListCreateView, UserGoalDetailView, ProfileOverviewView, UserMoodCalendarView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('profile/overview/', ProfileOverviewView.as_view(), name='profile_overview'),
    path('moods/', UserMoodListCreateView.as_view(), name='mood_list_create'),
    path('moods/<uuid:pk>/', UserMoodDetailView.as_view(), name='mood_detail'),
    path('moods/calendar/', UserMoodCalendarView.as_view(), name='mood_calendar'),
    path('goals/', UserGoalListCreateView.as_view(), name='goals_list_create'),
    path('goals/<uuid:pk>/', UserGoalDetailView.as_view(), name='goals_detail'),
]
