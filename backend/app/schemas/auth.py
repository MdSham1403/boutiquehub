from pydantic import BaseModel, EmailStr

from app.models.enums import AdminRole


class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class CustomerRegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    mobile_number: str | None = None


class CustomerEmailLoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class AdminOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: AdminRole

    class Config:
        from_attributes = True


class CustomerAuthOut(BaseModel):
    id: int
    name: str
    email: str
    mobile_number: str | None = None

    class Config:
        from_attributes = True


class AdminLoginResponse(TokenResponse):
    admin: AdminOut


class CustomerLoginResponse(TokenResponse):
    customer: CustomerAuthOut
