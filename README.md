# BoutiqueHub: Multi-Tenant Boutique E-Commerce Monorepo

BoutiqueHub is a production-grade, highly optimized e-commerce platform explicitly engineered for boutique retail. The project is structured as a unified monorepo featuring an automated **FastAPI** backend engine, a mobile-first **React Customer Web Storefront**, and a high-density **React Admin Operations Dashboard**.

---

## ??? Core Architecture & Tech Stack

### Backend Ecosystem
* **Framework:** FastAPI (Python 3.10+) with Uvicorn ASGI production server execution.
* **ORM & Database:** SQLAlchemy Core + Expression Language, PostgreSQL (Deployed via Supabase), explicit schema migration history managed via Alembic.
* **Document Engine:** ReportLab for automated, dynamic PDF Invoice compiling.
* **Media Cloud CDN:** Cloudinary integrations for binary stream image and video content management.

### Frontend Ecosystem
* **Core Framework:** React 18 initialized via Vite bundler.
* **State & Query Architecture:** TanStack Query (React Query v4/v5) caching mechanics, standard client-side state hooks.
* **Form Automation:** React Hook Form mapping directly into runtime client validation layers.
* **Styling & Motion:** Tailwind CSS engine utility injection alongside Framer Motion transition curves.

---

## ?? Project Directory Breakdown

```text
boutiquehub/
ÃÄÄ backend/                   # FastAPI Server Layer & DB Migrations
³   ÃÄÄ alembic/               # Schema state version timelines
³   ÃÄÄ app/                   # Core microservice modular directories
³   ³   ÃÄÄ auth/              # Security protocols & JWT implementations
³   ³   ÃÄÄ jobs/              # Automated tasks (Daily summary script)
³   ³   ÃÄÄ models/            # SQLAlchemy declarative database mapping
³   ³   ÃÄÄ routers/           # Dedicated route API controller paths
³   ³   ÃÄÄ schemas/           # Pydantic structural request validation
³   ³   ÀÄÄ utils/             # Helper libraries (Slugify, Cloudinary)
³   ÀÄÄ requirements.txt       # Python platform dependency requirements
ÃÄÄ frontend/
³   ÃÄÄ customer-web/          # Phase 5: Client-facing shopping storefront
³   ÀÄÄ admin-dashboard/       # Phase 6: High-density business operations console
ÀÄÄ README.md                  # Unified project orchestration documentation
```

---

## ??? Step-by-Step Environment Installation

### 1. Central Backend Configuration

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows Shell: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Open your newly generated `.env` file and provision the variables accurately:
```env
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/boutiquehub"
JWT_SECRET_KEY="YOUR_CRYPTO_SECURE_TOKEN_PHRASE"
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
CLOUDINARY_CLOUD_NAME="your_cloud_id"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret_key"
SELLER_WHATSAPP_NUMBER="919876543210"
TELEGRAM_BOT_TOKEN="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
TELEGRAM_CHAT_ID="987654321"
LOW_STOCK_THRESHOLD=5
```

Execute your structural database migrations and seed default records:
```bash
alembic upgrade head
python -m app.seed
uvicorn app.main:app --reload
```
* Backend Interactive OpenAPI Swagger Specs trace cleanly at: `http://localhost:8000/docs`

---

### 2. React Customer Storefront Installation (Phase 5)

```bash
cd ../frontend/customer-web
cp .env.example .env
```

Configure `.env` to bind securely with the active backend engine:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

Execute installation routines:
```bash
npm install
npm run dev
```
* Storefront interface maps natively at: `http://localhost:5173`

---

### 3. React Admin Operational Dashboard Setup (Phase 6)

```bash
cd ../admin-dashboard
cp .env.example .env
```

Configure `.env` coordinates:
```env
VITE_API_BASE_URL=http://localhost:8000
```

Bootstrap dashboard interface execution parameters:
```bash
npm install
npm run dev
```
* Operations dashboard maps natively at: `http://localhost:5174`
* **Default Seeding Credentials:** Login with `admin@boutiquehub.com` / Password: `changeme123`.

---

## ?? Automated Notification Flows & Operational Crons

### Telegram Bot Wiring Protocol
1. Query `@BotFather` on Telegram, initialize `/newbot`, and extract your generated `TELEGRAM_BOT_TOKEN`.
2. Direct message your bot interface, then issue a call query structure to: `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` to grab your target profile `id` for `TELEGRAM_CHAT_ID`.
3. Test processing loops immediately by issuing an endpoint trigger request: `POST /api/admin/notifications/test`.

### Activating the Daily Sales Summary Scheduler
The daily metrics compiler runs decoupled out of `backend/app/jobs/daily_summary.py`. Coordinate its execution loop based on your host structure:

* **Cloud VM/Linux Workspace Crontab entry (Runs at 21:00 Daily):**
  ```bash
  0 21 * * * cd /path/to/boutiquehub/backend && venv/bin/python -m app.jobs.daily_summary
  ```
* **Railway Cloud Environment Execution:** Bind an explicit Cron Job infrastructure service triggering the entry instruction: `python -m app.jobs.daily_summary`.
* **Alternative External API Triggers:** If computing tasks are restricted by your provider, schedule an external task request runner (e.g., cron-job.org) targeting your secure endpoint: `POST /api/admin/notifications/daily-summary`.

---

## ?? System Design & Interface Paradigm Rules

### Brand Interface Architecture (Customer-Facing)
* **Visual Palette Execution:** Core background runs soft Ivory (`#FBF7F2`), textual weights display Espresso charcoal (`#2B2420`), focus actions flag brand Rose accent (`#9B2242`), with structural stitching points highlighted in Gold line finish (`#C99B5B`).
* **The `.stitch-divider` Utility Rule:** Never use traditional `<hr>` dividers. Inject structural layout splits with the signature sewing utility module to match high-end tailored presentation lines.
* **Typography:** Core Title blocks apply `Fraunces` display tracking. Interface text and interactive options read via clean `Inter` sans-serif parameters.

### High-Density Utility Focus (Admin Operations Console)
* Contrast sidebar coupled with an open white core content grid.
* Prioritizes extreme data compilation utility; inline interactive spreadsheet configurations let admins edit inventory row limits instantly without triggering multi-step modal dialog structures.

---

## ?? Deployment Standards

### Production Compilation Configuration
```bash
cd frontend/customer-web && npm run build
cd ../admin-dashboard && npm run build
```

### Single Page Application (SPA) Vercel Path Fix (`vercel.json`)
To prevent structural path drop failures when reloading dynamic pages (`/products/:slug` or `/orders/:id`), deploy each frontend as a unique project block incorporating this direct proxy fallback wrapper:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

---

## ?? Roadmap & Unfinished Feature Scopes
* **Coupons System Integration:** Core database tables exist on the backend; needs dedicated frontend schema fields and route bindings on both dashboards.
* **Review Moderation Workspace:** Endpoints need configuration to block/approve user content streams.
* **Structured Financial Refunding workflows:** Database states require expansion to track bank payment reversals alongside WhatsApp payment screen links.
* **Invoice Component Additions:** Standardize ReportLab code arrays to inject state GST calculations seamlessly based on order location contexts.
