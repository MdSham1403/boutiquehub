from typing import Optional
from pydantic import BaseModel

from app.models.enums import BannerType


class BannerCreate(BaseModel):
    banner_type: BannerType
    image_url: str
    link_url: Optional[str] = None
    display_order: int = 0


class BannerUpdate(BaseModel):
    banner_type: Optional[BannerType] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class BannerOut(BaseModel):
    id: int
    banner_type: BannerType
    image_url: str
    link_url: Optional[str] = None
    is_active: bool
    display_order: int

    class Config:
        from_attributes = True
