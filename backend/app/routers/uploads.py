"""
Generic upload endpoint used during checkout: customer uploads their UPI
payment screenshot for the Scan & Pay flow before placing the order.
"""
from fastapi import APIRouter, Depends, UploadFile, File
from pydantic import BaseModel

from app.auth.dependencies import get_current_customer
from app.utils.cloudinary_utils import upload_image
from app.models.customer import Customer

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


class UploadResponse(BaseModel):
    url: str


@router.post("/payment-screenshot", response_model=UploadResponse)
async def upload_payment_screenshot(
    file: UploadFile = File(...),
    customer: Customer = Depends(get_current_customer),
):
    url = await upload_image(file, folder="boutiquehub/payments")
    return UploadResponse(url=url)
