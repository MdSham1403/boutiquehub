"""
Resets an admin's password directly in the database. Use this when
you're locked out and can't log in to use the in-app "change password"
flow.

Usage:
    python -m app.reset_admin_password admin@boutiquehub.com NewPassword123
"""
import sys

from app.database import SessionLocal
from app.models.user import AdminUser
from app.auth.security import hash_password


def reset_password(email: str, new_password: str):
    if len(new_password) < 8:
        print("Password must be at least 8 characters.")
        sys.exit(1)

    db = SessionLocal()
    try:
        admin = db.query(AdminUser).filter(AdminUser.email == email).first()
        if not admin:
            print(f"No admin found with email '{email}'.")
            sys.exit(1)

        admin.hashed_password = hash_password(new_password)
        admin.is_active = True
        db.commit()
        print(f"Password reset for '{email}'. You can log in with the new password now.")
    finally:
        db.close()


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python -m app.reset_admin_password <email> <new_password>")
        sys.exit(1)
    reset_password(sys.argv[1], sys.argv[2])
