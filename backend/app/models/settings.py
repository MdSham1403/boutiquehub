"""
StoreSettings: a single-row table holding store-wide config the admin
manages without code changes - the UPI QR code shown at checkout's
"Scan & Pay" step, store name, and logo (used on invoices).
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database import Base


class StoreSettings(Base):
    __tablename__ = "store_settings"

    id = Column(Integer, primary_key=True, default=1)
    store_name = Column(String(255), nullable=True)
    store_logo_url = Column(String(500), nullable=True)
    upi_id = Column(String(100), nullable=True)
    upi_qr_code_url = Column(String(500), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
