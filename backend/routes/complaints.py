"""
routes/complaints.py — Complaint registration & retrieval

POST /complaint       → Register a new complaint (multipart form + images)
GET  /complaint/{id}  → Fetch complaint by complaint_id
GET  /complaints      → List all complaints (admin only, paginated)
PATCH /complaint/{id}/status → Update complaint status
"""

import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from typing import Optional

from db import complaints_col
from utils.image_utils import save_upload_file
from utils.face_embeddings import extract_embedding_from_bytes, FACE_MODEL
from utils.jwt_handler import get_current_admin

router = APIRouter(prefix="/complaint", tags=["Complaints"])


# ─────────────────────────────────────────────────────────────
# POST /complaint  — Register a new missing person complaint
# ─────────────────────────────────────────────────────────────
@router.post("/", status_code=status.HTTP_201_CREATED)
async def register_complaint(
    # Text fields via multipart form
    name:           str = Form(...),
    mobile:         str = Form(...),
    contact_person: str = Form(...),
    age:            Optional[int] = Form(None),
    gender:         Optional[str] = Form(None),
    last_seen_location: Optional[str] = Form(None),
    description:    Optional[str] = Form(None),
    # Image uploads
    photo:    UploadFile = File(..., description="Photo of the missing person"),
    id_proof: UploadFile = File(..., description="ID proof document image"),
):
    """
    Register a missing person complaint.

    Steps:
      1. Save uploaded images to disk
      2. Extract face embedding from the person's photo using FaceNet/DeepFace
      3. Store complaint + embedding in MongoDB
      4. Return the unique complaint_id

    The embedding is what makes detection possible later —
    every incoming face will be compared against all stored embeddings.
    """
    # ── Step 1: Save images ──────────────────────────────────
    photo_bytes    = await photo.read()
    id_proof_bytes = await id_proof.read()

    photo_path    = save_upload_file(photo_bytes,    "photos",    ".jpg")
    id_proof_path = save_upload_file(id_proof_bytes, "id_proofs", ".jpg")

    # ── Step 2: Extract face embedding ───────────────────────
    embedding = extract_embedding_from_bytes(photo_bytes)

    if embedding is None:
        # Complaint is still saved, but marked as no embedding
        # The admin can re-upload a clearer photo later
        has_embedding = False
    else:
        has_embedding = True

    # ── Step 3: Build MongoDB document ───────────────────────
    complaint_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)

    doc = {
        "complaint_id":       complaint_id,
        "name":               name,
        "mobile":             mobile,
        "contact_person":     contact_person,
        "age":                age,
        "gender":             gender,
        "last_seen_location": last_seen_location,
        "description":        description,
        "photo_path":         photo_path,
        "id_proof_path":      id_proof_path,
        "status":             "pending",
        "has_embedding":      has_embedding,
        "embedding":          embedding,          # list[float] or None
        "embedding_model":    FACE_MODEL if has_embedding else None,
        "created_at":         now,
        "updated_at":         now,
    }

    # ── Step 4: Insert into MongoDB ──────────────────────────
    await complaints_col().insert_one(doc)

    return {
        "message":      "Complaint registered successfully.",
        "complaint_id": complaint_id,
        "has_embedding": has_embedding,
        "warning": None if has_embedding else
                   "No face detected in the photo. Please upload a clearer image.",
    }


# ─────────────────────────────────────────────────────────────
# GET /complaint/{id}  — Track a complaint by ID
# ─────────────────────────────────────────────────────────────
@router.get("/{complaint_id}")
async def get_complaint(complaint_id: str):
    """
    Public endpoint — anyone with a complaint ID can check status.
    Embedding vector is NOT returned in this response.
    """
    doc = await complaints_col().find_one(
        {"complaint_id": complaint_id},
        {"_id": 0, "embedding": 0}   # exclude MongoDB _id and embedding
    )
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Complaint '{complaint_id}' not found.",
        )
    return doc


# ─────────────────────────────────────────────────────────────
# GET /complaint  — List all complaints (admin only)
# ─────────────────────────────────────────────────────────────
@router.get("/")
async def list_complaints(
    skip: int = 0,
    limit: int = 20,
    status_filter: Optional[str] = None,
    _admin: dict = Depends(get_current_admin),   # JWT required
):
    """
    Paginated list of complaints. Admin only.
    Optional filter: ?status_filter=pending or ?status_filter=solved
    """
    query = {}
    if status_filter:
        query["status"] = status_filter

    cursor = complaints_col().find(query, {"_id": 0, "embedding": 0}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)
    return {"complaints": docs, "count": len(docs)}


# ─────────────────────────────────────────────────────────────
# PATCH /complaint/{id}/status  — Update complaint status
# ─────────────────────────────────────────────────────────────
@router.patch("/{complaint_id}/status")
async def update_status(
    complaint_id: str,
    new_status: str = Form(..., pattern="^(pending|solved)$"),
    _admin: dict = Depends(get_current_admin),
):
    """Mark a complaint as solved or revert to pending. Admin only."""
    result = await complaints_col().update_one(
        {"complaint_id": complaint_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Complaint not found.")
    return {"message": f"Status updated to '{new_status}'."}
