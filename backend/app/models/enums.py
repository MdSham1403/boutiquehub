"""
Shared enums used by SQLAlchemy models and Pydantic schemas.
"""
import enum


class AdminRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    ORDER_MANAGER = "order_manager"
    PACKING_STAFF = "packing_staff"
    DELIVERY_STAFF = "delivery_staff"
    CUSTOMER_SUPPORT = "customer_support"


class PaymentMethod(str, enum.Enum):
    SCAN_AND_PAY = "scan_and_pay"
    COD = "cod"


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFICATION_PENDING = "verification_pending"
    COD_PENDING = "cod_pending"
    VERIFIED = "verified"
    FAILED = "failed"


class OrderStatus(str, enum.Enum):
    PENDING = "pending"
    PAYMENT_VERIFICATION = "payment_verification"
    CONFIRMED = "confirmed"
    PACKING = "packing"
    SHIPPED = "shipped"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"
    RETURNED = "returned"


class BannerType(str, enum.Enum):
    HOME = "home"
    SALE = "sale"
    FESTIVAL = "festival"


class CouponType(str, enum.Enum):
    PERCENTAGE = "percentage"
    FLAT = "flat"
    FREE_SHIPPING = "free_shipping"
