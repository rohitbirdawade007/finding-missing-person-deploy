"""
routes/stats.py — Dashboard statistics endpoint

GET /stats → Returns counts for home page charts
"""

from fastapi import APIRouter
from db import complaints_col, alerts_col

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/")
async def get_stats():
    """
    Returns aggregate statistics for the dashboard and home page.

    Response shape:
    {
      "total_complaints": 42,
      "pending":          30,
      "solved":           12,
      "total_alerts":     8,
      "unacknowledged_alerts": 3
    }
    """
    col = complaints_col()
    total      = await col.count_documents({})
    pending    = await col.count_documents({"status": "pending"})
    solved     = await col.count_documents({"status": "solved"})
    no_embed   = await col.count_documents({"has_embedding": False})

    acol = alerts_col()
    total_alerts = await acol.count_documents({})
    unacked      = await acol.count_documents({"acknowledged": False})

    return {
        "total_complaints":       total,
        "pending":                pending,
        "solved":                 solved,
        "complaints_no_embedding": no_embed,
        "total_alerts":           total_alerts,
        "unacknowledged_alerts":  unacked,
    }
