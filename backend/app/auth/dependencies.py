"""
FastAPI dependencies that extract + validate the JWT from the
Authorization header and load the corresponding user from the DB.

Use `get_current_admin` to protect admin dashboard routes, and
`get_current_customer` to protect customer account routes.
`require_role(...)` further restricts admin routes to specific staff roles.
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.security import decode_token
from app.models.user import AdminUser
from app.models.customer import Customer
from app.models.enums import AdminRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/admin/login", auto_error=False)


def _unauthorized(detail: str = "Could not validate credentials") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_admin(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> AdminUser:
    if not token:
        raise _unauthorized("Not authenticated")
    payload = decode_token(token)
    if not payload or payload.get("type") != "admin":
        raise _unauthorized()
    admin = db.query(AdminUser).filter(AdminUser.id == int(payload["sub"])).first()
    if not admin or not admin.is_active:
        raise _unauthorized("Account inactive or not found")
    return admin


def get_current_customer(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Customer:
    if not token:
        raise _unauthorized("Not authenticated")
    payload = decode_token(token)
    if not payload or payload.get("type") != "customer":
        raise _unauthorized()
    customer = db.query(Customer).filter(Customer.id == int(payload["sub"])).first()
    if not customer:
        raise _unauthorized("Account not found")
    return customer


def require_role(*allowed_roles: AdminRole):
    """Dependency factory: restrict a route to specific admin roles.
    Example: Depends(require_role(AdminRole.SUPER_ADMIN, AdminRole.ADMIN))
    """
    def checker(admin: AdminUser = Depends(get_current_admin)) -> AdminUser:
        if admin.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action",
            )
        return admin
    return checker
