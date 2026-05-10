# SALex — Multi-Marketplace Listing Automation

> **Telegram Mini App** for selling products across multiple Azerbaijani marketplaces with a single listing creation.

**SALex** (Smart Auto Listing Exchange) lets sellers create a listing once and automatically publish it to **Tap.az**, **Lalafo**, **Alan.az**, **Laylo.az**, and **Birja.com** — all from inside Telegram.

---

## 🎯 What SALex Does

1. **Seller logs in via Telegram** → OTP verification (needs migration to Telegram `initData`)
2. **Creates a single listing** → Title, price, images, description, category
3. **Connects marketplace accounts** → Selenium automation logs into each platform
4. **Publishes with one click** → Backend creates jobs; worker publishes to all platforms in parallel
5. **Tracks status** → Real-time status updates; recovers failed publishes automatically

---

## 🛠 Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS | Telegram Mini App wrapper; runs at `localhost:3000` |
| **Backend** | Express 5 (Node.js) | REST API at `localhost:4000`; handles auth, listings, jobs |
| **Database** | PostgreSQL | Stores users, listings, marketplace connections, publish jobs |
| **Job Queue** | pg-boss | Scales publishing across worker processes; runs in same DB as app |
| **Automation** | Selenium WebDriver + Chromium | Logs into marketplaces; fills forms; submits listings |
| **Deployment** | Vercel (frontend) + Railway (backend + DB) | Frontend auto-deploys on git push; backend via Railway |

---

## 📁 Project Structure

```
salex-main/
├── app/                        # Next.js app (browser UI)
│   ├── page.tsx                # Main Telegram Mini App component
│   ├── layout.tsx              # Root layout (Telegram provider)
│   └── globals.css             # Tailwind + global styles
├── components/
│   ├── screens/                # Full-page screens (Dashboard, CreateListing, etc.)
│   ├── ui/                     # Reusable UI components (Button, Input, etc.)
│   └── providers/              # Context providers (TelegramMiniAppProvider)
├── contexts/                   # React contexts (LanguageContext, etc.)
├── hooks/                      # Custom React hooks
├── lib/
│   ├── api.ts                  # API client (fetch wrapper)
│   ├── app-state.ts            # Types & constants (UserProfile, Listing, etc.)
│   ├── clientSession.ts        # localStorage management (APP_VERSION, user ID binding)
│   └── listingLocalization.ts  # Category/city translations
├── src/                        # Express backend (TypeScript)
│   ├── app.ts                  # Express app setup (middleware, routes)
│   ├── server.ts               # Entry point (starts server + pg-boss)
│   ├── middleware/             # Auth, error handling
│   ├── routes/                 # API routes (/api/auth, /api/listings, /api/publish, etc.)
│   ├── services/               # Business logic (OTP, listings, publish, payment)
│   ├── connectors/             # Selenium platform connectors (TapazConnector, LalafoConnector, etc.)
│   ├── queue/                  # pg-boss setup + job handlers (publish, recover)
│   ├── db/                     # Database config, connection pool, schema
│   └── utils/                  # Helpers (downloadImages, logging, etc.)
├── docs/                       # Developer documentation
│   ├── ARCHITECTURE.md         # System design & data flows
│   ├── KNOWN_ISSUES.md         # Bugs, risks, and TODOs
│   ├── BACKEND_DEVELOPER_GUIDE.md  # Setup & what to work on
│   ├── ENVIRONMENT.md          # Environment variables
│   ├── API_HANDOFF.md          # HTTP API spec
│   ├── DB_HANDOFF.md           # Database schema
│   ├── PLATFORM_CONNECTORS.md  # Selenium automation details
│   ├── DEPLOYMENT.md           # Production setup
│   └── RUNBOOK.md              # Commands & operations
├── .env.example                # Template for local .env
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript config
└── next.config.ts              # Next.js config (API rewrite proxy)
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 12+ (local or remote)
- **Google Chrome / Chromium** (for Selenium connectors; path via `CHROME_BIN` optional)
- **Git** (for version control)

### Local Setup (5 minutes)

**1. Clone and install:**
```bash
git clone https://github.com/ArazFlutter/salex.git
cd salex
npm install
```

**2. Configure environment:**
```bash
cp .env.example .env
```

Then edit `.env`:
```bash
# Required
DATABASE_URL=postgres://postgres:password@localhost:5432/salex

# Optional (defaults shown)
PORT=4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
APP_URL=http://localhost:3000
```

**3. Initialize database:**
```bash
npm run db:bootstrap
```

This creates all tables, indices, and pg-boss schema.

**4. Start services (three terminals):**

**Terminal 1 — Backend API + embedded pg-boss:**
```bash
npm run server:dev
```
Watches `src/` for changes. Runs on `http://localhost:4000`.

**Terminal 2 — Job worker (publish listings):**
```bash
ENABLE_WORKER_IN_SERVER=false npm run worker:dev
```
Optional if you're not testing job publishing. Processes publish jobs from queue.

**Terminal 3 — Frontend:**
```bash
npm run dev
```
Runs on `http://localhost:3000`. Open in browser or Telegram Mini App preview.

---

## 🔗 Local Hosts

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `http://localhost:3000` | Next.js app; Telegram Mini App runs here |
| **Backend API** | `http://localhost:4000` | Express REST API; handles auth, listings, jobs |
| **PostgreSQL** | From `DATABASE_URL` | App data + pg-boss job queues |
| **Admin panel** | `http://localhost:4000/admin` | (if implemented) Job monitoring |

**Note:** Next.js automatically **rewrites** `/api/*` and `/uploads/*` from port 3000 to 4000. You can hit the API directly at `:4000` or through the Next.js proxy.

---

## 📋 Quick Commands

```bash
npm run dev                    # Start all three services (server + worker + next)
npm run server:dev             # API + embedded jobs
npm run worker:dev             # Standalone worker
npm run db:bootstrap           # Create tables
npm run db:seed                # Insert test data
npm run lint                   # Run ESLint
npm run build                  # Build for production
npm run start                  # Run production build
npm run smoke:backend          # Test API endpoints
npm run smoke:publish-connectors  # Test Selenium connectors
```

---

## 🌐 Deployment

### Frontend (Vercel)
- Auto-deploys on push to `main` branch
- **Live URL:** `https://salex-next.vercel.app` (or your Vercel project)
- Environment: `NEXT_PUBLIC_BACKEND_URL` points to Railway backend

### Backend (Railway)
- Deploy via `git push` or Railway CLI
- **Live URL:** `https://salex-api.railway.app` (or Railway project domain)
- Environment: `DATABASE_URL` points to Railway PostgreSQL
- Worker runs as separate dyno/service

### Telegram Bot
- **Bot Username:** `@YourSALexBot` (configure in `.env` → `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`)
- Users interact via `/start` command in Telegram
- Mini App loads from Vercel frontend

---

## 📚 Documentation

| Document | Purpose | Audience |
|----------|---------|----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, data flows, component interactions | All developers |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | Critical bugs, risks, TODOs | All developers |
| [docs/BACKEND_DEVELOPER_GUIDE.md](docs/BACKEND_DEVELOPER_GUIDE.md) | Onboarding for backend devs; what to build | Backend engineers |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | All env variables explained | DevOps, all developers |
| [docs/API_HANDOFF.md](docs/API_HANDOFF.md) | HTTP API routes, request/response spec | Frontend & backend devs |
| [docs/DB_HANDOFF.md](docs/DB_HANDOFF.md) | Database schema, table relationships | Backend developers |
| [docs/PLATFORM_CONNECTORS.md](docs/PLATFORM_CONNECTORS.md) | How Selenium automation works; per-platform quirks | Backend developers |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production checklist, Railway setup, SSL certs | DevOps engineers |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Common operations (restart, logs, database migrations) | DevOps & on-call |

---

## 🔐 Authentication (Current & Future)

### Current: OTP + Global Session
- User enters phone → receives SMS with 4-digit code
- Backend stores code in `otp_sessions` table; sets `is_current = TRUE` on verify
- **⚠️ Issues:** Unreliable SMS, plaintext code in logs, global session (not per-tab)

### Future: Telegram `initData` + JWT
- App runs inside Telegram → user already authenticated
- Request includes `initData` signed by Telegram
- Backend verifies signature → issues JWT token
- **Benefits:** Reliable (no SMS), more secure, per-device sessions, better UX

See [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) for details.

---

## 🛟 Troubleshooting

### "Cannot connect to PostgreSQL"
```bash
# Check DATABASE_URL in .env
# Verify PostgreSQL is running
psql $DATABASE_URL -c "SELECT version();"
```

### "Port 4000 already in use"
```bash
# Change PORT in .env or kill existing process
lsof -i :4000  # Find process
kill -9 <PID>  # Kill it
```

### "Chrome not found" (Selenium error)
```bash
# Install Chrome or set path
export CHROME_BIN=/usr/bin/google-chrome
npm run worker:dev
```

### "Telegram Mini App won't load"
- Check `NEXT_PUBLIC_BACKEND_URL` matches actual backend
- Browser console (F12) should show no 401 errors on `/api/me`
- Clear Telegram app cache and reload

---

## 📞 Support

- **Issues:** GitHub Issues in this repo
- **Questions:** See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for technical overview
- **Getting started:** See [docs/BACKEND_DEVELOPER_GUIDE.md](docs/BACKEND_DEVELOPER_GUIDE.md)

---

## 📄 License

(Add your license here)

---

**Last updated:** May 2026  
**Maintainers:** SALex team
