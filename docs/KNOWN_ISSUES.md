# Known Issues — SALex

Grounded in **✅ VERIFIED** code behavior. Use tags: **❗ ISSUE**, **⚠️ PARTIAL**, **🧠 ASSUMPTION**.

---

## Auth / OTP

### ❗ ISSUE — OTP logged in plaintext

**✅ VERIFIED** `src/services/otpService.ts` — `log.info('auth.otp.sent', { phone, code })` exposes OTP to log aggregation. **Risk:** credential leak via logs; also confusing for “double send” debugging (every send logs a new code).

### ❗ ISSUE — “Latest OTP row” semantics / resend

**✅ VERIFIED** `verifyOtp` selects **latest** `otp_sessions` row for phone. **🧠 ASSUMPTION:** rapid double `send-otp` may leave user entering an older code if they read SMS from first send while DB kept second row as latest — operational confusion risk.

### ❗ ISSUE — Global session model

**✅ VERIFIED** `getCurrentUser` uses single `is_current` row across DB — not per-device JWT. `logout` clears **all** current flags. Multi-user local testing on one DB can interfere.

---

## Tap.az connector

### ❗ ISSUE — React-controlled phone input

**✅ VERIFIED** `tapazConnector.ts` — DOM value may not match internal app state; mitigations: native value setter, **`TAPAZ_LOGIN_FETCH_OVERRIDE`** (CDP body rewrite with heuristics), **`TAPAZ_DEBUG_REQUEST_LOG`** (global request capture).

### ⚠️ PARTIAL — Network override may miss real endpoint

**✅ VERIFIED** override uses URL/body heuristics; if login uses WebSocket, non-POST, or non-matching host, rewrite never applies.

### ❗ ISSUE — Global CDP debug noise + secrets

**✅ VERIFIED** debug mode logs **full bodies** for **all** POST/PUT/PATCH (`urlPattern: '*'`) — may include third-party tokens; logs must be treated as sensitive.

### ⚠️ PARTIAL — CDP availability

**✅ VERIFIED** `createCDPConnection` may fail in some Grid/remote setups — logging/override silently skipped with warnings.

---

## Selenium / infrastructure

### ❗ ISSUE — Headless + site changes

Connectors depend on **selectors and flows** that break when marketplace UIs change.

### ⚠️ PARTIAL — chromedriver / Chrome version skew

**🧠 ASSUMPTION:** `chromedriver` package version must remain compatible with installed Chrome; CI/docs should pin versions.

### ⚠️ PARTIAL — Worker + server both register pg-boss workers

**✅ VERIFIED** `server.ts` and `worker.ts` both call `registerHandlers`. **🧠 ASSUMPTION:** running **two** processes with handlers may **double-consume** jobs unless pg-boss locking prevents it (typically safe) — still confusing for ops.

---

## API / product

### ⚠️ PARTIAL — `createListing` auth

**✅ VERIFIED** uses `getCurrentUser()` — no separate middleware; consistent pattern.

### ⚠️ PARTIAL — Publish job status vs platform rows

**✅ VERIFIED** overall job `status` in `publish_jobs` vs per-platform rows — edge cases during partial failure require reading `finishJob` implementation.

---

## Frontend / ports

### ⚠️ PARTIAL — Default ports 3000 / 4000

**✅ VERIFIED** Next default **3000**, API default **4000**. If dev runs Next on another port, **`NEXT_PUBLIC_BACKEND_URL`** and **`APP_URL`** must stay consistent (**❗ ISSUE** class if misconfigured — uploads/payment links wrong).

---

## Dependencies

### ⚠️ PARTIAL — `GEMINI_API_KEY` in `.env.example`

**✅ VERIFIED** not referenced under `src/` in repo grep — dead or used outside scanned paths.

---

## Recovery queue

### ✅ VERIFIED — Scheduled recovery

`RECOVERY_SCHEDULE_CRON` drives pending link recovery — monitor for duplicate work / API rate limits (**🧠 ASSUMPTION** on marketplace side).
