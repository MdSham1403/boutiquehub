"""
Products: public search/browse/detail endpoints for the storefront, and
full admin management (create, edit, delete, archive, duplicate, enable/
disable, image & video upload) per the spec's Product Management section.
"""
import math
from decimal import Decimal
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func as sa_func

from app.database import get_db
from app.models.product import Product, Category, ProductVariant, ProductImage
from app.auth.dependencies import get_current_admin
from app.utils.slugify import unique_slug
from app.utils.cloudinary_utils import upload_image, upload_video
from app.schemas.product import (
    ProductCreate, ProductUpdate, ProductOut, ProductListItem, ProductImageOut,
)
from app.schemas.common import PaginatedResponse

router = APIRouter(tags=["products"])


def _product_query_base(db: Session):
    return db.query(Product).options(
        joinedload(Product.images),
        joinedload(Product.variants),
        joinedload(Product.category),
        joinedload(Product.reviews),
    )


# ---------- Public: search, filter, browse ----------

@router.get("/api/products", response_model=PaginatedResponse[ProductListItem])
def search_products(
    search: Optional[str] = None,           # matches name, fabric
    category: Optional[str] = None,         # category slug
    color: Optional[str] = None,
    size: Optional[str] = None,
    min_price: Optional[Decimal] = None,
    max_price: Optional[Decimal] = None,
    fabric: Optional[str] = None,
    min_rating: Optional[float] = None,
    in_stock_only: bool = False,
    sort_by: str = "newest",                # newest | price_low | price_high | rating
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db),
):
    query = _product_query_base(db).filter(Product.is_active == True, Product.is_archived == False)  # noqa: E712

    if search:
        like = f"%{search}%"
        query = query.filter(or_(Product.name.ilike(like), Product.fabric.ilike(like)))

    if category:
        query = query.join(Category).filter(Category.slug == category)

    if fabric:
        query = query.filter(Product.fabric.ilike(f"%{fabric}%"))

    effective_price = sa_func.coalesce(Product.offer_price, Product.price)
    if min_price is not None:
        query = query.filter(effective_price >= min_price)
    if max_price is not None:
        query = query.filter(effective_price <= max_price)

    if color or size or in_stock_only:
        variant_filters = []
        if color:
            variant_filters.append(ProductVariant.color.ilike(color))
        if size:
            variant_filters.append(ProductVariant.size.ilike(size))
        if in_stock_only:
            variant_filters.append(ProductVariant.stock > 0)
        query = query.join(ProductVariant).filter(and_(*variant_filters))

    query = query.distinct()

    # Rating filter applied after fetch since it's a computed property -
    # for catalogs in the thousands, this should move to a denormalized
    # rating column. Fine for boutique-scale catalogs (hundreds of SKUs).
    all_matching = query.all()
    if min_rating is not None:
        all_matching = [p for p in all_matching if p.average_rating >= min_rating]

    sorters = {
        "newest": lambda p: p.created_at,
        "price_low": lambda p: float(p.offer_price or p.price),
        "price_high": lambda p: -float(p.offer_price or p.price),
        "rating": lambda p: -p.average_rating,
    }
    reverse = sort_by == "newest"
    all_matching.sort(key=sorters.get(sort_by, sorters["newest"]), reverse=reverse)

    total = len(all_matching)
    start = (page - 1) * page_size
    page_items = all_matching[start:start + page_size]

    return PaginatedResponse(
        items=page_items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/api/products/{slug}", response_model=ProductOut)
def get_product_detail(slug: str, db: Session = Depends(get_db)):
    product = _product_query_base(db).filter(Product.slug == slug, Product.is_active == True).first()  # noqa: E712
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.get("/api/products/{slug}/similar", response_model=List[ProductListItem])
def get_similar_products(slug: str, limit: int = 8, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.slug == slug).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    return (
        _product_query_base(db)
        .filter(
            Product.category_id == product.category_id,
            Product.id != product.id,
            Product.is_active == True,  # noqa: E712
            Product.is_archived == False,  # noqa: E712
        )
        .limit(limit)
        .all()
    )


# ---------- Admin: management ----------

@router.get("/api/admin/products", response_model=PaginatedResponse[ProductListItem])
def admin_list_products(
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    include_archived: bool = False,
    is_active: Optional[bool] = None,
    page: int = 1,
    page_size: int = 30,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    query = _product_query_base(db)
    if not include_archived:
        query = query.filter(Product.is_archived == False)  # noqa: E712
    if search:
        query = query.filter(Product.name.ilike(f"%{search}%"))
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if is_active is not None:
        query = query.filter(Product.is_active == is_active)

    total = query.count()
    items = (
        query.order_by(Product.created_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return PaginatedResponse(
        items=items, total=total, page=page, page_size=page_size,
        total_pages=max(1, math.ceil(total / page_size)),
    )


@router.get("/api/admin/products/{product_id}", response_model=ProductOut)
def admin_get_product(product_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    product = _product_query_base(db).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    return product


@router.post("/api/admin/products", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")

    if db.query(Product).filter(Product.sku == payload.sku).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")

    slug = unique_slug(payload.name, lambda s: db.query(Product).filter(Product.slug == s).first() is not None)

    product = Product(
        name=payload.name,
        slug=slug,
        category_id=payload.category_id,
        description=payload.description,
        fabric=payload.fabric,
        wash_instructions=payload.wash_instructions,
        sku=payload.sku,
        tags=payload.tags,
        price=payload.price,
        offer_price=payload.offer_price,
        video_url=payload.video_url,
    )
    db.add(product)
    db.flush()  # get product.id before adding variants

    for v in payload.variants:
        db.add(ProductVariant(product_id=product.id, color=v.color, size=v.size, stock=v.stock, sku_suffix=v.sku_suffix))

    db.commit()
    db.refresh(product)
    return _product_query_base(db).filter(Product.id == product.id).first()


@router.put("/api/admin/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    update_data = payload.model_dump(exclude_unset=True)
    incoming_variants = update_data.pop("variants", None)

    if "category_id" in update_data:
        if not db.query(Category).filter(Category.id == update_data["category_id"]).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Category not found")

    if "sku" in update_data and update_data["sku"] != product.sku:
        if db.query(Product).filter(Product.sku == update_data["sku"], Product.id != product_id).first():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="SKU already exists")

    if "name" in update_data and update_data["name"] != product.name:
        product.slug = unique_slug(
            update_data["name"],
            lambda s: db.query(Product).filter(Product.slug == s, Product.id != product_id).first() is not None,
        )

    for field, value in update_data.items():
        setattr(product, field, value)

    if incoming_variants is not None:
        # Match existing variants by (color, size) rather than replacing the
        # whole collection, so variants already referenced by past orders
        # keep their id - only their stock gets updated, not their identity.
        existing_by_key = {(v.color.strip().lower(), v.size.strip().lower()): v for v in product.variants}
        seen_keys = set()

        for incoming in incoming_variants:
            key = (incoming["color"].strip().lower(), incoming["size"].strip().lower())
            seen_keys.add(key)
            existing = existing_by_key.get(key)
            if existing:
                existing.stock = incoming["stock"]
                if incoming.get("sku_suffix") is not None:
                    existing.sku_suffix = incoming["sku_suffix"]
            else:
                db.add(ProductVariant(
                    product_id=product.id, color=incoming["color"], size=incoming["size"],
                    stock=incoming["stock"], sku_suffix=incoming.get("sku_suffix"),
                ))

        # Remove variants that were deleted in the form (no longer present).
        for key, existing in existing_by_key.items():
            if key not in seen_keys:
                db.delete(existing)

    db.commit()
    db.refresh(product)
    return _product_query_base(db).filter(Product.id == product_id).first()


@router.delete("/api/admin/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(product_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    db.delete(product)
    db.commit()


@router.patch("/api/admin/products/{product_id}/archive", response_model=ProductOut)
def toggle_archive_product(product_id: int, archived: bool, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_archived = archived
    db.commit()
    db.refresh(product)
    return _product_query_base(db).filter(Product.id == product_id).first()


@router.patch("/api/admin/products/{product_id}/toggle-active", response_model=ProductOut)
def toggle_active_product(product_id: int, active: bool, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_active = active
    db.commit()
    db.refresh(product)
    return _product_query_base(db).filter(Product.id == product_id).first()


@router.post("/api/admin/products/{product_id}/duplicate", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
def duplicate_product(product_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    original = _product_query_base(db).filter(Product.id == product_id).first()
    if not original:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    new_sku = f"{original.sku}-COPY"
    counter = 2
    while db.query(Product).filter(Product.sku == new_sku).first():
        new_sku = f"{original.sku}-COPY{counter}"
        counter += 1

    new_name = f"{original.name} (Copy)"
    new_slug = unique_slug(new_name, lambda s: db.query(Product).filter(Product.slug == s).first() is not None)

    duplicate = Product(
        name=new_name,
        slug=new_slug,
        category_id=original.category_id,
        description=original.description,
        fabric=original.fabric,
        wash_instructions=original.wash_instructions,
        sku=new_sku,
        tags=original.tags,
        price=original.price,
        offer_price=original.offer_price,
        video_url=original.video_url,
        is_active=False,  # duplicates start disabled so admin can review before going live
    )
    db.add(duplicate)
    db.flush()

    for img in original.images:
        db.add(ProductImage(product_id=duplicate.id, image_url=img.image_url, display_order=img.display_order))
    for v in original.variants:
        db.add(ProductVariant(product_id=duplicate.id, color=v.color, size=v.size, stock=0))  # fresh stock, not copied

    db.commit()
    db.refresh(duplicate)
    return _product_query_base(db).filter(Product.id == duplicate.id).first()


# ---------- Admin: images & video ----------

@router.post("/api/admin/products/{product_id}/images", response_model=List[ProductImageOut])
async def upload_product_images(
    product_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    current_max_order = db.query(sa_func.max(ProductImage.display_order)).filter(ProductImage.product_id == product_id).scalar() or 0

    created = []
    for i, file in enumerate(files):
        url = await upload_image(file)
        image = ProductImage(product_id=product_id, image_url=url, display_order=current_max_order + i + 1)
        db.add(image)
        created.append(image)

    db.commit()
    for img in created:
        db.refresh(img)
    return created


@router.delete("/api/admin/products/{product_id}/images/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_image(product_id: int, image_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    image = db.query(ProductImage).filter(ProductImage.id == image_id, ProductImage.product_id == product_id).first()
    if not image:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Image not found")
    db.delete(image)
    db.commit()


@router.post("/api/admin/products/{product_id}/video", response_model=ProductOut)
async def upload_product_video(
    product_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    product.video_url = await upload_video(file)
    db.commit()
    db.refresh(product)
    return _product_query_base(db).filter(Product.id == product_id).first()
