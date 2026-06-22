"""
Import every model here so that Base.metadata is fully populated -
this is required for Alembic's autogenerate to detect all tables.
"""
from app.models.user import AdminUser
from app.models.customer import Customer, Address
from app.models.product import Category, Product, ProductImage, ProductVariant
from app.models.order import Order, OrderItem
from app.models.engagement import WishlistItem, Review
from app.models.marketing import Banner, Coupon
from app.models.settings import StoreSettings

__all__ = [
    "AdminUser",
    "Customer", "Address",
    "Category", "Product", "ProductImage", "ProductVariant",
    "Order", "OrderItem",
    "WishlistItem", "Review",
    "Banner", "Coupon",
    "StoreSettings",
]
