"""
Order + OrderItem: a customer's purchase. OrderItem snapshots product
details at time of purchase so historical orders stay accurate even if
the product is later edited or deleted.
"""
from sqlalchemy import (
    Column, Integer, String, Numeric, DateTime, ForeignKey, Enum, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base
from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(20), unique=True, nullable=False, index=True)  # e.g. BCH000145

    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    address_id = Column(Integer, ForeignKey("addresses.id"), nullable=False)

    status = Column(Enum(OrderStatus), nullable=False, default=OrderStatus.PENDING)
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    payment_status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    payment_screenshot_url = Column(String(500), nullable=True)

    subtotal = Column(Numeric(10, 2), nullable=False)
    total = Column(Numeric(10, 2), nullable=False)

    invoice_url = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    customer = relationship("Customer", back_populates="orders")
    address = relationship("Address")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    variant_id = Column(Integer, ForeignKey("product_variants.id"), nullable=True)

    # Snapshot fields (kept even if the product is edited/deleted later)
    product_name = Column(String(255), nullable=False)
    color = Column(String(50), nullable=False)
    size = Column(String(20), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Numeric(10, 2), nullable=False)
    total_price = Column(Numeric(10, 2), nullable=False)

    order = relationship("Order", back_populates="items")
