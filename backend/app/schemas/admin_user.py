from typing import Optional
from pydantic import BaseModel, EmailStr

from app.models.enums import AdminRole


class AdminUserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: AdminRole


class AdminUserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[AdminRole] = None
    is_active: Optional[bool] = None


class AdminUserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: AdminRole
    is_active: bool

    class Config:
        from_attributes = True
