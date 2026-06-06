from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import JournalEntry, JournalPrompt
from .serializers import JournalEntrySerializer, JournalPromptSerializer
from .services import JournalInsightsService
import random


class JournalEntryListCreateView(generics.ListCreateAPIView):
    serializer_class = JournalEntrySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['mood_score']

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user, is_deleted=False)


class JournalEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JournalEntrySerializer

    def get_queryset(self):
        return JournalEntry.objects.filter(user=self.request.user, is_deleted=False)

    def perform_destroy(self, instance):
        instance.is_deleted = True
        instance.save()


class DailyPromptView(generics.RetrieveAPIView):
    serializer_class = JournalPromptSerializer

    def get_object(self):
        prompts = JournalPrompt.objects.filter(is_active=True, is_deleted=False)
        if prompts.exists():
            return random.choice(list(prompts))
        return None


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def journal_insights(request):
    """Get AI-powered insights for user's journal entries."""
    user_entries = JournalEntry.objects.filter(user=request.user, is_deleted=False)
    insights_service = JournalInsightsService()
    
    insights = insights_service.analyze_entry_patterns(user_entries)
    streak = insights_service.calculate_streak(user_entries)
    mood_trends = insights_service.get_mood_trends(user_entries)
    
    return Response({
        'insights': insights,
        'streak': streak,
        'mood_trends': mood_trends,
        'total_entries': user_entries.count(),
        'entries_with_mood': user_entries.filter(mood_score__isnull=False).count()
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mood_affirmation(request):
    """Get a positive affirmation based on recent mood."""
    user_entries = JournalEntry.objects.filter(user=request.user, is_deleted=False).order_by('-created_at')
    
    if not user_entries.exists():
        affirmation = "Start your journaling journey today! Your thoughts matter."
    else:
        latest_entry = user_entries.first()
        insights_service = JournalInsightsService()
        affirmation = insights_service.generate_mood_affirmation(latest_entry.mood_score)
    
    return Response({'affirmation': affirmation})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reflection_prompt(request):
    """Get a personalized reflection prompt."""
    user_entries = JournalEntry.objects.filter(user=request.user, is_deleted=False).order_by('-created_at')
    
    if not user_entries.exists():
        prompt = "What's on your mind today? Take a moment to reflect on your thoughts and feelings."
    else:
        latest_entry = user_entries.first()
        insights_service = JournalInsightsService()
        prompt = insights_service.generate_reflection_prompt(latest_entry)
    
    return Response({'prompt': prompt})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def journal_statistics(request):
    """Get detailed journal statistics."""
    user_entries = JournalEntry.objects.filter(user=request.user, is_deleted=False)
    
    # Basic stats
    total_entries = user_entries.count()
    entries_this_month = user_entries.filter(
        created_at__month=timezone.now().month,
        created_at__year=timezone.now().year
    ).count()
    
    # Mood statistics
    mood_counts = {}
    for mood in range(1, 6):
        mood_counts[mood] = user_entries.filter(mood_score=mood).count()
    
    # Tag analysis
    all_tags = []
    for entry in user_entries:
        if entry.tags:
            all_tags.extend(entry.tags)
    
    tag_counts = {}
    for tag in all_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
    
    # Writing consistency
    insights_service = JournalInsightsService()
    streak = insights_service.calculate_streak(user_entries)
    
    return Response({
        'total_entries': total_entries,
        'entries_this_month': entries_this_month,
        'current_streak': streak,
        'mood_distribution': mood_counts,
        'top_tags': sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10],
        'avg_words_per_entry': sum(len(entry.content or '') for entry in user_entries) // max(total_entries, 1)
    })
