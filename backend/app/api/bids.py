"""
Bidding API routes: place, view, accept, withdraw bids.
Includes smart buyer ranking algorithm.
"""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, Field

from app.core.deps import get_current_user
from app.database.mongodb import get_database

router = APIRouter(prefix="/bids", tags=["Bidding"])


# ──────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────

class BidCreateRequest(BaseModel):
    listing_id: str
    price_per_unit: float = Field(..., gt=0)
    quantity: float = Field(..., gt=0)
    payment_terms: str = "ESCROW"      # "ESCROW" | "ADVANCE_25" | "NET_30"
    delivery_days: int = 2


# ──────────────────────────────────────────────────────
# POST /bids — Place a new bid on a listing
# ──────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def place_bid(
    payload: BidCreateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Place a bid on an active listing (buyers only)."""
    db = get_database()

    # 1. Fetch listing
    listing = await db.listings.find_one({"_id": payload.listing_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing["status"] not in ("ACTIVE", "BIDDING"):
        raise HTTPException(status_code=400, detail="Listing is not open for bids")

    # 2. Prevent self-bidding
    if listing["farmer_id"] == str(current_user["_id"]):
        raise HTTPException(status_code=400, detail="Cannot bid on your own listing")

    # 3. Calculate trust / rank score
    # Score = (price_ratio * 0.50) + (reputation * 0.25) + (fulfillment_rate * 0.25)
    min_price = listing.get("pricing", {}).get("minimum_price", 1)
    price_ratio = min(payload.price_per_unit / min_price, 1.5)
    reputation = current_user.get("reputation_score", 4.5) / 5.0
    fulfillment = current_user.get("fulfillment_rate", 95.0) / 100.0

    rank_score = round(
        (price_ratio * 50.0) + (reputation * 25.0) + (fulfillment * 25.0),
        2,
    )

    now = datetime.utcnow()
    bid_id = str(uuid.uuid4())
    total_amount = round(payload.price_per_unit * payload.quantity, 2)

    doc = {
        "_id": bid_id,
        "listing_id": payload.listing_id,
        "buyer_id": str(current_user["_id"]),
        "buyer_name": current_user.get("name", "Buyer"),
        "buyer_type": current_user.get("role", "buyer"),
        "crop_name": listing.get("crop_name"),
        "variety": listing.get("variety"),
        "farmer_id": listing["farmer_id"],
        "price_per_unit": payload.price_per_unit,
        "quantity": payload.quantity,
        "unit": listing.get("unit", "kg"),
        "total_amount": total_amount,
        "payment_terms": payload.payment_terms,
        "delivery_days": payload.delivery_days,
        "rank_score": rank_score,
        "status": "PENDING",           # "PENDING" | "ACCEPTED" | "COUNTERED" | "REJECTED" | "EXPIRED"
        "created_at": now,
        "updated_at": now,
    }

    await db.bids.insert_one(doc)

    # Update listing status to BIDDING if not already
    await db.listings.update_one(
        {"_id": payload.listing_id},
        {"$set": {"status": "BIDDING", "updated_at": now}},
    )

    doc["id"] = doc.pop("_id")
    return {"message": "Bid placed successfully", "bid": doc}


# ──────────────────────────────────────────────────────
# GET /bids/my — Current user's bids (as buyer or farmer)
# ──────────────────────────────────────────────────────

@router.get("/my")
async def get_my_bids(
    current_user: dict = Depends(get_current_user),
    status_filter: Optional[str] = Query(None, alias="status"),
):
    """
    If farmer: returns incoming bids on their listings.
    If buyer: returns outgoing bids placed by this buyer.
    """
    db = get_database()
    role = current_user.get("role")
    user_id = str(current_user["_id"])

    if role == "farmer":
        query = {"farmer_id": user_id}
    else:
        query = {"buyer_id": user_id}

    if status_filter:
        query["status"] = status_filter.upper()

    cursor = db.bids.find(query).sort("rank_score", -1)
    bids = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        bids.append(doc)

    return {"bids": bids, "total": len(bids)}


# ──────────────────────────────────────────────────────
# POST /bids/{bid_id}/accept — Accept a bid (farmer only)
# ──────────────────────────────────────────────────────

@router.post("/{bid_id}/accept")
async def accept_bid(
    bid_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Farmer accepts a bid:
    1. Sets bid status to ACCEPTED
    2. Rejects competing bids on this lot
    3. Creates a new ORDER with ESCROW_LOCKED status
    4. Marks listing as MATCHED
    """
    db = get_database()
    bid = await db.bids.find_one({"_id": bid_id})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")

    if bid["farmer_id"] != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized to accept this bid")

    if bid["status"] != "PENDING":
        raise HTTPException(status_code=400, detail=f"Bid is already {bid['status']}")

    now = datetime.utcnow()

    # 1. Accept this bid
    await db.bids.update_one(
        {"_id": bid_id},
        {"$set": {"status": "ACCEPTED", "updated_at": now}},
    )

    # 2. Reject other pending bids on the same listing
    await db.bids.update_many(
        {"listing_id": bid["listing_id"], "_id": {"$ne": bid_id}, "status": "PENDING"},
        {"$set": {"status": "REJECTED", "updated_at": now}},
    )

    # 3. Mark listing MATCHED
    await db.listings.update_one(
        {"_id": bid["listing_id"]},
        {"$set": {"status": "MATCHED", "updated_at": now}},
    )

    # 4. Create an Order in Escrow
    order_id = str(uuid.uuid4())
    order_doc = {
        "_id": order_id,
        "bid_id": bid_id,
        "listing_id": bid["listing_id"],
        "farmer_id": bid["farmer_id"],
        "buyer_id": bid["buyer_id"],
        "buyer_name": bid["buyer_name"],
        "crop_name": bid.get("crop_name"),
        "quantity": bid["quantity"],
        "unit": bid.get("unit", "kg"),
        "price_per_unit": bid["price_per_unit"],
        "total_amount": bid["total_amount"],
        "escrow_status": "FUNDS_LOCKED",
        "order_status": "IN_TRANSIT",
        "otp": "4821",                     # Simulated 4-digit delivery OTP
        "created_at": now,
        "updated_at": now,
    }
    await db.orders.insert_one(order_doc)
    order_doc["id"] = order_doc.pop("_id")

    return {
        "message": "Bid accepted! Order created and funds locked in escrow.",
        "order": order_doc,
    }
