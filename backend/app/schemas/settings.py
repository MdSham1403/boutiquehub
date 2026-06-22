from typing import Optional
from pydantic import BaseModel


class StoreSettingsOut(BaseModel):
    store_name: Optional[str] = None
    store_logo_url: Optional[str] = None
    upi_id: Optional[str] = None
    upi_qr_code_url: Optional[str] = None

    class Config:
        from_attributes = True


class StoreSettingsUpdate(BaseModel):
    store_name: Optional[str] = None
    upi_id: Optional[str] = None
