"""
models/complaint.py — Pydantic schemas for complaint documents

Pydantic models serve two purposes:
  1. Request body validation (FastAPI auto-parses and validates)
  2. Response serialization (converts MongoDB docs to clean JSON)
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid


class ComplaintCreate(BaseModel):
    """Fields submitted by the user during complaint registration."""
    name: str = Field(..., min_length=2, max_length=100, description="Missing person's full name")
    mobile: str = Field(..., pattern=r"^\d{10}$", description="10-digit mobile number")
    contact_person: str = Field(..., min_length=2, description="Name of contact person")
    age: Optional[int] = Field(None, ge=1, le=120)
    gender: Optional[str] = Field(None, pattern="^(Male|Female|Other)$")
    last_seen_location: Optional[str] = None
    description: Optional[str] = None
    # Images are uploaded as files (multipart), not in this body model


class ComplaintResponse(BaseModel):
    """What the API returns after a complaint is created."""
    complaint_id: str
    name: str
    mobile: str
    contact_person: str
    age: Optional[int]
    gender: Optional[str]
    last_seen_location: Optional[str]
    description: Optional[str]
    status: str                          # "pending" | "solved"
    photo_path: Optional[str]            # server path to person photo
    id_proof_path: Optional[str]         # server path to ID document
    has_embedding: bool                  # True once face embedding is extracted
    created_at: datetime
    updated_at: datetime

    class Config:
        # Allow MongoDB ObjectId and datetime serialization
        populate_by_name = True


class ComplaintInDB(ComplaintResponse):
    """
    Full document stored in MongoDB.
    embedding is NOT included in API responses (large list of floats).
    """
    embedding: Optional[List[float]] = None   # 512-dim FaceNet vector
    embedding_model: Optional[str] = None     # e.g. "Facenet512"
