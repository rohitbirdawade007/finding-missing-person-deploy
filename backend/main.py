"""
main.py — FastAPI Application Entry Point

Registers all routers, configures CORS, static file serving,
and provides a health check endpoint.

Run locally:
    uvicorn main:app --reload --port 8000

Deploy (Render):
    uvicorn main:app --host 0.0.0.0 --port $PORT
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv

# ── Import routers ─────────────────────────────────────────────
from routes.auth       import router as auth_router
from routes.complaints import router as complaints_router
from routes.alerts     import router as alerts_router
from routes.detection  import router as detection_router
from routes.stats      import router as stats_router
from db import ping_db

load_dotenv()

# ── App instance ───────────────────────────────────────────────
app = FastAPI(
    title="Guardian Eye AI",
    description="AI-Based Missing Person Detection System — FastAPI Backend",
    version="2.0.0",
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc UI
)

# ── CORS ───────────────────────────────────────────────────────
# Read allowed origins from .env (comma-separated)
raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
origins = [o.strip() for o in raw_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static file serving (uploaded images) ─────────────────────
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ── Register routers ───────────────────────────────────────────
app.include_router(auth_router)
app.include_router(complaints_router)
app.include_router(alerts_router)
app.include_router(detection_router)
app.include_router(stats_router)

# ── Health check ───────────────────────────────────────────────
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Quick health and DB connectivity check.
    Use this to verify the backend is running and Atlas is reachable.

    Expected response:
      { "status": "ok", "db": true }
    """
    db_ok = await ping_db()
    return {
        "status": "ok",
        "db": db_ok,
        "version": "2.0.0",
    }


@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "Guardian Eye AI Backend — v2.0.0",
        "docs": "/docs",
        "health": "/health",
    }
