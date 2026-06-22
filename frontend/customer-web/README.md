# BoutiqueHub — Customer Website (Phase 5)

Mobile-first React storefront for boutique customers.

## Stack
React 18 · Vite · Tailwind CSS · TanStack Query · React Router v6 · Framer Motion · React Hook Form · Lucide Icons

## Pages

| Route | Page |
|---|---|
| `/` | Home — hero, category strip, new arrivals, flash sale, trending |
| `/search` | Search/Browse — filters (category, size, price, in-stock), sort, pagination |
| `/products/:slug` | Product Detail — gallery + zoom, color/size selector, add to cart, similar products |
| `/cart` | Cart — live server-validated quantities & prices, checkout CTA |
| `/login` | Google Sign-In |
| `/checkout` | 3-step: Address → Payment (COD / Scan & Pay with UPI QR) → Review & Place |
| `/order-confirm` | Confirmation + WhatsApp deep-link button |
| `/account` | Profile |
| `/account/orders` | Order list |
| `/account/orders/:id` | Order detail with visual status tracker + invoice download |
| `/account/wishlist` | Wishlist |
| `/account/addresses` | Saved addresses with add/edit/delete/set-default |

## Setup

```bash
cd frontend/customer-web
cp .env.example .env
# Edit .env:
#   VITE_API_BASE_URL=http://localhost:8000   (your backend URL)
#   VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

npm install
npm run dev          # starts on http://localhost:5173
npm run build        # production build → dist/
```

## Google OAuth setup

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add your frontend URL to "Authorized JavaScript origins"
   - Development: `http://localhost:5173`
   - Production: `https://your-store.vercel.app`
4. Copy the Client ID to `VITE_GOOGLE_CLIENT_ID`
5. The same Client ID must be set as `GOOGLE_CLIENT_ID` on the backend

## Deployment (Vercel)

```bash
# From frontend/customer-web/
vercel --prod
# Set env vars in Vercel dashboard: VITE_API_BASE_URL, VITE_GOOGLE_CLIENT_ID
```

Add a `vercel.json` for SPA routing:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

## Design decisions

- **Colour palette**: ivory background (`#FBF7F2`), espresso text (`#2B2420`),
  rose accent (`#9B2242`), gold stitch detail (`#C99B5B`)
- **Signature element**: gold dashed "stitch" divider — a `.stitch-divider`
  CSS utility that ties every page back to clothing/craft, used wherever
  a generic horizontal rule would sit
- **Typography**: Fraunces (display serif) for headings + Inter for body
- **Cart**: client-side only; a server preview endpoint validates prices +
  stock before every checkout so the user always sees accurate numbers

## What's next — Phase 6 (Admin Dashboard)

- React admin SPA (separate Vite project at `frontend/admin-dashboard/`)
- Dashboard with revenue/orders/customers/low-stock cards and charts
- Product management, inventory, order management, customer list,
  banner management, store settings
