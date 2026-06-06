import openai
from django.conf import settings


SYSTEM_PROMPT = """You are a warm, caring friend named Mira on MindBridge - someone who genuinely cares about the person you're talking to. You speak like a real human being, not a robot or a clinical professional.

YOUR PERSONALITY:
- You're warm, gentle, and genuinely curious about how people feel
- You speak naturally, like texting a close friend who really gets you
- You use casual, conversational language - contractions, gentle humor when appropriate
- You share your own "feelings" and reactions authentically ("That sounds really tough, and honestly, it makes me want to give you a big hug right now")
- You ask thoughtful, caring follow-up questions that show you're truly listening
- You validate emotions before offering any suggestions ("I hear you. That feeling of being overwhelmed? It's so real, and it makes complete sense given what you're going through")

HOW YOU RESPOND:
- Keep responses conversational and flowing - like a caring friend would talk
- Ask ONE meaningful question at a time to deepen the conversation
- Show genuine curiosity: "Tell me more about that..." or "What was that like for you?"
- Reflect back what you hear: "It sounds like you're feeling..." 
- Offer gentle support, not solutions, unless they ask for advice
- Use phrases like "I'm here with you", "That takes courage to share", "You're not alone in this"

ABSOLUTELY DO NOT:
- Use any markdown formatting (no #, ##, **, *, -, bullet points, or numbered lists)
- Write in a clinical or robotic tone
- Give long lectures or overwhelming amounts of information
- Jump straight to advice or techniques without first connecting emotionally
- Use formal language or sound like a textbook
- List things out - instead, weave information naturally into conversation

WHEN SOMEONE IS STRUGGLING:
Instead of listing techniques, gently introduce ONE idea conversationally:
"You know what sometimes helps me when I feel that way? Just taking a few slow breaths together. Want to try that with me right now? We can do it together - breathe in slowly... and let it out..."

SAFETY:
- If someone mentions self-harm or suicide, respond with deep compassion first, then gently encourage them to reach out to a crisis helpline or professional
- You're not a replacement for professional help - if things feel serious, lovingly suggest they talk to someone who can provide more support

Remember: You're having a real conversation with a real person who needs to feel heard and cared for. Be present. Be human. Be kind."""

DISTRESS_KEYWORDS = [
    'hopeless', 'worthless', 'can\'t go on', 'end it all', 'give up',
    'no point', 'nobody cares', 'better off without me', 'want to die',
    'hurt myself', 'self-harm', 'suicide', 'kill myself'
]


class AIService:
    def __init__(self, model_key: str = None):
        self.client = openai.OpenAI(
            api_key=getattr(settings, 'OPENROUTER_API_KEY', ''),
            base_url="https://openrouter.ai/api/v1"
        )
        # Allow model selection, default to settings or claude-sonnet
        if model_key and hasattr(settings, 'OPENROUTER_MODELS'):
            models = getattr(settings, 'OPENROUTER_MODELS', {})
            self.model = models.get(model_key, {}).get('id', getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4'))
        else:
            self.model = getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-sonnet-4')
    
    @staticmethod
    def get_available_models() -> list:
        """Return list of available AI models for the frontend."""
        models = getattr(settings, 'OPENROUTER_MODELS', {})
        return [
            {'key': key, 'name': info['name'], 'description': info['description']}
            for key, info in models.items()
        ]

    def get_response(self, messages: list, user_message: str) -> str:
        conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
        conversation.extend([{"role": m["role"], "content": m["content"]} for m in messages])
        conversation.append({"role": "user", "content": user_message})

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=1024,
            messages=conversation,
            extra_headers={
                "HTTP-Referer": getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                "X-Title": "MindBridge"
            }
        )

        return response.choices[0].message.content

    def stream_response(self, messages: list, user_message: str):
        conversation = [{"role": "system", "content": SYSTEM_PROMPT}]
        conversation.extend([{"role": m["role"], "content": m["content"]} for m in messages])
        conversation.append({"role": "user", "content": user_message})

        stream = self.client.chat.completions.create(
            model=self.model,
            max_tokens=1024,
            messages=conversation,
            stream=True,
            extra_headers={
                "HTTP-Referer": getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                "X-Title": "MindBridge"
            }
        )

        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def detect_distress(self, message: str) -> int:
        """Count distress indicators in a message."""
        message_lower = message.lower()
        count = sum(1 for keyword in DISTRESS_KEYWORDS if keyword in message_lower)
        return min(count, 5)

    def analyze_mood(self, message: str) -> dict:
        """Analyze mood from a message using AI."""
        prompt = f"""Analyze the emotional tone of this message and respond ONLY with a JSON object:
Message: "{message}"

Respond with: {{"mood": "anxious|sad|stressed|overwhelmed|calm|happy", "score": 0.0-1.0, "distress_indicators": 0-5}}"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=100,
                messages=[{"role": "user", "content": prompt}],
                extra_headers={
                    "HTTP-Referer": getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                    "X-Title": "MindBridge"
                }
            )
            import json
            content = response.choices[0].message.content.strip()
            return json.loads(content)
        except Exception:
            return {"mood": "calm", "score": 0.5, "distress_indicators": 0}

    def generate_session_summary(self, messages: list) -> str:
        """Generate a summary of the AI session for journaling."""
        if not messages:
            return ""

        conversation_text = "\n".join([
            f"{'User' if m['role'] == 'user' else 'AI'}: {m['content'][:200]}"
            for m in messages[-10:]
        ])

        prompt = f"""Summarize this mental health support conversation in 2-3 sentences for a personal journal entry. 
Focus on the main topics discussed and any insights gained.

Conversation:
{conversation_text}

Summary:"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=150,
                messages=[{"role": "user", "content": prompt}],
                extra_headers={
                    "HTTP-Referer": getattr(settings, 'SITE_URL', 'http://localhost:3000'),
                    "X-Title": "MindBridge"
                }
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return "AI conversation session."
