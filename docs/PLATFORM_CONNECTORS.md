# Platform Connectors — SALex

**✅ VERIFIED** registry: `src/connectors/index.ts`.

Platforms: **Tap.az**, **Lalafo**, **Alan.az**, **Laylo.az**, **Birja.com** (`src/utils/platforms.ts`).

**Shared pattern — ✅ VERIFIED:**

- `buildChromeDriver({ENV_PREFIX}_SELENIUM_*)` from `seleniumSession.ts`.
- Optional **`{PLATFORM}_LOGIN_PHONE`**, **`_OTP_CODE`**, **`_OTP_FILE`**, **`_OTP_TIMEOUT_MS`**.
- **`CHROME_BIN`** overrides Chrome path for all.
- **`platformSessionService`** persists cookies between runs unless forced fresh login.

---

## Tap.az — ✅ VERIFIED (primary implementation detail in `tapazConnector.ts`)

| Topic | Detail |
|-------|--------|
| **Automation** | Selenium WebDriver; extensive login + publish form flow |
| **Login** | Phone + OTP; session wipe options; iframe-aware phone input search |
| **OTP** | `TAPAZ_OTP_CODE` or file poll (`TAPAZ_OTP_FILE`, default `.tapaz-otp`) |
| **Persistence** | Cookies/storage cleared selectively; DB-backed `platform_sessions` |
| **CDP / Fetch** | Optional **request body rewrite** for phone (`TAPAZ_LOGIN_FETCH_OVERRIDE`, default on) when heuristics match login POST |
| **Debug** | `TAPAZ_DEBUG_REQUEST_LOG` — CDP Fetch logs **all** POST/PUT/PATCH (`urlPattern: '*'`) without modifying |
| **DOM fragility** | ❗ React-controlled phone field; native setter + network override + debug bypass documented in code |
| **Env extras** | `TAPAZ_FORCE_FRESH_LOGIN`, `TAPAZ_DEBUG_LOGIN`, mismatch bypass when debug request log on |

---

## Lalafo — ✅ VERIFIED (`lalafoConnector.ts`)

| Topic | Detail |
|-------|--------|
| **Automation** | Selenium; parallel structure to Tap.az (phone/OTP/env pattern) |
| **OTP** | `LALAFO_OTP_CODE` / `LALAFO_OTP_FILE` |
| **Fragility** | ❗ Site DOM/CSS selectors; timing (`LALAFO_SELENIUM_TIMEOUT_MS`) |

---

## Alan.az — ✅ VERIFIED (`alanazConnector.ts`)

Same env pattern: `ALANAZ_*` — Selenium + OTP file/code.

---

## Laylo.az — ✅ VERIFIED (`layloConnector.ts`)

Same env pattern: `LAYLO_*`.

---

## Birja.com — ✅ VERIFIED (`birjacomConnector.ts`)

Same env pattern: `BIRJACOM_*`.

---

## Publish pipeline (all) — ✅ VERIFIED

1. `mapToPlatformPayload(platformId, normalizedListing)` — `src/mappers/platforms/*Mapper.ts`.
2. `connector.publishListing(payload, { userId })`.
3. `resolvePublishResult` — normalizes success / pending-link / failure for DB.

---

## Contract (`PlatformConnector`) — ✅ VERIFIED

- `publishListing` → `{ externalListingId?, externalUrl?, publishMetadata? }`.
- `fetchListingUrl` / `getListingUrl` — URL recovery for pending publishes.

---

## External hosts (automation targets)

| Platform | Host (typical) |
|----------|----------------|
| Tap.az | `tap.az`, `hello.tap.az` (storage origins in code) |
| Others | **🧠 ASSUMPTION:** each connector encodes base URLs internally — read per `*Connector.ts` |
