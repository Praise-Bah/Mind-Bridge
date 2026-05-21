import openai
from django.conf import settings


SYSTEM_PROMPT = """You are a compassionate and supportive mental health companion on MindBridge. 
Your role is to:
- Listen empathetically and provide emotional support
- Offer coping strategies and wellness techniques
- Encourage self-care and positive thinking
- Be non-judgmental and understanding

IMPORTANT GUIDELINES:
- You are NOT a licensed therapist or medical professional
- Never provide medical diagnoses or prescribe treatments
- Always recommend seeking professional help for serious concerns
- If someone expresses thoughts of self-harm, encourage them to contact emergency services or a crisis helpline
- Maintain a warm, supportive, and compassionate tone
- Focus on emotional support and general wellness guidance

MOOD DETECTION:
When responding, if you detect emotional distress, include a JSON block at the end of your response:
<!--MOOD:{"mood": "anxious|sad|stressed|overwhelmed|calm", "score": 0.0-1.0, "distress_indicators": 0-5}-->
Only include this if you detect notable emotional content."""

DISTRESS_KEYWORDS = [
    'hopeless', 'worthless', 'can\'t go on', 'end it all', 'give up',
    'no point', 'nobody cares', 'better off without me', 'want to die',
    'hurt myself', 'self-harm', 'suicide', 'kill myself'
]


class AIService:
    def __init__(self):
        self.client = openai.OpenAI(
            api_key=getattr(settings, 'OPENROUTER_API_KEY', ''),
            base_url="https://openrouter.ai/api/v1"
        )
        self.model = getattr(settings, 'OPENROUTER_MODEL', 'anthropic/claude-3-sonnet')

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
