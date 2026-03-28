"""
utils/face_embeddings.py — Face Embedding Extraction & Comparison

This is the heart of the AI matching pipeline.

Flow:
  1. Complaint registration:
       image file → extract_embedding() → 512-dim vector → stored in MongoDB

  2. Detection (live/uploaded frame):
       frame → extract_embedding() → compare_embeddings() → match found?

Models supported (via DeepFace):
  • "Facenet512"  — 512-dim, best accuracy  (DEFAULT)
  • "Facenet"     — 128-dim, faster
  • "ArcFace"     — production-grade, very accurate

Distance metrics:
  • Cosine similarity  — angle between vectors (scale-invariant, RECOMMENDED)
  • Euclidean distance — absolute distance in embedding space

Thresholds (lower distance = higher similarity):
  ┌─────────────┬──────────────────┬───────────────────┐
  │ Model       │ Cosine threshold │ Euclidean thresho │
  ├─────────────┼──────────────────┼───────────────────┤
  │ Facenet512  │ 0.30             │ 23.56             │
  │ Facenet     │ 0.40             │ 10.00             │
  │ ArcFace     │ 0.68             │ 4.15              │
  └─────────────┴──────────────────┴───────────────────┘
"""

import os
import numpy as np
import cv2
from pathlib import Path
from typing import Optional
from scipy.spatial.distance import cosine as cosine_distance
from deepface import DeepFace
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

# ── Configuration ─────────────────────────────────────────────
FACE_MODEL        = os.getenv("FACE_MODEL", "Facenet512")
COSINE_THRESHOLD  = float(os.getenv("COSINE_THRESHOLD", "0.4"))
EUCLIDEAN_THRESHOLD = float(os.getenv("EUCLIDEAN_THRESHOLD", "23.56"))


# ══════════════════════════════════════════════════════════════
# 1. EXTRACTION — Convert an image into a face embedding vector
# ══════════════════════════════════════════════════════════════

def extract_embedding(image_input: str | np.ndarray) -> Optional[list[float]]:
    """
    Extract a face embedding vector from an image.

    Args:
        image_input: Either:
            • A file path (str) to a JPEG/PNG image
            • A NumPy array (BGR, from OpenCV)

    Returns:
        A list of floats representing the face embedding vector.
        Returns None if no face is detected or an error occurs.

    How it works:
        DeepFace uses the chosen model (Facenet512 by default) to:
          1. Detect a face in the image using MTCNN/RetinaFace
          2. Align the face (correct rotation, scale)
          3. Pass the aligned face through the FaceNet CNN
          4. Return the final-layer activations as the embedding
    """
    try:
        # DeepFace.represent() returns a list of dicts, one per detected face
        # enforce_detection=False: don't crash if no face found, return None
        results = DeepFace.represent(
            img_path=image_input,
            model_name=FACE_MODEL,
            enforce_detection=True,          # raise if no face
            detector_backend="retinaface",   # best face detector available
            align=True,                      # geometric alignment
        )

        if not results:
            logger.warning("extract_embedding: No face detected.")
            return None

        # If multiple faces detected, take the one with highest confidence
        best = max(results, key=lambda r: r.get("face_confidence", 0))
        embedding = best["embedding"]

        logger.info(
            f"extract_embedding: model={FACE_MODEL}, "
            f"dim={len(embedding)}, confidence={best.get('face_confidence', '?'):.3f}"
        )
        return embedding

    except ValueError as e:
        # DeepFace raises ValueError when no face is found with enforce_detection=True
        logger.warning(f"extract_embedding: No face found — {e}")
        return None
    except Exception as e:
        logger.error(f"extract_embedding: Unexpected error — {e}")
        return None


def extract_embedding_from_bytes(image_bytes: bytes) -> Optional[list[float]]:
    """
    Convenience wrapper: extract embedding from raw image bytes
    (e.g., uploaded file content or a captured video frame).

    Decodes bytes → NumPy array → extract_embedding()
    """
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img_bgr is None:
            logger.error("extract_embedding_from_bytes: Failed to decode image bytes.")
            return None
        return extract_embedding(img_bgr)
    except Exception as e:
        logger.error(f"extract_embedding_from_bytes: Error — {e}")
        return None


# ══════════════════════════════════════════════════════════════
# 2. COMPARISON — Measure similarity between two embeddings
# ══════════════════════════════════════════════════════════════

def cosine_similarity_score(emb1: list[float], emb2: list[float]) -> float:
    """
    Compute cosine similarity between two embedding vectors.

    Returns a value in [0.0, 1.0]:
      • 1.0 = identical direction (same face)
      • 0.0 = completely orthogonal (completely different)

    Internally computes cosine DISTANCE (0 to 2) then converts:
        similarity = 1 - cosine_distance
    """
    v1 = np.array(emb1, dtype=np.float32)
    v2 = np.array(emb2, dtype=np.float32)
    dist = cosine_distance(v1, v2)   # scipy: 1 - dot(u, v) / (||u|| * ||v||)
    similarity = 1.0 - dist
    return float(similarity)


def euclidean_distance_score(emb1: list[float], emb2: list[float]) -> float:
    """
    Compute Euclidean (L2) distance between two embedding vectors.

    Returns:
        Distance value — lower means more similar.
    """
    v1 = np.array(emb1, dtype=np.float32)
    v2 = np.array(emb2, dtype=np.float32)
    return float(np.linalg.norm(v1 - v2))


def is_match(emb1: list[float], emb2: list[float], metric: str = "cosine") -> tuple[bool, float]:
    """
    Determine if two embeddings belong to the same person.

    Args:
        emb1: Embedding from a complaint photo (stored in DB)
        emb2: Embedding from a live/uploaded detection frame
        metric: "cosine" (default) or "euclidean"

    Returns:
        (matched: bool, score: float)
            • matched: True if distance is within threshold
            • score: The raw distance/similarity value

    Threshold logic:
        Cosine    → score = similarity (0–1); match if score > (1 - COSINE_THRESHOLD)
        Euclidean → score = distance;         match if score < EUCLIDEAN_THRESHOLD
    """
    if not emb1 or not emb2:
        return False, 0.0

    if metric == "cosine":
        similarity = cosine_similarity_score(emb1, emb2)
        matched = similarity >= (1.0 - COSINE_THRESHOLD)
        return matched, similarity

    elif metric == "euclidean":
        distance = euclidean_distance_score(emb1, emb2)
        matched = distance <= EUCLIDEAN_THRESHOLD
        return matched, distance

    else:
        raise ValueError(f"Unknown metric '{metric}'. Use 'cosine' or 'euclidean'.")


# ══════════════════════════════════════════════════════════════
# 3. BATCH SEARCH — Find best match in a list of complaints
# ══════════════════════════════════════════════════════════════

def find_best_match(
    probe_embedding: list[float],
    complaint_embeddings: list[dict],
    metric: str = "cosine",
    top_k: int = 1,
) -> list[dict]:
    """
    Search all stored complaint embeddings for the closest match.

    Args:
        probe_embedding:    Embedding extracted from a detected face
        complaint_embeddings: List of dicts, each must have:
                              {"complaint_id": str, "embedding": list[float], ...}
        metric:             "cosine" or "euclidean"
        top_k:              Return the top-k results (default: 1 best match)

    Returns:
        List of dicts with match results, sorted by score (best first):
        [
          {
            "complaint_id": "...",
            "matched": True,
            "score": 0.91,
            "metric": "cosine"
          },
          ...
        ]

    Algorithm:
        For each stored embedding, compute similarity to probe.
        Sort by similarity (descending for cosine, ascending for euclidean).
        Return top_k results that exceed the match threshold.
    """
    results = []

    for record in complaint_embeddings:
        stored_emb = record.get("embedding")
        if not stored_emb:
            continue  # skip complaints with no embedding yet

        matched, score = is_match(probe_embedding, stored_emb, metric=metric)
        results.append({
            "complaint_id":   record.get("complaint_id"),
            "name":           record.get("name", "Unknown"),
            "photo_path":     record.get("photo_path"),
            "matched":        matched,
            "score":          round(score, 4),
            "metric":         metric,
        })

    # Sort by score:
    # Cosine similarity → higher is better → descending
    # Euclidean distance → lower is better → ascending
    reverse = (metric == "cosine")
    results.sort(key=lambda r: r["score"], reverse=reverse)

    # Return only top_k results that are actual matches
    matches = [r for r in results if r["matched"]]
    return matches[:top_k] if matches else results[:top_k]
