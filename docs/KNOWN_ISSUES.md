# Known Issues & Roadmap — SALex

Critical bugs, design flaws, and items that need fixing. Organized by priority.

---

## 🔴 CRITICAL

### 1. Authentication: OTP System is Unreliable

**Status:** Broken on production; needs migration

**Problem:**
- Current system uses SMS OTP verification
- OTP code is **logged in plaintext** to server logs (`otpService.ts`)
- SMS delivery is unreliable (slow, blocked, missing)
- Global session model (not per-device/browser tab)
- No proper session tokens (uses DB flag `is_current`)

**Current Code:**
```typescript
// src/services/otpService.ts
log.info('auth.otp.sent', { phone, code }); // ❌ Plaintext code logged!
```

**Why It Needs to Change:**
- App runs inside **Telegram** → user is already authenticated there
- No need for SMS; Telegram provides `initData` signed proof
- JWT tokens are more secure and scalable than DB session flags

**Solution (Telegram initData + JWT):**

1. **Remove SMS dependency:**
   - Frontend: Access `window.Telegram.WebApp.initData`
   - Send to backend: `POST /api/auth/telegram { initData }`

2. **Backend verifies signature:**
   ```typescript
   // Using Telegram bot token
   const isValid = verifyTelegramWebAppData(initData, BOT_TOKEN);
   if (!isValid) return 401;
   
   const userId = parseTelegramUser(initData).id;
   ```

3. **Issue JWT token:**
   ```typescript
   const token = jwt.sign(
     { userId, iat: Date.now() },
     JWT_SECRET,
     { expiresIn: '30d' }
   );
   ```

4. **Client stores token:**
   ```typescript
   localStorage.setItem('auth_token', token);
   // Include in all requests: Authorization: Bearer <token>
   ```

5. **Delete OTP tables & code:**
   - Drop `otp_sessions` table
   - Remove `src/services/otpService.ts`
   - Simplify auth logic

**Benefits:**
- ✅ No SMS dependency
- ✅ Instant verification (Telegram already verified user)
- ✅ More secure (signed tokens, not DB flags)
- ✅ Per-device tokens (JWT with ID)
- ✅ Better mobile UX (no OTP waiting)
- ✅ Logs won't expose credentials

**Effort:** ~2-3 days (1 day backend, 1 day frontend, 1 day testing)

**Files to Change:**
- `src/routes/auth.ts` — New `/api/auth/telegram` endpoint
- `src/services/userService.ts` — JWT verification instead of session lookup
- `src/middleware/authenticate.ts` — Check JWT instead of session flag
- `app/page.tsx` — Use Telegram initData, store JWT in localStorage
- `lib/api.ts` — Include JWT in all API requests

**Testing:**
- Unit tests for Telegram signature verification
- E2E test with real Telegram Mini App (dev mode)
- Verify logout clears token

---

### 2. Puppeteer/Selenium on Railway: Chrome Not Working Reliably

**Status:** Partially working; crashes on complex sites

**Problem:**
- Railway environment may not have Chrome/Chromium properly configured
- Selenium connectors fail to:
  - Find buttons (selector issues)
  - Login to platforms (CDP timeouts)
  - Fill forms (JavaScript injection failures)
- **Error messages:**
  - `ChromeDriver version mismatch`
  - `Button not found: Daxil ol` (Tap.az "Login" button)
  - `Chrome process crashed`

**Current Workarounds:**
- `CHROME_BIN` env var to specify Chrome path
- `clickByText()` helper added for more reliable button finding
- Debug mode: `TAPAZ_DEBUG_REQUEST_LOG=1` to log network calls
- CDP body rewrite with heuristics: `TAPAZ_LOGIN_FETCH_OVERRIDE`

**Why It Still Breaks:**
1. **Version skew:** Installed Chrome ≠ chromedriver version
2. **Railway sandbox limitations:** Chrome needs more system resources
3. **Platform updates:** Marketplaces change UI/API; selectors become stale
4. **Headless limitations:** Some sites detect and block headless Chrome

**Solution (Two Options):**

**Option A: Use Puppeteer on Railway (Recommended)**
- More reliable for headless automation
- Built-in Chrome bundling (correct version)
- Better handling of JavaScript-heavy sites
- Replace Selenium with Puppeteer

**Steps:**
1. Install: `npm install puppeteer`
2. Rewrite connectors:
   ```typescript
   // Old (Selenium)
   const driver = buildChromeDriver();
   await driver.findElement(By.css('input[name=phone]')).sendKeys(phone);
   
   // New (Puppeteer)
   const browser = await puppeteer.launch();
   const page = await browser.newPage();
   await page.goto(url);
   await page.$eval('input[name=phone]', el => el.value = phone);
   await page.click('button:contains("Login")');
   ```
3. Test on Railway locally (Railway CLI)
4. Update env vars (`PUPPETEER_EXECUTABLE_PATH`)

**Option B: Use Separate Service**
- Deploy a dedicated Selenium/Chrome service on another platform
- SALex backend calls via API: `POST https://selenium-service.railway.app/publish { platform, listing }`
- Pros: Isolated; easier scaling
- Cons: More complex; adds latency

**Effort (Option A):** ~3-4 days (rewrite connectors, test each platform)

**Files to Change:**
- `src/connectors/seleniumSession.ts` → Replace with Puppeteer
- `src/connectors/tapazConnector.ts`, etc. — Rewrite using puppeteer API
- `.env.example` — Update Chrome/Puppeteer env vars
- `Dockerfile` (if using) — Ensure Puppeteer dependencies included

**Testing:**
- Run connectors locally with `npm run smoke:publish-connectors`
- Deploy to Railway dev env; test with each marketplace
- Test with headless=true and headless=false

---

### 3. Telegram Mini App Shows Old (Stale) User Data After DB Truncate

**Status:** Fixed (v1.0.1 hydration + cache-bust)

**Problem (Historical):**
- DB was truncated (all users deleted)
- `/api/me` returned 401 (correct)
- BUT: Telegram Mini App showed old registration data
- Root cause: Telegram WebView aggressively caches localStorage + React state

**Solutions Applied:**
1. **Hydration guard (v1.0.0):**
   - Added `isHydrating` state
   - Block all UI rendering until `/api/me` completes
   - Show `LoadingScreen` while hydrating
   - Prevents flash of stale UI

2. **Cache-busting (v1.0.1):**
   - Bumped `APP_VERSION` from implicit to explicit '1.0.1'
   - `invalidateStaleAppVersion()` detects version change
   - Clears all localStorage on version mismatch
   - Forces Telegram to refresh on next open

**Why It Was an Issue:**
- Telegram caches localStorage even after `browser.clear()`
- React component rendered immediately with initial state
- Frontend didn't wait for `/api/me` before showing data

**Result:**
- ✅ No more stale data flashing
- ✅ Version bump triggers cache clear
- ✅ Users always see fresh state

**Long-term Fix:**
- JWT-based auth (no localStorage dependency)
- Tokens stored in memory or httpOnly cookies
- No persistent stale state

---

## 🟡 MEDIUM

### 4. Platform Publish Not Tested End-to-End

**Status:** Partially works; needs E2E testing

**Problem:**
- Tap.az & Lalafo: Connectors exist, tested manually
- Alan.az, Laylo.az, Birja.com: **Connector stubs only**
- No automated E2E tests (publish → verify listing appears on marketplace)
- Manual testing is time-consuming; breaks with UI changes

**What's Missing:**
- [ ] Complete Alan.az connector (`src/connectors/alanaConnector.ts`)
- [ ] Complete Laylo.az connector
- [ ] Complete Birja.com connector
- [ ] E2E test suite: `npm run test:e2e` (publish to all 5 platforms, verify URLs)
- [ ] CI/CD pipeline to run tests on each deploy

**Solution:**
1. **Implement missing connectors:** Copy Tap.az/Lalafo, adapt to each platform's flow
2. **Write E2E tests:**
   ```bash
   # E2E test: Create listing, publish to all 5 platforms, verify URLs
   npm run test:e2e
   ```
3. **Add to CI:** GitHub Actions runs E2E before deploy to production

**Effort:** ~4-5 days (1-2 days per connector, 1 day test framework)

**Files to Create:**
- `src/connectors/alanaConnector.ts`
- `src/connectors/layloConnector.ts`
- `src/connectors/birjacomConnector.ts`
- `tests/e2e/publish.test.ts`
- `.github/workflows/e2e.yml` (GitHub Actions)

---

### 5. Alan.az & Birja.com Connectors Not Implemented

**Status:** Stub only; no functionality

**Current Code:**
```typescript
export class AlanazConnector implements PlatformConnector {
  async publishListing(): Promise<PublishResult> {
    throw new Error('Not implemented');
  }
}
```

**Why It Matters:**
- Users can't publish to these platforms (will get "Not implemented" error)
- Backend returns 400 instead of 5xx, but UX is confusing

**What Needs to Do:**
1. **Analyze each platform's UI flow:**
   - How to login (phone + OTP?)
   - Where's the listing creation form?
   - What fields are required?
   - How to submit & get listing URL?

2. **Implement connector:**
   ```typescript
   export class AlanazConnector implements PlatformConnector {
     async publishListing(listing: NormalizedListing): Promise<PublishResult> {
       const driver = buildChromeDriver();
       try {
         // 1. Navigate to alan.az
         // 2. Login (similar to Tap.az)
         // 3. Go to listing creation page
         // 4. Fill form fields
         // 5. Submit
         // 6. Extract listing URL
         return { success: true, url: '...' };
       } catch (err) {
         return { success: false, error: this.normalizeError(err) };
       }
     }
   }
   ```

3. **Test:** Manual testing + E2E suite

**Effort:** ~1-2 days each

**Files:**
- `src/connectors/alanaConnector.ts` — ~200 lines
- `src/connectors/birjacomConnector.ts` — ~200 lines

---

### 6. No Real SMS Integration for OTP

**Status:** Partially implemented

**Problem:**
- OTP code is logged to console (`console.log` in dev)
- No actual SMS provider integrated (Twilio, Vonage, AWS SNS, etc.)
- Code for real SMS exists but commented out

**Current Flow:**
```typescript
// src/services/otpService.ts
const code = generateRandomCode(); // e.g., '1234'
log.info('auth.otp.sent', { phone, code }); // Server logs it
// ❌ No actual SMS sent
```

**Why Not Critical:**
- Works for local dev (read code from logs)
- Frontend can handle 401 from SMS send failure

**Solution:**
- Integrate SMS provider (Twilio recommended for Azerbaijan coverage)
- Move OTP to separate service or job queue
- **Better:** Skip this entirely; migrate to Telegram auth (see #1)

**Effort:** ~2 days (if doing SMS) or 0 days (if migrating to Telegram)

---

## 🟢 LOW PRIORITY

### 7. Worker vs Server Handler Registration

**Status:** Works but confusing

**Problem:**
- `src/server.ts` starts pg-boss and registers handlers
- `src/queue/worker.ts` also starts pg-boss and registers handlers
- Running both simultaneously may double-process jobs
- Unclear which setup to use in production

**Current Setup:**
```bash
# Option 1: Embedded worker in server
npm run server:dev

# Option 2: Standalone worker
ENABLE_WORKER_IN_SERVER=false npm run worker:dev
npm run server:dev (in another terminal)
```

**Why It's Confusing:**
- pg-boss has job locking, so double-processing usually doesn't happen
- But design is unclear; docs don't explain the choice
- In production, unclear which is recommended

**Best Practice:**
- Development: Run server with embedded worker (`ENABLE_WORKER_IN_SERVER=true`, default)
- Production: Separate services
  - API service: `npm run start` (with worker disabled)
  - Worker service: Dedicated dyno/service (`ENABLE_WORKER_IN_SERVER=false npm run start`)

**Solution:**
- Document in README: Decision tree for which option
- Add comments to `server.ts` explaining when to disable worker
- Ensure env var `ENABLE_WORKER_IN_SERVER` is honored consistently

**Effort:** ~1 day (docs + code review)

---

### 8. Platform Connection Flow Partially Implemented

**Status:** Works for Tap.az & Lalafo; needs testing

**Problem:**
- Frontend popup for platform connection works
- Backend stores access tokens in `platform_connections`
- But tokens aren't used when publishing (re-login instead)
- Recovery from failed platform connections not tested

**What Works:**
- User clicks "Connect Tap.az"
- Popup opens with Selenium login
- Token extracted and stored
- Response: "Connected ✓"

**What Doesn't:**
- Reusing token on next publish (currently re-logs in every time)
- Token refresh (if provider supports it)
- Token expiry & renewal
- Disconnecting a platform

**Solution:**
- Modify connector to check `platform_connections` for existing token
- If valid: Skip login, use token directly
- If expired: Try refresh_token or re-login

**Effort:** ~1-2 days (per connector)

---

### 9. Recovery Queue & Retry Logic

**Status:** Implemented but not fully tested

**Problem:**
- Recovery job runs every 10 minutes (`RECOVERY_SCHEDULE_CRON`)
- Retries failed publishes up to `MAX_RECOVERY_RETRIES`
- No monitoring/alerting if recovery keeps failing
- Unclear if recovery handles partial failures correctly

**What Works:**
- Scheduled cron job queries failed rows
- Re-enqueues them
- Processes with backoff

**What's Unclear:**
- Does recovery handle marketplace rate limits?
- What if a marketplace is down? Keeps retrying forever?
- How long does recovery take for 1000 failed jobs?

**Solution:**
- Add monitoring: Alert if failed_jobs table grows
- Add backoff: Exponential delay between retries (1m, 5m, 15m, etc.)
- Add circuit breaker: Stop retrying if marketplace API is down

**Effort:** ~2-3 days

---

## 📋 Migration Checklist

When migrating from OTP to Telegram auth:

- [ ] Create new `/api/auth/telegram` endpoint
- [ ] Implement Telegram signature verification
- [ ] Issue JWT tokens on verify
- [ ] Update frontend to use `initData`
- [ ] Update API client to include `Authorization` header
- [ ] Update all authenticated routes to verify JWT
- [ ] Run all tests
- [ ] Verify logout clears tokens
- [ ] Delete old OTP code
- [ ] Remove `otp_sessions` table migration
- [ ] Deploy to staging; verify E2E
- [ ] Announce breaking change in changelog
- [ ] Migrate old users (if needed)
- [ ] Deploy to production

---

## 🔗 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design
- [BACKEND_DEVELOPER_GUIDE.md](./BACKEND_DEVELOPER_GUIDE.md) — What to work on next
- [PLATFORM_CONNECTORS.md](./PLATFORM_CONNECTORS.md) — Selenium automation details

---

**Last updated:** May 2026  
**Priority:** Fix #1 (auth), then #2 (Puppeteer/Railway), then #4 (E2E tests)
