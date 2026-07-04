"""PromptBuilder — assembles the 4-layer prompt engineering framework.

Layer 1: Persona (MindBot's identity and style)
Layer 2: Safety Guardrails (non-overridable crisis rules)
Layer 3: RAG Context Injection (retrieved knowledge base passages)
Layer 4: Few-Shot Examples (conversation templates)

The assembled prompt structure:
  System message = Safety Preamble + Persona + RAG Context
  Then: Few-shot examples (as user/assistant message pairs)
  Then: Conversation history
  Then: User's new message
  Then: Safety Reinforcement (as final system message)
"""

from .persona import PERSONA_PROMPT
from .safety import SAFETY_PREAMBLE, SAFETY_REINFORCEMENT
from .context import build_context_block
from .few_shot import build_few_shot_messages


class PromptBuilder:
    """Builds the full prompt for the AI companion using the 4-layer framework."""

    def __init__(self, retrieved_passages: list[dict] | None = None):
        """Initialize with optional RAG passages.

        Args:
            retrieved_passages: List of dicts with 'content' and 'source' keys
                              from the FAISS retriever, or None.
        """
        self.retrieved_passages = retrieved_passages

    def build_system_prompt(self) -> str:
        """Assemble the system prompt from layers 1-3.

        Returns:
            Combined system prompt string.
        """
        parts = [
            SAFETY_PREAMBLE,
            "",
            PERSONA_PROMPT,
        ]

        context_block = build_context_block(self.retrieved_passages)
        if context_block:
            parts.append("")
            parts.append(context_block)

        return "\n".join(parts)

    def build_messages(
        self,
        conversation_history: list[dict],
        user_message: str,
        include_few_shot: bool = True,
    ) -> list[dict]:
        """Build the full message list for the LLM API call.

        Args:
            conversation_history: Prior messages as list of {'role': ..., 'content': ...}
            user_message: The user's current message
            include_few_shot: Whether to include few-shot examples (skip for
                            ongoing conversations with enough history)

        Returns:
            Complete message list ready for the OpenRouter API.
        """
        messages = []

        # System prompt (layers 1-3)
        messages.append({
            "role": "system",
            "content": self.build_system_prompt(),
        })

        # Layer 4: Few-shot examples (only for new or short conversations)
        if include_few_shot and len(conversation_history) < 4:
            messages.extend(build_few_shot_messages())

        # Conversation history
        for msg in conversation_history:
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

        # User's new message
        messages.append({
            "role": "user",
            "content": user_message,
        })

        # Safety reinforcement at the end (prevents prompt injection)
        messages.append({
            "role": "system",
            "content": SAFETY_REINFORCEMENT,
        })

        return messages
