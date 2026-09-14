"""
Listing API routes: CRUD for crop listings + image upload.
"""

import os
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from pydantic import BaseModel, Field

from app.core.deps import get_current_user
from app.database.mongodb import get_database

router = APIRouter(prefix="/listings", tags=["Listings"])

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


# ──────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────

class ListingCreateRequest(BaseModel):
    crop_name: str
    variety: Optional[str] = None
    category: str = "vegetables"
    quantity: float
    unit: str = "kg"
    route: str = "Retail"                  # "Retail" or "Bulk"
    quality_grade: str = "A"               # "A" or "B"
    minimum_price: float
    target_price: Optional[float] = None
    description: Optional[str] = None
    harvest_date: Optional[str] = None


# ──────────────────────────────────────────────────────
# POST /listings — Create a new listing
# ──────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: ListingCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a new produce listing (farmers only)."""
    db = get_database()

    listing_id = str(uuid.uuid4())
    now = datetime.utcnow()

    doc = {
        "_id": listing_id,
        "farmer_id": str(current_user["_id"]),
        "farmer_name": current_user.get("name", "Farmer"),
        "farmer_phone": current_user.get("phone", ""),
        "crop_name": payload.crop_name,
        "variety": payload.variety,
        "category": payload.category,
        "quantity": payload.quantity,
        "unit": payload.unit,
        "route": payload.route,
        "quality": {
            "grade": payload.quality_grade,
            "assayed": False,
        },
        "pricing": {
            "minimum_price": payload.minimum_price,
            "target_price": payload.target_price or payload.minimum_price,
            "currency": "INR",
        },
        "status": "ACTIVE",
        "images": [],
        "description": payload.description,
        "harvest_date": payload.harvest_date,
        "created_at": now,
        "updated_at": now,
    }

    await db.listings.insert_one(doc)
    doc["id"] = doc.pop("_id")
    return {"message": "Listing created successfully", "listing": doc}


# ──────────────────────────────────────────────────────
# GET /listings/my — List current user's listings
# ──────────────────────────────────────────────────────

@router.get("/my")
async def get_my_listings(
    current_user: dict = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """Get all produce listings created by the authenticated farmer."""
    db = get_database()
    query = {"farmer_id": str(current_user["_id"])}
    if status_filter:
        query["status"] = status_filter.upper()

    cursor = db.listings.find(query).sort("created_at", -1)
    listings = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        listings.append(doc)

    return {"listings": listings, "total": len(listings)}


# ──────────────────────────────────────────────────────
# GET /listings/{listing_id} — Get listing details
# ──────────────────────────────────────────────────────

@router.get("/{listing_id}")
async def get_listing(listing_id: str):
    """Get a single listing by ID."""
    db = get_database()
    doc = await db.listings.find_one({"_id": listing_id})
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Listing with id {listing_id} not found",
        )
    doc["id"] = str(doc.pop("_id"))
    return doc


# ──────────────────────────────────────────────────────
# POST /listings/{listing_id}/images — Upload crop image
# ──────────────────────────────────────────────────────

@router.post("/{listing_id}/images")
async def upload_listing_image(
    listing_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Upload a crop image for quality grading and display."""
    db = get_database()
    doc = await db.listings.find_one({"_id": listing_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Listing not found")

    if doc["farmer_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to edit this listing")

    ext = os.path.splitext(file.filename or "")[1] or ".jpg"
    filename = f"{listing_id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    contents = await file.read()
    with open(filepath, "wb") as f:
        f.write(contents)

    image_url = f"/uploads/{filename}"
    await db.listings.update_one(
        {"_id": listing_id},
        {"$push": {"images": image_url}, "$set": {"updated_at": datetime.utcnow()}},
    )

    return {"message": "Image uploaded", "image_url": image_url}
