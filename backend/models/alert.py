"""
models/alert.py — Alert document schema

Alerts are created when a face match is found during detection.
Each alert stores:
  • Which complaint was matched
  • Detection confidence score
  • The cropped face image (base64)
  • Mock location / camera ID
  • Timestamp
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AlertCreate(BaseModel):
    complaint_id: str
    name: str
    score: float = Field(..., ge=0.0, le=1.0, description="Match confidence (cosine similarity)")
    metric: str = Field(default="cosine")
    location: str = Field(default="Camera-01", description="Camera ID or location string")
    detected_face_b64: Optional[str] = None   # base64-encoded cropped face image
    frame_snapshot_b64: Optional[str] = None  # full frame base64 (optional)


class AlertResponse(AlertCreate):
    alert_id: str
    created_at: datetime
    acknowledged: bool = False   # admin can mark as acknowledged
