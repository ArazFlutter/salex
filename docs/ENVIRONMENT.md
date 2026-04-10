# Environment variables — SALex

**✅ VERIFIED** = read/used in codebase or loaded by documented config. **🧠 ASSUMPTION** = standard Node/Next behavior or not grep-confirmed in `src/`.

Backend loads **project-root `.env`** via `src/db/env.ts` (`dotenv`). Next loads its own env for build/dev (`.env.local`, etc.) — **⚠️ PARTIAL:** duplicate keys may need alignment between root `.env` and Next env files.

---

## Core — ✅ VERIFIED

| Name | Purpose | Example | Required | Where |
|------|---------|---------|----------|--------|
| `DATABASE_URL` | PostgreSQL connection | `postgres://postgres:postgres@localhost:5432/salex` | **Yes** (backend) | `src/db/env.ts`, `src/dev/smokeTest.ts`, `src/queue/boss.ts` |
| `PORT` | Express listen port | `4000` | No (default 4000) | `src/server.ts` |
| `PUBLIC_API_ORIGIN` | Base URL for resolving `/uploads/...` when worker fetches images | `http://127.0.0.1:4000` | No | `src/utils/downloadImages.ts` |
| `API_PUBLIC_ORIGIN` | Alias fallback for same | | No | `src/utils/downloadImages.ts` |

---

## Frontend / proxy — ✅ VERIFIED

| Name | Purpose | Example | Required | Where |
|------|---------|---------|----------|--------|
| `NEXT_PUBLIC_BACKEND_URL` | Express base for Next rewrites | `http://localhost:4000` | No (default in `next.config.ts`) | `next.config.ts` |

---

## App URLs — ✅ VERIFIED

| Name | Purpose | Example | Required | Where |
|------|---------|---------|----------|--------|
| `APP_URL` | Payment / redirect style base | `http://localhost:3000` | No | `src/services/paymentService.ts` |

---

## Queue / recovery — ✅ VERIFIED

| Name | Purpose | Example | Required | Where |
|------|---------|---------|----------|--------|
| `RECOVERY_SCHEDULE_CRON` | pg-boss schedule for pending-link recovery | `*/10 * * * *` | No | `src/queue/registerHandlers.ts`, `.env.example` |
| `MAX_RECOVERY_RETRIES` | Cap recovery attempts | `5` | No | `src/services/recoverPendingLinks.ts`, `.env.example` |

---

## Shared Selenium — ✅ VERIFIED

| Name | Purpose | Example | Required | Where |
|------|---------|---------|----------|--------|
| `CHROME_BIN` | Chrome/Chromium binary path | `/usr/bin/google-chrome` | No | `src/connectors/seleniumSession.ts` |

---

## Tap.az (`TAPAZ_*`) — ✅ VERIFIED

| Name | Purpose | Example | Required | Where |
|------|---------|---------|----------|--------|
| `TAPAZ_SELENIUM_HEADLESS` | `false` to show browser | `true` | No | `.env.example`; read via `buildChromeOptions` pattern |
| `TAPAZ_SELENIUM_TIMEOUT_MS` | Selenium waits | `15000` | No | `getSeleniumTimeout('TAPAZ')` |
| `TAPAZ_LOGIN_PHONE` | Login phone (normalized in connector) | `+994501234567` | For automated login paths | `tapazConnector.ts` |
| `TAPAZ_OTP_CODE` | Static OTP for tests | `1234` | No | `tapazConnector.ts` |
| `TAPAZ_OTP_FILE` | File-based OTP exchange | `.tapaz-otp` | No | `tapazConnector.ts` |
| `TAPAZ_OTP_TIMEOUT_MS` | OTP wait | `120000` | No | `tapazConnector.ts` |
| `TAPAZ_LOGIN_FETCH_OVERRIDE` | `0`/`false` disables CDP body rewrite | default on | No | `tapazConnector.ts` |
| `TAPAZ_DEBUG_REQUEST_LOG` | `1`/`true` — global CDP POST log, no modify | | No | `tapazConnector.ts` (`envTruthy`) |
| `TAPAZ_DEBUG_LOGIN` | Extra login logs | | No | `tapazConnector.ts` (`envTruthy`) |
| `TAPAZ_FORCE_FRESH_LOGIN` | Skip DB session, env-only login | `1` | No | `tapazConnector.ts` (`envTruthy`) |

---

## Lalafo — ✅ VERIFIED (pattern matches `lalafoConnector.ts` + `.env.example`)

`LALAFO_SELENIUM_HEADLESS`, `LALAFO_SELENIUM_TIMEOUT_MS`, `LALAFO_LOGIN_PHONE`, `LALAFO_OTP_CODE`, `LALAFO_OTP_FILE`, `LALAFO_OTP_TIMEOUT_MS`

---

## Alan.az — ✅ VERIFIED

`ALANAZ_SELENIUM_HEADLESS`, `ALANAZ_SELENIUM_TIMEOUT_MS`, `ALANAZ_LOGIN_PHONE`, `ALANAZ_OTP_CODE`, `ALANAZ_OTP_FILE`, `ALANAZ_OTP_TIMEOUT_MS`

---

## Laylo.az — ✅ VERIFIED

`LAYLO_SELENIUM_HEADLESS`, `LAYLO_SELENIUM_TIMEOUT_MS`, `LAYLO_LOGIN_PHONE`, `LAYLO_OTP_CODE`, `LAYLO_OTP_FILE`, `LAYLO_OTP_TIMEOUT_MS`

---

## Birja.com — ✅ VERIFIED

`BIRJACOM_SELENIUM_HEADLESS`, `BIRJACOM_SELENIUM_TIMEOUT_MS`, `BIRJACOM_LOGIN_PHONE`, `BIRJACOM_OTP_CODE`, `BIRJACOM_OTP_FILE`, `BIRJACOM_OTP_TIMEOUT_MS`

---

## Dev / smoke — ✅ VERIFIED

| Name | Purpose | Where |
|------|---------|--------|
| `SMOKE_BASE_URL` | API base for smoke | `src/dev/smokeTest.ts` |
| `PUBLISH_SMOKE_PLATFORMS` | Comma platforms | `src/dev/publishConnectorSmoke.ts` |
| `SMOKE_PUBLISH_USER_ID` | User id for smoke | `src/dev/publishConnectorSmoke.ts` |
| `PUBLISH_SMOKE_REQUIRE_LOGIN_ENV` | `1` strict creds | `src/dev/publishConnectorSmoke.ts` |

---

## Documented in `.env.example` but not found in `src/` — ⚠️ PARTIAL

| Name | Notes |
|------|--------|
| `GEMINI_API_KEY` | **🧠 ASSUMPTION:** used by app/AI features outside `src/` or planned; not found in `src/` grep |

---

## Next.js build — ✅ VERIFIED

| Name | Purpose | Where |
|------|---------|--------|
| `NODE_ENV` | Standard Node | `next.config.ts` (`distDir` branch) |
| `DISABLE_HMR` | `true` ignores webpack file changes in dev | `next.config.ts` |

---

## Active hosts (summary) — ✅ VERIFIED

| Role | Env / default |
|------|----------------|
| API | `PORT` → 4000 |
| Frontend | Next default 3000; `APP_URL` for payment links |
| DB | `DATABASE_URL` |
