# DMS — Decentralised Marketplace & Supply Chain

This is the SIH 2026 Prototype codebase for the DMS platform. It connects farmers/FPOs directly with bulk buyers using live bidding, AI grading, logistics optimization, and escrow payments.

## Architecture

- **Frontend**: React + Vite + Tailwind CSS (in `/frontend`)
- **Backend**: FastAPI + MongoDB (in `/backend`)
- **AI Models**: PyTorch (in `/ai`)
- **Logistics Engine**: OR-Tools (in `/logistics`)

## Quick Start

### 1. Using Docker (Recommended)

Make sure Docker and Docker Compose are installed.

```bash
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API Docs: http://localhost:8000/docs
- MongoDB: localhost:27017

### 2. Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
# Activate venv: `venv\Scripts\activate` on Windows, `source venv/bin/activate` on Mac/Linux
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Vercel Deployment

The frontend is ready for Vercel deployment:
- Root Directory: `frontend` (or project root with the included `vercel.json`)
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - `VITE_API_URL`: Your deployed FastAPI backend URL (e.g. `https://your-api.onrender.com/api/v1`)
