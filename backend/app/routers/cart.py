"""
Cart is managed client-side (frontend keeps the list of {product_id,
variant_id, quantity} in local state). This endpoint takes that list and
returns it enriched with live prices, images, and stock - so the Cart
page always shows accurate, up-to-date info even if a product changed
since it was added.
"""
from typing import List
from decimal import Decimal

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.product import ProductVariant
from app.schemas.cart import CartItemRequest, CartLineOut, CartPreviewResponse

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.post("/preview", response_model=CartPreviewResponse)
def preview_cart(items: List[CartItemRequest], db: Session = Depends(get_db)):
    lines = []
    subtotal = Decimal("0")
    has_issues = False

    for requested in items:
        variant = (
            db.query(ProductVariant)
            .options(joinedload(ProductVariant.product))
            .filter(ProductVariant.id == requested.variant_id, ProductVariant.product_id == requested.product_id)
            .first()
        )
        if not variant:
            has_issues = True
            continue

        product = variant.product
        unit_price = product.offer_price if product.offer_price else product.price
        capped_quantity = min(requested.quantity, variant.stock) if variant.stock > 0 else 0
        in_stock = variant.stock > 0
        is_active = product.is_active and not product.is_archived

        if capped_quantity != requested.quantity or not in_stock or not is_active:
            has_issues = True

        line_total = unit_price * capped_quantity if is_active else Decimal("0")
        if is_active:
            subtotal += line_total

        lines.append(CartLineOut(
            product_id=product.id,
            variant_id=variant.id,
            product_name=product.name,
            image_url=product.primary_image,
            color=variant.color,
            size=variant.size,
            quantity=capped_quantity,
            requested_quantity=requested.quantity,
            unit_price=unit_price,
            line_total=line_total,
            available_stock=variant.stock,
            in_stock=in_stock,
            is_active=is_active,
        ))

    return CartPreviewResponse(items=lines, subtotal=subtotal, total=subtotal, has_issues=has_issues)
