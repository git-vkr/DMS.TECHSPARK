"""
Orders API: order tracking, payment simulation, escrow, OTP delivery verification.
"""

import random
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.core.deps import get_current_user
from app.database.mongodb import get_database

router = APIRouter(prefix="/orders", tags=["Orders & Escrow"])


# ──────────────────────────────────────────────────────
# GET /orders — List user's orders
# ──────────────────────────────────────────────────────

@router.get("/")
async def list_orders(current_user: dict = Depends(get_current_user)):
    """List orders for the current user (farmer or buyer)."""
    db = get_database()
    user_id = str(current_user["_id"])
    role = current_user.get("role")

    if role == "farmer":
        query = {"farmer_id": user_id}
    else:
        query = {"buyer_id": user_id}

    cursor = db.orders.find(query).sort("created_at", -1)
    orders = []
    async for doc in cursor:
        doc["id"] = str(doc.pop("_id"))
        orders.append(doc)

    return {"orders": orders, "total": len(orders)}


# ──────────────────────────────────────────────────────
# GET /orders/{order_id} — Single order details
# ──────────────────────────────────────────────────────

@router.get("/{order_id}")
async def get_order(order_id: str, current_user: dict = Depends(get_current_user)):
    """Get single order details."""
    db = get_database()
    doc = await db.orders.find_one({"_id": order_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Order not found")

    user_id = str(current_user["_id"])
    if doc["farmer_id"] != user_id and doc["buyer_id"] != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this order")

    doc["id"] = str(doc.pop("_id"))
    return doc


# ──────────────────────────────────────────────────────
# POST /orders/{order_id}/verify-otp — Delivery acceptance & escrow release
# ──────────────────────────────────────────────────────

class OtpVerifyRequest(BaseModel):
    otp: str


@router.post("/{order_id}/verify-otp")
async def verify_delivery_otp(
    order_id: str,
    payload: OtpVerifyRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Delivery confirmation via OTP:
    When the buyer shares OTP with driver/farmer at delivery:
    1. Verify OTP matches order
    2. Transition escrow_status to RELEASED
    3. Transition order_status to DELIVERED
    4. Simulate instant UPI credit to farmer
    """
    db = get_database()
    order = await db.orders.find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if str(order["buyer_id"]) != str(current_user["_id"]) and str(order["farmer_id"]) != str(current_user["_id"]):
        raise HTTPException(status_code=403, detail="Not authorized")

    if order.get("otp") != payload.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")

    now = datetime.utcnow()
    await db.orders.update_one(
        {"_id": order_id},
        {
            "$set": {
                "order_status": "DELIVERED",
                "escrow_status": "RELEASED_TO_FARMER",
                "delivered_at": now,
                "updated_at": now,
            }
        },
    )

    return {
        "message": "Delivery verified successfully! Escrow funds released to farmer.",
        "order_id": order_id,
        "escrow_status": "RELEASED_TO_FARMER",
        "order_status": "DELIVERED",
    }
