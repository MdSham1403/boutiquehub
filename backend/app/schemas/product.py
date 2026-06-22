from typing import Optional, List
from decimal import Decimal
from pydantic import BaseModel, Field

from app.schemas.category import CategoryOut


class ProductVariantCreate(BaseModel):
    color: str
    size: str
    stock: int = 0
    sku_suffix: Optional[str] = None


class ProductVariantUpdate(BaseModel):
    stock: Optional[int] = None
    color: Optional[str] = None
    size: Optional[str] = None


class ProductVariantOut(BaseModel):
    id: int
    color: str
    size: str
    stock: int

    class Config:
        from_attributes = True


class ProductImageOut(BaseModel):
    id: int
    image_url: str
    display_order: int

    class Config:
        from_attributes = True


class ProductCreate(BaseModel):
    name: str
    category_id: int
    description: Optional[str] = None
    fabric: Optional[str] = None
    wash_instructions: Optional[str] = None
    sku: str
    tags: Optional[str] = None
    price: Decimal = Field(gt=0)
    offer_price: Optional[Decimal] = Field(default=None, ge=0)
    video_url: Optional[str] = None
    variants: List[ProductVariantCreate] = Field(default_factory=list)


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category_id: Optional[int] = None
    description: Optional[str] = None
    fabric: Optional[str] = None
    wash_instructions: Optional[str] = None
    sku: Optional[str] = None
    tags: Optional[str] = None
    price: Optional[Decimal] = Field(default=None, gt=0)
    offer_price: Optional[Decimal] = Field(default=None, ge=0)
    video_url: Optional[str] = None
    is_active: Optional[bool] = None
    is_archived: Optional[bool] = None
    variants: Optional[List[ProductVariantCreate]] = None


class ProductListItem(BaseModel):
    """Lightweight shape for grid/listing views."""
    id: int
    name: str
    slug: str
    price: Decimal
    offer_price: Optional[Decimal] = None
    discount_percent: int
    total_stock: int
    primary_image: Optional[str] = None
    average_rating: float = 0
    review_count: int = 0

    class Config:
        from_attributes = True


class ProductOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    fabric: Optional[str] = None
    wash_instructions: Optional[str] = None
    sku: str
    tags: Optional[str] = None
    price: Decimal
    offer_price: Optional[Decimal] = None
    discount_percent: int
    video_url: Optional[str] = None
    is_active: bool
    is_archived: bool
    category: CategoryOut
    images: List[ProductImageOut] = []
    variants: List[ProductVariantOut] = []
    total_stock: int
    average_rating: float = 0
    review_count: int = 0

    class Config:
        from_attributes = True
