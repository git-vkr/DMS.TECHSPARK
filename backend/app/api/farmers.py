"""
Farmer-specific API routes: dashboard, profile.
"""

from bson import ObjectId
from fastapi import APIRouter, Depends

from app.core.deps import require_role
from app.database.mongodb import get_database

router = APIRouter(prefix="/api/v1/farmers", tags=["Farmers"])


@router.get("/dashboard")
async def farmer_dashboard(
    current_user: dict = Depends(require_role("farmer")),
):
    """Get farmer dashboard summary."""
    db = get_database()
    farmer_id = str(current_user["_id"])

    # Count listings by status
    active_listings = await db.listings.count_documents({"farmer_id": farmer_id, "status": "ACTIVE"})
    bidding_listings = await db.listings.count_documents({"farmer_id": farmer_id, "status": "BIDDING"})
    sold_listings = await db.listings.count_documents({"farmer_id": farmer_id, "status": "SOLD"})

    # Count orders
    pending_orders = await db.orders.count_documents({"farmer_id": farmer_id, "status": {"$nin": ["COMPLETED", "CANCELLED"]}})
    completed_orders = await db.orders.count_documents({"farmer_id": farmer_id, "status": "COMPLETED"})

    # Count incoming bids on active listings
    farmer_listing_ids = []
    async for listing in db.listings.find({"farmer_id": farmer_id, "status": {"$in": ["ACTIVE", "BIDDING"]}}):
        farmer_listing_ids.append(str(listing["_id"]))

    incoming_bids = 0
    if farmer_listing_ids:
        incoming_bids = await db.bids.count_documents({
            "listing_id": {"$in": farmer_listing_ids},
            "status": "ACTIVE",
        })

    # Total earnings from completed orders
    total_earnings = 0.0
    async for order in db.orders.find({"farmer_id": farmer_id, "status": "COMPLETED"}):
        total_earnings += order.get("total_amount", 0)

    # Get farmer profile
    farmer_profile = await db.farmers.find_one({"user_id": farmer_id})

    return {
        "farmer_name": current_user.get("name"),
        "active_listings": active_listings,
        "bidding_listings": bidding_listings,
        "sold_listings": sold_listings,
        "incoming_bids": incoming_bids,
        "pending_orders": pending_orders,
        "completed_orders": completed_orders,
        "total_earnings": total_earnings,
        "crops": farmer_profile.get("crops", []) if farmer_profile else [],
        "land_area": farmer_profile.get("land_area") if farmer_profile else None,
    }


@router.get("/profile")
async def get_farmer_profile(
    current_user: dict = Depends(require_role("farmer")),
):
    """Get full farmer profile including user + farmer-specific data."""
    db = get_database()
    farmer_id = str(current_user["_id"])

    farmer_profile = await db.farmers.find_one({"user_id": farmer_id})

    return {
        "user": {
            "id": str(current_user["_id"]),
            "name": current_user.get("name"),
            "phone": current_user.get("phone"),
            "email": current_user.get("email"),
            "language": current_user.get("language"),
            "verified": current_user.get("verified", False),
            "location": current_user.get("location"),
            "address": current_user.get("address"),
        },
        "farmer": {
            "farmer_type": farmer_profile.get("farmer_type") if farmer_profile else None,
            "fpo_id": farmer_profile.get("fpo_id") if farmer_profile else None,
            "land_area": farmer_profile.get("land_area") if farmer_profile else None,
            "crops": farmer_profile.get("crops", []) if farmer_profile else [],
        },
    }
