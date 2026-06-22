"""
Verifies a Google ID token sent from the frontend (customer clicks
"Sign in with Google", frontend gets an id_token, sends it here).
"""
from fastapi import HTTPException, status
from google.oauth2 import id_token as google_id_token
from google.auth.transport import requests as google_requests

from app.config import settings

_google_request = google_requests.Request()


def verify_google_token(token: str) -> dict:
    """
    Returns the decoded payload (contains 'sub', 'email', 'name', 'picture')
    or raises 401 if the token is invalid / expired / wrong audience.
    """
    try:
        payload = google_id_token.verify_oauth2_token(
            token, _google_request, settings.GOOGLE_CLIENT_ID
        )
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )
    return payload
