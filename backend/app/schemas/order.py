from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, model_validator

from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.schemas.cart import CartItemRequest
from app.schemas.address import AddressCreate, AddressOut
from app.schemas.auth import CustomerAuthOut


class OrderCreate(BaseModel):
    items: List[CartItemRequest]
    payment_method: PaymentMethod

    # Address: use an existing saved address OR provide a new one to save
    address_id: Optional[int] = None
    new_address: Optional[AddressCreate] = None

    # Required the first time a customer checks out if Google profile didn't supply it
    mobile_number: Optional[str] = None

    # Required when payment_method is scan_and_pay - upload via
    # POST /api/uploads/payment-screenshot first, then pass the returned URL here
    payment_screenshot_url: Optional[str] = None

    @model_validator(mode="after")
    def check_address_and_payment(self):
        if not self.address_id and not self.new_address:
            raise ValueError("Provide either address_id or new_address")
        if self.payment_method == PaymentMethod.SCAN_AND_PAY and not self.payment_screenshot_url:
            raise ValueError("payment_screenshot_url is required for Scan & Pay orders")
        return self


class OrderItemOut(BaseModel):
    id: int
    product_id: Optional[int] = None
    product_name: str
    color: str
    size: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal

    class Config:
        from_attributes = True


class OrderListItem(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    total: Decimal
    created_at: datetime
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    order_number: str
    status: OrderStatus
    payment_method: PaymentMethod
    payment_status: PaymentStatus
    payment_screenshot_url: Optional[str] = None
    subtotal: Decimal
    total: Decimal
    invoice_url: Optional[str] = None
    created_at: datetime
    address: AddressOut
    items: List[OrderItemOut]
    customer: CustomerAuthOut

    class Config:
        from_attributes = True


class OrderCreateResponse(BaseModel):
    order: OrderOut
    whatsapp_link: str


class OrderStatusUpdate(BaseModel):
    status: OrderStatus


class PaymentVerifyUpdate(BaseModel):
    verified: bool
