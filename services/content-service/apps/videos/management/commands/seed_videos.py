"""Seed initial mental health YouTube videos into the database.

Run once on each environment:
  docker exec docker-content-service-1 python manage.py seed_videos
  python manage.py seed_videos           # local dev
"""
from django.core.management.base import BaseCommand
from apps.videos.models import Video, VideoCategory


CATEGORIES = [
    {'name': 'Anxiety & Stress',     'slug': 'anxiety-stress',     'mood_tags': ['anxious', 'overwhelmed', 'stressed']},
    {'name': 'Depression & Sadness', 'slug': 'depression-sadness', 'mood_tags': ['sad', 'depressed', 'hopeless']},
    {'name': 'Mindfulness & Calm',   'slug': 'mindfulness-calm',   'mood_tags': ['calm', 'relaxed', 'peaceful']},
    {'name': 'Self-Esteem & Growth', 'slug': 'self-esteem-growth', 'mood_tags': ['happy', 'motivated', 'confident']},
    {'name': 'Sleep & Rest',         'slug': 'sleep-rest',         'mood_tags': ['tired', 'overwhelmed', 'calm']},
]

# Real YouTube video IDs from popular mental-health creators
VIDEOS = [
    # Anxiety & Stress
    {
        'title': 'How to Deal With Anxiety | Kati Morton',
        'description': 'Licensed therapist Kati Morton explains practical strategies for managing anxiety day-to-day.',
        'youtube_id': 'WWloIAQpMcQ',
        'category_slug': 'anxiety-stress',
        'mood_tags': ['anxious', 'overwhelmed'],
        'is_featured': True,
        'thumbnail': 'https://img.youtube.com/vi/WWloIAQpMcQ/hqdefault.jpg',
    },
    {
        'title': '5-Minute Breathing Exercise to Calm Anxiety | Therapy in a Nutshell',
        'description': 'A short guided breathing technique you can use anywhere to reduce acute anxiety.',
        'youtube_id': 'odADwWzHR24',
        'category_slug': 'anxiety-stress',
        'mood_tags': ['anxious', 'stressed'],
        'is_featured': False,
        'thumbnail': 'https://img.youtube.com/vi/odADwWzHR24/hqdefault.jpg',
    },
    {
        'title': 'Understanding Stress and How to Manage It | TED-Ed',
        'description': 'TED-Ed explains the science of stress and evidence-based coping strategies.',
        'youtube_id': 'hnpQrMqDoqE',
        'category_slug': 'anxiety-stress',
        'mood_tags': ['stressed', 'overwhelmed'],
        'is_featured': False,
        'thumbnail': 'https://img.youtube.com/vi/hnpQrMqDoqE/hqdefault.jpg',
    },
    # Depression & Sadness
    {
        'title': 'Depression: How It Really Feels | Psych2Go',
        'description': 'An honest look at what depression feels like from the inside and how to seek help.',
        'youtube_id': 'z-IR48Mb3W0',
        'category_slug': 'depression-sadness',
        'mood_tags': ['sad', 'depressed'],
        'is_featured': True,
        'thumbnail': 'https://img.youtube.com/vi/z-IR48Mb3W0/hqdefault.jpg',
    },
    {
        'title': 'How to Help Someone With Depression | Kati Morton',
        'description': 'Therapist Kati Morton shares how to support a friend or family member struggling with depression.',
        'youtube_id': '1a7jMmTK9Wg',
        'category_slug': 'depression-sadness',
        'mood_tags': ['sad', 'hopeless'],
        'is_featured': False,
        'thumbnail': 'https://img.youtube.com/vi/1a7jMmTK9Wg/hqdefault.jpg',
    },
    # Mindfulness & Calm
    {
        'title': '10-Minute Guided Meditation for Beginners | Headspace',
        'description': 'A calm, beginner-friendly guided meditation to reduce stress and improve focus.',
        'youtube_id': 'inpok4MKVLM',
        'category_slug': 'mindfulness-calm',
        'mood_tags': ['calm', 'relaxed'],
        'is_featured': True,
        'thumbnail': 'https://img.youtube.com/vi/inpok4MKVLM/hqdefault.jpg',
    },
    {
        'title': 'What Is Mindfulness? | Therapy in a Nutshell',
        'description': 'A clear explanation of mindfulness and how it benefits mental health.',
        'youtube_id': 'HmEo6RI4Wvs',
        'category_slug': 'mindfulness-calm',
        'mood_tags': ['calm', 'peaceful'],
        'is_featured': False,
        'thumbnail': 'https://img.youtube.com/vi/HmEo6RI4Wvs/hqdefault.jpg',
    },
    {
        'title': 'Body Scan Meditation for Stress Relief | Mindful Movement',
        'description': 'A 15-minute body scan meditation to release physical tension and quiet the mind.',
        'youtube_id': 'QS2yDmWk0vs',
        'category_slug': 'mindfulness-calm',
        'mood_tags': ['stressed', 'overwhelmed', 'calm'],
        'is_featured': False,
        'thumbnail': 'https://img.youtube.com/vi/QS2yDmWk0vs/hqdefault.jpg',
    },
    # Self-Esteem & Growth
    {
        'title': 'How to Build Self-Confidence | Psych2Go',
        'description': 'Science-backed tips to build genuine self-confidence and overcome self-doubt.',
        'youtube_id': 'w-HYZv6HzAs',
        'category_slug': 'self-esteem-growth',
        'mood_tags': ['happy', 'motivated'],
        'is_featured': True,
        'thumbnail': 'https://img.youtube.com/vi/w-HYZv6HzAs/hqdefault.jpg',
    },
    {
        'title': 'The Power of Vulnerability | Brené Brown TED Talk',
        'description': "Brené Brown's iconic TED talk on vulnerability, shame, and human connection.",
        'youtube_id': 'iCvmsMzlF7o',
        'category_slug': 'self-esteem-growth',
        'mood_tags': ['motivated', 'confident'],
        'is_featured': False,
        'thumbnail': 'https://img.youtube.com/vi/iCvmsMzlF7o/hqdefault.jpg',
    },
    # Sleep & Rest
    {
        'title': 'Why Sleep Is Your Superpower | Matt Walker TED Talk',
        'description': 'Sleep scientist Matt Walker explains how sleep improves mental and physical health.',
        'youtube_id': '5MuIMqhT8oM',
        'category_slug': 'sleep-rest',
        'mood_tags': ['tired', 'overwhelmed'],
        'is_featured': True,
        'thumbnail': 'https://img.youtube.com/vi/5MuIMqhT8oM/hqdefault.jpg',
    },
    {
        'title': 'Sleep Meditation: Calm Your Mind | Jason Stephenson',
        'description': 'A soothing guided sleep meditation to quiet racing thoughts and ease into rest.',
        'youtube_id': 'aEqlQvczMJQ',
        'category_slug': 'sleep-rest',
        'mood_tags': ['calm', 'tired'],
        'is_featured': False,
        'thumbnail': 'https://img.youtube.com/vi/aEqlQvczMJQ/hqdefault.jpg',
    },
]


class Command(BaseCommand):
    help = 'Seed initial mental health YouTube videos'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear', action='store_true',
            help='Delete all existing videos and categories before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            Video.objects.all().delete()
            VideoCategory.objects.all().delete()
            self.stdout.write('Cleared existing videos and categories.')

        # Create categories
        cat_map = {}
        for cat_data in CATEGORIES:
            cat, created = VideoCategory.objects.get_or_create(
                slug=cat_data['slug'],
                defaults={'name': cat_data['name'], 'mood_tags': cat_data['mood_tags']},
            )
            cat_map[cat_data['slug']] = cat
            if created:
                self.stdout.write(f'  Created category: {cat.name}')

        # Create videos
        created_count = 0
        skipped_count = 0
        for v in VIDEOS:
            category = cat_map.get(v['category_slug'])
            _, created = Video.objects.get_or_create(
                youtube_id=v['youtube_id'],
                defaults={
                    'title': v['title'],
                    'description': v['description'],
                    'source_type': 'youtube',
                    'thumbnail': v['thumbnail'],
                    'category': category,
                    'mood_tags': v['mood_tags'],
                    'is_featured': v.get('is_featured', False),
                    'duration_seconds': 0,
                },
            )
            if created:
                created_count += 1
                self.stdout.write(f'  Added: {v["title"]}')
            else:
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'\nDone. {created_count} videos added, {skipped_count} already existed.'
            )
        )
