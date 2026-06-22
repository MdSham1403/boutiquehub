"""
Categories: public read-only listing for the storefront nav, plus full
admin CRUD. Per spec default categories: Kurtis, Sarees, Tops, Leggings,
Chudidars, Nightwear, Kids Wear, Dupattas, Western Wear (seeded separately,
not hardcoded here, so admins can fully customize them).
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.product import Category
from app.auth.dependencies import get_current_admin
from app.utils.slugify import unique_slug
from app.schemas.category import CategoryCreate, CategoryUpdate, CategoryOut

router = APIRouter(tags=["categories"])


# ---------- Public ----------

@router.get("/api/categories", response_model=list[CategoryOut])
def list_categories(include_inactive: bool = False, db: Session = Depends(get_db)):
    query = db.query(Category)
    if not include_inactive:
        query = query.filter(Category.is_active == True)  # noqa: E712
    return query.order_by(Category.display_order, Category.name).all()


# ---------- Admin ----------

@router.post("/api/admin/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    slug = unique_slug(payload.name, lambda s: db.query(Category).filter(Category.slug == s).first() is not None)
    category = Category(name=payload.name, slug=slug, image_url=payload.image_url, display_order=payload.display_order)
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/api/admin/categories/{category_id}", response_model=CategoryOut)
def update_category(category_id: int, payload: CategoryUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] != category.name:
        category.slug = unique_slug(
            update_data["name"],
            lambda s: db.query(Category).filter(Category.slug == s, Category.id != category_id).first() is not None,
        )
    for field, value in update_data.items():
        setattr(category, field, value)

    db.commit()
    db.refresh(category)
    return category


@router.delete("/api/admin/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")

    if category.products:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete a category that still has products. Reassign or delete those products first.",
        )
    db.delete(category)
    db.commit()
