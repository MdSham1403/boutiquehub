"""
Admin > Banner Management: home/sale/festival banners, no coding
required - admin uploads an image straight to Cloudinary and it shows
up on the storefront immediately.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.marketing import Banner
from app.models.enums import BannerType
from app.auth.dependencies import get_current_admin
from app.utils.cloudinary_utils import upload_image
from app.schemas.banner import BannerCreate, BannerUpdate, BannerOut

router = APIRouter(tags=["banners"])


# ---------- Public ----------

@router.get("/api/banners", response_model=List[BannerOut])
def list_public_banners(banner_type: Optional[BannerType] = None, db: Session = Depends(get_db)):
    query = db.query(Banner).filter(Banner.is_active == True)  # noqa: E712
    if banner_type:
        query = query.filter(Banner.banner_type == banner_type)
    return query.order_by(Banner.display_order).all()


# ---------- Admin ----------

@router.get("/api/admin/banners", response_model=List[BannerOut])
def admin_list_banners(banner_type: Optional[BannerType] = None, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    query = db.query(Banner)
    if banner_type:
        query = query.filter(Banner.banner_type == banner_type)
    return query.order_by(Banner.display_order).all()


@router.post("/api/admin/banners/upload-image")
async def upload_banner_image(file: UploadFile = File(...), admin=Depends(get_current_admin)):
    url = await upload_image(file, folder="boutiquehub/banners")
    return {"url": url}


@router.post("/api/admin/banners", response_model=BannerOut, status_code=status.HTTP_201_CREATED)
def create_banner(payload: BannerCreate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    banner = Banner(**payload.model_dump())
    db.add(banner)
    db.commit()
    db.refresh(banner)
    return banner


@router.put("/api/admin/banners/{banner_id}", response_model=BannerOut)
def update_banner(banner_id: int, payload: BannerUpdate, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(banner, field, value)
    db.commit()
    db.refresh(banner)
    return banner


@router.delete("/api/admin/banners/{banner_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_banner(banner_id: int, db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    banner = db.query(Banner).filter(Banner.id == banner_id).first()
    if not banner:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Banner not found")
    db.delete(banner)
    db.commit()
