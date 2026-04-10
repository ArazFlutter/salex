# SALex — Deployment & Production Guide

## System Overview

SALex consists of four runtime components:

```
┌─────────────┐    /api/*     ┌──────────────────┐     ┌──────────┐
│  Next.js     │ ──────────── │  Express backend  │ ──  │ Postgres │
│  frontend    │   (rewrite)  │  + pg-boss worker │     │  (16+)   │
└─────────────┘               └──────────────────┘     └──────────┘
                                       │
                              ┌────────┴────────┐
                              │  Selenium/Chrome │
                              │  (per connector) │
                              └─────────────────┘
```

| Component | Role | Port (default) |
|-----------|------|----------------|
| **Next.js app** | Frontend SPA + API proxy | 3000 |
| **Express backend** | REST API + pg-boss worker (in-process) | 4000 |
| **PostgreSQL** | Data store + pg-boss job queue | 5432 |
| **Chrome/ChromeDriver** | Selenium automation for platform connectors | N/A |

---

## Environment Variables

### Required

| Variable | Example | Used By | Description |
|----------|---------|---------|-------------|
| `DATABASE_URL` | `postgres://user:pass@host:5432/salex` | Backend | PostgreSQL connection string |
| `PORT` | `4000` | Backend | Express server listen port |

### Frontend

| Variable | Example | Used By | Description |
|----------|---------|---------|-------------|
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | Next.js | Backend URL for API proxy rewrites. In production, set to the internal backend address. |

### Platform Connectors (per platform)

Each of the 5 platforms (Tap.az, Lalafo, Alan.az, Laylo.az, Birja.com) has:

| Variable Pattern | Example | Description |
|------------------|---------|-------------|
| `{PLATFORM}_SELENIUM_HEADLESS` | `true` | Run Chrome headless (recommended for production) |
| `{PLATFORM}_SELENIUM_TIMEOUT_MS` | `15000` | Selenium operation timeout |
| `{PLATFORM}_LOGIN_PHONE` | `+994501234567` | Phone number for platform login |
| `{PLATFORM}_OTP_CODE` | `1234` | Static OTP for dev/testing (skip file-based OTP) |
| `{PLATFORM}_OTP_FILE` | `.tapaz-otp` | File path for manual OTP exchange |
| `{PLATFORM}_OTP_TIMEOUT_MS` | `120000` | How long to wait for OTP in file |

Platform prefixes: `TAPAZ_`, `LALAFO_`, `ALANAZ_`, `LAYLO_`, `BIRJACOM_`.

### Shared / Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `CHROME_BIN` | System Chrome | Path to Chrome/Chromium binary |
| `RECOVERY_SCHEDULE_CRON` | `*/10 * * * *` | How often pending-link recovery runs |
| `MAX_RECOVERY_RETRIES` | `5` | Max recovery attempts per platform result |
| `GEMINI_API_KEY` | — | Google Gemini API key (if AI features are used) |
| `APP_URL` | `http://localhost:3000` | Public frontend URL |

---

## Local Development Setup

### Prerequisites

- Node.js 20+
- PostgreSQL 16+ (local or Docker)
- Chrome/Chromium (for Selenium connectors)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Create env file
cp .env.example .env
# Edit .env with your DATABASE_URL

# 3. Start PostgreSQL (Docker option)
docker run --name salex-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=salex \
  -p 5432:5432 -d postgres:16

# 4. Bootstrap database schema
npm run db:bootstrap

# 5. Start backend (Express + pg-boss in-process)
npm run server:dev
# → Listening on http://localhost:4000

# 6. Start frontend (Next.js dev server)
npm run dev
# → Listening on http://localhost:3000

# 7. Verify
# Browser: http://localhost:3000
# Health:  http://localhost:3000/api/health → { "status": "ok" }
```

### Alternative: Standalone Worker

For debugging worker issues separately from the API server:

```bash
# Terminal 1: API server only (still starts pg-boss in-process)
npm run server:dev

# Terminal 2: Standalone worker
npm run worker:dev
```

Both modes register the same handlers. The standalone worker is useful for isolating publish/recovery behavior.

---

## Staging Setup

### Database

Use a managed PostgreSQL instance (AWS RDS, GCP Cloud SQL, Neon, Supabase, etc.).

```
DATABASE_URL=postgres://salex_user:secret@staging-db.example.com:5432/salex_staging
```

Run schema bootstrap once:

```bash
DATABASE_URL="..." npm run db:bootstrap
```

### Backend

```bash
# Build backend to CommonJS
npm run server:build
# Output: dist-server/

# Start in production mode
NODE_ENV=production \
DATABASE_URL="postgres://..." \
PORT=4000 \
node dist-server/server.js
```

### Frontend

```bash
# Build Next.js
NEXT_PUBLIC_BACKEND_URL=http://backend-internal:4000 \
npm run build

# Start Next.js production server
npm run start
# → Listening on http://localhost:3000
```

### Process Management

Use `pm2`, `systemd`, or container orchestration:

```bash
# pm2 example
pm2 start dist-server/server.js --name salex-backend
pm2 start node_modules/.bin/next -- start --name salex-frontend
```

---

## Production Setup

### Architecture

```
Internet
   │
   ▼
┌──────────────┐
│  Reverse      │  TLS termination, static assets
│  Proxy        │  (nginx, Caddy, or cloud LB)
│  (port 443)   │
└──────┬───────┘
       │
  ┌────┴─────────────────────────────┐
  │                                  │
  ▼                                  ▼
┌──────────┐                  ┌─────────────┐
│ Next.js  │  /api/* rewrite  │  Express    │
│ :3000    │ ────────────────→│  :4000      │
└──────────┘                  │  + pg-boss  │
                              └──────┬──────┘
                                     │
                              ┌──────▼──────┐
                              │  PostgreSQL  │
                              │  :5432       │
                              └─────────────┘
```

### Startup Order

1. **PostgreSQL** — must be running and accessible
2. **Backend** (`node dist-server/server.js`) — connects to DB, starts pg-boss, registers handlers
3. **Frontend** (`next start`) — proxies `/api/*` to backend

### Production Build Commands

```bash
# Backend
npm run server:build

# Frontend
NEXT_PUBLIC_BACKEND_URL=http://backend:4000 npm run build
```

### Production Start Commands

```bash
# Backend
NODE_ENV=production \
DATABASE_URL="postgres://..." \
PORT=4000 \
node dist-server/server.js

# Frontend
NODE_ENV=production \
NEXT_PUBLIC_BACKEND_URL=http://backend:4000 \
PORT=3000 \
npx next start -p 3000
```

### Database Bootstrap (first deploy only)

```bash
DATABASE_URL="postgres://..." npx tsx src/db/bootstrap.ts
```

The schema uses `CREATE TABLE IF NOT EXISTS` and `ADD COLUMN IF NOT EXISTS`, making it safe to re-run.

### Health Check

```
GET http://backend:4000/api/health
→ { "status": "ok", "uptime": 123.4, "timestamp": "..." }
```

Use this for load balancer health probes, container readiness checks, and uptime monitoring.

### Graceful Shutdown

The backend handles `SIGTERM` and `SIGINT`:

1. Stops accepting new HTTP connections
2. Waits for pg-boss to finish active jobs (10s timeout)
3. Exits cleanly

Container orchestrators (Kubernetes, ECS) send `SIGTERM` during rolling deploys — the backend handles this correctly.

---

## Docker Deployment

### Backend Dockerfile

```dockerfile
FROM node:20-slim

# Chrome for Selenium connectors
RUN apt-get update && apt-get install -y \
    chromium \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

ENV CHROME_BIN=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY dist-server/ ./dist-server/
COPY src/db/schema.sql ./src/db/schema.sql

EXPOSE 4000
CMD ["node", "dist-server/server.js"]
```

### Frontend Dockerfile

```dockerfile
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_BACKEND_URL=http://backend:4000
RUN npm run build

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
```

### Docker Compose

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: salex
      POSTGRES_USER: salex
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DATABASE_URL: postgres://salex:${DB_PASSWORD}@postgres:5432/salex
      PORT: "4000"
      NODE_ENV: production
      TAPAZ_SELENIUM_HEADLESS: "true"
      LALAFO_SELENIUM_HEADLESS: "true"
      ALANAZ_SELENIUM_HEADLESS: "true"
      LAYLO_SELENIUM_HEADLESS: "true"
      BIRJACOM_SELENIUM_HEADLESS: "true"
    ports:
      - "4000:4000"
    depends_on:
      - postgres

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        NEXT_PUBLIC_BACKEND_URL: http://backend:4000
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## Smoke Test After Deploy

Run these checks in order after every deployment:

```bash
BASE=http://localhost:3000

# 1. Health
curl -s $BASE/api/health | jq .status
# Expected: "ok"

# 2. Send OTP
curl -s -X POST $BASE/api/auth/send-otp \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+994501234567"}' | jq .success
# Expected: true

# 3. Verify OTP (check server logs for code)
curl -s -X POST $BASE/api/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+994501234567","code":"THE_CODE"}' | jq .user.id
# Expected: "user-994501234567"

# 4. Get current user
curl -s $BASE/api/me | jq .user.phone
# Expected: "+994501234567"

# 5. Connect platform
curl -s -X POST $BASE/api/platforms/connect \
  -H 'Content-Type: application/json' \
  -d '{"platform":"tapaz"}' | jq .platform.connected
# Expected: true

# 6. Create listing
curl -s -X POST $BASE/api/listings \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test","category":"Test","price":100,"city":"Baku","description":"Smoke test","images":[],"status":"active"}' | jq .listing.id
# Expected: "listing-..."

# 7. Publish
LISTING_ID=<from step 6>
curl -s -X POST $BASE/api/publish/$LISTING_ID | jq .job.id
# Expected: "publish-job-..."

# 8. Poll status
JOB_ID=<from step 7>
curl -s $BASE/api/publish/$JOB_ID/status | jq '.status, .platforms[0].status'
# Expected: "processing" then eventually "success" or "failed"
```

---

## Production Risks & Mitigations

### 1. Selenium / Chrome Runtime

**Risk:** Connectors require a working Chrome + ChromeDriver installation. Version mismatches cause `session not created` errors.

**Mitigation:**
- Pin `chromedriver` version in `package.json` to match the deployed Chrome major version
- Use the Docker image with Chromium pre-installed (version-locked)
- Set `CHROME_BIN` explicitly in production
- All Selenium failures are caught and result in `failed` status — never crash the worker

### 2. Platform Selector Drift

**Risk:** Target platforms (Tap.az, Lalafo, etc.) may change their DOM structure, breaking Selenium selectors.

**Mitigation:**
- Each connector uses multi-selector fallback strategies
- `navigateToNewListingPage` tries multiple URL candidates + button-click fallbacks
- Success detection uses 3-phase multi-signal approach
- Failed selectors result in `published_pending_link` or `failed` — not crashes
- Monitor `publish.platform.failed` logs for selector-related errors
- Schedule periodic DOM re-calibration (manual)

### 3. OTP Handling

**Risk:** Platform login requires real OTP codes. In production, static OTP codes are not viable for real platform accounts.

**Mitigation:**
- File-based OTP exchange (`{PLATFORM}_OTP_FILE`) allows external OTP delivery
- An external service or human operator can write OTP codes to the file
- Platform sessions are persisted — successful login is reused until session expires
- Login only happens when session is invalid, minimizing OTP frequency

### 4. Retry / Recovery Exhaustion

**Risk:** `published_pending_link` results may never resolve if the platform doesn't surface the listing.

**Mitigation:**
- `MAX_RECOVERY_RETRIES` (default 5) prevents infinite retries
- Exhausted results are marked with `recoveryState: 'exhausted'`
- `recovery.attempt.exhausted` log event fires for monitoring
- Cron schedule is configurable (`RECOVERY_SCHEDULE_CRON`)

### 5. Single-User Session Model

**Risk:** The current auth model uses the most recently verified OTP session. This means only one user can be "active" at a time per backend instance.

**Mitigation:**
- For Telegram Mini App deployment, this is acceptable — each user opens the app independently
- For multi-user production, add proper session tokens (JWT or cookie-based) in a future step
- The architecture already passes `userId` through the job queue, so the worker handles multi-user correctly

### 6. Database Connection Limits

**Risk:** pg-boss and the Express connection pool both consume PostgreSQL connections.

**Mitigation:**
- Express pool uses `connectionTimeoutMillis: 5000` with default pool size (10)
- pg-boss maintains its own connections
- For production, ensure PostgreSQL `max_connections` >= 50
- Use PgBouncer for connection pooling at scale

### 7. No HTTPS

**Risk:** The Express backend serves HTTP only.

**Mitigation:**
- Use a reverse proxy (nginx, Caddy, cloud load balancer) for TLS termination
- Never expose the backend port directly to the internet

### 8. Logging / Monitoring

**Risk:** Structured logs go to stdout/stderr. Without a log aggregator, they are lost on process restart.

**Mitigation:**
- In Docker/Kubernetes, stdout is captured automatically by the container runtime
- Pipe to a log aggregator: `node dist-server/server.js 2>&1 | tee /var/log/salex.log`
- Use Datadog, Grafana Loki, or CloudWatch for structured log ingestion
- All key events have machine-readable JSON format with `ts`, `level`, `event` fields

---

## Checklist Before Going Live

- [ ] PostgreSQL provisioned with backups enabled
- [ ] `DATABASE_URL` set to production database
- [ ] `npm run db:bootstrap` executed on production database
- [ ] Backend built (`npm run server:build`) and tested
- [ ] Frontend built (`npm run build`) with correct `NEXT_PUBLIC_BACKEND_URL`
- [ ] Chrome/Chromium installed on backend host; `CHROME_BIN` set
- [ ] `chromedriver` version matches installed Chrome
- [ ] Platform login phones set (`{PLATFORM}_LOGIN_PHONE`)
- [ ] OTP delivery method configured (file-based or static code)
- [ ] All `*_SELENIUM_HEADLESS=true` set
- [ ] Reverse proxy configured with TLS
- [ ] Health check endpoint monitored (`/api/health`)
- [ ] Log aggregation configured
- [ ] Graceful shutdown tested (`SIGTERM` handling)
- [ ] Smoke test passed (all 8 steps above)
- [ ] Recovery cron verified (`recovery.job.start` log appears on schedule)
