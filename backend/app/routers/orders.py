"""
Orders: checkout (Step 3-4 of the spec's customer flow), customer order
history, and admin order management (view/search/filter/change status/
verify payment/cancel).

Order numbering: BCH + the order's own DB id, zero-padded to 6 digits
(e.g. BCH000145). Using the DB-assigned id avoids race conditions that a
separately-tracked counter could hit under concurrent checkouts.
"""
import math
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from app.database import get_db
from app.models.customer import Customer, Address
from app.models.product import Product, ProductVariant
from app.models.order import Order, OrderItem
from app.models.enums import OrderStatus, PaymentMethod, PaymentStatus
from app.auth.dependencies import get_current_customer, get_current_admin
from app.utils.whatsapp import build_whatsapp_order_link
from app.utils.invoice import generate_invoice_pdf
from app.utils.cloudinary_utils import upload_pdf_bytes
from app.utils.notifications import notify_new_order, notify_low_stock, notify_out_of_stock
from app.config import settings
from app.schemas.order import (
    OrderCreate, OrderOut, OrderCreateResponse, OrderListItem,
    OrderStatusUpdate, PaymentVerifyUpdate,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(tags=["orders"])

RESTOCKABLE_STATUSES = {OrderStatus.CANCELLED, OrderStatus.RETURNED}


def _attach_invoice(db: Session, order: Order) -> None:
    """Generates the invoice PDF and uploads it, storing the URL on the
    order. Best-effort: a PDF/upload failure should never block checkout -
    the admin can still regenerate it later via the invoice endpoint."""
    try:
        pdf_bytes = generate_invoice_pdf(order)
        order.invoice_url = upload_pdf_bytes(pdf_bytes, public_id=order.order_number)
        db.commit()
    except Exception:
        db.rollback()


def _send_stock_alerts(variants_touched: List[ProductVariant]) -> None:
    for variant in variants_touched:
        if variant.stock <= 0:
            notify_out_of_stock(variant.product, variant)
        elif variant.stock <= settings.LOW_STOCK_THRESHOLD:
            notify_low_stock(variant.product, variant)


def _order_query_base(db: Session):
    return db.query(Order).options(
        joinedload(Order.items),
        joinedload(Order.address),
        joinedload(Order.customer),
    )


def _resolve_address(db: Session, customer: Customer, payload: OrderCreate) -> Address:
    if payload.address_id:
        address = db.query(Address).filter(Address.id == payload.address_id, Address.customer_id == customer.id).first()
        if not address:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
        return address

    # New address - saved permanently for future orders, per spec
    if payload.new_address.is_default:
        db.query(Address).filter(Address.customer_id == customer.id).update({"is_default": False})
    address = Address(customer_id=customer.id, **payload.new_address.model_dump())
    db.add(address)
    db.flush()
    return address


# ---------- Customer: checkout & order history ----------

@router.post("/api/orders", response_model=OrderCreateResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    if not payload.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cart is empty")

    # Save mobile number on first checkout if the Google profile didn't have one
    if payload.mobile_number and not customer.mobile_number:
        customer.mobile_number = payload.mobile_number

    address = _resolve_address(db, customer, payload)

    # Validate every item BEFORE writing anything, so a bad item doesn't
    # leave a half-created order behind.
    validated_lines = []
    for item in payload.items:
        variant = (
            db.query(ProductVariant)
            .filter(ProductVariant.id == item.variant_id, ProductVariant.product_id == item.product_id)
            .first()
        )
        if not variant:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Product variant not found (product_id={item.product_id})")

        product: Product = variant.product
        if not product.is_active or product.is_archived:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"'{product.name}' is no longer available")
        if item.quantity < 1:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Quantity must be at least 1")
        if variant.stock < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only {variant.stock} left of '{product.name}' ({variant.color}, {variant.size})",
            )

        unit_price = product.offer_price if product.offer_price else product.price
        validated_lines.append({
            "variant": variant,
            "product": product,
            "quantity": item.quantity,
            "unit_price": unit_price,
        })

    subtotal = sum(line["unit_price"] * line["quantity"] for line in validated_lines)

    payment_status = (
        PaymentStatus.VERIFICATION_PENDING if payload.payment_method == PaymentMethod.SCAN_AND_PAY
        else PaymentStatus.COD_PENDING
    )

    order = Order(
        order_number="PENDING",  # placeholder, replaced below once we have the id
        customer_id=customer.id,
        address_id=address.id,
        status=OrderStatus.PENDING,
        payment_method=payload.payment_method,
        payment_status=payment_status,
        payment_screenshot_url=payload.payment_screenshot_url,
        subtotal=subtotal,
        total=subtotal,
    )
    db.add(order)
    db.flush()  # assigns order.id

    order.order_number = f"BCH{order.id:06d}"

    for line in validated_lines:
        variant = line["variant"]
        product = line["product"]
        db.add(OrderItem(
            order_id=order.id,
            product_id=product.id,
            variant_id=variant.id,
            product_name=product.name,
            color=variant.color,
            size=variant.size,
            quantity=line["quantity"],
            unit_price=line["unit_price"],
            total_price=line["unit_price"] * line["quantity"],
        ))
        variant.stock -= line["quantity"]  # auto-reduce stock, per spec

    db.commit()

    order = _order_query_base(db).filter(Order.id == order.id).first()

    _attach_invoice(db, order)
    notify_new_order(order)
    _send_stock_alerts([line["variant"] for line in validated_lines])

    whatsapp_link = build_whatsapp_order_link(order)

    return OrderCreateResponse(order=order, whatsapp_link=whatsapp_link)


@router.get("/api/orders", response_model=List[OrderListItem])
def list_my_orders(db: Session = Depends(get_db), customer: Customer = Depends(get_current_customer)):
    orders = (
        _order_query_base(db)
        .filter(Order.customer_id == customer.id)
        .order_by(Order.created_at.desc())
        .all()
    )
    return [
        OrderListItem(
            id=o.id, order_number=o.order_number, status=o.status,
            payment_method=o.payment_method, payment_status=o.payment_status,
            total=o.total, created_at=o.created_at,
            customer_name=o.customer.name, customer_phone=o.customer.mobile_number,
        )
        for o in orders
    ]


@router.get("/api/orders/{order_id}", response_model=OrderOut)
def get_my_order(order_id: int, db: Session = Depends(get_db), customer: Customer = Depends(get_current_customer)):
    order = _order_query_base(db).filter(Order.id == order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


# ---------- Admin: order management ----------

@router.get("/api/admin/orders", response_model=PaginatedResponse[OrderListItem])
def admin_list_orders(
    order_status: Optional[OrderStatus] = None,
    payment_status: Optional[PaymentStatus] = None,
    search: Optional[str] = None,  # matches order_number, customer name, or phone
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    page: int = 1,
    page_size: int = 30,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    query = _order_query_base(db)

    if order_status:
        query = query.filter(Order.status == order_status)
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    if date_from:
        query = query.filter(Order.created_at >= date_from)
    if date_to:
        query = query.filter(Order.created_at <= date_to)
    if search:
        like = f"%{search}%"
        query = query.join(Customer).filter(
            or_(Order.order_number.ilike(like), Customer.name.ilike(like), Customer.mobile_number.ilike(like))
        )

    total = query.count()
    orders = (
        query.order_by(Order.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    items = [
        OrderListItem(
            id=o.id, order_number=o.order_number, status=o.status,
            payment_method=o.payment_method, payment_status=o.payment_status,
            total=o.total, created_at=o.created_at,
            customer_name=o.customer.name, customer_phone=o.customer.mobile_number,
        )
        for o in orders
    ]
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/api/admin/orders/{order_id}", response_model=OrderOut)
def admin_get_order(order_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    order = _order_query_base(db).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return order


def _restock_order(db: Session, order: Order) -> None:
    for item in order.items:
        if item.variant_id:
            variant = db.query(ProductVariant).filter(ProductVariant.id == item.variant_id).first()
            if variant:
                variant.stock += item.quantity


@router.patch("/api/admin/orders/{order_id}/status", response_model=OrderOut)
def update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    order = _order_query_base(db).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    was_restockable = order.status in RESTOCKABLE_STATUSES
    will_be_restockable = payload.status in RESTOCKABLE_STATUSES

    if will_be_restockable and not was_restockable:
        _restock_order(db, order)

    order.status = payload.status
    db.commit()
    db.refresh(order)
    return order


@router.patch("/api/admin/orders/{order_id}/verify-payment", response_model=OrderOut)
def verify_payment(
    order_id: int,
    payload: PaymentVerifyUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    order = _order_query_base(db).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if payload.verified:
        order.payment_status = PaymentStatus.VERIFIED
        if order.status in (OrderStatus.PENDING, OrderStatus.PAYMENT_VERIFICATION):
            order.status = OrderStatus.CONFIRMED
    else:
        order.payment_status = PaymentStatus.FAILED

    db.commit()
    db.refresh(order)
    return order


@router.patch("/api/admin/orders/{order_id}/cancel", response_model=OrderOut)
def cancel_order(order_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    order = _order_query_base(db).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")

    if order.status not in RESTOCKABLE_STATUSES:
        _restock_order(db, order)

    order.status = OrderStatus.CANCELLED
    db.commit()
    db.refresh(order)
    return order


# ---------- Invoices ----------

def _get_or_generate_invoice_url(db: Session, order: Order) -> str:
    if order.invoice_url:
        return order.invoice_url
    _attach_invoice(db, order)
    if not order.invoice_url:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Could not generate invoice right now. Please try again shortly.",
        )
    return order.invoice_url


@router.get("/api/orders/{order_id}/invoice")
def get_my_invoice(order_id: int, db: Session = Depends(get_db), customer: Customer = Depends(get_current_customer)):
    """My Account > Invoice Downloads."""
    order = _order_query_base(db).filter(Order.id == order_id, Order.customer_id == customer.id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return {"invoice_url": _get_or_generate_invoice_url(db, order)}


@router.get("/api/admin/orders/{order_id}/invoice")
def admin_get_invoice(order_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Admin > Orders > Print Invoice."""
    order = _order_query_base(db).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return {"invoice_url": _get_or_generate_invoice_url(db, order)}
