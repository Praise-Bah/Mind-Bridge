"""RAG Retriever — embeds queries and retrieves relevant passages from FAISS.

Lazy-loads the FAISS index as a singleton so the embedding model and index
are only loaded once per process lifetime.
"""
import logging
import threading

import numpy as np
from sentence_transformers import SentenceTransformer

from .index import EMBEDDING_MODEL, load_index

logger = logging.getLogger(__name__)


class RAGRetriever:
    """Retrieves relevant knowledge base passages for a given query.

    Uses a singleton pattern to avoid reloading the model and index on every request.
    Thread-safe via a lock on initialization.
    """

    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
                    cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self._model = None
        self._indexes = {}  # name -> (faiss_index, chunks)
        self._initialized = True

    def _ensure_model(self):
        if self._model is None:
            logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
            self._model = SentenceTransformer(EMBEDDING_MODEL)

    def _ensure_index(self, index_name: str = 'mental_health') -> bool:
        """Load an index if not already loaded. Returns True if available."""
        if index_name in self._indexes:
            return True

        result = load_index(index_name)
        if result is None:
            logger.warning(f"FAISS index '{index_name}' not found on disk. "
                          f"Run 'python manage.py build_faiss_index' to create it.")
            return False

        self._indexes[index_name] = result
        return True

    def retrieve(
        self,
        query: str,
        index_name: str = 'mental_health',
        top_k: int = 5,
    ) -> list[dict]:
        """Retrieve the top-k most relevant passages for a query.

        Args:
            query: The user's message or search query.
            index_name: Which FAISS index to search ('mental_health' or 'campus').
            top_k: Number of passages to retrieve (default: 5).

        Returns:
            List of dicts with 'content', 'source', and 'score' keys,
            sorted by relevance (highest score first).
            Returns empty list if the index is not available.
        """
        if not self._ensure_index(index_name):
            return []

        self._ensure_model()

        index, chunks = self._indexes[index_name]

        # Embed the query
        query_embedding = self._model.encode(
            [query], normalize_embeddings=True
        ).astype(np.float32)

        # Search FAISS index
        scores, indices = index.search(query_embedding, min(top_k, index.ntotal))

        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < 0:  # FAISS returns -1 for missing results
                continue
            chunk = chunks[idx]
            results.append({
                'content': chunk['content'],
                'source': chunk['source'],
                'score': float(score),
            })

        return results

    def retrieve_from_all(
        self,
        query: str,
        top_k: int = 5,
    ) -> list[dict]:
        """Retrieve from all available indexes and merge results by score.

        Useful when the query could match either mental health or campus content.
        """
        all_results = []
        for index_name in ['mental_health', 'campus']:
            results = self.retrieve(query, index_name=index_name, top_k=top_k)
            all_results.extend(results)

        # Sort by score descending and take top_k
        all_results.sort(key=lambda x: x['score'], reverse=True)
        return all_results[:top_k]

    @classmethod
    def reset(cls):
        """Reset the singleton (useful for testing or after rebuilding indexes)."""
        with cls._lock:
            cls._instance = None
