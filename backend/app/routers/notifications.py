"""
Lets the admin verify their Telegram bot is wired up correctly, and
manually trigger the daily summary (useful for hosts without native cron,
or just to re-send if the scheduled run failed).
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_admin
from app.utils.telegram import send_telegram_message
from app.utils.notifications import send_daily_sales_summary

router = APIRouter(prefix="/api/admin/notifications", tags=["notifications"])


@router.post("/test")
def send_test_notification(admin=Depends(get_current_admin)):
    sent = send_telegram_message("\u2705 BoutiqueHub is connected to Telegram. You'll receive order alerts here.")
    return {"sent": sent}


@router.post("/daily-summary")
def trigger_daily_summary(db: Session = Depends(get_db), admin=Depends(get_current_admin)):
    send_daily_sales_summary(db)
    return {"message": "Daily summary sent (if Telegram is configured)."}
