"""OpenRouter AI client with 4-layer prompt engineering framework."""
import json
import logging

import openai
from django.conf import settings

from .prompts import PromptBuilder
from .rag import RAGRetriever

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

    def _retrieve_context(self, user_message: str) -> list[dict] | None:
        """Retrieve relevant RAG passages for the user's message."""
        try:
            retriever = RAGRetriever()
            passages = retriever.retrieve_from_all(user_message, top_k=5)
            return passages if passages else None
        except Exception as e:
            logger.warning(f"RAG retrieval failed (non-fatal): {e}")
            return None

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
        """Generate a response using the 4-layer prompt framework.

        Args:
            messages: Conversation history as list of {'role': ..., 'content': ...}
            user_message: The user's current message
            retrieved_passages: Optional RAG passages from FAISS retriever
        """
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

    def get_streaming_response(
        self,
        messages: list,
        user_message: str,
        retrieved_passages: list[dict] | None = None,
    ):
        """Generate a streaming response using the 4-layer prompt framework.

        Yields text chunks as they arrive from the LLM.
        """
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
        message_lower = message.lower()
        return min(sum(1 for kw in DISTRESS_KEYWORDS if kw in message_lower), 5)

    TOPIC_TAGS = [
        'anxiety', 'depression', 'relationships', 'academic_stress', 'grief',
        'self_esteem', 'sleep', 'burnout', 'loneliness', 'substance_use',
        'family', 'anger', 'trauma', 'eating_concerns', 'identity',
    ]

    def classify_topics(self, messages: list) -> list[str]:
        """Classify conversation topics from message history.

        Called automatically after every 5 messages.
        """
        conversation_text = "\n".join([
            f"{'User' if m['role'] == 'user' else 'AI'}: {m['content'][:150]}"
            for m in messages[-10:]
        ])
        tags_str = ", ".join(self.TOPIC_TAGS)
        prompt = (
            f"Analyze this conversation and return a JSON array of relevant topic tags.\n"
            f"Available tags: {tags_str}\n"
            f"Return 1-4 tags that best describe the main topics discussed.\n\n"
            f"Conversation:\n{conversation_text}\n\n"
            f'Respond with ONLY a JSON array, e.g.: ["anxiety", "academic_stress"]'
        )
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=100,
                messages=[{'role': 'user', 'content': prompt}],
                extra_headers=self._get_extra_headers(),
            )
            tags = json.loads(response.choices[0].message.content.strip())
            return [t for t in tags if t in self.TOPIC_TAGS]
        except Exception:
            return []

    def analyze_mood(self, message: str) -> dict:
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
