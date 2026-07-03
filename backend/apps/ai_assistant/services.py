"""OpenRouter AI client with 4-layer prompt engineering framework."""
import json
import logging

import openai
from django.conf import settings

from .prompts import PromptBuilder

logger = logging.getLogger(__name__)

# Kept for backward compatibility — crisis module (1.3) will replace this
DISTRESS_KEYWORDS = [
    'hopeless', 'worthless', "can't go on", 'end it all', 'give up',
    'no point', 'nobody cares', 'better off without me', 'want to die',
    'hurt myself', 'self-harm', 'suicide', 'kill myself',
]


class AIService:
    def __init__(self, model_key: str = None):
        self.client = openai.OpenAI(
            api_key=getattr(settings, 'OPENROUTER_API_KEY', ''),
            base_url='https://openrouter.ai/api/v1',
            timeout=60,
            max_retries=1,
        )
        default_model = getattr(
            settings, 'OPENROUTER_MODEL', 'meta-llama/llama-3.1-8b-instruct'
        )
        if model_key and hasattr(settings, 'OPENROUTER_MODELS'):
            models = getattr(settings, 'OPENROUTER_MODELS', {})
            self.model = models.get(model_key, {}).get('id', default_model)
        else:
            self.model = default_model

    @staticmethod
    def get_available_models() -> list:
        """Return list of available AI models for the frontend."""
        models = getattr(settings, 'OPENROUTER_MODELS', {})
        return [
            {'key': key, 'name': info['name'], 'description': info.get('description', '')}
            for key, info in models.items()
        ]

    def _get_extra_headers(self) -> dict:
        return {
            'HTTP-Referer': getattr(settings, 'SITE_URL', 'http://localhost:3000'),
            'X-Title': 'MindBridge',
        }

    def get_response(
        self,
        messages: list,
        user_message: str,
        retrieved_passages: list[dict] | None = None,
    ) -> str:
        """Generate a response using the 4-layer prompt framework."""
        builder = PromptBuilder(retrieved_passages=retrieved_passages)
        conversation = builder.build_messages(
            conversation_history=messages,
            user_message=user_message,
        )

        response = self.client.chat.completions.create(
            model=self.model,
            max_tokens=1024,
            messages=conversation,
            extra_headers=self._get_extra_headers(),
        )
        return response.choices[0].message.content

    def stream_response(
        self,
        messages: list,
        user_message: str,
        retrieved_passages: list[dict] | None = None,
    ):
        """Generate a streaming response using the 4-layer prompt framework."""
        builder = PromptBuilder(retrieved_passages=retrieved_passages)
        conversation = builder.build_messages(
            conversation_history=messages,
            user_message=user_message,
        )

        stream = self.client.chat.completions.create(
            model=self.model,
            max_tokens=1024,
            messages=conversation,
            stream=True,
            extra_headers=self._get_extra_headers(),
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content

    def detect_distress(self, message: str) -> int:
        """Count distress indicators in a message."""
        message_lower = message.lower()
        return min(sum(1 for kw in DISTRESS_KEYWORDS if kw in message_lower), 5)

    def analyze_mood(self, message: str) -> dict:
        """Analyze mood from a message using AI."""
        prompt = (
            f'Analyze the emotional tone of this message and respond ONLY with a JSON object:\n'
            f'Message: "{message}"\n\n'
            f'Respond with: {{"mood": "anxious|sad|stressed|overwhelmed|calm|happy", "score": 0.0-1.0, "distress_indicators": 0-5}}'
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=100,
                messages=[{'role': 'user', 'content': prompt}],
                extra_headers=self._get_extra_headers(),
            )
            return json.loads(response.choices[0].message.content.strip())
        except Exception:
            return {'mood': 'calm', 'score': 0.5, 'distress_indicators': 0}

    def generate_session_summary(self, messages: list) -> str:
        """Generate a summary of the AI session for journaling."""
        if not messages:
            return ""

        conversation_text = "\n".join([
            f"{'User' if m['role'] == 'user' else 'AI'}: {m['content'][:200]}"
            for m in messages[-10:]
        ])

        prompt = (
            "Summarize this mental health support conversation in 2-3 sentences "
            "for a personal journal entry. Focus on the main topics discussed "
            f"and any insights gained.\n\nConversation:\n{conversation_text}\n\nSummary:"
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=150,
                messages=[{'role': 'user', 'content': prompt}],
                extra_headers=self._get_extra_headers(),
            )
            return response.choices[0].message.content.strip()
        except Exception:
            return "AI conversation session."
