from django.urls import path
from .views import JournalEntryListCreateView, JournalEntryDetailView, DailyPromptView

urlpatterns = [
    path('', JournalEntryListCreateView.as_view(), name='journal_list'),
    path('<uuid:pk>/', JournalEntryDetailView.as_view(), name='journal_detail'),
    path('prompt/', DailyPromptView.as_view(), name='daily_prompt'),
]
