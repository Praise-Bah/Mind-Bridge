import random
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from .models import JournalEntry, JournalPrompt
from .serializers import JournalEntrySerializer, JournalPromptSerializer
from .services import JournalInsightsService


class JournalEntryListCreateView(generics.ListCreateAPIView):
    serializer_class = JournalEntrySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['mood_score']

    def get_queryset(self):
        return JournalEntry.objects.filter(
            user_id=str(self.request.user.user_id), is_deleted=False
        )


class JournalEntryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = JournalEntrySerializer

    def get_queryset(self):
        return JournalEntry.objects.filter(
            user_id=str(self.request.user.user_id), is_deleted=False
        )

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
    user_entries = list(JournalEntry.objects.filter(
        user_id=str(request.user.user_id), is_deleted=False
    ))
    service = JournalInsightsService()
    return Response({
        'insights': service.analyze_entry_patterns(user_entries),
        'streak': service.calculate_streak(user_entries),
        'mood_trends': service.get_mood_trends(user_entries),
        'total_entries': len(user_entries),
        'entries_with_mood': sum(1 for e in user_entries if e.mood_score),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mood_affirmation(request):
    entry = JournalEntry.objects.filter(
        user_id=str(request.user.user_id), is_deleted=False
    ).order_by('-created_at').first()
    service = JournalInsightsService()
    if entry:
        affirmation = service.generate_mood_affirmation(entry.mood_score)
    else:
        affirmation = 'Start your journaling journey today! Your thoughts matter.'
    return Response({'affirmation': affirmation})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def reflection_prompt(request):
    entry = JournalEntry.objects.filter(
        user_id=str(request.user.user_id), is_deleted=False
    ).order_by('-created_at').first()
    service = JournalInsightsService()
    if entry:
        prompt = service.generate_reflection_prompt(entry)
    else:
        prompt = "What's on your mind today? Take a moment to reflect on your thoughts and feelings."
    return Response({'prompt': prompt})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def journal_statistics(request):
    user_entries = JournalEntry.objects.filter(
        user_id=str(request.user.user_id), is_deleted=False
    )
    total_entries = user_entries.count()
    entries_this_month = user_entries.filter(
        created_at__month=timezone.now().month,
        created_at__year=timezone.now().year,
    ).count()
    mood_counts = {mood: user_entries.filter(mood_score=mood).count() for mood in range(1, 6)}
    all_tags = [tag for e in user_entries for tag in (e.tags or [])]
    tag_counts = {}
    for tag in all_tags:
        tag_counts[tag] = tag_counts.get(tag, 0) + 1
    service = JournalInsightsService()
    streak = service.calculate_streak(list(user_entries))
    return Response({
        'total_entries': total_entries,
        'entries_this_month': entries_this_month,
        'current_streak': streak,
        'mood_distribution': mood_counts,
        'top_tags': sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:10],
        'avg_words_per_entry': sum(len(e.content or '') for e in user_entries) // max(total_entries, 1),
    })
