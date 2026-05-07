# Developer Handoff — SALex

Tags: **✅ VERIFIED** (from code), **⚠️ PARTIAL**, **❗ ISSUE**, **🧠 ASSUMPTION**

---

## 1. What this system is — ✅ VERIFIED

- **Frontend:** Next.js app; browser calls **`/api/*`** on the same origin; Next **rewrites** those to the Express backend (`next.config.ts`).
- **Backend:** Express app mounted at **`/api`** (`src/app.ts`), entry **`src/server.ts`**.
- **Auth:** **Not JWT.** “Current user” = row in **`otp_sessions`** with **`is_current = TRUE`** and **`verified_at IS NOT NULL`**, joined to **`users`** (`src/services/userService.ts` → `getCurrentUser`).
- **Publish:** Creates **`publish_jobs`** + **`publish_job_platforms`**, enqueues **pg-boss** jobs; **worker** (`src/queue/worker.ts`) runs **`handlePublishPlatform`** which drives **Selenium connectors**.

---

## 2. Current system status

| Area | Status | Notes |
|------|--------|--------|
| API routes | ✅ VERIFIED | Under `src/routes/*.ts`, mounted in `src/routes/index.ts` |
| OTP send/verify | ✅ VERIFIED | `otpService.ts`; code **logged server-side** on send (`log.info` includes code) — see KNOWN_ISSUES |
| Listings CRUD (user-scoped) | ✅ VERIFIED | `listingService.ts` + `getCurrentUser()` |
| Image upload | ✅ VERIFIED | Multer → `uploads/`; URL `/uploads/...` |
| Publish queue | ✅ VERIFIED | `publishService.ts` + `queue/handlers/publishPlatform.ts` |
| Platform connectors | ✅ VERIFIED | Five: tapaz, lalafo, alanaz, laylo, birjacom (`src/connectors/index.ts`) |
| Selenium reliability | ⚠️ PARTIAL / ❗ ISSUE | Depends on site DOM, headless, credentials; Tap.az has extra CDP/OTP complexity — see PLATFORM_CONNECTORS + KNOWN_ISSUES |
| Worker vs server | ✅ VERIFIED | **Server** starts pg-boss + registers workers (`src/server.ts`). **Standalone worker** also starts boss + handlers — **🧠 ASSUMPTION:** avoid running two workers against same queues in prod without design intent (duplicate job processing risk). |
| GEMINI_API_KEY in `.env.example` | ⚠️ PARTIAL | **✅ VERIFIED** not referenced in `src/` grep; likely optional / future / another package path |

---

## 3. High-level flows

### 3.1 Auth (OTP) — ✅ VERIFIED

1. Client `POST /api/auth/send-otp` with `{ phone }`.
2. Server inserts **`otp_sessions`** (new code, expiry), returns success + `expiresAt`. **OTP plaintext logged** (`auth.otp.sent`).
3. Client `POST /api/auth/verify-otp` with `{ phone, code }`.
4. Server loads **latest** row for phone; checks expiry, attempts, code match; on success **`getOrCreateUser`**, sets **`is_current`** on that session, clears other **`is_current`** flags.
5. Subsequent authenticated calls use **`getCurrentUser()`** (no API key in code — session is global per DB flag).

### 3.2 Listing flow — ✅ VERIFIED

1. Authenticated user `POST /api/listings` with listing payload (validated in `listingService`).
2. Optional `POST /api/listings/upload-image` (multipart `image`) → returns `{ url: "/uploads/..." }`.
3. `GET /api/listings`, `GET /api/listings/:id` scoped to current user.

### 3.3 Publish flow — ✅ VERIFIED

1. User connects platforms via `POST /api/platforms/connect` (stores **`platform_connections`**).
2. `POST /api/publish/:listingId` creates **`publish_jobs`** (status `processing`), rows in **`publish_job_platforms`**, sends one **pg-boss** job per allowed platform (`QUEUE_PUBLISH_PLATFORM`).
3. Handler loads listing, normalizes + maps payload, calls **`connector.publishListing`**.
4. Results persisted to **`publish_job_platforms`**; **`finishJob`** logic updates overall job status (see `queue/handlers/finishJob.ts` — not fully expanded in handoff; **⚠️ PARTIAL** detail).
5. Client polls `GET /api/publish/:id/status`.

---

## 4. External dependencies — ✅ VERIFIED

| Dependency | Use |
|------------|-----|
| PostgreSQL | App data + pg-boss schema `pgboss` |
| Chrome / chromedriver | Selenium connectors |
| Target marketplaces | Remote sites (Tap.az, etc.) |

---

## 5. Critical notes for new developers

1. **`.env` location:** Loaded from **project root** via `src/db/env.ts` (`DATABASE_URL` **required**).
2. **Three processes for full stack:** `server:dev`, `worker:dev`, `dev` — **✅ VERIFIED** scripts exist; whether you need **both** server and worker depends on whether handlers only run on server (**✅ VERIFIED** server registers handlers) — running **worker alone** without API is possible for job-only testing.
3. **Auth model:** Single global “current” OTP session row — not multi-user isolated sessions in the sense of separate tokens per browser tab.
4. **Publish images:** Worker may fetch image URLs; **`PUBLIC_API_ORIGIN`** / **`API_PUBLIC_ORIGIN`** used when resolving relative `/uploads/...` URLs (`src/utils/downloadImages.ts`).

---

## 6. Active hosts — ✅ VERIFIED

| Role | Value |
|------|--------|
| Frontend | `http://localhost:3000` (default Next dev) |
| Backend | `http://localhost:4000` unless `PORT` set |
| DB | From `DATABASE_URL` |
| External | Marketplace origins per connector |

---

## 7. Where to read next

- [RUNBOOK.md](./RUNBOOK.md) — exact commands  
- [API_HANDOFF.md](./API_HANDOFF.md) — routes  
- [PLATFORM_CONNECTORS.md](./PLATFORM_CONNECTORS.md) — Selenium  
