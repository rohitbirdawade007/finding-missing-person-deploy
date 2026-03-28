"""
utils/image_utils.py — Image helper functions

Handles:
  • Saving uploaded files to disk
  • Converting images to/from base64 (for API responses)
  • Resizing images for embedding extraction
"""

import os
import base64
import uuid
import cv2
import numpy as np
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")


def ensure_upload_dir():
    """Create uploads directory structure if it doesn't exist."""
    for sub in ["photos", "id_proofs", "snapshots"]:
        Path(f"{UPLOAD_DIR}/{sub}").mkdir(parents=True, exist_ok=True)


def save_upload_file(file_bytes: bytes, subfolder: str, extension: str = ".jpg") -> str:
    """
    Save raw image bytes to disk.

    Returns the relative file path (stored in MongoDB).
    """
    ensure_upload_dir()
    filename = f"{uuid.uuid4().hex}{extension}"
    filepath = os.path.join(UPLOAD_DIR, subfolder, filename)
    with open(filepath, "wb") as f:
        f.write(file_bytes)
    return filepath


def image_to_base64(image_path: str) -> str | None:
    """Read an image file and return its base64 string."""
    try:
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    except FileNotFoundError:
        return None


def ndarray_to_base64(img_bgr: np.ndarray) -> str:
    """Convert an OpenCV BGR image (numpy array) to base64 string."""
    _, buffer = cv2.imencode(".jpg", img_bgr)
    return base64.b64encode(buffer).decode("utf-8")


def base64_to_ndarray(b64_str: str) -> np.ndarray | None:
    """Convert a base64 string back to an OpenCV image array."""
    try:
        decoded = base64.b64decode(b64_str)
        nparr = np.frombuffer(decoded, np.uint8)
        return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    except Exception:
        return None


def resize_for_embedding(img_bgr: np.ndarray, size: int = 160) -> np.ndarray:
    """
    Resize an image for faster embedding extraction.
    FaceNet was trained on 160×160 aligned faces.
    DeepFace handles this internally, but pre-resizing
    reduces processing time for large frames.
    """
    return cv2.resize(img_bgr, (size, size), interpolation=cv2.INTER_AREA)
