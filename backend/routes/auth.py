"""
routes/auth.py — Authentication endpoints

POST /login       → Email + password → returns JWT token
POST /seed-admin  → Create default admin (dev only, disable in production)
GET  /me          → Returns current admin info from token (protected)
"""

import os
from fastapi import APIRouter, HTTPException, status, Depends
from passlib.context import CryptContext
from dotenv import load_dotenv

from db import admins_col
from models.user import AdminLogin, AdminCreate, AdminInDB
from utils.jwt_handler import create_access_token, get_current_admin

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Authentication"])

# bcrypt password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


# ─────────────────────────────────────────────────────────────
# POST /auth/login
# ─────────────────────────────────────────────────────────────
@router.post("/login")
async def login(body: AdminLogin):
    """
    Authenticate an admin user and return a JWT access token.

    Request body:
      { "email": "admin@guardian.ai", "password": "Admin@1234" }

    Response:
      { "access_token": "eyJ...", "token_type": "bearer", "email": "..." }
    """
    col = admins_col()
    admin = await col.find_one({"email": body.email})

    if not admin or not verify_password(body.password, admin["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    token = create_access_token({"sub": admin["email"], "role": admin["role"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "email": admin["email"],
        "role": admin["role"],
    }


# ─────────────────────────────────────────────────────────────
# POST /auth/seed-admin  (dev utility — disable in production)
# ─────────────────────────────────────────────────────────────
@router.post("/seed-admin", status_code=status.HTTP_201_CREATED)
async def seed_admin():
    """
    Create the default admin from .env values.
    Safe to call multiple times — skips if already exists.

    Remove or protect this endpoint before production deployment.
    """
    email    = os.getenv("ADMIN_EMAIL", "admin@guardian.ai")
    password = os.getenv("ADMIN_PASSWORD", "Admin@1234")

    col = admins_col()
    existing = await col.find_one({"email": email})
    if existing:
        return {"message": f"Admin '{email}' already exists."}

    doc = {
        "email": email,
        "hashed_password": hash_password(password),
        "role": "admin",
    }
    await col.insert_one(doc)
    return {"message": f"Admin '{email}' created successfully."}


# ─────────────────────────────────────────────────────────────
# GET /auth/me  (protected)
# ─────────────────────────────────────────────────────────────
@router.get("/me")
async def get_me(current_admin: dict = Depends(get_current_admin)):
    """
    Returns the currently authenticated admin's info.
    Useful for frontend to verify token validity on page load.
    """
    return {
        "email": current_admin.get("sub"),
        "role":  current_admin.get("role"),
    }
