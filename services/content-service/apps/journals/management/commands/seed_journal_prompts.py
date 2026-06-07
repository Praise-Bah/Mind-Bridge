"""Seed daily journal prompts.

Run once on each environment:
  docker exec docker-content-service-1 python manage.py seed_journal_prompts
  python manage.py seed_journal_prompts           # local dev
"""
from django.core.management.base import BaseCommand
from apps.journals.models import JournalPrompt


PROMPTS = [
    {'prompt_text': 'What is one thing that made you smile today, and why?', 'category': 'gratitude'},
    {'prompt_text': 'Describe a challenge you faced recently. How did you handle it?', 'category': 'reflection'},
    {'prompt_text': "What are three things you're grateful for right now?", 'category': 'gratitude'},
    {'prompt_text': 'How are you really feeling today? Try to name the emotion behind the emotion.', 'category': 'mood'},
    {'prompt_text': 'Write about a moment this week when you felt proud of yourself.', 'category': 'growth'},
    {'prompt_text': 'What is something that has been weighing on your mind lately?', 'category': 'reflection'},
    {'prompt_text': 'Describe your ideal calm, peaceful day from start to finish.', 'category': 'mindfulness'},
    {'prompt_text': 'What is one small step you can take tomorrow toward a goal that matters to you?', 'category': 'growth'},
    {'prompt_text': 'Who is someone that supports you, and how do they make a difference in your life?', 'category': 'relationships'},
    {'prompt_text': 'What does self-care look like for you this week?', 'category': 'self-care'},
    {'prompt_text': 'Write a kind letter to yourself about how this week has gone.', 'category': 'self-compassion'},
    {'prompt_text': 'What thought have you been replaying in your head, and what would you tell a friend who had that same thought?', 'category': 'reflection'},
]


class Command(BaseCommand):
    help = 'Seed daily journal prompts'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', action='store_true',
            help='Delete all existing prompts before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            JournalPrompt.objects.all().delete()
            self.stdout.write('Cleared existing journal prompts.')

        created_count = 0
        skipped_count = 0
        for p in PROMPTS:
            _, created = JournalPrompt.objects.get_or_create(
                prompt_text=p['prompt_text'],
                defaults={'category': p['category'], 'is_active': True},
            )
            if created:
                created_count += 1
            else:
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. {created_count} prompts added, {skipped_count} already existed.'
            )
        )
