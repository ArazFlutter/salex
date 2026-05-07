# Architecture — SALex

Tags: **✅ VERIFIED** (from code), **🧠 ASSUMPTION** where noted.

---

## 1. Diagram (logical) — ✅ VERIFIED

```text
┌─────────────────┐     rewrites /api, /uploads      ┌──────────────────┐
│  Next.js :3000  │ ─────────────────────────────────►│ Express :4000    │
│  (browser)      │                                   │  src/app.ts      │
└─────────────────┘                                   │  /api/* router   │
                                                      └────────┬─────────┘
                                                               │
                      ┌────────────────────────────────────────┼────────────────────┐
                      │                                        ▼                    │
                      │                                 PostgreSQL                    │
                      │                              (app tables +                  │
                      │                               pgboss schema)                │
                      │                                        ▲                    │
                      │                                        │                    │
               ┌──────┴───────┐                       ┌────────┴────────┐          │
               │  pg-boss     │◄── same DATABASE_URL ──│ server.ts       │          │
               │  queues      │    startBoss()         │ worker.ts       │          │
               └──────┬───────┘                       └────────┬────────┘          │
                      │                                        │                    │
                      │  publish / recover jobs                  │                    │
                      ▼                                        │                    │
               ┌──────────────┐                                │                    │
               │  Handlers    │──► getConnector() ──► Selenium + Chrome             │
               │  publishPlatform                                 │                    │
               └──────────────┘                                uploads/ dir            │
```

---

## 2. Frontend (Next.js) — ✅ VERIFIED

- **Config:** `next.config.ts`
- **Proxy:** `beforeFiles` rewrites:
  - `/api/:path*` → `${NEXT_PUBLIC_BACKEND_URL}/api/:path*` (default backend `http://localhost:4000`)
  - `/uploads/:path*` → backend static uploads
- **Dist:** `.next-dev` in development, `.next` otherwise (`distDir`).

---

## 3. Backend (Express) — ✅ VERIFIED

- **App:** `src/app.ts` — `express.json()`, static `uploads/`, `app.use('/api', apiRouter)`, centralized `AppError` handler.
- **Entry:** `src/server.ts` — `verifyDatabaseConnection`, **`startBoss()`**, **`registerHandlers(boss)`**, `app.listen(PORT)`.
- **Routes:** `src/routes/index.ts` aggregates routers.

---

## 4. Database (PostgreSQL) — ✅ VERIFIED

- **Connection:** `src/db/pool.ts` + `DATABASE_URL` from `src/db/env.ts`.
- **Schema:** `src/db/schema.sql` (applied by `npm run db:bootstrap`).
- **Migrations:** **🧠 ASSUMPTION:** no separate migration runner beyond bootstrap SQL; idempotent `CREATE TABLE IF NOT EXISTS` / `ALTER ... IF NOT EXISTS` style.

---

## 5. Worker / queue — ✅ VERIFIED

- **Library:** pg-boss (`src/queue/boss.ts`) — `schema: 'pgboss'`.
- **Queues:** `QUEUE_PUBLISH_PLATFORM`, `QUEUE_RECOVER_PENDING_LINKS` (`src/queue/queues.ts`).
- **Handlers:** `registerHandlers.ts` — work + scheduled recovery cron (`RECOVERY_SCHEDULE_CRON`).
- **Standalone worker:** `src/queue/worker.ts` — starts boss + same `registerHandlers` (no HTTP).

---

## 6. Selenium connectors — ✅ VERIFIED

- **Registry:** `src/connectors/index.ts` → `Map<PlatformId, PlatformConnector>`.
- **Shared:** `src/connectors/seleniumSession.ts` (`buildChromeDriver`, cookies, timeouts per `ENV_PREFIX`).
- **Contract:** `PlatformConnector` in `baseConnector.ts` — `publishListing`, `getListingUrl`, `normalizeError`, `fetchListingUrl`.

---

## 7. Data flow: publish — ✅ VERIFIED

1. HTTP `POST /api/publish/:listingId` → `publishService.createPublishJob`.
2. DB rows + `boss.send(QUEUE_PUBLISH_PLATFORM, payload)`.
3. `handlePublishPlatform` loads listing → `normalizeListing` → `validateListingMappingForPublish` → `mapToPlatformPayload` → `connector.publishListing`.
4. `resolvePublishResult` + SQL updates to `publish_job_platforms`; `maybeFinishJob` coordinates job-level status.

---

## 8. Data flow: images — ✅ VERIFIED

1. Browser uploads to `/api/listings/upload-image` (rewritten to Express).
2. Multer writes under `uploads/`; API returns `/uploads/<filename>`.
3. Listing stores JSON array of URL strings.
4. Worker `downloadImages` may resolve relative URLs using API origin env vars.

---

## 9. Active hosts — ✅ VERIFIED

| Component | Default / source |
|-----------|------------------|
| Frontend | Port **3000** (Next default) |
| Backend | **`PORT`** or **4000** |
| PostgreSQL | **`DATABASE_URL`** |
| External sites | Connector-specific URLs |
