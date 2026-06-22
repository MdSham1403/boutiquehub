# BoutiqueHub Backend — Phases 1, 2, 3 & 4

FastAPI backend: auth, catalog/inventory, checkout/orders, and now
Telegram seller notifications + PDF invoices.

## What's included

**Phase 1 — Foundation**
- Models: AdminUser, Customer, Address, Category, Product, ProductImage,
  ProductVariant, Order, OrderItem, WishlistItem, Review, Banner, Coupon,
  StoreSettings
- Auth: admin email+password (JWT), customer Google login, refresh tokens,
  role-based access control
- Config, DB session management, Alembic migrations

**Phase 2 — Catalog & Inventory**
- Public storefront search/filter/sort/paginate, product detail, similar products
- Admin product CRUD, archive/duplicate/enable-disable, image & video upload
- Category CRUD seeded with the 9 default categories
- Inventory: per-variant stock editing, low-stock / out-of-stock views

**Phase 3 — Cart, Checkout & Orders**
- Cart preview, customer profile/addresses/wishlist
- Full checkout with order numbering (`BCH000145`) and a ready-to-open
  WhatsApp deep link
- Store settings for the admin's UPI QR code (shown at checkout)
- Order tracking through all spec statuses with auto-restock on cancel/return
- Admin order search/filter/verify-payment/status changes

**Phase 4 — Notifications & Invoices**
- **PDF invoices** (ReportLab): generated automatically the moment an
  order is placed, uploaded to Cloudinary, and the URL stored on the
  order. `GET /api/orders/{id}/invoice` (customer) and
  `GET /api/admin/orders/{id}/invoice` (admin "Print Invoice") return the
  URL, generating it on the fly if it's ever missing.
- **Telegram seller notifications** for every alert in the spec:
  - 🛒 New order (full order details, formatted like the spec's mockup)
  - ⚠️ Low stock (fires automatically when a sale drops a variant to/below
    `LOW_STOCK_THRESHOLD`, default 5 — configurable in `.env`)
  - 🚫 Out of stock (fires when a sale brings a variant to 0)
  - 👤 New customer (fires on first-time Google sign-in)
  - 📊 Daily sales summary — see below, this one needs a scheduler
- `POST /api/admin/notifications/test` to confirm your bot/chat ID are
  wired up correctly before going live

### Setting up the Telegram bot

1. Message `@BotFather` on Telegram, send `/newbot`, follow the prompts —
   you'll get a bot token for `TELEGRAM_BOT_TOKEN`
2. Message your new bot anything, then visit
   `https://api.telegram.org/bot<TOKEN>/getUpdates` to find your chat id
   for `TELEGRAM_CHAT_ID`
3. Set both in `.env`, restart the server, then call
   `POST /api/admin/notifications/test` to confirm it works

### Scheduling the daily summary

Telegram notifications are event-driven except the daily summary, which
needs something to trigger it once a day. `app/jobs/daily_summary.py` is
a standalone script for this — wire it up however your host supports
scheduled jobs:
- **Railway**: add a Cron Job service running `python -m app.jobs.daily_summary`
- **Any VM**: a crontab entry, e.g. `0 21 * * * cd /app && python -m app.jobs.daily_summary`
- No native cron available: an external scheduler (GitHub Actions, cron-job.org)
  can instead call `POST /api/admin/notifications/daily-summary` once a day

## Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env
# edit .env: DATABASE_URL, JWT_SECRET_KEY, GOOGLE_CLIENT_ID,
# CLOUDINARY_*, SELLER_WHATSAPP_NUMBER (for the WhatsApp deep link)

alembic revision --autogenerate -m "initial schema"
alembic upgrade head

python -m app.seed     # creates default admin + default categories

uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for interactive Swagger API docs.

## Try the full checkout flow

```bash
# 1. Admin uploads their UPI QR code once (shown at checkout going forward)
curl -X POST http://localhost:8000/api/admin/store-settings/upi-qr \
  -H "Authorization: Bearer <admin_access_token>" \
  -F "file=@upi-qr.png"

# 2. Customer adds items, previews cart
curl -X POST http://localhost:8000/api/cart/preview \
  -H "Content-Type: application/json" \
  -d '[{"product_id": 1, "variant_id": 1, "quantity": 2}]'

# 3. Customer checks out (COD example)
curl -X POST http://localhost:8000/api/orders \
  -H "Authorization: Bearer <customer_access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"product_id": 1, "variant_id": 1, "quantity": 2}],
    "payment_method": "cod",
    "new_address": {
      "house_no": "12", "street": "Main St", "area": "T Nagar",
      "city": "Madurai", "district": "Madurai", "state": "Tamil Nadu",
      "pincode": "625001"
    },
    "mobile_number": "9876543210"
  }'
# Response includes "whatsapp_link" - open it to message the seller directly
```

## What's next

- Phase 5: Customer website (React)
- Phase 6: Admin dashboard (React)

## Deployment notes (per your stack)

- **Database**: Supabase PostgreSQL
- **Backend**: Railway — start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Images**: Cloudinary
