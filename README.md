# 🛡️ Guardian Eye AI v2

**AI-Based Missing Person Detection System**

> Stack: FastAPI · MongoDB Atlas · JWT Auth · DeepFace/FaceNet · React + Vite + Tailwind CSS

---

## Quick Start

### 1. Clone & configure

```bash
cd backend
cp .env.example .env
# Edit .env → add your MongoDB Atlas URI and JWT secret
```

### 2. Install dependencies (Python 3.10 or 3.11)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

### 3. Seed the admin user

```bash
uvicorn main:app --reload --port 8000
# In another terminal:
curl -X POST http://localhost:8000/auth/seed-admin
```

### 4. Run backend

```bash
uvicorn main:app --reload --port 8000
```

Visit `http://localhost:8000/docs` for interactive API docs.

---

## Project Structure

```
backend/
├── main.py              ← FastAPI app entry point
├── db.py                ← MongoDB Atlas connection (Motor async)
├── requirements.txt
├── .env.example         ← Copy to .env
├── models/
│   ├── complaint.py     ← Complaint Pydantic schemas
│   ├── alert.py         ← Alert schemas
│   └── user.py          ← Admin user schemas
├── routes/
│   ├── auth.py          ← POST /auth/login, /seed-admin, /me
│   ├── complaints.py    ← POST /complaint, GET /complaint/{id}
│   ├── alerts.py        ← GET /alerts, PATCH /alerts/{id}/ack
│   ├── detection.py     ← POST /detect/frame, /detect/upload
│   └── stats.py         ← GET /stats
└── utils/
    ├── jwt_handler.py   ← JWT create/verify, FastAPI dependency
    ├── face_embeddings.py ← FaceNet embedding extraction + cosine/Euclidean comparison
    └── image_utils.py   ← File save, base64 helpers

frontend/              ← React + Vite + Tailwind CSS (coming next)
```

---

## Face Embedding Pipeline

```
Complaint Registration:
  photo.jpg
    ↓ DeepFace.represent(model="Facenet512")
    ↓ 512-dim float vector
    ↓ stored in MongoDB complaints.embedding

Live Detection:
  browser frame (base64)
    ↓ extract_embedding_from_bytes()
    ↓ 512-dim probe vector
    ↓ find_best_match() → cosine similarity vs all stored embeddings
    ↓ if similarity ≥ 0.6 → create Alert in MongoDB
    ↓ return matched complaint + score to frontend
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | ❌ | Admin login → JWT |
| POST | `/auth/seed-admin` | ❌ | Create default admin |
| GET | `/auth/me` | ✅ | Get current admin |
| POST | `/complaint/` | ❌ | Register complaint + extract embedding |
| GET | `/complaint/{id}` | ❌ | Track complaint by ID |
| GET | `/complaint/` | ✅ | List all complaints |
| PATCH | `/complaint/{id}/status` | ✅ | Update status |
| GET | `/stats/` | ❌ | Dashboard statistics |
| POST | `/detect/frame` | ✅ | Match base64 frame |
| POST | `/detect/upload` | ✅ | Match uploaded image |
| GET | `/alerts/` | ✅ | List alerts |
| PATCH | `/alerts/{id}/ack` | ✅ | Acknowledge alert |
| GET | `/health` | ❌ | Health + DB check |

---

## Deployment

**Backend → Render**
1. Push to GitHub
2. New Web Service → select repo → `backend/` root
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add all `.env` variables in Render dashboard

**Frontend → Vercel**
1. Push to GitHub
2. New Project → select repo → `frontend/` root
3. Set `VITE_API_URL=https://your-render-url.onrender.com`
