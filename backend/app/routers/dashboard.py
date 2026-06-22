"""
Admin Dashboard: the cards (Revenue, Orders, Customers, Products, Low
Stock, Pending Orders) and charts (Monthly Sales, Weekly Orders, Top
Products) from the spec's Admin Dashboard section.
"""
from datetime import datetime, timedelta
from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.models.order import Order, OrderItem
from app.models.product import Product, ProductVariant
from app.models.customer import Customer
from app.models.enums import OrderStatus
from app.config import settings
from app.schemas.dashboard import (
    DashboardSummary, SalesChartPoint, TopProductItem, WeeklyOrdersPoint,
)

router = APIRouter(prefix="/api/admin/dashboard", tags=["dashboard"])

NON_REVENUE_STATUSES = (OrderStatus.CANCELLED, OrderStatus.RETURNED)


@router.get("/summary", response_model=DashboardSummary)
def get_summary(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    now = datetime.utcnow()
    month_start = datetime(now.year, now.month, 1)

    revenue_total = (
        db.query(func.coalesce(func.sum(Order.total), 0))
        .filter(Order.status.notin_(NON_REVENUE_STATUSES))
        .scalar()
    )
    revenue_this_month = (
        db.query(func.coalesce(func.sum(Order.total), 0))
        .filter(Order.status.notin_(NON_REVENUE_STATUSES), Order.created_at >= month_start)
        .scalar()
    )
    orders_total = db.query(func.count(Order.id)).scalar()
    orders_pending = (
        db.query(func.count(Order.id))
        .filter(Order.status.in_([OrderStatus.PENDING, OrderStatus.PAYMENT_VERIFICATION, OrderStatus.CONFIRMED]))
        .scalar()
    )
    customers_total = db.query(func.count(Customer.id)).scalar()
    products_total = db.query(func.count(Product.id)).filter(Product.is_archived == False).scalar()  # noqa: E712

    low_stock_count = (
        db.query(func.count(ProductVariant.id))
        .filter(ProductVariant.stock > 0, ProductVariant.stock <= settings.LOW_STOCK_THRESHOLD)
        .scalar()
    )
    out_of_stock_count = db.query(func.count(ProductVariant.id)).filter(ProductVariant.stock <= 0).scalar()

    return DashboardSummary(
        revenue_total=revenue_total,
        revenue_this_month=revenue_this_month,
        orders_total=orders_total,
        orders_pending=orders_pending,
        customers_total=customers_total,
        products_total=products_total,
        low_stock_count=low_stock_count,
        out_of_stock_count=out_of_stock_count,
    )


@router.get("/sales-chart", response_model=List[SalesChartPoint])
def get_sales_chart(days: int = 30, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Daily revenue + order count for the trailing N days (Monthly Sales chart)."""
    start_date = (datetime.utcnow() - timedelta(days=days - 1)).date()

    rows = (
        db.query(
            func.date(Order.created_at).label("day"),
            func.coalesce(func.sum(Order.total), 0).label("revenue"),
            func.count(Order.id).label("orders"),
        )
        .filter(func.date(Order.created_at) >= start_date, Order.status.notin_(NON_REVENUE_STATUSES))
        .group_by(func.date(Order.created_at))
        .all()
    )
    by_day = {str(r.day): r for r in rows}

    points = []
    for i in range(days):
        day = start_date + timedelta(days=i)
        row = by_day.get(str(day))
        points.append(SalesChartPoint(
            date=day.strftime("%Y-%m-%d"),
            revenue=row.revenue if row else 0,
            orders=row.orders if row else 0,
        ))
    return points


@router.get("/weekly-orders", response_model=List[WeeklyOrdersPoint])
def get_weekly_orders(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    """Order count per weekday over the trailing 7 days."""
    start_date = (datetime.utcnow() - timedelta(days=6)).date()
    rows = (
        db.query(
            func.date(Order.created_at).label("day"),
            func.count(Order.id).label("orders"),
        )
        .filter(func.date(Order.created_at) >= start_date)
        .group_by(func.date(Order.created_at))
        .all()
    )
    by_day = {str(r.day): r.orders for r in rows}

    points = []
    for i in range(7):
        day = start_date + timedelta(days=i)
        points.append(WeeklyOrdersPoint(day=day.strftime("%a"), orders=by_day.get(str(day), 0)))
    return points


@router.get("/top-products", response_model=List[TopProductItem])
def get_top_products(limit: int = 5, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    rows = (
        db.query(
            OrderItem.product_id,
            OrderItem.product_name,
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.total_price).label("revenue"),
        )
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.status.notin_(NON_REVENUE_STATUSES), OrderItem.product_id.isnot(None))
        .group_by(OrderItem.product_id, OrderItem.product_name)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(limit)
        .all()
    )

    product_ids = [r.product_id for r in rows]
    images = {}
    if product_ids:
        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        images = {p.id: p.primary_image for p in products}

    return [
        TopProductItem(
            product_id=r.product_id,
            name=r.product_name,
            image_url=images.get(r.product_id),
            units_sold=r.units_sold,
            revenue=r.revenue,
        )
        for r in rows
    ]
