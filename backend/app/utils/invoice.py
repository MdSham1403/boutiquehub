"""
Generates the order invoice PDF: logo/store name, order id, customer,
address, line items, totals, and a QR code (encodes the order number for
quick lookup). GST is left as a future line per the spec.
"""
from io import BytesIO
from datetime import datetime

from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_RIGHT, TA_CENTER

from app.models.order import Order
from app.utils.qr import generate_qr_png
from app.config import settings


def generate_invoice_pdf(order: Order) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=18 * mm, bottomMargin=18 * mm)
    styles = getSampleStyleSheet()
    elements = []

    title_style = ParagraphStyle("StoreTitle", parent=styles["Title"], fontSize=20, spaceAfter=2)
    right_style = ParagraphStyle("Right", parent=styles["Normal"], alignment=TA_RIGHT)
    center_style = ParagraphStyle("Center", parent=styles["Normal"], alignment=TA_CENTER)

    # Header: store name (logo placeholder) + invoice meta
    header_table = Table(
        [[
            Paragraph(settings.APP_NAME, title_style),
            Paragraph(
                f"<b>INVOICE</b><br/>Order: {order.order_number}<br/>"
                f"Date: {order.created_at.strftime('%d %b %Y')}",
                right_style,
            ),
        ]],
        colWidths=[90 * mm, 90 * mm],
    )
    elements.append(header_table)
    elements.append(Spacer(1, 10 * mm))

    # Billing info
    address = order.address
    address_lines = (
        f"{address.house_no}, {address.street}<br/>"
        f"{address.area}, {address.city}<br/>"
        f"{address.district}, {address.state} - {address.pincode}"
        + (f"<br/>Landmark: {address.landmark}" if address.landmark else "")
    )
    billing_table = Table(
        [[
            Paragraph(
                f"<b>Bill To</b><br/>{order.customer.name}<br/>"
                f"{order.customer.mobile_number or ''}<br/>{address_lines}",
                styles["Normal"],
            ),
            Paragraph(
                f"<b>Payment Method</b><br/>{'Cash on Delivery' if order.payment_method.value == 'cod' else 'UPI (Scan & Pay)'}"
                f"<br/><b>Payment Status</b><br/>{order.payment_status.value.replace('_', ' ').title()}",
                styles["Normal"],
            ),
        ]],
        colWidths=[110 * mm, 70 * mm],
    )
    elements.append(billing_table)
    elements.append(Spacer(1, 8 * mm))

    # Line items
    data = [["Product", "Color", "Size", "Qty", "Unit Price", "Total"]]
    for item in order.items:
        data.append([
            item.product_name, item.color, item.size, str(item.quantity),
            f"\u20b9{item.unit_price}", f"\u20b9{item.total_price}",
        ])

    items_table = Table(data, colWidths=[55 * mm, 25 * mm, 20 * mm, 15 * mm, 30 * mm, 35 * mm])
    items_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#222222")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("ALIGN", (3, 0), (-1, -1), "RIGHT"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#dddddd")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f7f7f7")]),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    elements.append(items_table)
    elements.append(Spacer(1, 6 * mm))

    # Totals + QR
    qr_bytes = generate_qr_png(order.order_number)
    qr_image = Image(BytesIO(qr_bytes), width=28 * mm, height=28 * mm)

    totals_data = [
        ["Subtotal", f"\u20b9{order.subtotal}"],
        ["Total", f"\u20b9{order.total}"],
    ]
    totals_table = Table(totals_data, colWidths=[35 * mm, 35 * mm])
    totals_table.setStyle(TableStyle([
        ("FONTNAME", (0, 1), (-1, 1), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("ALIGN", (1, 0), (1, -1), "RIGHT"),
        ("LINEABOVE", (0, 1), (-1, 1), 0.75, colors.black),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
    ]))

    footer_row = Table(
        [[qr_image, totals_table]],
        colWidths=[100 * mm, 80 * mm],
    )
    footer_row.setStyle(TableStyle([("VALIGN", (0, 0), (-1, -1), "TOP")]))
    elements.append(footer_row)
    elements.append(Spacer(1, 10 * mm))
    elements.append(Paragraph("Thank you for shopping with us!", center_style))

    doc.build(elements)
    return buffer.getvalue()
