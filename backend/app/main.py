"""
BoutiqueHub API entrypoint.

Run locally with:
    uvicorn app.main:app --reload

Routers are added incrementally as each phase of the build is completed.
Currently wired: auth (Phase 1).
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth as auth_router
from app.routers import categories as categories_router
from app.routers import products as products_router
from app.routers import inventory as inventory_router
from app.routers import cart as cart_router
from app.routers import customer as customer_router
from app.routers import orders as orders_router
from app.routers import uploads as uploads_router
from app.routers import settings as settings_router
from app.routers import notifications as notifications_router
from app.routers import dashboard as dashboard_router
from app.routers import admin_customers as admin_customers_router
from app.routers import banners as banners_router
from app.routers import admin_staff as admin_staff_router

app = FastAPI(
    title=settings.APP_NAME,
    description="API for BoutiqueHub - a multi-tenant-ready boutique e-commerce platform",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(categories_router.router)
app.include_router(products_router.router)
app.include_router(inventory_router.router)
app.include_router(cart_router.router)
app.include_router(customer_router.router)
app.include_router(orders_router.router)
app.include_router(uploads_router.router)
app.include_router(settings_router.router)
app.include_router(notifications_router.router)
app.include_router(dashboard_router.router)
app.include_router(admin_customers_router.router)
app.include_router(banners_router.router)
app.include_router(admin_staff_router.router)


@app.get("/")
def root():
    return {"app": settings.APP_NAME, "status": "running", "environment": settings.ENVIRONMENT}


@app.get("/api/health")
def health_check():
    return {"status": "ok"}
