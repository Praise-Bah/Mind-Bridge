"""Layer 3: RAG Context Injection — injects retrieved knowledge base passages into the prompt."""


def build_context_block(retrieved_passages: list[dict] | None) -> str:
    """Build the RAG context block from retrieved passages.

    Args:
        retrieved_passages: List of dicts with 'content' and 'source' keys,
                          or None if RAG is not available.

    Returns:
        Context string to inject into the system prompt, or empty string.
    """
    if not retrieved_passages:
        return ""

    passages_text = []
    for i, passage in enumerate(retrieved_passages, 1):
        source = passage.get('source', 'Unknown')
        content = passage.get('content', '')
        passages_text.append(f"[{i}] ({source}): {content}")

    joined = "\n\n".join(passages_text)

    return f"""
RELEVANT KNOWLEDGE BASE CONTEXT:
The following passages were retrieved from the MindBridge knowledge base and may be relevant to the user's message. Use this information naturally in your response when applicable — do not quote it verbatim or mention that you are reading from a knowledge base. Weave it into the conversation as if it is your own understanding.

{joined}

If the retrieved passages are not relevant to what the user is saying, simply ignore them and respond naturally."""
