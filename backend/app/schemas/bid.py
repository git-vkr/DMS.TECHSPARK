"""
Pydantic schemas for bids.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class BidStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACCEPTED = "ACCEPTED"
    REJECTED = "REJECTED"
    WITHDRAWN = "WITHDRAWN"
    EXPIRED = "EXPIRED"


class BidCreate(BaseModel):
    listing_id: str = Field(..., examples=["60f7b2c4e4b0f5a3d8c9e1a2"])
    price_per_unit: float = Field(..., gt=0, examples=[32.0])
    quantity: Optional[float] = Field(None, gt=0, examples=[500.0])
    message: Optional[str] = Field(None, examples=["I need fresh Grade A tomatoes for my restaurant."])


class BidResponse(BaseModel):
    id: str
    listing_id: str
    buyer_id: str
    buyer_name: Optional[str] = None
    price_per_unit: float
    quantity: float
    logistics_cost: Optional[float] = None
    estimated_total: Optional[float] = None
    status: str
    message: Optional[str] = None
    distance_km: Optional[float] = None
    buyer_rating: Optional[float] = None
    score: Optional[float] = None
    created_at: Optional[datetime] = None


class BidListResponse(BaseModel):
    bids: List[BidResponse]
    total: int
