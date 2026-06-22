from datetime import datetime
from pydantic import BaseModel

from app.schemas.product import ProductListItem


class WishlistItemOut(BaseModel):
    id: int
    created_at: datetime
    product: ProductListItem

    class Config:
        from_attributes = True
