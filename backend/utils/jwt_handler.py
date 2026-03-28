"""
utils/jwt_handler.py — JWT Token creation and verification

Uses python-jose for HS256 token signing.
Tokens carry the admin's email and role.
"""

import os
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fallback_dev_secret_change_me")
ALGORITHM  = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_MIN = int(os.getenv("JWT_EXPIRE_MINUTES", "480"))

# FastAPI dependency: reads Bearer token from Authorization header
bearer_scheme = HTTPBearer()


def create_access_token(data: dict) -> str:
    """
    Create a signed JWT token.

    Args:
        data: Payload dict, e.g. {"sub": "admin@guardian.ai", "role": "admin"}

    Returns:
        Signed JWT string
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=EXPIRE_MIN)
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_token(token: str) -> dict:
    """
    Decode and validate a JWT token.

    Returns:
        Decoded payload dict

    Raises:
        HTTPException 401 if token is invalid or expired
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token. Please log in again.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        raise credentials_exception


# ── FastAPI dependency ─────────────────────────────────────────

def get_current_admin(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    FastAPI dependency — attach to any protected route:

        @router.get("/secret")
        async def secret(admin = Depends(get_current_admin)):
            ...

    Extracts the Bearer token from the Authorization header,
    verifies it, and returns the decoded payload.
    """
    return verify_token(credentials.credentials)
