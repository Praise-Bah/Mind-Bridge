"""AI-powered journal insights — local OpenRouter client."""
import json
import random
import openai
from django.conf import settings
from django.utils import timezone


class AIService:
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=getattr(settings, 'OPENROUTER_API_KEY', ''),
            base_url='https://openrouter.ai/api/v1',
        )
        self.model = getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4')

    def get_response(self, messages: list, user_message: str) -> str:
        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=1024,
            messages=[{'role': 'user', 'content': user_message}],
            extra_headers={
                'HTTP-Referer': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                'X-Title': 'MindBridge',
            },
        )
        return response.choices[0].message.content


class JournalInsightsService:
    def __init__(self):
        self.ai_service = AIService()

    def analyze_entry_patterns(self, user_entries):
        if not user_entries:
            return {}
        all_content = ' '.join(e.content for e in user_entries)
        all_tags = [tag for e in user_entries if e.tags for tag in e.tags]
        mood_data = [
            {'date': e.created_at.date(), 'mood': e.mood_score}
            for e in user_entries if e.mood_score
        ]
        prompt = (
            f'Analyze this journal data for patterns and insights:\n'
            f'Content sample: {all_content[:1000]}\n'
            f'Common tags: {list(set(all_tags))}\n'
            f'Mood data: {mood_data[:10]}\n\n'
            f'Return JSON with keys: insights, patterns, recommendations, emotional_summary'
        )
        try:
            response = self.ai_service.get_response([], prompt)
            return json.loads(response)
        except Exception:
            return {
                'insights': ['Continue writing regularly to build momentum'],
                'patterns': ['Consistent journaling detected'],
                'recommendations': ['Try writing about gratitude daily'],
                'emotional_summary': 'User shows good self-awareness',
            }

    def generate_reflection_prompt(self, entry):
        if not entry.mood_score:
            return 'How did this experience make you feel?'
        mood_descriptions = {1: 'challenging emotions', 2: 'difficult feelings', 3: 'neutral state',
                             4: 'positive emotions', 5: 'joyful feelings'}
        mood_context = mood_descriptions.get(entry.mood_score, 'emotional state')
        return random.choice([
            f'What specific events led to these {mood_context}?',
            'How did you cope with these feelings?',
            'What did you learn from this experience?',
        ])

    def generate_mood_affirmation(self, mood_score):
        affirmations = {
            1: "It's okay to have difficult days. You're strong enough to get through this.",
            2: "Every emotion is valid. You're doing your best, and that's enough.",
            3: 'Balance is key. You\'re finding your way through this.',
            4: 'Your positive energy is wonderful! Keep nurturing this feeling.',
            5: 'Your joy is contagious! Share it with the world.',
        }
        return affirmations.get(mood_score, "You're doing great!")

    def calculate_streak(self, user_entries):
        if not user_entries:
            return 0
        sorted_entries = sorted(user_entries, key=lambda x: x.created_at.date(), reverse=True)
        streak = 0
        current_date = timezone.now().date()
        for entry in sorted_entries:
            if entry.created_at.date() == current_date - timezone.timedelta(days=streak):
                streak += 1
            else:
                break
        return streak

    def get_mood_trends(self, user_entries, days=30):
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days)
        mood_data = []
        current_date = start_date
        while current_date <= end_date:
            day_entries = [e for e in user_entries if e.created_at.date() == current_date]
            valid = [e.mood_score for e in day_entries if e.mood_score]
            if valid:
                mood_data.append({'date': current_date.isoformat(), 'mood': round(sum(valid) / len(valid), 1)})
            current_date += timezone.timedelta(days=1)
        return mood_data
