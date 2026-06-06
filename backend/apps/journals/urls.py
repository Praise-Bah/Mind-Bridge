from django.urls import path
from .views import (
    JournalEntryListCreateView, JournalEntryDetailView, DailyPromptView,
    journal_insights, mood_affirmation, reflection_prompt, journal_statistics
)

urlpatterns = [
    path('', JournalEntryListCreateView.as_view(), name='journal_list'),
    path('<uuid:pk>/', JournalEntryDetailView.as_view(), name='journal_detail'),
    path('prompt/', DailyPromptView.as_view(), name='daily_prompt'),
    path('insights/', journal_insights, name='journal_insights'),
    path('affirmation/', mood_affirmation, name='mood_affirmation'),
    path('reflection/', reflection_prompt, name='reflection_prompt'),
    path('statistics/', journal_statistics, name='journal_statistics'),
]
