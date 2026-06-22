"""
Low-level Telegram sender. Uses the plain Bot API over HTTP (no SDK
needed for one-way notifications) - the seller's bot/chat is set up once
via TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID in .env.

Notifications are best-effort: a Telegram failure should never break a
checkout or admin action, so every call here swallows errors after
logging them.
"""
import logging

import httpx

from app.config import settings

logger = logging.getLogger("boutiquehub.telegram")

TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


def send_telegram_message(text: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
        logger.info("Telegram not configured - skipping notification.")
        return False

    url = TELEGRAM_API_URL.format(token=settings.TELEGRAM_BOT_TOKEN)
    try:
        response = httpx.post(
            url,
            json={"chat_id": settings.TELEGRAM_CHAT_ID, "text": text, "parse_mode": "HTML"},
            timeout=10,
        )
        response.raise_for_status()
        return True
    except httpx.HTTPError as exc:
        logger.warning(f"Telegram notification failed: {exc}")
        return False
