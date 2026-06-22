"""
Admin > Staff Management: lets a super_admin create and manage other
admin/staff accounts (order manager, packing staff, delivery staff,
customer support) with role-based permissions. Restricted entirely to
the super_admin role - this is "who can manage the website" control.
"""
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import AdminUser
from app.models.enums import AdminRole
from app.auth.dependencies import require_role
from app.auth.security import hash_password
from app.schemas.admin_user import AdminUserCreate, AdminUserUpdate, AdminUserOut

router = APIRouter(prefix="/api/admin/staff", tags=["admin-staff"])

superadmin_only = require_role(AdminRole.SUPER_ADMIN)


@router.get("", response_model=List[AdminUserOut])
def list_staff(db: Session = Depends(get_db), admin: AdminUser = Depends(superadmin_only)):
    return db.query(AdminUser).order_by(AdminUser.id).all()


@router.post("", response_model=AdminUserOut, status_code=status.HTTP_201_CREATED)
def create_staff(payload: AdminUserCreate, db: Session = Depends(get_db), admin: AdminUser = Depends(superadmin_only)):
    if db.query(AdminUser).filter(AdminUser.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists")
    if len(payload.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")

    staff = AdminUser(
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        is_active=True,
    )
    db.add(staff)
    db.commit()
    db.refresh(staff)
    return staff


@router.put("/{staff_id}", response_model=AdminUserOut)
def update_staff(staff_id: int, payload: AdminUserUpdate, db: Session = Depends(get_db), admin: AdminUser = Depends(superadmin_only)):
    staff = db.query(AdminUser).filter(AdminUser.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff account not found")
    if staff.id == admin.id and payload.is_active is False:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't deactivate your own account")
    if staff.id == admin.id and payload.role and payload.role != AdminRole.SUPER_ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't remove your own super admin role")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(staff, field, value)
    db.commit()
    db.refresh(staff)
    return staff


@router.delete("/{staff_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_staff(staff_id: int, db: Session = Depends(get_db), admin: AdminUser = Depends(superadmin_only)):
    if staff_id == admin.id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You can't delete your own account")
    staff = db.query(AdminUser).filter(AdminUser.id == staff_id).first()
    if not staff:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Staff account not found")
    db.delete(staff)
    db.commit()
