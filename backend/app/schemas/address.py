from typing import Optional
from pydantic import BaseModel


class AddressCreate(BaseModel):
    house_no: str
    street: str
    area: str
    city: str
    district: str
    state: str
    pincode: str
    landmark: Optional[str] = None
    is_default: bool = False


class AddressUpdate(BaseModel):
    house_no: Optional[str] = None
    street: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    landmark: Optional[str] = None
    is_default: Optional[bool] = None


class AddressOut(BaseModel):
    id: int
    house_no: str
    street: str
    area: str
    city: str
    district: str
    state: str
    pincode: str
    landmark: Optional[str] = None
    is_default: bool

    class Config:
        from_attributes = True
