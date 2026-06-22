from typing import Optional
from pydantic import BaseModel


class CategoryCreate(BaseModel):
    name: str
    image_url: Optional[str] = None
    display_order: int = 0


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    image_url: Optional[str] = None
    is_active: bool
    display_order: int

    class Config:
        from_attributes = True
