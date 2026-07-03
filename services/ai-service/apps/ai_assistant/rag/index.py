"""FAISS index builder for the RAG pipeline.

Builds and persists a FAISS vector index from chunked knowledge base documents
using sentence-transformers (all-MiniLM-L6-v2) for embeddings.
"""
import json
import logging
from pathlib import Path

import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

from .chunker import load_and_chunk_documents

logger = logging.getLogger(__name__)

# Default paths relative to the ai-service root
DEFAULT_KB_DIR = Path(__file__).resolve().parent.parent.parent.parent / 'data' / 'knowledge_base'
DEFAULT_INDEX_DIR = Path(__file__).resolve().parent.parent.parent.parent / 'data' / 'faiss_indexes'

EMBEDDING_MODEL = 'sentence-transformers/all-MiniLM-L6-v2'
EMBEDDING_DIMENSION = 384  # all-MiniLM-L6-v2 output dimension


def build_index(
    kb_subdirectory: str = 'mental_health',
    index_name: str = 'mental_health',
    chunk_size: int = 512,
    chunk_overlap: int = 50,
) -> tuple[faiss.IndexFlatIP, list[dict]]:
    """Build a FAISS index from knowledge base documents.

    Args:
        kb_subdirectory: Subdirectory under the knowledge base dir to index.
        index_name: Name for the saved index files.
        chunk_size: Token chunk size.
        chunk_overlap: Token overlap between chunks.

    Returns:
        Tuple of (FAISS index, list of chunk metadata).
    """
    kb_dir = DEFAULT_KB_DIR / kb_subdirectory
    if not kb_dir.exists():
        raise FileNotFoundError(f"Knowledge base directory not found: {kb_dir}")

    logger.info(f"Loading documents from {kb_dir}")
    chunks = load_and_chunk_documents(kb_dir, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    if not chunks:
        raise ValueError(f"No documents found in {kb_dir}")

    logger.info(f"Loaded {len(chunks)} chunks from knowledge base")

    # Generate embeddings
    logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
    model = SentenceTransformer(EMBEDDING_MODEL)

    texts = [chunk['content'] for chunk in chunks]
    logger.info(f"Generating embeddings for {len(texts)} chunks...")
    embeddings = model.encode(texts, show_progress_bar=True, normalize_embeddings=True)
    embeddings = np.array(embeddings, dtype=np.float32)

    # Build FAISS index using inner product (cosine similarity on normalized vectors)
    index = faiss.IndexFlatIP(EMBEDDING_DIMENSION)
    index.add(embeddings)

    logger.info(f"FAISS index built with {index.ntotal} vectors")

    # Save index and metadata
    save_index(index, chunks, index_name)

    return index, chunks


def save_index(
    index: faiss.IndexFlatIP,
    chunks: list[dict],
    index_name: str = 'mental_health',
) -> None:
    """Save FAISS index and chunk metadata to disk."""
    index_dir = DEFAULT_INDEX_DIR
    index_dir.mkdir(parents=True, exist_ok=True)

    index_path = index_dir / f'{index_name}.faiss'
    metadata_path = index_dir / f'{index_name}_metadata.json'

    faiss.write_index(index, str(index_path))
    metadata_path.write_text(json.dumps(chunks, indent=2), encoding='utf-8')

    logger.info(f"Index saved to {index_path}")
    logger.info(f"Metadata saved to {metadata_path}")


def load_index(
    index_name: str = 'mental_health',
) -> tuple[faiss.IndexFlatIP, list[dict]] | None:
    """Load a previously built FAISS index from disk.

    Returns:
        Tuple of (index, chunks) or None if index doesn't exist.
    """
    index_path = DEFAULT_INDEX_DIR / f'{index_name}.faiss'
    metadata_path = DEFAULT_INDEX_DIR / f'{index_name}_metadata.json'

    if not index_path.exists() or not metadata_path.exists():
        return None

    index = faiss.read_index(str(index_path))
    chunks = json.loads(metadata_path.read_text(encoding='utf-8'))

    logger.info(f"Loaded FAISS index '{index_name}' with {index.ntotal} vectors")
    return index, chunks
