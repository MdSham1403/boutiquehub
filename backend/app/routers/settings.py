"""
Store-wide settings: public GET so the checkout page can show the UPI
QR code + UPI id for Scan & Pay, and admin endpoints to manage it
(no coding required, per spec's design philosophy for admin-editable assets).
"""
from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.settings import StoreSettings
from app.auth.dependencies import get_current_admin
from app.utils.cloudinary_utils import upload_image
from app.schemas.settings import StoreSettingsOut, StoreSettingsUpdate

router = APIRouter(tags=["settings"])


def _get_or_create_settings(db: Session) -> StoreSettings:
    settings_row = db.query(StoreSettings).filter(StoreSettings.id == 1).first()
    if not settings_row:
        settings_row = StoreSettings(id=1)
        db.add(settings_row)
        db.commit()
        db.refresh(settings_row)
    return settings_row


@router.get("/api/store-settings", response_model=StoreSettingsOut)
def get_store_settings(db: Session = Depends(get_db)):
    return _get_or_create_settings(db)


@router.put("/api/admin/store-settings", response_model=StoreSettingsOut)
def update_store_settings(
    payload: StoreSettingsUpdate,
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    settings_row = _get_or_create_settings(db)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(settings_row, field, value)
    db.commit()
    db.refresh(settings_row)
    return settings_row


@router.post("/api/admin/store-settings/upi-qr", response_model=StoreSettingsOut)
async def upload_upi_qr(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    settings_row = _get_or_create_settings(db)
    settings_row.upi_qr_code_url = await upload_image(file, folder="boutiquehub/settings")
    db.commit()
    db.refresh(settings_row)
    return settings_row


@router.post("/api/admin/store-settings/logo", response_model=StoreSettingsOut)
async def upload_store_logo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin=Depends(get_current_admin),
):
    settings_row = _get_or_create_settings(db)
    settings_row.store_logo_url = await upload_image(file, folder="boutiquehub/settings")
    db.commit()
    db.refresh(settings_row)
    return settings_row
