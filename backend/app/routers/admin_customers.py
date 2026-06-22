"""
Admin > Customer Management: list customers with name, mobile, email,
address, total orders, lifetime spend, last purchase - exactly the
fields the spec calls out.
"""
import math
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order
from app.models.enums import OrderStatus
from app.auth.dependencies import get_current_admin
from app.schemas.admin_customer import AdminCustomerListItem, AdminCustomerDetail
from app.schemas.common import PaginatedResponse

router = APIRouter(prefix="/api/admin/customers", tags=["admin-customers"])

NON_REVENUE_STATUSES = (OrderStatus.CANCELLED, OrderStatus.RETURNED)


def _stats_for_customer(db: Session, customer: Customer) -> dict:
    total_orders = db.query(func.count(Order.id)).filter(Order.customer_id == customer.id).scalar()
    lifetime_spend = (
        db.query(func.coalesce(func.sum(Order.total), 0))
        .filter(Order.customer_id == customer.id, Order.status.notin_(NON_REVENUE_STATUSES))
        .scalar()
    )
    last_purchase = (
        db.query(func.max(Order.created_at))
        .filter(Order.customer_id == customer.id)
        .scalar()
    )
    return {"total_orders": total_orders, "lifetime_spend": lifetime_spend, "last_purchase": last_purchase}


@router.get("", response_model=PaginatedResponse[AdminCustomerListItem])
def list_customers(
    search: Optional[str] = None,  # matches name, email, mobile
    page: int = 1,
    page_size: int = 30,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    query = db.query(Customer)
    if search:
        like = f"%{search}%"
        query = query.filter(or_(Customer.name.ilike(like), Customer.email.ilike(like), Customer.mobile_number.ilike(like)))

    total = query.count()
    customers = (
        query.order_by(Customer.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [
        AdminCustomerListItem(
            id=c.id, name=c.name, email=c.email, mobile_number=c.mobile_number,
            created_at=c.created_at, **_stats_for_customer(db, c),
        )
        for c in customers
    ]
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/{customer_id}", response_model=AdminCustomerDetail)
def get_customer(customer_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    customer = db.query(Customer).options(joinedload(Customer.addresses)).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Customer not found")

    return AdminCustomerDetail(
        id=customer.id, name=customer.name, email=customer.email,
        mobile_number=customer.mobile_number, created_at=customer.created_at,
        addresses=customer.addresses, **_stats_for_customer(db, customer),
    )
