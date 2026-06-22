# BoutiqueHub — Admin Dashboard (Phase 6)

React admin SPA for the boutique owner: dashboard analytics, product/
inventory management, order management, customer list, banner
management, and store settings.

## Stack
React 18 · Vite · Tailwind CSS · TanStack Query · React Router v6 · Recharts · React Hook Form · Lucide Icons

## Pages

| Route | Page |
|---|---|
| `/login` | Admin email + password login |
| `/` | Dashboard — revenue/orders/customers/products/low-stock/pending cards, monthly sales line chart, order volume bar chart, top products |
| `/products` | Product list — search, filter by category, archive toggle, status toggle, duplicate, delete |
| `/products/new`, `/products/:id` | Add/edit product — full form + variants (color/size/stock) + image & video upload |
| `/inventory` | All stock / low stock / out of stock tabs, inline stock editing |
| `/orders` | Order list — search (order #, name, phone), status filter |
| `/orders/:id` | Order detail — items, address, payment screenshot, verify payment, status progression, cancel, invoice download |
| `/customers` | Customer list — orders, lifetime spend, last purchase |
| `/banners` | Upload/manage Home, Sale, Festival banners — no coding required |
| `/settings` | Store name, logo, UPI ID + QR code, Telegram notification test |

## Setup

```bash
cd frontend/admin-dashboard
cp .env.example .env
# VITE_API_BASE_URL=http://localhost:8000

npm install
npm run dev          # starts on http://localhost:5174
npm run build         # production build to dist/
```

Log in with the seeded admin (`python -m app.seed` on the backend):
`admin@boutiquehub.com` / `changeme123` — change this immediately after
first login.

## New backend endpoints added to support this dashboard

The original Phase 1-4 backend didn't yet have analytics, banner
management, or admin customer endpoints. These were added now since
the dashboard depends on them:

- `GET /api/admin/dashboard/summary` — KPI cards
- `GET /api/admin/dashboard/sales-chart` — daily revenue/orders, last N days
- `GET /api/admin/dashboard/top-products` — best sellers by units sold
- `GET /api/admin/customers`, `GET /api/admin/customers/{id}` — customer list with order count, lifetime spend, last purchase
- `GET /api/banners`, full `/api/admin/banners` CRUD + image upload

All other endpoints (products, inventory, orders, settings, notifications)
were already built in Phases 2-4.

## Deployment (Vercel)

```bash
cd frontend/admin-dashboard
vercel --prod
```

Set `VITE_API_BASE_URL` in the Vercel dashboard. Add a `vercel.json` for SPA routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

Deploy this as a separate Vercel project from the customer site
(different subdomain, e.g. `admin.yourstore.com`), since it has its own
login and shouldn't be linked from the public storefront.

## Design decisions

- Dark sidebar plus a warm off-white content area, same rose/gold accent
  as the customer site for brand consistency, but utilitarian density
  (tables, compact stat cards) instead of the storefront's editorial
  feel, since admins need to scan data fast
- Inline stock editing in the Inventory table (click the number, type,
  save) rather than a separate modal, since this is the page admins use
  most during a busy sale
- Product duplicate starts disabled with zeroed stock (enforced by the
  backend), so the UI just reflects that state rather than re-validating it

## What's left (per the original spec, future phases)

- Coupons UI (backend model exists, no endpoints/UI yet)
- Reviews moderation UI
- Refunds workflow
- GST on invoices
- Staff role-specific dashboard views — the backend's AdminRole enum
  already supports order manager / packing / delivery / support roles;
  the UI currently shows the same dashboard to every role
