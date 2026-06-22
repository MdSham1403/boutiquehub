"""
Catalog models: Category -> Product -> (ProductImage, ProductVariant).

ProductVariant represents one color+size combination and its own stock
count - this is the "Inventory" table from the spec (managed separately
per color/size, auto-reduced after purchase).
"""
from sqlalchemy import (
    Column, Integer, String, Text, Numeric, Boolean, DateTime,
    ForeignKey, UniqueConstraint
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    slug = Column(String(120), unique=True, nullable=False, index=True)
    image_url = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    display_order = Column(Integer, default=0)

    products = relationship("Product", back_populates="category")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    slug = Column(String(280), unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False)

    description = Column(Text, nullable=True)
    fabric = Column(String(100), nullable=True)
    wash_instructions = Column(Text, nullable=True)
    sku = Column(String(100), unique=True, nullable=False)
    tags = Column(String(500), nullable=True)  # comma-separated

    price = Column(Numeric(10, 2), nullable=False)
    offer_price = Column(Numeric(10, 2), nullable=True)

    video_url = Column(String(500), nullable=True)

    is_active = Column(Boolean, default=True)     # enable/disable
    is_archived = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    category = relationship("Category", back_populates="products")
    images = relationship("ProductImage", back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.display_order")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="product", cascade="all, delete-orphan")

    @property
    def discount_percent(self) -> int:
        if self.offer_price and self.price and self.price > 0:
            return round((1 - float(self.offer_price) / float(self.price)) * 100)
        return 0

    @property
    def total_stock(self) -> int:
        return sum(v.stock for v in self.variants)

    @property
    def average_rating(self) -> float:
        if not self.reviews:
            return 0.0
        return round(sum(r.rating for r in self.reviews) / len(self.reviews), 1)

    @property
    def review_count(self) -> int:
        return len(self.reviews)

    @property
    def primary_image(self) -> str | None:
        return self.images[0].image_url if self.images else None


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    image_url = Column(String(500), nullable=False)
    display_order = Column(Integer, default=0)

    product = relationship("Product", back_populates="images")


class ProductVariant(Base):
    """One color+size combination with its own stock count (the Inventory table)."""
    __tablename__ = "product_variants"
    __table_args__ = (UniqueConstraint("product_id", "color", "size", name="uq_product_color_size"),)

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    color = Column(String(50), nullable=False)
    size = Column(String(20), nullable=False)
    stock = Column(Integer, nullable=False, default=0)
    sku_suffix = Column(String(50), nullable=True)

    product = relationship("Product", back_populates="variants")
