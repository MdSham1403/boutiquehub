from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel


class CartItemRequest(BaseModel):
    product_id: int
    variant_id: int
    quantity: int = 1


class CartLineOut(BaseModel):
    product_id: int
    variant_id: int
    product_name: str
    image_url: Optional[str] = None
    color: str
    size: str
    quantity: int
    requested_quantity: int
    unit_price: Decimal
    line_total: Decimal
    available_stock: int
    in_stock: bool
    is_active: bool


class CartPreviewResponse(BaseModel):
    items: List[CartLineOut]
    subtotal: Decimal
    total: Decimal
    has_issues: bool  # true if any item is out of stock, inactive, or quantity was capped
