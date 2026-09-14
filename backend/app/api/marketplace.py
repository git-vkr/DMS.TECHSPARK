"""
Marketplace API routes: public listing search and filtering for buyers.
"""

import math
from typing import Optional

from fastapi import APIRouter, Query

from app.database.mongodb import get_database

router = APIRouter(prefix="/marketplace", tags=["Marketplace"])


@router.get("/")
async def get_marketplace_listings(
    category: Optional[str] = Query(None, description="Crop category filter (e.g. vegetables, grains, pulses)"),
    search: Optional[str] = Query(None, description="Search query across crop name, variety, farmer name, location"),
    route: Optional[str] = Query(None, description="Trade route: 'Retail' or 'Bulk'"),
    grade: Optional[str] = Query(None, description="Quality grade: 'A' or 'B'"),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
):
    """
    Public marketplace catalog:
    Returns active, verified listings with optional filters.
    """
    db = get_database()

    query: dict = {"status": {"$in": ["ACTIVE", "BIDDING"]}}

    if category and category.lower() != "all":
        query["category"] = {"$regex": f"^{category}$", "$options": "i"}

    if route:
        query["route"] = route

    if grade:
        query["quality.grade"] = grade.upper()

    if min_price is not None or max_price is not None:
        price_query = {}
        if min_price is not None:
            price_query["$gte"] = min_price
        if max_price is not None:
            price_query["$lte"] = max_price
        query["pricing.minimum_price"] = price_query

    if search:
        query["$or"] = [
            {"crop_name": {"$regex": search, "$options": "i"}},
            {"variety": {"$regex": search, "$options": "i"}},
            {"farmer_name": {"$regex": search, "$options": "i"}},
            {"location": {"$regex": search, "$options": "i"}},
        ]

    total = await db.listings.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.listings.find(query).sort("created_at", -1).skip(skip).limit(limit)

    listings = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        listings.append(doc)

    return {
        "listings": listings,
        "total": total,
        "page": page,
        "pages": math.ceil(total / limit) if limit else 1,
    }
