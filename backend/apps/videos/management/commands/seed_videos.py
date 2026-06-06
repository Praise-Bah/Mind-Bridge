from django.core.management.base import BaseCommand
from apps.videos.models import Video, VideoCategory

class Command(BaseCommand):
    help = 'Seeds initial mental health videos and categories'

    def handle(self, *args, **options):
        self.stdout.write('Seeding categories...')
        categories_data = [
            {'name': 'Meditation & Calm', 'slug': 'meditation-calm', 'mood_tags': ['calm', 'happy']},
            {'name': 'Anxiety & Relief', 'slug': 'anxiety-relief', 'mood_tags': ['anxious', 'overwhelmed']},
            {'name': 'Mood Boosters', 'slug': 'mood-boosters', 'mood_tags': ['sad', 'happy']},
            {'name': 'Yoga & Somatic', 'slug': 'yoga-somatic', 'mood_tags': ['sad', 'calm', 'overwhelmed']},
            {'name': 'Sleep & Relaxation', 'slug': 'sleep-relaxation', 'mood_tags': ['calm', 'overwhelmed']},
            {'name': 'Fun & Uplifting', 'slug': 'fun-uplifting', 'mood_tags': ['happy', 'sad']},
            {'name': 'Nature & ASMR', 'slug': 'nature-asmr', 'mood_tags': ['calm', 'anxious']},
            {'name': 'Motivation & Growth', 'slug': 'motivation-growth', 'mood_tags': ['happy', 'sad', 'overwhelmed']},
        ]

        categories = {}
        for cat_info in categories_data:
            cat, created = VideoCategory.objects.get_or_create(
                slug=cat_info['slug'],
                defaults={
                    'name': cat_info['name'],
                    'mood_tags': cat_info['mood_tags']
                }
            )
            categories[cat.slug] = cat
            if created:
                self.stdout.write(f"Created category: {cat.name}")

        self.stdout.write('Seeding videos...')
        videos_data = [
            # Meditation & Calm (10 videos)
            {'title': '10-Minute Meditation For Beginners', 'description': 'A simple guided meditation perfect for beginners to start their mindfulness journey.', 'youtube_id': 'U9YKY7fdwyg', 'duration_seconds': 600, 'category': 'meditation-calm', 'mood_tags': ['calm', 'happy'], 'is_featured': True},
            {'title': 'Guided Morning Meditation', 'description': 'Start your day with clarity and positive energy with this calming morning meditation.', 'youtube_id': 'ENYYb5vIMkU', 'duration_seconds': 600, 'category': 'meditation-calm', 'mood_tags': ['calm', 'happy'], 'is_featured': False},
            {'title': '5 Minute Meditation You Can Do Anywhere', 'description': 'A quick meditation break you can take anywhere to reset your mind.', 'youtube_id': 'inpok4MKVLM', 'duration_seconds': 300, 'category': 'meditation-calm', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Daily Calm - 10 Minute Mindfulness Meditation', 'description': 'Find your daily dose of calm with this peaceful mindfulness practice.', 'youtube_id': 'ZToicYcHIOU', 'duration_seconds': 600, 'category': 'meditation-calm', 'mood_tags': ['calm', 'happy'], 'is_featured': False},
            {'title': 'Meditation for Inner Peace', 'description': 'A gentle meditation to help you find inner peace and tranquility.', 'youtube_id': 'FjHGZj2IjBk', 'duration_seconds': 900, 'category': 'meditation-calm', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Breathing Meditation for Relaxation', 'description': 'Focus on your breath and let go of tension with this relaxing meditation.', 'youtube_id': 'SEfs5TJZ6Nk', 'duration_seconds': 600, 'category': 'meditation-calm', 'mood_tags': ['calm', 'anxious'], 'is_featured': False},
            {'title': 'Peaceful Mind Meditation', 'description': 'Quiet your thoughts and find mental clarity with this peaceful meditation.', 'youtube_id': '1ZYbU82GVz4', 'duration_seconds': 720, 'category': 'meditation-calm', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Guided Visualization for Stress Relief', 'description': 'Use the power of visualization to melt away stress and tension.', 'youtube_id': 'nf3FHKX7DhE', 'duration_seconds': 900, 'category': 'meditation-calm', 'mood_tags': ['calm', 'overwhelmed'], 'is_featured': False},
            {'title': 'Loving Kindness Meditation', 'description': 'Cultivate compassion and love for yourself and others.', 'youtube_id': '-d_AA9H4z9U', 'duration_seconds': 600, 'category': 'meditation-calm', 'mood_tags': ['calm', 'happy'], 'is_featured': False},
            {'title': 'Body Scan Meditation for Deep Relaxation', 'description': 'Release tension throughout your body with this guided body scan.', 'youtube_id': 'QS2yDmWk0vs', 'duration_seconds': 1200, 'category': 'meditation-calm', 'mood_tags': ['calm'], 'is_featured': False},

            # Anxiety & Relief (8 videos)
            {'title': 'Calm Anxiety in 10 Minutes', 'description': 'Quick techniques to calm your anxious mind and find relief.', 'youtube_id': 'O-6f5wQXSu8', 'duration_seconds': 600, 'category': 'anxiety-relief', 'mood_tags': ['anxious', 'overwhelmed'], 'is_featured': True},
            {'title': 'Box Breathing Exercise', 'description': 'Learn the Navy SEAL breathing technique for instant calm.', 'youtube_id': 'tEmt1Znux58', 'duration_seconds': 300, 'category': 'anxiety-relief', 'mood_tags': ['anxious'], 'is_featured': False},
            {'title': '4-7-8 Breathing Technique', 'description': 'A powerful breathing pattern to reduce anxiety and promote relaxation.', 'youtube_id': 'YRPh_GaiL8s', 'duration_seconds': 300, 'category': 'anxiety-relief', 'mood_tags': ['anxious', 'overwhelmed'], 'is_featured': False},
            {'title': 'Grounding Exercise for Anxiety', 'description': 'Use the 5-4-3-2-1 grounding technique to come back to the present moment.', 'youtube_id': '30VMIEmA114', 'duration_seconds': 480, 'category': 'anxiety-relief', 'mood_tags': ['anxious'], 'is_featured': False},
            {'title': 'Progressive Muscle Relaxation', 'description': 'Release physical tension caused by anxiety with this guided relaxation.', 'youtube_id': '1nZEdqcGVzo', 'duration_seconds': 900, 'category': 'anxiety-relief', 'mood_tags': ['anxious', 'overwhelmed'], 'is_featured': False},
            {'title': 'Meditation for Panic Attacks', 'description': 'A calming meditation to help during moments of panic or intense anxiety.', 'youtube_id': 'MR57rug8NsM', 'duration_seconds': 600, 'category': 'anxiety-relief', 'mood_tags': ['anxious'], 'is_featured': False},
            {'title': 'Anxiety Relief Hypnosis', 'description': 'Deep relaxation hypnosis session to release anxiety and worry.', 'youtube_id': 'j7d5Plai03g', 'duration_seconds': 1800, 'category': 'anxiety-relief', 'mood_tags': ['anxious', 'calm'], 'is_featured': False},
            {'title': 'Calming Music for Anxiety', 'description': 'Soothing music designed to calm anxious thoughts and promote peace.', 'youtube_id': 'lFcSrYw-ARY', 'duration_seconds': 3600, 'category': 'anxiety-relief', 'mood_tags': ['anxious', 'calm'], 'is_featured': False},

            # Yoga & Somatic (7 videos)
            {'title': 'Yoga for Stress Relief', 'description': 'A gentle yoga flow to release stress and tension from your body.', 'youtube_id': 'hJbRpHZr_d0', 'duration_seconds': 1200, 'category': 'yoga-somatic', 'mood_tags': ['calm', 'overwhelmed'], 'is_featured': True},
            {'title': 'Morning Yoga Stretch', 'description': 'Wake up your body with this energizing morning yoga routine.', 'youtube_id': 'UEEsdXn8oG8', 'duration_seconds': 600, 'category': 'yoga-somatic', 'mood_tags': ['happy', 'calm'], 'is_featured': False},
            {'title': 'Bedtime Yoga for Better Sleep', 'description': 'Wind down with this relaxing bedtime yoga sequence.', 'youtube_id': 'v7AYKMP6rOE', 'duration_seconds': 1200, 'category': 'yoga-somatic', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Yoga for Anxiety and Stress', 'description': 'Calm your nervous system with this anxiety-relieving yoga practice.', 'youtube_id': 'bJJWArRfKa0', 'duration_seconds': 900, 'category': 'yoga-somatic', 'mood_tags': ['anxious', 'calm'], 'is_featured': False},
            {'title': 'Gentle Stretching for Relaxation', 'description': 'Easy stretches to release muscle tension and promote relaxation.', 'youtube_id': 'g_tea8ZNk5A', 'duration_seconds': 900, 'category': 'yoga-somatic', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Yoga for Depression', 'description': 'A nurturing yoga practice to lift your mood when feeling low.', 'youtube_id': '9oX1ClMz8RA', 'duration_seconds': 1200, 'category': 'yoga-somatic', 'mood_tags': ['sad', 'calm'], 'is_featured': False},
            {'title': 'Chair Yoga for Beginners', 'description': 'Accessible yoga you can do from a chair, perfect for any fitness level.', 'youtube_id': 'KEjiXtb2hRg', 'duration_seconds': 900, 'category': 'yoga-somatic', 'mood_tags': ['calm', 'happy'], 'is_featured': False},

            # Sleep & Relaxation (7 videos)
            {'title': 'Sleep Meditation - Fall Asleep Fast', 'description': 'Drift off to peaceful sleep with this calming guided meditation.', 'youtube_id': 'rvaqPPjtxng', 'duration_seconds': 1800, 'category': 'sleep-relaxation', 'mood_tags': ['calm'], 'is_featured': True},
            {'title': 'Rain Sounds for Sleep', 'description': 'Relaxing rain sounds to help you fall asleep and stay asleep.', 'youtube_id': 'mPZkdNFkNps', 'duration_seconds': 28800, 'category': 'sleep-relaxation', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Deep Sleep Music', 'description': 'Calming music designed to promote deep, restful sleep.', 'youtube_id': '1ZYbU82GVz4', 'duration_seconds': 28800, 'category': 'sleep-relaxation', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Bedtime Story for Adults', 'description': 'A soothing bedtime story to help you relax and drift off to sleep.', 'youtube_id': 'p7LVaOlKbdY', 'duration_seconds': 2700, 'category': 'sleep-relaxation', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Ocean Waves for Sleep', 'description': 'Peaceful ocean wave sounds for deep relaxation and sleep.', 'youtube_id': 'bn9F19Hi1Lk', 'duration_seconds': 28800, 'category': 'sleep-relaxation', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'ASMR for Sleep', 'description': 'Gentle ASMR triggers to help you relax and fall asleep.', 'youtube_id': 'RLNlYg7Y5QA', 'duration_seconds': 3600, 'category': 'sleep-relaxation', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Guided Sleep Hypnosis', 'description': 'Deep relaxation hypnosis to help you achieve restful sleep.', 'youtube_id': 'cpkTQRq28Cw', 'duration_seconds': 3600, 'category': 'sleep-relaxation', 'mood_tags': ['calm'], 'is_featured': False},

            # Fun & Uplifting (8 videos)
            {'title': 'Happy Music - Uplifting Songs', 'description': 'Feel-good music playlist to boost your mood and energy.', 'youtube_id': 'ZbZSe6N_BXs', 'duration_seconds': 3600, 'category': 'fun-uplifting', 'mood_tags': ['happy'], 'is_featured': True},
            {'title': 'Funny Animal Compilation', 'description': 'Adorable and hilarious animal moments guaranteed to make you smile.', 'youtube_id': '7T1LO6qOdGk', 'duration_seconds': 600, 'category': 'fun-uplifting', 'mood_tags': ['happy'], 'is_featured': False},
            {'title': 'Feel Good Dance Workout', 'description': 'Get moving and boost your mood with this fun dance workout.', 'youtube_id': 'gCzgc_RelBA', 'duration_seconds': 1800, 'category': 'fun-uplifting', 'mood_tags': ['happy', 'sad'], 'is_featured': False},
            {'title': 'Inspirational Speeches Compilation', 'description': 'Powerful speeches to inspire and motivate you.', 'youtube_id': 'mgmVOuLgFB0', 'duration_seconds': 1200, 'category': 'fun-uplifting', 'mood_tags': ['happy', 'sad'], 'is_featured': False},
            {'title': 'Cute Puppies Playing', 'description': 'Adorable puppy videos to brighten your day.', 'youtube_id': 'j5a0jTc9S10', 'duration_seconds': 600, 'category': 'fun-uplifting', 'mood_tags': ['happy'], 'is_featured': False},
            {'title': 'Comedy Sketches Compilation', 'description': 'Laugh out loud with these hilarious comedy sketches.', 'youtube_id': 'dQw4w9WgXcQ', 'duration_seconds': 1200, 'category': 'fun-uplifting', 'mood_tags': ['happy'], 'is_featured': False},
            {'title': 'Satisfying Videos Compilation', 'description': 'Oddly satisfying videos to help you relax and feel good.', 'youtube_id': 'hHW1oY26kxQ', 'duration_seconds': 900, 'category': 'fun-uplifting', 'mood_tags': ['happy', 'calm'], 'is_featured': False},
            {'title': 'Positive Affirmations for a Great Day', 'description': 'Start your day with powerful positive affirmations.', 'youtube_id': 'Wob7dCdvWzk', 'duration_seconds': 600, 'category': 'fun-uplifting', 'mood_tags': ['happy'], 'is_featured': False},

            # Nature & ASMR (5 videos)
            {'title': 'Forest Sounds - Birds and Nature', 'description': 'Immerse yourself in peaceful forest sounds with birds singing.', 'youtube_id': 'xNN7iTA57jM', 'duration_seconds': 28800, 'category': 'nature-asmr', 'mood_tags': ['calm'], 'is_featured': True},
            {'title': 'Waterfall Sounds for Relaxation', 'description': 'Calming waterfall sounds to help you relax and focus.', 'youtube_id': 'TQwGTe_MueM', 'duration_seconds': 28800, 'category': 'nature-asmr', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Campfire Sounds', 'description': 'Cozy crackling campfire sounds for relaxation.', 'youtube_id': 'RDfjXj5EGqI', 'duration_seconds': 28800, 'category': 'nature-asmr', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Thunderstorm Sounds', 'description': 'Relaxing thunderstorm sounds for sleep and relaxation.', 'youtube_id': 'nDq6TstdEi8', 'duration_seconds': 28800, 'category': 'nature-asmr', 'mood_tags': ['calm'], 'is_featured': False},
            {'title': 'Mountain Stream Sounds', 'description': 'Peaceful mountain stream sounds for meditation and focus.', 'youtube_id': 'IvjMgVS6kng', 'duration_seconds': 28800, 'category': 'nature-asmr', 'mood_tags': ['calm'], 'is_featured': False},

            # Motivation & Growth (5 videos)
            {'title': 'Morning Motivation - Start Your Day Right', 'description': 'Powerful morning motivation to kickstart your day with energy.', 'youtube_id': 'kPGppGLvD0E', 'duration_seconds': 600, 'category': 'motivation-growth', 'mood_tags': ['happy', 'sad'], 'is_featured': True},
            {'title': 'How to Build Self-Discipline', 'description': 'Practical tips to develop self-discipline and achieve your goals.', 'youtube_id': 'W8e_dvbXoCQ', 'duration_seconds': 900, 'category': 'motivation-growth', 'mood_tags': ['happy', 'overwhelmed'], 'is_featured': False},
            {'title': 'Overcoming Fear and Self-Doubt', 'description': 'Learn strategies to overcome fear and build confidence.', 'youtube_id': 'k5MfuwMNcMo', 'duration_seconds': 1200, 'category': 'motivation-growth', 'mood_tags': ['anxious', 'sad'], 'is_featured': False},
            {'title': 'The Power of Positive Thinking', 'description': 'Discover how positive thinking can transform your life.', 'youtube_id': 'LPjzfGChGlE', 'duration_seconds': 900, 'category': 'motivation-growth', 'mood_tags': ['happy', 'sad'], 'is_featured': False},
            {'title': 'Building Mental Resilience', 'description': 'Develop mental toughness and resilience for life challenges.', 'youtube_id': 'TFbv757kup4', 'duration_seconds': 1200, 'category': 'motivation-growth', 'mood_tags': ['overwhelmed', 'sad'], 'is_featured': False},

            # Mood Boosters (additional)
            {'title': 'Gratitude Meditation', 'description': 'Cultivate gratitude and appreciation with this guided meditation.', 'youtube_id': 'Hd5A0vfVlpU', 'duration_seconds': 600, 'category': 'mood-boosters', 'mood_tags': ['happy', 'sad'], 'is_featured': True},
            {'title': 'Self-Love Affirmations', 'description': 'Powerful affirmations to boost self-love and confidence.', 'youtube_id': 'itZMM5gCboo', 'duration_seconds': 600, 'category': 'mood-boosters', 'mood_tags': ['happy', 'sad'], 'is_featured': False},
            {'title': 'Mood Lifting Music', 'description': 'Uplifting instrumental music to elevate your mood.', 'youtube_id': 'jfKfPfyJRdk', 'duration_seconds': 3600, 'category': 'mood-boosters', 'mood_tags': ['happy'], 'is_featured': False},
            {'title': 'Laughter Yoga Session', 'description': 'Boost your mood with this fun laughter yoga session.', 'youtube_id': 'A0FFnuGhh7E', 'duration_seconds': 900, 'category': 'mood-boosters', 'mood_tags': ['happy'], 'is_featured': False},
            {'title': 'Energy Boosting Meditation', 'description': 'Recharge your energy with this invigorating meditation.', 'youtube_id': 'cyMxWXlX9sU', 'duration_seconds': 600, 'category': 'mood-boosters', 'mood_tags': ['happy', 'sad'], 'is_featured': False},
        ]

        for video_info in videos_data:
            category_slug = video_info['category']
            category = categories.get(category_slug)
            if not category:
                self.stdout.write(self.style.WARNING(f"Category {category_slug} not found, skipping video: {video_info['title']}"))
                continue

            thumbnail_url = f"https://img.youtube.com/vi/{video_info['youtube_id']}/hqdefault.jpg"
            
            video, created = Video.objects.get_or_create(
                youtube_id=video_info['youtube_id'],
                defaults={
                    'title': video_info['title'],
                    'description': video_info['description'],
                    'source_type': 'youtube',
                    'duration_seconds': video_info['duration_seconds'],
                    'category': category,
                    'mood_tags': video_info['mood_tags'],
                    'is_featured': video_info['is_featured']
                }
            )
            # Update thumbnail string directly to bypass file upload validations
            if created or not video.thumbnail:
                Video.objects.filter(id=video.id).update(thumbnail=thumbnail_url)
                self.stdout.write(f"Created video: {video.title}")

        self.stdout.write(self.style.SUCCESS(f'Successfully seeded {len(videos_data)} mental health videos!'))
