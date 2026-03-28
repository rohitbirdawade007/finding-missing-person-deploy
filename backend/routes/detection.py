"""
routes/detection.py — Face Detection & Matching Endpoint

POST /detect  → Accept an image/frame, run face matching against all complaints

This is how the live detection pipeline works:
  1. Frontend captures a video frame from the browser camera (WebRTC)
  2. Sends it as base64 string or file upload to this endpoint
  3. Backend extracts face embedding from the frame
  4. Compares it against ALL complaint embeddings in MongoDB
  5. If a match is found → creates an alert and returns it

For production: this runs every N frames to manage load.
"""

import uuid
import base64
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel
from typing import Optional

from db import complaints_col, alerts_col
from utils.face_embeddings import (
    extract_embedding_from_bytes,
    find_best_match,
)
from utils.image_utils import ndarray_to_base64, base64_to_ndarray
from utils.jwt_handler import get_current_admin

router = APIRouter(prefix="/detect", tags=["Detection"])


class FrameBase64Request(BaseModel):
    """Request body for base64-encoded frame detection."""
    frame_b64: str              # base64-encoded JPEG frame from browser
    location: str = "Camera-01"  # Camera/location identifier


# ─────────────────────────────────────────────────────────────
# Internal helper: load all complaint embeddings from DB
# ─────────────────────────────────────────────────────────────
async def _load_all_embeddings() -> list[dict]:
    """
    Fetch complaint_id, name, photo_path, and embedding for all
    pending complaints that have embeddings stored.

    Only includes 'pending' complaints (solved ones don't need detection).
    """
    cursor = complaints_col().find(
        {"status": "pending", "has_embedding": True},
        {"complaint_id": 1, "name": 1, "photo_path": 1, "embedding": 1, "_id": 0}
    )
    return await cursor.to_list(length=None)


# ─────────────────────────────────────────────────────────────
# POST /detect/frame  — Base64 frame from browser (WebRTC)
# ─────────────────────────────────────────────────────────────
@router.post("/frame")
async def detect_from_frame(
    body: FrameBase64Request,
    _admin: dict = Depends(get_current_admin),
):
    """
    Detect and match faces in a base64-encoded video frame.

    Called periodically by the frontend (e.g., every 30 frames).
    Returns any matches found — frontend displays them as alerts.
    """
    # Decode base64 frame
    img = base64_to_ndarray(body.frame_b64)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid base64 image data.")

    # Extract face embedding from the frame
    import cv2
    _, frame_bytes = cv2.imencode(".jpg", img)
    probe_embedding = extract_embedding_from_bytes(frame_bytes.tobytes())

    if probe_embedding is None:
        return {"matched": False, "message": "No face detected in frame.", "alerts": []}

    # Load all stored complaint embeddings
    complaint_embeddings = await _load_all_embeddings()
    if not complaint_embeddings:
        return {"matched": False, "message": "No active complaints with embeddings.", "alerts": []}

    # Find best match using cosine similarity
    matches = find_best_match(probe_embedding, complaint_embeddings, metric="cosine", top_k=3)
    matched_results = [m for m in matches if m["matched"]]

    if not matched_results:
        return {"matched": False, "message": "No match found.", "alerts": []}

    # Create alerts for each match
    created_alerts = []
    for match in matched_results:
        alert_id = str(uuid.uuid4())
        alert_doc = {
            "alert_id":           alert_id,
            "complaint_id":       match["complaint_id"],
            "name":               match["name"],
            "score":              match["score"],
            "metric":             match["metric"],
            "location":           body.location,
            "detected_face_b64":  ndarray_to_base64(img),  # full frame as snapshot
            "acknowledged":       False,
            "created_at":         datetime.now(timezone.utc),
        }
        await alerts_col().insert_one(alert_doc)
        alert_doc.pop("_id", None)
        created_alerts.append(alert_doc)

    return {
        "matched": True,
        "message": f"Found {len(created_alerts)} match(es).",
        "alerts": created_alerts,
    }


# ─────────────────────────────────────────────────────────────
# POST /detect/upload  — Upload an image file for detection
# ─────────────────────────────────────────────────────────────
@router.post("/upload")
async def detect_from_upload(
    image: UploadFile = File(...),
    location: str = "Manual Upload",
    _admin: dict = Depends(get_current_admin),
):
    """
    Accept an uploaded image file and run face matching.
    Useful for testing without a live camera.
    """
    image_bytes = await image.read()
    probe_embedding = extract_embedding_from_bytes(image_bytes)

    if probe_embedding is None:
        raise HTTPException(status_code=422, detail="No face detected in the uploaded image.")

    complaint_embeddings = await _load_all_embeddings()
    matches = find_best_match(probe_embedding, complaint_embeddings, metric="cosine", top_k=3)
    matched_results = [m for m in matches if m["matched"]]

    return {
        "matched": len(matched_results) > 0,
        "total_compared": len(complaint_embeddings),
        "matches": matched_results,
    }
