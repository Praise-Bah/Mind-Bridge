from django.urls import path
from .views import UserProfileView, UserMoodListCreateView, UserMoodDetailView

urlpatterns = [
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('moods/', UserMoodListCreateView.as_view(), name='mood_list_create'),
    path('moods/<uuid:pk>/', UserMoodDetailView.as_view(), name='mood_detail'),
]
