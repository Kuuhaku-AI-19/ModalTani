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


def _cosine(a, b) -> float:
    import math as _m
    dot = sum(x * y for x, y in zip(a, b))
    na = _m.sqrt(sum(x * x for x in a))
    nb = _m.sqrt(sum(y * y for y in b))
    if na == 0 or nb == 0:
        return 0.0
    return dot / (na * nb)


def chunk_quality_report(chunks: List[str]) -> List[dict]:
    """For each adjacent pair, compute cosine similarity between chunk embeddings.

    Lower similarity → semantic split found a real topic boundary (good).
    Higher similarity → chunks are still on the same topic (SemanticChunker over-split).
    """
    if not _init_all() or len(chunks) < 2:
        return []
    try:
        vectors = _embedder.embed_documents(chunks)
        report = []
        for i in range(len(chunks) - 1):
            sim = round(_cosine(vectors[i], vectors[i + 1]), 3)
            if sim < 0.55:
                verdict = "topik berbeda ✓"
            elif sim < 0.80:
                verdict = "transisi lembut"
            else:
                verdict = "sangat mirip — mungkin bisa digabung ⚠"
            report.append({
                "pair": f"Chunk {i + 1} ↔ {i + 2}",
                "similarity": sim,
                "verdict": verdict,
            })
        return report
    except Exception as e:
        logger.warning(f"[RAG] chunk_quality_report failed: {e}")
        return []


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


def _tokenize_bm25(text: str) -> List[str]:
    import re as _re
    return _re.findall(r"\w+", (text or "").lower())


def hybrid_search(query: str, corpus: List[dict], top_k: int = 3, rrf_k: int = 60) -> List[dict]:
    """Reciprocal Rank Fusion of dense (Qdrant) + BM25 keyword search.

    Args:
        query: user query.
        corpus: full docs list (list of dicts each with `id`, `isi_teks`, ...) — mongo mirror.
        top_k: number of results to return.
        rrf_k: RRF constant (typical 60).

    Falls back gracefully when either engine fails.
    """
    if not query:
        return []

    dense_hits = []
    dense_by_id = {}
    if _init_all():
        try:
            hits = search(query, top_k=max(top_k * 3, 10))
            for rank, h in enumerate(hits, start=1):
                did = h.get("_doc_id") or h.get("id")
                if not did:
                    continue
                dense_hits.append((did, rank, h))
                dense_by_id[did] = h
        except Exception as e:
            logger.warning(f"[RAG] hybrid dense leg failed: {e}")

    bm25_hits = []
    try:
        from rank_bm25 import BM25Okapi
        tokenized = [_tokenize_bm25(f"{d.get('topik','')} {d.get('judul','')} {d.get('isi_teks','')}") for d in corpus]
        if any(tokenized):
            bm25 = BM25Okapi(tokenized)
            scores = bm25.get_scores(_tokenize_bm25(query))
            ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)
            for rank, (idx, sc) in enumerate(ranked[: max(top_k * 3, 10)], start=1):
                if sc <= 0:
                    continue
                did = corpus[idx].get("id")
                bm25_hits.append((did, rank, corpus[idx], sc))
    except Exception as e:
        logger.warning(f"[RAG] hybrid BM25 leg failed: {e}")

    # RRF fusion
    rrf_scores = {}
    docs_by_id = {}
    for did, rank, doc in dense_hits:
        rrf_scores[did] = rrf_scores.get(did, 0.0) + 1.0 / (rrf_k + rank)
        docs_by_id[did] = doc
    for did, rank, doc, _bm in bm25_hits:
        rrf_scores[did] = rrf_scores.get(did, 0.0) + 1.0 / (rrf_k + rank)
        # prefer dense payload if present, else fall back to corpus doc
        if did not in docs_by_id:
            docs_by_id[did] = doc

    if not rrf_scores:
        return []

    ordered = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]
    out = []
    for did, score in ordered:
        d = docs_by_id.get(did, {})
        d = {k: v for k, v in d.items() if not k.startswith("_")}
        d["_rrf_score"] = round(score, 4)
        d["_has_dense"] = did in dense_by_id
        d["_has_bm25"] = any(x[0] == did for x in bm25_hits)
        out.append(d)
    return out
