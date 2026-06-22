from typing import Optional, List
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel

from app.schemas.address import AddressOut


class AdminCustomerListItem(BaseModel):
    id: int
    name: str
    email: str
    mobile_number: Optional[str] = None
    total_orders: int
    lifetime_spend: Decimal
    last_purchase: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class AdminCustomerDetail(AdminCustomerListItem):
    addresses: List[AddressOut] = []
