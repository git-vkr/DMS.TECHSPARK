"""
Pydantic schemas for orders.
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime


class OrderStatus(str, Enum):
    PAYMENT_PENDING = "PAYMENT_PENDING"
    ESCROW_LOCKED = "ESCROW_LOCKED"
    PICKUP_SCHEDULED = "PICKUP_SCHEDULED"
    PICKED_UP = "PICKED_UP"
    IN_TRANSIT = "IN_TRANSIT"
    DELIVERED = "DELIVERED"
    OTP_VERIFIED = "OTP_VERIFIED"
    PAYMENT_RELEASED = "PAYMENT_RELEASED"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"
    DISPUTED = "DISPUTED"


class OrderResponse(BaseModel):
    id: str
    listing_id: str
    bid_id: str
    farmer_id: str
    buyer_id: str
    crop_name: str
    quantity: float
    unit: str = "kg"
    price_per_unit: float
    total_amount: float
    logistics_cost: float = 0
    status: str
    pickup: Optional[dict] = None
    delivery: Optional[dict] = None
    pickup_otp: Optional[str] = None
    delivery_otp: Optional[str] = None
    created_at: Optional[datetime] = None


class PaymentCreate(BaseModel):
    order_id: str


class PaymentResponse(BaseModel):
    id: str
    order_id: str
    amount: float
    status: str
    transaction_id: Optional[str] = None
    created_at: Optional[datetime] = None
