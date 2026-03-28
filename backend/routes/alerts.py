"""
routes/alerts.py — Alert management endpoints

GET  /alerts         → List all alerts (paginated, newest first)
GET  /alerts/{id}    → Get a single alert
PATCH /alerts/{id}/ack → Mark alert as acknowledged (admin)
"""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from fastapi import Form

from db import alerts_col
from utils.jwt_handler import get_current_admin

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/")
async def list_alerts(
    skip: int = 0,
    limit: int = 20,
    unacknowledged_only: bool = False,
    _admin: dict = Depends(get_current_admin),
):
    """
    Return alerts sorted by newest first.
    ?unacknowledged_only=true → only pending alerts
    """
    query = {}
    if unacknowledged_only:
        query["acknowledged"] = False

    cursor = (
        alerts_col()
        .find(query, {"_id": 0})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    docs = await cursor.to_list(length=limit)
    total = await alerts_col().count_documents(query)
    return {"alerts": docs, "count": len(docs), "total": total}


@router.get("/{alert_id}")
async def get_alert(alert_id: str, _admin: dict = Depends(get_current_admin)):
    doc = await alerts_col().find_one({"alert_id": alert_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return doc


@router.patch("/{alert_id}/ack")
async def acknowledge_alert(alert_id: str, _admin: dict = Depends(get_current_admin)):
    """Mark an alert as acknowledged so it doesn't clutter the dashboard."""
    result = await alerts_col().update_one(
        {"alert_id": alert_id},
        {"$set": {"acknowledged": True, "acknowledged_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return {"message": "Alert acknowledged."}
