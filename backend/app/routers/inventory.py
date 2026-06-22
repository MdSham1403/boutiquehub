"""
Inventory: stock is tracked per color+size variant (ProductVariant).
This router handles adding/editing/removing variants and the low-stock /
out-of-stock dashboards admins use to know what to restock.

Stock auto-reduction after a purchase happens in the orders router
(Phase 3), not here - this router is for manual management.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.product import Product, ProductVariant
from app.auth.dependencies import get_current_admin
from app.schemas.product import ProductVariantCreate, ProductVariantUpdate, ProductVariantOut
from app.schemas.inventory import InventoryItemOut
from app.config import settings

router = APIRouter(prefix="/api/admin", tags=["inventory"])


def _to_inventory_item(variant: ProductVariant) -> InventoryItemOut:
    return InventoryItemOut(
        variant_id=variant.id,
        product_id=variant.product_id,
        product_name=variant.product.name,
        sku=variant.product.sku,
        color=variant.color,
        size=variant.size,
        stock=variant.stock,
    )


@router.get("/inventory", response_model=List[InventoryItemOut])
def list_inventory(
    product_id: Optional[int] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    query = db.query(ProductVariant).options(joinedload(ProductVariant.product))
    if product_id:
        query = query.filter(ProductVariant.product_id == product_id)
    variants = query.all()
    return [_to_inventory_item(v) for v in variants]


@router.get("/inventory/low-stock", response_model=List[InventoryItemOut])
def low_stock(
    threshold: Optional[int] = None,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if threshold is None:
        threshold = settings.LOW_STOCK_THRESHOLD
    variants = (
        db.query(ProductVariant)
        .options(joinedload(ProductVariant.product))
        .filter(ProductVariant.stock > 0, ProductVariant.stock <= threshold)
        .all()
    )
    return [_to_inventory_item(v) for v in variants]


@router.get("/inventory/out-of-stock", response_model=List[InventoryItemOut])
def out_of_stock(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    variants = (
        db.query(ProductVariant)
        .options(joinedload(ProductVariant.product))
        .filter(ProductVariant.stock <= 0)
        .all()
    )
    return [_to_inventory_item(v) for v in variants]


@router.post("/products/{product_id}/variants", response_model=ProductVariantOut, status_code=status.HTTP_201_CREATED)
def add_variant(
    product_id: int,
    payload: ProductVariantCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = (
        db.query(ProductVariant)
        .filter(
            ProductVariant.product_id == product_id,
            ProductVariant.color == payload.color,
            ProductVariant.size == payload.size,
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This color/size combination already exists for this product")

    variant = ProductVariant(
        product_id=product_id, color=payload.color, size=payload.size,
        stock=payload.stock, sku_suffix=payload.sku_suffix,
    )
    db.add(variant)
    db.commit()
    db.refresh(variant)
    return variant


@router.put("/variants/{variant_id}", response_model=ProductVariantOut)
def update_variant(
    variant_id: int,
    payload: ProductVariantUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "stock" in update_data and update_data["stock"] < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Stock cannot be negative")

    for field, value in update_data.items():
        setattr(variant, field, value)

    db.commit()
    db.refresh(variant)
    return variant


@router.delete("/variants/{variant_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_variant(variant_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    variant = db.query(ProductVariant).filter(ProductVariant.id == variant_id).first()
    if not variant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Variant not found")
    db.delete(variant)
    db.commit()
