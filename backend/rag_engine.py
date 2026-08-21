"""Qdrant-backed RAG engine for ModalTani.

- Local self-hosted Qdrant (embedded path storage — no separate service).
- Embeddings via FastEmbed (multilingual model, Indonesian friendly).
- Semantic chunking via langchain_experimental.SemanticChunker.
"""
import os
import re
import logging
import uuid as uuidlib
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger(__name__)

QDRANT_PATH = os.environ.get("QDRANT_PATH", "/app/qdrant_storage")
QDRANT_COLLECTION = os.environ.get("QDRANT_COLLECTION", "modaltani_kur_kb")
EMBED_MODEL = os.environ.get(
    "QDRANT_EMBED_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)

_client = None
_embedder = None
_semantic_chunker = None
_ready = False
_init_error: Optional[str] = None


def _init_all():
    global _client, _embedder, _semantic_chunker, _ready, _init_error
    if _ready:
        return True
    if _init_error:
        return False
    try:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams
        from langchain_community.embeddings import FastEmbedEmbeddings
        from langchain_experimental.text_splitter import SemanticChunker

        Path(QDRANT_PATH).mkdir(parents=True, exist_ok=True)
        _client = QdrantClient(path=QDRANT_PATH)
        _embedder = FastEmbedEmbeddings(model_name=EMBED_MODEL)
        # discover dim
        probe = _embedder.embed_query("probe kur pertanian")
        dim = len(probe)
        # ensure collection exists
        existing = [c.name for c in _client.get_collections().collections]
        if QDRANT_COLLECTION not in existing:
            _client.create_collection(
                collection_name=QDRANT_COLLECTION,
                vectors_config=VectorParams(size=dim, distance=Distance.COSINE),
            )
        _semantic_chunker = SemanticChunker(
            _embedder, breakpoint_threshold_type="percentile"
        )
        _ready = True
        logger.info(
            f"[RAG] Qdrant ready • path={QDRANT_PATH} • collection={QDRANT_COLLECTION} • model={EMBED_MODEL} • dim={dim}"
        )
        return True
    except Exception as e:
        _init_error = str(e)
        logger.error(f"[RAG] init failed: {e}")
        return False


def is_ready() -> bool:
    return _ready


def status() -> dict:
    return {
        "ready": _ready,
        "collection": QDRANT_COLLECTION,
        "path": QDRANT_PATH,
        "embed_model": EMBED_MODEL,
        "error": _init_error,
    }


def _naive_chunk(text: str, target: int = 800) -> List[str]:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= target:
        return [text]
    sents = re.split(r"(?<=[\.\?\!])\s+", text)
    out, cur = [], ""
    for s in sents:
        if len(cur) + len(s) + 1 <= target:
            cur = (cur + " " + s).strip()
        else:
            if cur:
                out.append(cur)
            cur = s
    if cur:
        out.append(cur)
    return out


def semantic_chunk(text: str, max_chunk: int = 1500) -> List[str]:
    """Split text with SemanticChunker; fall back to sentence packing on failure."""
    text = (text or "").strip()
    if not text:
        return []
    if not _init_all():
        return _naive_chunk(text)
    try:
        chunks = _semantic_chunker.split_text(text)
        # hard cap any oversized chunk
        cleaned = []
        for c in chunks:
            c = c.strip()
            if not c:
                continue
            if len(c) > max_chunk:
                cleaned.extend(_naive_chunk(c, max_chunk))
            else:
                cleaned.append(c)
        return cleaned or _naive_chunk(text)
    except Exception as e:
        logger.warning(f"[RAG] semantic_chunk fallback: {e}")
        return _naive_chunk(text)


def upsert_docs(docs: List[dict]) -> int:
    """Each doc must have `id` and `isi_teks`. Full doc is stored as payload."""
    if not docs or not _init_all():
        return 0
    try:
        from qdrant_client.models import PointStruct
        texts = [d.get("isi_teks", "") for d in docs]
        vectors = _embedder.embed_documents(texts)
        points = []
        for d, v in zip(docs, vectors):
            payload = {k: v2 for k, v2 in d.items() if k != "_id"}
            payload["_doc_id"] = d.get("id")
            points.append(
                PointStruct(id=str(uuidlib.uuid4()), vector=v, payload=payload)
            )
        _client.upsert(collection_name=QDRANT_COLLECTION, points=points)
        return len(points)
    except Exception as e:
        logger.error(f"[RAG] upsert failed: {e}")
        return 0


def delete_doc(doc_id: str) -> bool:
    if not _init_all():
        return False
    try:
        from qdrant_client.models import Filter, FieldCondition, MatchValue
        _client.delete(
            collection_name=QDRANT_COLLECTION,
            points_selector=Filter(
                must=[FieldCondition(key="_doc_id", match=MatchValue(value=doc_id))]
            ),
        )
        return True
    except Exception as e:
        logger.error(f"[RAG] delete failed: {e}")
        return False


def clear_collection() -> bool:
    if not _init_all():
        return False
    try:
        from qdrant_client.models import Distance, VectorParams
        _client.delete_collection(QDRANT_COLLECTION)
        probe = _embedder.embed_query("probe")
        _client.create_collection(
            collection_name=QDRANT_COLLECTION,
            vectors_config=VectorParams(size=len(probe), distance=Distance.COSINE),
        )
        return True
    except Exception as e:
        logger.error(f"[RAG] clear failed: {e}")
        return False


def count_points() -> int:
    if not _init_all():
        return 0
    try:
        info = _client.get_collection(QDRANT_COLLECTION)
        return int(getattr(info, "points_count", 0) or 0)
    except Exception:
        return 0


def search(query: str, top_k: int = 3, min_score: float = 0.0) -> List[dict]:
    if not query or not _init_all():
        return []
    try:
        vec = _embedder.embed_query(query)
        result = _client.query_points(
            collection_name=QDRANT_COLLECTION,
            query=vec,
            limit=top_k,
            with_payload=True,
        )
        out = []
        for point in result.points:
            if point.score < min_score:
                continue
            payload = point.payload or {}
            payload["_score"] = float(point.score)
            out.append(payload)
        return out
    except Exception as e:
        logger.error(f"[RAG] search failed: {e}")
        return []
