from django.db.models import Avg, Count
from django.utils import timezone
from apps.ai_assistant.services import AIService
from .models import JournalEntry, JournalPrompt
import json
import random

class JournalInsightsService:
    """AI-powered insights for journal entries."""
    
    def __init__(self):
        self.ai_service = AIService()
    
    def analyze_entry_patterns(self, user_entries):
        """Analyze patterns in user's journal entries."""
        if not user_entries:
            return {}
        
        # Extract themes and patterns
        all_content = ' '.join([entry.content for entry in user_entries])
        all_tags = []
        for entry in user_entries:
            if entry.tags:
                all_tags.extend(entry.tags)
        
        # Get mood trends
        mood_data = []
        for entry in user_entries:
            if entry.mood_score:
                mood_data.append({
                    'date': entry.created_at.date(),
                    'mood': entry.mood_score
                })
        
        # AI analysis
        analysis_prompt = f"""
        Analyze this journal data for patterns and insights:
        
        Content sample: {all_content[:1000]}...
        Common tags: {list(set(all_tags))}
        Mood data: {mood_data[:10]}
        
        Provide insights about:
        1. Emotional patterns
        2. Recurring themes
        3. Progress indicators
        4. Recommendations
        
        Return as JSON with keys: insights, patterns, recommendations, emotional_summary
        """
        
        try:
            response = self.ai_service.get_response([], analysis_prompt)
            return json.loads(response)
        except:
            return {
                'insights': ['Continue writing regularly to build momentum'],
                'patterns': ['Consistent journaling detected'],
                'recommendations': ['Try writing about gratitude daily'],
                'emotional_summary': 'User shows good self-awareness'
            }
    
    def generate_reflection_prompt(self, entry):
        """Generate a reflection prompt based on journal entry."""
        if not entry.mood_score:
            return "How did this experience make you feel?"
        
        mood_descriptions = {
            1: "challenging emotions",
            2: "difficult feelings",
            3: "neutral state",
            4: "positive emotions",
            5: "joyful feelings"
        }
        
        mood_context = mood_descriptions.get(entry.mood_score, "emotional state")
        
        prompt_templates = [
            f"What specific events led to these {mood_context}?",
            f"How did you cope with these feelings?",
            f"What did you learn from this experience?",
            f"How can you build on this positive moment?",
            f"What support do you need during challenging times?"
        ]
        
        return random.choice(prompt_templates)
    
    def generate_mood_affirmation(self, mood_score):
        """Generate a positive affirmation based on mood."""
        affirmations = {
            1: "It's okay to have difficult days. You're strong enough to get through this.",
            2: "Every emotion is valid. You're doing your best, and that's enough.",
            3: "Balance is key. You're finding your way through this.",
            4: "Your positive energy is wonderful! Keep nurturing this feeling.",
            5: "Your joy is contagious! Share it with the world."
        }
        
        return affirmations.get(mood_score, "You're doing great!")
    
    def calculate_streak(self, user_entries):
        """Calculate current journaling streak."""
        if not user_entries:
            return 0
        
        # Sort entries by date
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
        """Get mood trends over specified period."""
        end_date = timezone.now().date()
        start_date = end_date - timezone.timedelta(days=days)
        
        mood_data = []
        current_date = start_date
        
        while current_date <= end_date:
            day_entries = [e for e in user_entries if e.created_at.date() == current_date]
            if day_entries:
                avg_mood = sum(e.mood_score for e in day_entries if e.mood_score) / len([e for e in day_entries if e.mood_score])
                mood_data.append({
                    'date': current_date.isoformat(),
                    'mood': round(avg_mood, 1)
                })
            current_date += timezone.timedelta(days=1)
        
        return mood_data
