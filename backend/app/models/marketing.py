"""
Marketing tools: home/sale/festival banners (no-code admin uploads) and
coupons (flagged as Future in the spec, but modeled now so the schema
doesn't need a breaking migration later).
"""
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Numeric, Enum
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import BannerType, CouponType


class Banner(Base):
    __tablename__ = "banners"

    id = Column(Integer, primary_key=True, index=True)
    banner_type = Column(Enum(BannerType), nullable=False)
    image_url = Column(String(500), nullable=False)
    link_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False, index=True)
    coupon_type = Column(Enum(CouponType), nullable=False)
    value = Column(Numeric(10, 2), nullable=False, default=0)  # ignored for free_shipping
    is_active = Column(Boolean, default=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
