from typing import List
from decimal import Decimal
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    revenue_total: Decimal
    revenue_this_month: Decimal
    orders_total: int
    orders_pending: int
    customers_total: int
    products_total: int
    low_stock_count: int
    out_of_stock_count: int


class SalesChartPoint(BaseModel):
    date: str
    revenue: Decimal
    orders: int


class TopProductItem(BaseModel):
    product_id: int
    name: str
    image_url: str | None = None
    units_sold: int
    revenue: Decimal


class WeeklyOrdersPoint(BaseModel):
    day: str
    orders: int
