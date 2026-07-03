"""Document chunker for the RAG pipeline.

Splits documents into overlapping chunks suitable for embedding and retrieval.
Uses 512-token chunks with 50-token overlap as specified in the thesis.
"""
import os
import re
from pathlib import Path

from transformers import AutoTokenizer


# Use the same tokenizer as the embedding model for accurate token counts
_tokenizer = None


def _get_tokenizer():
    global _tokenizer
    if _tokenizer is None:
        _tokenizer = AutoTokenizer.from_pretrained('sentence-transformers/all-MiniLM-L6-v2')
    return _tokenizer


def chunk_text(
    text: str,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
) -> list[str]:
    """Split text into overlapping token-based chunks.

    Args:
        text: The input text to chunk.
        chunk_size: Maximum number of tokens per chunk (default: 512).
        chunk_overlap: Number of overlapping tokens between chunks (default: 50).

    Returns:
        List of text chunks.
    """
    tokenizer = _get_tokenizer()
    tokens = tokenizer.encode(text, add_special_tokens=False)

    if len(tokens) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(tokens):
        end = min(start + chunk_size, len(tokens))
        chunk_tokens = tokens[start:end]
        chunk_text = tokenizer.decode(chunk_tokens, skip_special_tokens=True)
        chunks.append(chunk_text.strip())

        if end >= len(tokens):
            break
        start += chunk_size - chunk_overlap

    return chunks


def load_and_chunk_documents(
    knowledge_base_dir: str | Path,
    chunk_size: int = 512,
    chunk_overlap: int = 50,
) -> list[dict]:
    """Load all markdown files from a directory and chunk them.

    Args:
        knowledge_base_dir: Path to directory containing .md files.
        chunk_size: Maximum tokens per chunk.
        chunk_overlap: Overlap tokens between chunks.

    Returns:
        List of dicts with 'content', 'source', and 'chunk_index' keys.
    """
    knowledge_base_dir = Path(knowledge_base_dir)
    all_chunks = []

    for md_file in sorted(knowledge_base_dir.glob('**/*.md')):
        text = md_file.read_text(encoding='utf-8')
        if not text.strip():
            continue

        source = md_file.stem.replace('_', ' ').title()
        chunks = chunk_text(text, chunk_size=chunk_size, chunk_overlap=chunk_overlap)

        for i, chunk in enumerate(chunks):
            all_chunks.append({
                'content': chunk,
                'source': source,
                'chunk_index': i,
                'file': str(md_file.name),
            })

    return all_chunks
