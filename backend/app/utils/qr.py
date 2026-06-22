"""
Generates a small QR code (PNG bytes) to embed in invoices - encodes the
order number / tracking reference so a quick phone scan pulls up the order.
"""
from io import BytesIO
import qrcode


def generate_qr_png(data: str) -> bytes:
    qr = qrcode.QRCode(box_size=6, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = BytesIO()
    img.save(buffer, format="PNG")
    return buffer.getvalue()
