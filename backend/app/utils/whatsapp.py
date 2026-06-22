"""
Generates the "Continue to WhatsApp" deep link (no API needed - this is
just a wa.me URL with a pre-filled, URL-encoded text message). The
customer's WhatsApp app opens with this message ready to send.
"""
from urllib.parse import quote

from app.config import settings
from app.models.order import Order


def build_whatsapp_order_link(order: Order) -> str:
    lines = [
        "Hello,",
        "",
        f"Order ID : {order.order_number}",
        "",
        f"Name : {order.customer.name}",
        "",
        f"Phone : {order.customer.mobile_number or ''}",
        "",
        f"Payment : {'COD' if order.payment_method.value == 'cod' else 'Paid via UPI'}",
        "",
        "Products",
        "",
    ]

    for item in order.items:
        lines += [
            item.product_name,
            f"Size : {item.size}",
            f"Color : {item.color}",
            f"Qty : {item.quantity}",
            "",
        ]

    lines += [
        f"Total : \u20b9{order.total}",
        "",
        "Please confirm my order.",
    ]

    message = "\n".join(lines)
    seller_number = settings.SELLER_WHATSAPP_NUMBER
    return f"https://wa.me/{seller_number}?text={quote(message)}"
