"""
Pydantic schemas for crop listings.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class ListingStatus(str, Enum):
    DRAFT = "DRAFT"
    ACTIVE = "ACTIVE"
    BIDDING = "BIDDING"
    SOLD = "SOLD"
    EXPIRED = "EXPIRED"
    CANCELLED = "CANCELLED"


class QualityGrade(str, Enum):
    A = "A"
    B = "B"
    C = "C"


class Location(BaseModel):
    lat: float = Field(..., examples=[13.0827])
    lng: float = Field(..., examples=[80.2707])


class QualityInfo(BaseModel):
    grade: Optional[QualityGrade] = None
    confidence: Optional[float] = None
    image_url: Optional[str] = None
    ripeness: Optional[float] = None
    disease_probability: Optional[float] = None
    size_uniformity: Optional[float] = None


class PricingInfo(BaseModel):
    minimum_price: float = Field(..., gt=0, examples=[28.0])
    currency: str = Field(default="INR")


# --- Request Schemas ---
class ListingCreate(BaseModel):
    crop_name: str = Field(..., min_length=2, examples=["Tomato"])
    variety: Optional[str] = Field(None, examples=["Hybrid"])
    quantity: float = Field(..., gt=0, examples=[500.0])
    unit: str = Field(default="kg", examples=["kg"])
    expected_date: str = Field(..., examples=["2026-09-15"])
    minimum_price: float = Field(..., gt=0, examples=[28.0])
    location: Optional[Location] = None
    description: Optional[str] = None


class ListingUpdate(BaseModel):
    crop_name: Optional[str] = None
    variety: Optional[str] = None
    quantity: Optional[float] = None
    expected_date: Optional[str] = None
    minimum_price: Optional[float] = None
    location: Optional[Location] = None
    description: Optional[str] = None
    status: Optional[ListingStatus] = None


# --- Response Schemas ---
class ListingResponse(BaseModel):
    id: str
    farmer_id: str
    farmer_name: Optional[str] = None
    crop_name: str
    variety: Optional[str] = None
    quantity: float
    available_quantity: float
    unit: str = "kg"
    expected_date: str
    location: Optional[dict] = None
    quality: Optional[dict] = None
    pricing: dict
    status: str
    description: Optional[str] = None
    image_urls: List[str] = []
    created_at: Optional[datetime] = None


class ListingListResponse(BaseModel):
    listings: List[ListingResponse]
    total: int
    page: int = 1
    per_page: int = 20


class ImageUploadResponse(BaseModel):
    image_url: str
    message: str = "Image uploaded successfully"
