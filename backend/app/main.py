"""
DMS -- Decentralised Marketplace & Supply Chain
FastAPI Application Entry Point
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.auth import router as auth_router
from app.api.listings import router as listings_router
from app.api.farmers import router as farmers_router
from app.api.marketplace import router as marketplace_router
from app.api.bids import router as bids_router
from app.api.orders import router as orders_router
from app.database.mongodb import close_mongo_connection, connect_to_mongo


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown lifecycle."""
    await connect_to_mongo()
    yield
    await close_mongo_connection()


app = FastAPI(
    title="DMS API",
    description="Decentralised Marketplace & Supply Chain API for SIH 2026",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://0.0.0.0:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Static files (uploads) ---
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Routers ---
app.include_router(auth_router)
app.include_router(listings_router)
app.include_router(farmers_router)
app.include_router(marketplace_router)
app.include_router(bids_router)
app.include_router(orders_router)


# --- Health Check ---
@app.get("/health")
def health_check():
    return {"status": "DMS API running", "version": "0.2.0"}


@app.get("/")
def read_root():
    return {
        "message": "Welcome to DMS API",
        "docs": "/docs",
        "endpoints": {
            "auth": "/api/v1/auth",
            "listings": "/api/v1/listings",
            "farmers": "/api/v1/farmers",
            "marketplace": "/api/v1/marketplace",
            "bids": "/api/v1/bids",
            "orders": "/api/v1/orders",
        },
    }
