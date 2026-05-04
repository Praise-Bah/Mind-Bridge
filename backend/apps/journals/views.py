from rest_framework import generics
from django_filters.rest_framework import DjangoFilterBackend
from .models import JournalEntry, JournalPrompt
from .serializers import JournalEntrySerializer, JournalPromptSerializer
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
