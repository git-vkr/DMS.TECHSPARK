"""
Authentication API routes: register, login, OTP, profile.
"""

import random
from datetime import datetime, timezone

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status, Response

from app.core.deps import get_current_user, require_role
from app.core.security import create_access_token, hash_password, verify_password
from app.database.mongodb import get_database
from app.schemas.user import (
    BuyerProfileUpdate,
    FarmerProfileUpdate,
    MessageResponse,
    OTPRequest,
    OTPVerify,
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    UserUpdate,
)

router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])


# ──────────────────────────────────────────────────────
# Helper
# ──────────────────────────────────────────────────────
def _user_to_response(user: dict) -> dict:
    """Convert a MongoDB user doc to a safe response dict."""
    return {
        "id": str(user["_id"]),
        "name": user["name"],
        "phone": user["phone"],
        "role": user["role"],
        "email": user.get("email"),
        "language": user.get("language", "hi"),
        "verified": user.get("verified", False),
        "location": user.get("location"),
        "address": user.get("address"),
        "created_at": user.get("created_at"),
    }


# ──────────────────────────────────────────────────────
# POST /register
# ──────────────────────────────────────────────────────
@router.post("/register", response_model=UserResponse)
async def register(payload: UserRegister, response: Response):
    """Register a new user (Farmer or Buyer) and set secure cookie."""
    db = get_database()

    # Check if user exists
    existing = await db.users.find_one({"phone": payload.phone})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Phone number already registered",
        )

    # Hash password using bcrypt
    hashed = hash_password(payload.password)

    user_doc = {
        "name": payload.name,
        "phone": payload.phone,
        "password_hash": hashed,
        "role": payload.role.value,
        "language": payload.language,
        "verified": False,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    user_doc["_id"] = result.inserted_id

    # Create role-specific document
    if payload.role.value == "farmer":
        await db.farmers.insert_one(
            {
                "user_id": user_id,
                "rating": 0.0,
                "created_at": datetime.now(timezone.utc),
            }
        )
    elif payload.role.value == "buyer":
        await db.buyers.insert_one(
            {
                "user_id": user_id,
                "rating": 0.0,
                "created_at": datetime.now(timezone.utc),
            }
        )

    # Automatically log them in via secure cookie
    token = create_access_token({"user_id": user_id, "role": payload.role.value})
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        samesite="lax",
        max_age=86400 * 7,
    )

    return _user_to_response(user_doc)


@router.post("/login")
async def login(payload: UserLogin, response: Response):
    """Login with phone + password and set secure cookie."""
    db = get_database()

    user = await db.users.find_one({"phone": payload.phone})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )

    token = create_access_token(
        {"user_id": str(user["_id"]), "role": user["role"]}
    )
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=86400 * 7,
    )

    return {
        "access_token": token,
        "user": _user_to_response(user),
    }


@router.post("/logout")
async def logout(response: Response):
    """Logout by clearing the HttpOnly cookie."""
    response.delete_cookie("access_token", httponly=True, samesite="lax")
    return {"message": "Successfully logged out"}


# ──────────────────────────────────────────────────────
# POST /send-otp  (simulated for SIH)
# ──────────────────────────────────────────────────────
@router.post("/send-otp", response_model=MessageResponse)
async def send_otp(payload: OTPRequest):
    """Send a simulated OTP to the phone number."""
    db = get_database()

    user = await db.users.find_one({"phone": payload.phone})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Phone number not registered",
        )

    otp_code = str(random.randint(1000, 9999))

    # Store OTP in DB (in production: send via SMS gateway)
    await db.otps.update_one(
        {"phone": payload.phone},
        {
            "$set": {
                "otp": otp_code,
                "created_at": datetime.now(timezone.utc),
                "verified": False,
            }
        },
        upsert=True,
    )

    # For SIH demo: return the OTP directly so testers can use it
    return MessageResponse(
        message=f"OTP sent successfully. (Demo OTP: {otp_code})",
        success=True,
    )


# ──────────────────────────────────────────────────────
# POST /verify-otp
# ──────────────────────────────────────────────────────
@router.post("/verify-otp")
async def verify_otp(payload: OTPVerify, response: Response):
    """Verify OTP and set secure cookie."""
    db = get_database()

    otp_record = await db.otps.find_one(
        {"phone": payload.phone, "otp": payload.otp, "verified": False}
    )
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP",
        )

    # Mark OTP as used
    await db.otps.update_one(
        {"_id": otp_record["_id"]}, {"$set": {"verified": True}}
    )

    # Mark user as verified
    user = await db.users.find_one({"phone": payload.phone})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.users.update_one(
        {"_id": user["_id"]}, {"$set": {"verified": True}}
    )
    user["verified"] = True

    token = create_access_token(
        {"user_id": str(user["_id"]), "role": user["role"]}
    )
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=86400 * 7,
    )

    return {
        "access_token": token,
        "user": _user_to_response(user),
    }

@router.post("/forgot-password")
async def forgot_password(payload: OTPRequest):
    """Mock forgot password endpoint."""
    return {"message": "If the account exists, a password reset link has been sent.", "success": True}

@router.post("/reset-password")
async def reset_password(payload: dict):
    """Mock reset password endpoint."""
    return {"message": "Password successfully reset", "success": True}


# ──────────────────────────────────────────────────────
# GET /me
# ──────────────────────────────────────────────────────
@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get the currently authenticated user's profile."""
    return _user_to_response(current_user)


# ──────────────────────────────────────────────────────
# PUT /me
# ──────────────────────────────────────────────────────
@router.put("/me", response_model=UserResponse)
async def update_me(
    payload: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Update the current user's basic profile."""
    db = get_database()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}

    if update_data:
        await db.users.update_one(
            {"_id": current_user["_id"]}, {"$set": update_data}
        )

    updated = await db.users.find_one({"_id": current_user["_id"]})
    return _user_to_response(updated)


# ──────────────────────────────────────────────────────
# PUT /me/farmer-profile
# ──────────────────────────────────────────────────────
@router.put("/me/farmer-profile", response_model=MessageResponse)
async def update_farmer_profile(
    payload: FarmerProfileUpdate,
    current_user: dict = Depends(require_role("farmer")),
):
    """Update farmer-specific profile fields."""
    db = get_database()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}

    if update_data:
        await db.farmers.update_one(
            {"user_id": str(current_user["_id"])}, {"$set": update_data}
        )

    return MessageResponse(message="Farmer profile updated")


# ──────────────────────────────────────────────────────
# PUT /me/buyer-profile
# ──────────────────────────────────────────────────────
@router.put("/me/buyer-profile", response_model=MessageResponse)
async def update_buyer_profile(
    payload: BuyerProfileUpdate,
    current_user: dict = Depends(require_role("buyer")),
):
    """Update buyer-specific profile fields."""
    db = get_database()
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}

    if update_data:
        await db.buyers.update_one(
            {"user_id": str(current_user["_id"])}, {"$set": update_data}
        )

    return MessageResponse(message="Buyer profile updated")
