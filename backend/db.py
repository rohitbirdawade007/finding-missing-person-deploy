"""
db.py — MongoDB Atlas Connection (Motor async driver)

Motor is the async version of PyMongo.
It provides non-blocking DB operations that work natively
with FastAPI's async request handlers.

Collections used:
  • complaints  — missing person complaint documents
  • alerts      — face-match detection events
  • admins      — admin user credentials
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "")
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "guardian_eye")

if not MONGODB_URI:
    raise RuntimeError(
        "MONGODB_URI is not set. "
        "Copy .env.example → .env and add your Atlas connection string."
    )

# Single client instance (reused across all requests)
_client: AsyncIOMotorClient | None = None


def get_client() -> AsyncIOMotorClient:
    """Returns the shared Motor client, creating it on first call."""
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(MONGODB_URI)
    return _client


def get_db():
    """Returns the guardian_eye database object."""
    return get_client()[MONGODB_DB_NAME]


def get_collection(name: str):
    """Shortcut: get a named collection from the DB."""
    return get_db()[name]


# ── Named collection helpers ──────────────────────────────────
def complaints_col():
    return get_collection("complaints")

def alerts_col():
    return get_collection("alerts")

def admins_col():
    return get_collection("admins")


async def ping_db() -> bool:
    """Health check — returns True if Atlas responds."""
    try:
        await get_client().admin.command("ping")
        return True
    except Exception:
        return False
