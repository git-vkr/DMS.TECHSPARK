"""
Pydantic schemas for User authentication and profile.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


# --- Enums ---
class UserRole(str, Enum):
    FARMER = "farmer"
    BUYER = "buyer"
    FPO = "fpo"
    DRIVER = "driver"
    ADMIN = "admin"
    KRISHI_MITRA = "krishi_mitra"


# --- Request Schemas ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Ramesh Kumar"])
    phone: str = Field(..., pattern=r"^\+91\d{10}$", examples=["+919876543210"])
    password: str = Field(..., min_length=6, examples=["password123"])
    role: UserRole = Field(..., examples=["farmer"])
    email: Optional[str] = Field(None, examples=["ramesh@example.com"])
    language: str = Field(default="hi", examples=["hi"])


class UserLogin(BaseModel):
    phone: str = Field(..., pattern=r"^\+91\d{10}$", examples=["+919876543210"])
    password: str = Field(..., examples=["password123"])


class OTPRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+91\d{10}$", examples=["+919876543210"])


class OTPVerify(BaseModel):
    phone: str = Field(..., pattern=r"^\+91\d{10}$", examples=["+919876543210"])
    otp: str = Field(..., min_length=4, max_length=6, examples=["1234"])


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    language: Optional[str] = None
    address: Optional[dict] = None
    location: Optional[dict] = None


class FarmerProfileUpdate(BaseModel):
    farmer_type: Optional[str] = Field(None, examples=["small"])
    fpo_id: Optional[str] = None
    land_area: Optional[float] = Field(None, examples=[2.5])
    crops: Optional[List[str]] = Field(None, examples=[["tomato", "onion"]])


class BuyerProfileUpdate(BaseModel):
    business_name: Optional[str] = Field(None, examples=["ABC Foods"])
    buyer_type: Optional[str] = Field(None, examples=["processor"])
    gst_number: Optional[str] = None
    required_categories: Optional[List[str]] = Field(None, examples=[["tomato", "onion"]])
    delivery_location: Optional[dict] = None


# --- Response Schemas ---
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    name: str
    phone: str
    role: UserRole
    email: Optional[str] = None
    language: str = "hi"
    verified: bool = False
    location: Optional[dict] = None
    address: Optional[dict] = None
    created_at: Optional[datetime] = None


class MessageResponse(BaseModel):
    message: str
    success: bool = True
