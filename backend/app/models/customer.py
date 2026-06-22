"""
Customer: shoppers who sign up via Google OR email+password. Addresses
are saved permanently so repeat customers don't re-enter details (per
spec: "Saved permanently for future orders").
"""
from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    # Exactly one signup method is used per customer: google_id is set for
    # Google sign-ins, hashed_password is set for email/password sign-ups.
    google_id = Column(String(255), unique=True, nullable=True, index=True)
    hashed_password = Column(String(255), nullable=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    mobile_number = Column(String(20), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    addresses = relationship("Address", back_populates="customer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer")
    wishlist_items = relationship("WishlistItem", back_populates="customer", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="customer")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)

    house_no = Column(String(50), nullable=False)
    street = Column(String(255), nullable=False)
    area = Column(String(255), nullable=False)
    city = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    pincode = Column(String(10), nullable=False)
    landmark = Column(String(255), nullable=True)
    is_default = Column(Boolean, default=False)

    customer = relationship("Customer", back_populates="addresses")
