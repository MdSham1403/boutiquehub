"""
Cloudinary upload helper. Admin uploads multipart image/video files;
this wraps the Cloudinary SDK call and returns the hosted URL.

All upload functions fail loudly with a clear, actionable message if
Cloudinary isn't configured or rejects the request - previously these
errors surfaced as an opaque 500 with no indication of the actual cause.
"""
import cloudinary
import cloudinary.uploader
import cloudinary.exceptions
from fastapi import UploadFile, HTTPException, status

from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp", "image/jpg"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/webm"}
MAX_FILE_SIZE_MB = 15


def _ensure_configured():
    if not (settings.CLOUDINARY_CLOUD_NAME and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Image upload isn't configured. Set CLOUDINARY_CLOUD_NAME, "
                "CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in the backend's "
                ".env (find these in your Cloudinary dashboard), then restart the server."
            ),
        )


def _do_upload(contents, **kwargs) -> str:
    _ensure_configured()
    try:
        result = cloudinary.uploader.upload(contents, **kwargs)
    except cloudinary.exceptions.AuthorizationRequired:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Cloudinary rejected the request - double check CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET are correct.",
        )
    except cloudinary.exceptions.Error as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Upload failed: {exc}",
        )
    return result["secure_url"]


async def upload_image(file: UploadFile, folder: str = "boutiquehub/products") -> str:
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported image type: {file.content_type}",
        )
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Image exceeds {MAX_FILE_SIZE_MB}MB limit",
        )
    return _do_upload(contents, folder=folder, resource_type="image")


async def upload_video(file: UploadFile, folder: str = "boutiquehub/products/videos") -> str:
    if file.content_type not in ALLOWED_VIDEO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported video type: {file.content_type}",
        )
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE_MB * 1024 * 1024 * 4:  # allow up to 60MB for video
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Video file too large",
        )
    return _do_upload(contents, folder=folder, resource_type="video")


def upload_pdf_bytes(pdf_bytes: bytes, public_id: str, folder: str = "boutiquehub/invoices") -> str:
    """Uploads a generated PDF (e.g. an invoice) as a raw Cloudinary asset."""
    return _do_upload(pdf_bytes, folder=folder, public_id=public_id, resource_type="raw", overwrite=True)


def upload_raw_bytes(file_bytes: bytes, public_id: str, folder: str = "boutiquehub/invoices") -> str:
    """Uploads raw bytes and returns the hosted URL."""
    return _do_upload(file_bytes, folder=folder, public_id=public_id, resource_type="raw", overwrite=True)


def delete_asset(public_id: str, resource_type: str = "image") -> None:
    _ensure_configured()
    cloudinary.uploader.destroy(public_id, resource_type=resource_type)
