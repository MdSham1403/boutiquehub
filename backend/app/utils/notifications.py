"""
Builds and sends every seller-facing Telegram notification from the spec:
new order, low stock, out of stock, new customer, and daily sales summary.
"""
from datetime import datetime, timedelta
from typing import Optional

from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.order import Order
from app.models.product import Product, ProductVariant
from app.models.customer import Customer
from app.utils.telegram import send_telegram_message


def notify_new_order(order: Order) -> None:
    product_lines = "\n".join(
        f"\u2022 {item.product_name} - {item.color}, Size {item.size}, Qty {item.quantity}"
        for item in order.items
    )
    text = (
        "\U0001F6D2 <b>NEW ORDER</b>\n\n"
        f"Order: {order.order_number}\n"
        f"Customer: {order.customer.name}\n"
        f"Phone: {order.customer.mobile_number or 'N/A'}\n"
        f"Payment: {'COD' if order.payment_method.value == 'cod' else 'Scan & Pay (verify screenshot)'}\n\n"
        f"Products:\n{product_lines}\n\n"
        f"Total: \u20b9{order.total}\n"
        f"Address: {order.address.city}, {order.address.state}"
    )
    send_telegram_message(text)


def notify_low_stock(product: Product, variant: ProductVariant) -> None:
    text = (
        "\u26A0\uFE0F <b>LOW STOCK</b>\n\n"
        f"{product.name} ({variant.color}, {variant.size})\n"
        f"Only {variant.stock} left - SKU {product.sku}"
    )
    send_telegram_message(text)


def notify_out_of_stock(product: Product, variant: ProductVariant) -> None:
    text = (
        "\U0001F6AB <b>OUT OF STOCK</b>\n\n"
        f"{product.name} ({variant.color}, {variant.size})\n"
        f"SKU {product.sku} is now out of stock."
    )
    send_telegram_message(text)


def notify_new_customer(customer: Customer) -> None:
    text = (
        "\U0001F464 <b>NEW CUSTOMER</b>\n\n"
        f"{customer.name} ({customer.email}) just signed up."
    )
    send_telegram_message(text)


def send_daily_sales_summary(db: Session, for_date: Optional[datetime] = None) -> None:
    target_date = (for_date or datetime.utcnow()).date()
    start = datetime.combine(target_date, datetime.min.time())
    end = start + timedelta(days=1)

    orders = db.query(Order).filter(Order.created_at >= start, Order.created_at < end).all()
    total_orders = len(orders)
    total_revenue = sum((o.total for o in orders), start=0)
    new_customers = (
        db.query(func.count(Customer.id))
        .filter(Customer.created_at >= start, Customer.created_at < end)
        .scalar()
    )

    text = (
        "\U0001F4CA <b>DAILY SALES SUMMARY</b>\n\n"
        f"Date: {target_date.strftime('%d %b %Y')}\n"
        f"Orders: {total_orders}\n"
        f"Revenue: \u20b9{total_revenue}\n"
        f"New customers: {new_customers}"
    )
    send_telegram_message(text)
