"""
Authentication routes.

- POST /api/auth/admin/login          -> email + password (admin/staff)
- POST /api/auth/customer/google      -> Google id_token (customer)
- POST /api/auth/customer/register    -> email + password signup (customer)
- POST /api/auth/customer/login       -> email + password login (customer)
- POST /api/auth/refresh              -> exchange a refresh token for a new access token
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import AdminUser
from app.models.customer import Customer
from app.auth.security import (
    verify_password, hash_password, create_access_token, create_refresh_token, decode_token,
)
from app.auth.google_oauth import verify_google_token
from app.auth.dependencies import get_current_admin
from app.utils.notifications import notify_new_customer
from app.schemas.auth import (
    AdminLoginRequest, AdminLoginResponse, AdminOut,
    GoogleLoginRequest, CustomerLoginResponse, CustomerAuthOut,
    TokenResponse, ChangePasswordRequest,
    CustomerRegisterRequest, CustomerEmailLoginRequest,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/admin/login", response_model=AdminLoginResponse)
def admin_login(payload: AdminLoginRequest, db: Session = Depends(get_db)):
    admin = db.query(AdminUser).filter(AdminUser.email == payload.email).first()
    if not admin or not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not admin.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    access_token = create_access_token(str(admin.id), "admin", {"role": admin.role.value})
    refresh_token = create_refresh_token(str(admin.id), "admin")
    return AdminLoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        admin=AdminOut.model_validate(admin),
    )


def _issue_customer_tokens(customer: Customer) -> CustomerLoginResponse:
    access_token = create_access_token(str(customer.id), "customer")
    refresh_token = create_refresh_token(str(customer.id), "customer")
    return CustomerLoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        customer=CustomerAuthOut.model_validate(customer),
    )


@router.post("/customer/google", response_model=CustomerLoginResponse)
def customer_google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    google_data = verify_google_token(payload.id_token)

    customer = db.query(Customer).filter(Customer.google_id == google_data["sub"]).first()
    if not customer:
        # If they previously signed up with email+password using the same
        # email, link this Google identity to that existing account instead
        # of creating a duplicate - same person, two sign-in methods.
        customer = db.query(Customer).filter(Customer.email == google_data["email"]).first()
        if customer:
            customer.google_id = google_data["sub"]
            db.commit()
            db.refresh(customer)
        else:
            customer = Customer(
                google_id=google_data["sub"],
                name=google_data.get("name", "Customer"),
                email=google_data["email"],
            )
            db.add(customer)
            db.commit()
            db.refresh(customer)
            notify_new_customer(customer)

    return _issue_customer_tokens(customer)


@router.post("/customer/register", response_model=CustomerLoginResponse, status_code=status.HTTP_201_CREATED)
def customer_register(payload: CustomerRegisterRequest, db: Session = Depends(get_db)):
    if len(payload.password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters")
    if db.query(Customer).filter(Customer.email == payload.email).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="An account with this email already exists")

    customer = Customer(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        mobile_number=payload.mobile_number,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    notify_new_customer(customer)

    return _issue_customer_tokens(customer)


@router.post("/customer/login", response_model=CustomerLoginResponse)
def customer_email_login(payload: CustomerEmailLoginRequest, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.email == payload.email).first()
    if not customer or not customer.hashed_password:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not verify_password(payload.password, customer.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    return _issue_customer_tokens(customer)


@router.post("/refresh", response_model=TokenResponse)
def refresh_token(refresh_token: str, db: Session = Depends(get_db)):
    payload = decode_token(refresh_token)
    if not payload or not payload.get("refresh"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_type = payload["type"]
    user_id = payload["sub"]

    if user_type == "admin":
        admin = db.query(AdminUser).filter(AdminUser.id == int(user_id)).first()
        if not admin or not admin.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found")
        new_access = create_access_token(str(admin.id), "admin", {"role": admin.role.value})
    else:
        customer = db.query(Customer).filter(Customer.id == int(user_id)).first()
        if not customer:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found")
        new_access = create_access_token(str(customer.id), "customer")

    new_refresh = create_refresh_token(user_id, user_type)
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.put("/admin/change-password")
def change_admin_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(get_current_admin),
):
    if not verify_password(payload.current_password, admin.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Current password is incorrect")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 8 characters")

    admin.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
