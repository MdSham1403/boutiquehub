"""
Run once after the first migration to create the default super admin
account, so there's always a way to log into the dashboard.

Usage:
    python -m app.seed
"""
from app.database import SessionLocal
from app.models.user import AdminUser
from app.models.product import Category
from app.models.enums import AdminRole
from app.auth.security import hash_password
from app.utils.slugify import slugify
from app.config import settings

DEFAULT_CATEGORIES = [
    "Kurtis", "Sarees", "Tops", "Leggings", "Chudidars",
    "Nightwear", "Kids Wear", "Dupattas", "Western Wear",
]


def seed_admin():
    db = SessionLocal()
    try:
        existing = db.query(AdminUser).filter(AdminUser.email == settings.ADMIN_DEFAULT_EMAIL).first()
        if existing:
            print(f"Admin '{settings.ADMIN_DEFAULT_EMAIL}' already exists. Skipping.")
            return

        admin = AdminUser(
            email=settings.ADMIN_DEFAULT_EMAIL,
            hashed_password=hash_password(settings.ADMIN_DEFAULT_PASSWORD),
            full_name="Store Owner",
            role=AdminRole.SUPER_ADMIN,
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Created default admin: {settings.ADMIN_DEFAULT_EMAIL} / {settings.ADMIN_DEFAULT_PASSWORD}")
        print("IMPORTANT: log in and change this password immediately.")
    finally:
        db.close()


def seed_categories():
    db = SessionLocal()
    try:
        for i, name in enumerate(DEFAULT_CATEGORIES):
            if db.query(Category).filter(Category.name == name).first():
                continue
            db.add(Category(name=name, slug=slugify(name), display_order=i))
        db.commit()
        print(f"Seeded {len(DEFAULT_CATEGORIES)} default categories (skipping any that already exist).")
    finally:
        db.close()


if __name__ == "__main__":
    seed_admin()
    seed_categories()
