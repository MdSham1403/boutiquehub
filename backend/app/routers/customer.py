"""
Customer "My Account" features: profile, saved addresses (collected once
at checkout, reused on every future order), and wishlist.
"""
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from pydantic import BaseModel

from app.database import get_db
from app.models.customer import Customer, Address
from app.models.product import Product
from app.models.engagement import WishlistItem
from app.auth.dependencies import get_current_customer
from app.schemas.auth import CustomerAuthOut
from app.schemas.address import AddressCreate, AddressUpdate, AddressOut
from app.schemas.wishlist import WishlistItemOut

router = APIRouter(prefix="/api/customer", tags=["customer"])


class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None


# ---------- Profile ----------

@router.get("/me", response_model=CustomerAuthOut)
def get_profile(customer: Customer = Depends(get_current_customer)):
    return customer


@router.put("/me", response_model=CustomerAuthOut)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(customer, field, value)
    db.commit()
    db.refresh(customer)
    return customer


# ---------- Addresses ----------

@router.get("/addresses", response_model=List[AddressOut])
def list_addresses(db: Session = Depends(get_db), customer: Customer = Depends(get_current_customer)):
    return db.query(Address).filter(Address.customer_id == customer.id).order_by(Address.is_default.desc()).all()


@router.post("/addresses", response_model=AddressOut, status_code=status.HTTP_201_CREATED)
def create_address(
    payload: AddressCreate,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    if payload.is_default:
        db.query(Address).filter(Address.customer_id == customer.id).update({"is_default": False})

    address = Address(customer_id=customer.id, **payload.model_dump())
    db.add(address)
    db.commit()
    db.refresh(address)
    return address


@router.put("/addresses/{address_id}", response_model=AddressOut)
def update_address(
    address_id: int,
    payload: AddressUpdate,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    address = db.query(Address).filter(Address.id == address_id, Address.customer_id == customer.id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")

    update_data = payload.model_dump(exclude_unset=True)
    if update_data.get("is_default"):
        db.query(Address).filter(Address.customer_id == customer.id).update({"is_default": False})

    for field, value in update_data.items():
        setattr(address, field, value)
    db.commit()
    db.refresh(address)
    return address


@router.delete("/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(
    address_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    address = db.query(Address).filter(Address.id == address_id, Address.customer_id == customer.id).first()
    if not address:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    db.delete(address)
    db.commit()


# ---------- Wishlist ----------

@router.get("/wishlist", response_model=List[WishlistItemOut])
def get_wishlist(db: Session = Depends(get_db), customer: Customer = Depends(get_current_customer)):
    return (
        db.query(WishlistItem)
        .options(joinedload(WishlistItem.product).joinedload(Product.images))
        .filter(WishlistItem.customer_id == customer.id)
        .order_by(WishlistItem.created_at.desc())
        .all()
    )


@router.post("/wishlist/{product_id}", status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    if not db.query(Product).filter(Product.id == product_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    existing = (
        db.query(WishlistItem)
        .filter(WishlistItem.customer_id == customer.id, WishlistItem.product_id == product_id)
        .first()
    )
    if existing:
        return {"message": "Already in wishlist"}

    db.add(WishlistItem(customer_id=customer.id, product_id=product_id))
    db.commit()
    return {"message": "Added to wishlist"}


@router.delete("/wishlist/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_wishlist(
    product_id: int,
    db: Session = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    item = (
        db.query(WishlistItem)
        .filter(WishlistItem.customer_id == customer.id, WishlistItem.product_id == product_id)
        .first()
    )
    if item:
        db.delete(item)
        db.commit()
