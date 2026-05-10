# System Architecture — SALex

Comprehensive guide to SALex's system design, data flows, and component interactions.

---

## 1. Logical Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         TELEGRAM                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Telegram Mini App (Next.js Frontend)                        │   │
│  │  Browser: http://localhost:3000                             │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │  • Login screen (OTP verification)                     │ │   │
│  │  │  • Create listing (form, image upload)                │ │   │
│  │  │  • Connect platforms (Selenium popup)                 │ │   │
│  │  │  • Publish & track status (polling)                   │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────────┘   │
│         │                                                                │
└─────────┼────────────────────────────────────────────────────────────┘
          │ HTTP requests
          │ (via Next.js rewrite proxy)
          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (Node.js)                        │
│  Port: 4000 (configurable)                                           │
│  Entry: src/server.ts                                                │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  API Routes (src/routes/*.ts)                                │ │
│  │  • POST /api/auth/send-otp, /verify-otp                      │ │
│  │  • GET /api/me (current user)                                │ │
│  │  • POST /api/listings, GET /api/listings/:id                 │ │
│  │  • POST /api/listings/upload-image                           │ │
│  │  • POST /api/platforms/connect                               │ │
│  │  • POST /api/publish/:listingId (creates jobs)               │ │
│  │  • GET /api/publish/:id/status (job status)                  │ │
│  └────────────────────────────────────────────────────────────────┘ │
│         │                                                              │
│  ┌──────┴─────────────────────────────────────────────────────────┐ │
│  │  pg-boss Job Queue (PostgreSQL-backed)                       │ │
│  │  • QUEUE_PUBLISH_PLATFORM                                    │ │
│  │  • QUEUE_RECOVER_PENDING_LINKS                               │ │
│  │  • Scheduled recovery cron job                               │ │
│  └──────┬─────────────────────────────────────────────────────────┘ │
│         │                                                              │
│  ┌──────▼─────────────────────────────────────────────────────────┐ │
│  │  Job Handlers (src/queue/handlers/)                          │ │
│  │  • handlePublishPlatform: Publishes to one marketplace       │ │
│  │  • handleRecoverPendingLinks: Retries failed publishes       │ │
│  └──────┬─────────────────────────────────────────────────────────┘ │
│         │                                                              │
│  ┌──────▼─────────────────────────────────────────────────────────┐ │
│  │  Platform Connectors (src/connectors/)                       │ │
│  │  • TapazConnector (Chrome + Selenium)                        │ │
│  │  • LalafoConnector                                           │ │
│  │  • AlanazConnector                                           │ │
│  │  • LayloConnector                                            │ │
│  │  • BirjacomConnector                                         │ │
│  │                                                               │ │
│  │  Each: login() → fillForm() → submit() → getUrl()            │ │
│  └──────┬─────────────────────────────────────────────────────────┘ │
└─────────┼────────────────────────────────────────────────────────────┘
          │ Selenium automation
          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     MARKETPLACE PLATFORMS                            │
│  • Tap.az     (Chrome + Selenium headless)                           │
│  • Lalafo     (Chrome + Selenium headless)                           │
│  • Alan.az    (Chrome + Selenium headless) [Not yet implemented]    │
│  • Laylo.az   (Chrome + Selenium headless)                           │
│  • Birja.com  (Chrome + Selenium headless) [Not yet implemented]    │
└──────────────────────────────────────────────────────────────────────┘

          │ Database reads/writes
          │ (same DATABASE_URL)
          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL                                    │
│  Tables:                                                             │
│  • users: id, phone, full_name, account_type, active_plan          │
│  • listings: id, user_id, title, price, city, category, images    │
│  • otp_sessions: phone, code, is_current, verified_at              │
│  • platform_connections: user_id, platform, access_token, etc.    │
│  • publish_jobs: id, user_id, listing_id, status, created_at      │
│  • publish_job_platforms: job_id, platform, status, url           │
│  • pgboss.*: Internal pg-boss queue schema                         │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Breakdown

### 2.1 Frontend (Next.js)

**File:** `app/page.tsx` (main Telegram Mini App)

**Screens:**
- `StartScreen`: Welcome, "Create account" button
- `LanguageScreen`: Choose language (Azerbaijani, Russian, English)
- `RegistrationScreen`: Phone number input, OTP code verification
- `RegistrationSuccessScreen`: "Start creating" button
- `DashboardScreen`: View listings, create new, manage account
- `CreateListingScreen`: Form for title, price, images, category, city, description
- `ImageUploadScreen`: Upload & reorder images
- `PlatformActivationScreen`: Choose which platforms to use
- `PlatformConnectionScreen`: Connect marketplace accounts (Selenium popup)
- `SharePlanScreen`: Select platforms for this listing
- `ShareProgressScreen`: Shows publishing progress to each marketplace
- `ListingSuccessScreen`: Confirmation screen
- `MyListingsScreen`: List user's published listings
- `StatisticsScreen`: View/edit analytics
- `PackagesScreen`: Choose pricing plan (basic/premium/premiumPlus)
- `ProfileScreen`: View profile, connected platforms, logout

**Key Contexts:**
- `LanguageContext`: Manages language selection, provides translation function
- `TelegramMiniAppProvider`: Initializes Telegram Web App SDK; handles app lifecycle

**State Management:**
- Local React state in `app/page.tsx` (screen, listings, profile, draft)
- localStorage for language preference
- `localStorage.getItem('salex_client_user_id')` to bind user to current browser tab

---

### 2.2 Backend API (Express)

**Entry:** `src/server.ts`

**Steps:**
1. Load environment variables from `.env`
2. Verify PostgreSQL connection
3. Start pg-boss (job queue)
4. Register job handlers (`registerHandlers`)
5. Mount Express app on `PORT` (default 4000)

**Routes (src/routes/):**
- `auth.ts`: OTP send/verify, logout
- `listings.ts`: CRUD operations, image upload
- `publish.ts`: Create publish jobs, get status
- `platforms.ts`: Connect marketplace accounts
- `me.ts`: Get current user profile

**Services (src/services/):**
- `otpService`: Generate, send, verify OTP codes
- `userService`: Get/create users, manage sessions
- `listingService`: Validate, create, fetch listings
- `publishService`: Create jobs, coordinate publishing
- `paymentService`: Handle premium package payments

**Middleware (src/middleware/):**
- `authenticate`: Check current user session
- `errorHandler`: Catch AppError and return JSON

**Database Access (src/db/):**
- `pool.ts`: PostgreSQL connection pool
- `schema.sql`: Table definitions
- Services query using `pool.query()` with parameterized queries

---

### 2.3 Job Queue (pg-boss)

**Library:** pg-boss runs in same PostgreSQL instance

**Queues:**
1. `QUEUE_PUBLISH_PLATFORM` — One job per platform per listing
   - Created by `POST /api/publish/:listingId`
   - Handler: `handlePublishPlatform`
   - Payload: `{ listingId, platform, userId }`

2. `QUEUE_RECOVER_PENDING_LINKS` — Recovery job
   - Runs on schedule: `RECOVERY_SCHEDULE_CRON` (e.g., `*/10 * * * *` = every 10 min)
   - Handler: `handleRecoverPendingLinks`
   - Retries failed publishes up to `MAX_RECOVERY_RETRIES`

**Handler Registration:**
- Called in `src/server.ts` (API runs handlers)
- Also called in `src/queue/worker.ts` (standalone worker process)
- **⚠️ Design note:** Avoid running both in production without intent (may double-process jobs)

---

### 2.4 Selenium Platform Connectors

**Registry:** `src/connectors/index.ts`

```typescript
const connectors: Map<PlatformId, PlatformConnector> = new Map([
  ['tapaz', new TapazConnector()],
  ['lalafo', new LalafoConnector()],
  ['alanaz', new AlanazConnector()],
  ['laylo', new LayloConnector()],
  ['birjacom', new BirjacomConnector()],
]);
```

**Interface (baseConnector.ts):**
```typescript
interface PlatformConnector {
  publishListing(listing: NormalizedListing): Promise<PublishResult>;
  getListingUrl(result: PublishResult): string;
  normalizeError(error: any): string;
}
```

**Flow (per connector):**
1. **Login:** Build Chrome options, start headless browser, fill login form, verify OTP
2. **Navigate:** Go to listing creation page
3. **Fill Form:** Map standardized listing data to platform-specific fields
4. **Submit:** Click create/publish button
5. **Get URL:** Extract listing URL from browser or API response
6. **Cleanup:** Close browser, clear cookies

**Platform-Specific Details:**
- **Tap.az:** Uses Chrome DevTools Protocol (CDP) to intercept/override network requests; OTP sent via file or console
- **Lalafo:** Similar login flow; different form structure
- **Alan.az, Laylo.az, Birja.com:** Connector skeletons exist; not fully tested

---

### 2.5 Database Schema

**Core Tables:**

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone TEXT UNIQUE,
  full_name TEXT,
  account_type TEXT, -- 'individual' or 'business'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- OTP Sessions (auth)
CREATE TABLE otp_sessions (
  id UUID PRIMARY KEY,
  phone TEXT,
  code TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  is_current BOOLEAN DEFAULT FALSE,
  attempt_count INT DEFAULT 0
);

-- Listings
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  price DECIMAL,
  city TEXT,
  category TEXT,
  description TEXT,
  images JSONB, -- Array of URLs
  status TEXT, -- 'draft', 'active', 'sold', 'archived'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Platform Connections (user's marketplace accounts)
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  platform TEXT, -- 'tapaz', 'lalafo', etc.
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Publish Jobs (tracks overall job)
CREATE TABLE publish_jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  status TEXT, -- 'processing', 'completed', 'failed'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Publish Job Platforms (per-platform result)
CREATE TABLE publish_job_platforms (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES publish_jobs(id),
  platform TEXT,
  status TEXT, -- 'pending', 'completed', 'failed'
  url TEXT, -- Published listing URL
  error TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- pgboss.* (internal queue schema, auto-created by pg-boss)
```

---

## 3. Authentication Flow

### Current: OTP + Global Session

**Request → Response:**
1. Browser: `POST /api/auth/send-otp { phone: "+994501234567" }`
   - Backend: Creates `otp_sessions` row, logs code to console
   - Response: `{ expiresAt: timestamp }`

2. Backend (server logs): Outputs code like `[17:30] OTP code: 1234`

3. Browser: `POST /api/auth/verify-otp { phone, code: "1234" }`
   - Backend: Finds latest `otp_sessions` row for phone, verifies code
   - On success: Calls `getOrCreateUser()`, sets `is_current = TRUE` on session, clears other `is_current` rows
   - Response: `{ user: { id, phone, fullName, accountType, activePlan } }`

4. Subsequent requests: Backend calls `getCurrentUser()` which:
   - Queries: `SELECT users.* FROM users JOIN otp_sessions ON is_current = TRUE WHERE verified_at IS NOT NULL LIMIT 1`
   - If found: User is authenticated
   - If not found: Return 401 Unauthorized

**Logout:**
- Browser: `POST /api/auth/logout`
- Backend: Sets `is_current = FALSE` on all `otp_sessions` rows
- Effect: `getCurrentUser()` will fail for all tabs/browsers

**Issues:**
- ❌ OTP sent via SMS (unreliable, needs integration)
- ❌ Code logged in plaintext (security risk)
- ❌ Global session (not per-device; logout affects all tabs)
- ❌ No JWT; session state only in DB

### Future: Telegram initData + JWT

**Why:** App runs inside Telegram; user is already authenticated there.

**Flow:**
1. Telegram Mini App sends `window.Telegram.WebApp.initData` (signed by Telegram)
2. Browser: `POST /api/auth/telegram { initData: "..." }`
3. Backend: Verifies signature using Telegram bot token
4. On success: Issues JWT (access + refresh tokens)
5. Subsequent requests: Include `Authorization: Bearer <JWT>`
6. Benefits: No SMS, stateless (no DB session lookup), per-device tokens

**Status:** Not yet implemented. See [KNOWN_ISSUES.md](./KNOWN_ISSUES.md).

---

## 4. Publish Flow

**User perspective:**
1. User creates listing, selects platforms, clicks "Publish"
2. Page shows "Publishing..." with platform progress bars
3. Each platform goes: Pending → Publishing → Complete/Failed
4. User sees list of marketplace URLs

**Backend flow:**

```
POST /api/publish/:listingId
  ↓
publishService.createPublishJob()
  ├─ Insert publish_jobs (status='processing')
  ├─ Insert publish_job_platforms rows (one per platform)
  └─ For each platform:
     └─ boss.send(QUEUE_PUBLISH_PLATFORM, { listingId, platform, userId })
  ↓
Response: { success, job: { id, status, platforms } }
  ↓
Frontend polls: GET /api/publish/:jobId/status
  ├─ Returns: { job, platforms: [ { name, status, url?, error? } ] }
  └─ Updates UI every 1-2 seconds

[Background] Queue handler: handlePublishPlatform
  ├─ Load listing from DB
  ├─ Validate listing data
  ├─ Map to platform-specific payload
  ├─ Start Chrome + Selenium
  ├─ connector.publishListing()
  │   └─ Login → Fill form → Submit → Get URL
  ├─ Update publish_job_platforms row (status='completed', url='...')
  └─ Call finishJob() if all platforms done
       └─ Update publish_jobs (status='completed'/'failed')

[If failure] Recovery job runs every 10 minutes
  ├─ Query failed publish_job_platforms
  ├─ Retry up to MAX_RECOVERY_RETRIES times
  └─ Re-enqueue failed jobs
```

---

## 5. Image Upload & Storage

**Flow:**

```
Frontend: POST /api/listings/upload-image (multipart form-data, field: 'image')
  ↓
Backend (Express + Multer):
  ├─ Validate file is image (MIME type)
  ├─ Limit size (8 MB)
  ├─ Write to uploads/ directory
  └─ Generate unique filename

Response: { success: true, url: "/uploads/abc123.jpg" }
  ↓
Frontend: Stores URL in listing.images array

When publishing:
  ├─ Worker loads listing with images: [ "/uploads/abc123.jpg", ... ]
  ├─ If relative URL: Resolve using PUBLIC_API_ORIGIN
  │   e.g., "http://localhost:4000/uploads/abc123.jpg"
  ├─ Download image to temp directory
  └─ Upload to platform using Selenium
```

**Storage:**
- Development: `uploads/` directory in repo (not in git)
- Production: Railway persistent volume or external storage (S3, etc.)

---

## 6. Data Flow: Marketplace Platform Connection

**User connects marketplace account (e.g., Tap.az):**

```
Frontend: Initiates Selenium popup
  POST /api/platforms/connect
  ├─ Body: { platform: 'tapaz' }
  └─ Backend: Starts Chrome, navigates to tap.az, opens DevTools
    
User (in popup): Enters phone, receives OTP, enters code
  ├─ Selenium detects login success (URL change or DOM marker)
  ├─ CDP intercepts login POST request
  └─ Extracts auth token/cookie from response

Backend stores in platform_connections:
  ├─ platform: 'tapaz'
  ├─ access_token: 'token_from_login'
  ├─ refresh_token: (if supported)
  └─ expires_at: (calculated)

Response to frontend: { success: true, platform: 'tapaz' }
  ↓
Frontend: Shows "Tap.az — Connected ✓"

Later, when publishing:
  ├─ Selenium retrieves access_token from platform_connections
  ├─ Reuses token to avoid re-login
  └─ Publishes listing faster
```

**Status:** Partially implemented. Tap.az and Lalafo have login flows. Alan.az, Laylo.az, Birja.com are stubs.

---

## 7. Deployment Architecture

### Frontend (Vercel)

```
GitHub repo → Vercel webhook
  ↓
On push to main:
  ├─ Install dependencies
  ├─ Build Next.js (next build)
  ├─ Deploy to Vercel CDN
  └─ Assign URL: https://salex-next.vercel.app

Environment variables:
  ├─ NEXT_PUBLIC_BACKEND_URL=https://salex-api.railway.app
  └─ (client-side; accessible in browser)
```

### Backend (Railway)

```
GitHub repo → Railway webhook
  ↓
On push to main (or manual deploy):
  ├─ Install dependencies (npm install)
  ├─ Build (tsc)
  ├─ Start services (npm run server:dev or npm start)
  │   ├─ Express API
  │   └─ pg-boss (embedded or via worker service)
  └─ Assign URL: https://salex-api.railway.app

Environment variables:
  ├─ DATABASE_URL=postgres://...@railway.db....:5432/salex
  ├─ PORT=8080 (Railway assigns)
  ├─ NODE_ENV=production
  ├─ All platform connector env vars (LOGIN_PHONE, OTP_FILE, etc.)
  └─ (private; not accessible from browser)

Worker Service (separate Railway service):
  ├─ Same repo, same env variables
  ├─ Command: ENABLE_WORKER_IN_SERVER=false npm run worker:dev
  └─ Processes publish jobs async
```

### Database (Railway PostgreSQL)

```
Railway PostgreSQL managed service
  ├─ Automatic backups
  ├─ Connection pooling via PgBouncer (optional)
  └─ DATABASE_URL shared between API and worker services
```

---

## 8. Key Files & Responsibilities

| File / Directory | Purpose |
|------------------|---------|
| `app/page.tsx` | Main Telegram Mini App; screen state, navigation, UI logic |
| `src/server.ts` | Backend entry point; starts Express, pg-boss, handlers |
| `src/app.ts` | Express app setup; routes, middleware, error handler |
| `src/routes/*.ts` | API endpoint handlers (auth, listings, publish, etc.) |
| `src/services/*.ts` | Business logic (OTP, user, listing, publish, payment) |
| `src/connectors/*.ts` | Selenium automation for each marketplace |
| `src/queue/handlers/*.ts` | Job handlers (publish, recover) |
| `src/db/schema.sql` | Database table definitions |
| `src/db/pool.ts` | PostgreSQL connection pool |
| `next.config.ts` | Next.js config; rewrite `/api/*` to backend |
| `.env.example` | Template for environment variables |
| `docs/ARCHITECTURE.md` | This file |
| `docs/KNOWN_ISSUES.md` | Bugs and TODOs |
| `docs/BACKEND_DEVELOPER_GUIDE.md` | Onboarding for backend devs |

---

## 9. Deployment Checklist

- [ ] Environment variables set on Vercel (frontend) and Railway (backend)
- [ ] Database migrations applied (`npm run db:bootstrap`)
- [ ] Telegram bot created; bot token stored in Railway env
- [ ] Chrome/Chromium installed on Railway (or use headless option)
- [ ] SSL certificates (auto-provisioned by Vercel & Railway)
- [ ] Webhook configured for auto-deploy on git push
- [ ] Error logging set up (Sentry, LogRocket, etc.)
- [ ] Monitoring/alerting configured (uptime, job failures, etc.)
- [ ] Backup strategy for PostgreSQL (Railway handles, verify)

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **Mini App** | Telegram application that runs inside Telegram; loads web interface from URL |
| **OTP** | One-Time Password (e.g., 4-digit SMS code) |
| **Selenium** | WebDriver automation library; controls headless Chrome |
| **Connector** | Selenium script that automates a marketplace (e.g., Tap.az) |
| **pg-boss** | PostgreSQL-backed job queue; works without Redis |
| **Queue** | FIFO job list; handlers consume jobs asynchronously |
| **Publish Job** | Task to post a listing to all connected platforms |
| **Platform Connection** | Stored marketplace auth (token, cookie, etc.) for a user |
| **DevTools Protocol (CDP)** | Chrome remote debugging API; intercepts network, modifies requests |

---

**Last updated:** May 2026
