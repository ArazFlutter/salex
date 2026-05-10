# Backend Developer Guide — SALex

Complete onboarding guide for a new backend developer joining the SALex project.

---

## 🎯 What You're Building

**SALex** is a **Telegram Mini App** that lets sellers in Azerbaijan post listings to multiple marketplaces with one click.

**Your role:** Build and maintain the Express backend that handles:
- User authentication (currently OTP; migrating to Telegram `initData`)
- Listing CRUD (create, read, update, delete)
- Marketplace connections (Selenium automation)
- Publishing (job queue + async workers)
- Payment processing (premium plans)

---

## 🏗 Architecture Overview (60 seconds)

```
User opens Telegram → Loads Next.js frontend (port 3000)
                    ↓
User creates listing, clicks "Publish"
                    ↓
Frontend sends: POST /api/publish/:listingId
                    ↓
Backend (Express :4000) creates jobs in pg-boss queue
                    ↓
Worker processes jobs asynchronously:
  • Loads listing from DB
  • Starts Chrome
  • Logs into marketplace (Selenium)
  • Fills form with listing data
  • Submits → Gets URL
  • Stores result in DB
                    ↓
Frontend polls: GET /api/publish/:jobId/status
                    ↓
Displays: "Tap.az ✓ | Lalafo ✓ | Alan.az ✗ (retry in 10 min)"
```

**Key Technologies:**
- **Express** — HTTP server
- **PostgreSQL** — Database
- **pg-boss** — Job queue (same DB, no Redis needed)
- **Selenium** — Browser automation (login, form-filling)

**See Also:** [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed diagrams and data flows.

---

## ⚡ Quick Start (15 minutes)

### 1. Clone & Install

```bash
git clone https://github.com/ArazFlutter/salex.git
cd salex
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env`:
```bash
DATABASE_URL=postgres://postgres:password@localhost:5432/salex
PORT=4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
APP_URL=http://localhost:3000
```

Ensure PostgreSQL is running locally or accessible.

### 3. Initialize Database

```bash
npm run db:bootstrap
```

This applies `src/db/schema.sql` — creates all tables, indices, pg-boss schema.

### 4. Start Backend

```bash
# Terminal 1
npm run server:dev
```

You should see:
```
✓ Database connected
✓ pg-boss started
✓ Server listening on http://localhost:4000
```

### 5. Test API

```bash
# Terminal 2
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+994501234567"}'
```

Expected response:
```json
{
  "success": true,
  "phone": "+994501234567",
  "expiresAt": "2026-05-10T12:30:00Z"
}
```

---

## 📂 Code Organization

### `src/routes/` — API Endpoints

Each file is one logical route group:

- **`auth.ts`** — `POST /api/auth/send-otp`, `/verify-otp`, `/logout`
- **`listings.ts`** — `GET|POST /api/listings`, `/upload-image`
- **`publish.ts`** — `POST /api/publish/:id`, `GET /api/publish/:id/status`
- **`platforms.ts`** — `POST /api/platforms/connect`
- **`me.ts`** — `GET /api/me` (current user profile)
- **`packages.ts`** — `GET /api/packages` (pricing plans)

**Pattern:** Each route has a controller function + calls services.

**Example:** `POST /api/listings`

```typescript
// src/routes/listings.ts
router.post('/', async (req, res) => {
  const user = getCurrentUser(req); // Throws 401 if not logged in
  const input = req.body;
  
  try {
    const listing = await listingService.createListing(user.id, input);
    res.json({ success: true, listing });
  } catch (err) {
    // AppError handler catches and returns JSON
    throw err;
  }
});
```

### `src/services/` — Business Logic

Each service is a module with functions:

- **`otpService.ts`** — Generate, send, verify OTP codes
- **`userService.ts`** — User CRUD, get current user, manage sessions
- **`listingService.ts`** — Listing CRUD, validation, limits
- **`publishService.ts`** — Create publish jobs, coordinate platform publishing
- **`paymentService.ts`** — Handle Telegram payment callbacks
- **`platformService.ts`** — Manage marketplace connections

**Pattern:** Services call database, utilities, external APIs. Don't know about HTTP.

**Example:** `userService.ts`

```typescript
export async function getCurrentUser(req: Request): Promise<User> {
  // Query: SELECT users.* FROM users
  //        JOIN otp_sessions ON user_id = users.id AND is_current = TRUE
  //        WHERE verified_at IS NOT NULL LIMIT 1
  
  const user = await pool.query('SELECT * FROM users ...');
  if (!user.rows.length) throw new AppError('Unauthorized', 401);
  return user.rows[0];
}

export async function createListing(
  userId: string,
  input: CreateListingInput
): Promise<Listing> {
  // Validate input
  validateCreateInput(input);
  
  // Check listing limit
  const count = await getActiveListingCount(userId);
  if (count >= packageLimits[plan]) {
    throw new AppError('Listing limit reached', 403);
  }
  
  // Insert to DB
  const result = await pool.query(
    'INSERT INTO listings (...) VALUES (...) RETURNING *',
    [userId, input.title, input.price, ...]
  );
  
  return result.rows[0];
}
```

### `src/connectors/` — Marketplace Automation

Each marketplace has a connector that automates login + publishing:

- **`tapazConnector.ts`** — Tap.az (uses Chrome DevTools Protocol for login interception)
- **`lalafoConnector.ts`** — Lalafo
- **`alanaConnector.ts`** — Alan.az (stub)
- **`layloConnector.ts`** — Laylo.az
- **`birjacomConnector.ts`** — Birja.com (stub)

**Interface:**
```typescript
export interface PlatformConnector {
  publishListing(listing: NormalizedListing): Promise<PublishResult>;
  getListingUrl(result: PublishResult): string;
  normalizeError(error: any): string;
}
```

**Flow:**
1. Start Chrome with `buildChromeDriver()`
2. Login to marketplace (phone + OTP)
3. Navigate to listing creation page
4. Fill form with standardized fields (title, price, city, category, etc.)
5. Submit form
6. Extract listing URL
7. Return `{ url: '...' }` or `{ error: '...' }`

**Example:** Tap.az connector snippet

```typescript
export class TapazConnector implements PlatformConnector {
  async publishListing(listing: NormalizedListing): Promise<PublishResult> {
    const driver = buildChromeDriver();
    try {
      // Step 1: Login
      await driver.get('https://tap.az');
      await driver.findElement(By.css('a:contains("Login")')).click();
      await driver.findElement(By.name('phone')).sendKeys(TAPAZ_LOGIN_PHONE);
      // ... OTP verification ...
      
      // Step 2: Navigate to create listing
      await driver.get('https://tap.az/my/add');
      
      // Step 3: Fill form
      await driver.findElement(By.name('title')).sendKeys(listing.title);
      await driver.findElement(By.name('price')).sendKeys(listing.price);
      // ... more fields ...
      
      // Step 4: Submit
      await driver.findElement(By.css('button[type=submit]')).click();
      
      // Step 5: Get URL
      const url = await driver.getCurrentUrl();
      return { success: true, url };
    } catch (err) {
      return { success: false, error: this.normalizeError(err) };
    } finally {
      await driver.quit();
    }
  }
  
  normalizeError(error: any): string {
    if (error.message.includes('timeout')) {
      return 'Marketplace took too long to respond';
    }
    return 'Failed to publish; please try again';
  }
}
```

**See Also:** [PLATFORM_CONNECTORS.md](./PLATFORM_CONNECTORS.md) for per-marketplace details.

### `src/queue/` — Job Queue (pg-boss)

- **`boss.ts`** — Initialize pg-boss connection
- **`queues.ts`** — Define queue names (constants)
- **`handlers/`** — Job handler functions
  - **`publishPlatform.ts`** — Handle one publish job (call connector)
  - **`recoverPendingLinks.ts`** — Retry failed publishes
- **`worker.ts`** — Standalone worker process (run separately from API)

**Pattern:** Create a job → Handler processes asynchronously.

**Example:** `publishPlatform.ts` handler

```typescript
export async function handlePublishPlatform(job: PgBossJob) {
  const { listingId, platform, userId } = job.data;
  
  try {
    // 1. Load listing from DB
    const listing = await getListingById(listingId, userId);
    if (!listing) throw new Error('Listing not found');
    
    // 2. Normalize data to platform schema
    const normalized = normalizeListing(listing);
    
    // 3. Get connector
    const connector = getConnector(platform);
    if (!connector) throw new Error(`Platform ${platform} not supported`);
    
    // 4. Call connector (Selenium automation)
    const result = await connector.publishListing(normalized);
    
    // 5. Update DB with result
    await pool.query(
      'UPDATE publish_job_platforms SET status = $1, url = $2, error = $3 WHERE ...',
      [result.success ? 'completed' : 'failed', result.url, result.error]
    );
  } catch (err) {
    // Job failed; pg-boss will retry on next recovery cycle
    throw err;
  }
}
```

### `src/db/` — Database

- **`schema.sql`** — Table definitions (CREATE TABLE, INDEX, etc.)
- **`pool.ts`** — PostgreSQL connection pool (`pg.Pool`)
- **`env.ts`** — Load `DATABASE_URL` from `.env`

**Pattern:** All queries use `pool.query(sql, params)` with parameterized queries (safe from SQL injection).

**Example:** Query with parameters

```typescript
// ✓ Safe: Parameters are escaped
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ✗ UNSAFE: String concatenation
const result = await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
```

---

## 🔑 Key APIs You'll Build/Modify

### Authentication (CRITICAL — Needs Migration)

**Current Endpoints:**
- `POST /api/auth/send-otp { phone }` → Returns `expiresAt`
- `POST /api/auth/verify-otp { phone, code }` → Returns user
- `POST /api/auth/logout` → Clears session

**Current Implementation:** `src/routes/auth.ts` + `src/services/otpService.ts`

**Problem:** OTP via SMS is unreliable; plaintext logs.

**Your Task:** Migrate to Telegram `initData` + JWT.

**New Endpoints (to implement):**
```typescript
POST /api/auth/telegram
{
  "initData": "user=123&..." // From window.Telegram.WebApp.initData
}

Response:
{
  "success": true,
  "user": { id, phone, fullName, activePlan },
  "token": "eyJhbGc..." // JWT
}
```

**Why This Matters:** Blocking everyone. Fix first.

**See Also:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — Issue #1.

---

### Listings

**Endpoints (already implemented):**
- `POST /api/listings` — Create listing
- `GET /api/listings` — List user's listings
- `GET /api/listings/:id` — Get single listing
- `POST /api/listings/upload-image` — Upload image file

**Implementation:** `src/routes/listings.ts` + `src/services/listingService.ts`

**Your Task:** Usually just bug fixes or adding fields. See KNOWN_ISSUES #4.

---

### Publishing

**Endpoints (implemented but needs testing):**
- `POST /api/publish/:listingId` — Create publish job for all platforms
- `GET /api/publish/:jobId/status` — Poll job status

**Implementation:** `src/routes/publish.ts` + `src/services/publishService.ts` + `src/queue/handlers/`

**Your Task:**
- [ ] Complete Alan.az & Birja.com connectors (Issue #5)
- [ ] Write E2E tests (Issue #4)
- [ ] Fix Railway Chrome issues (Issue #2)

---

### Platforms

**Endpoints:**
- `POST /api/platforms/connect { platform }` — Initiate marketplace connection (opens popup)
- `GET /api/platforms` — List connected platforms

**Implementation:** `src/routes/platforms.ts` + connectors

**Your Task:** Verify token reuse works; implement full disconnect flow.

---

### Package Plans (Premium)

**Endpoints:**
- `GET /api/packages` — List available plans (basic, premium, premiumPlus)
- `GET /api/package/current` — User's current plan + listing limit
- `POST /api/package/select { plan }` — Switch plan
- `POST /api/payments/create { plan }` — Create Telegram payment link

**Implementation:** `src/routes/packages.ts` + `src/services/paymentService.ts`

**Your Task:** Usually works. Monitor for payment webhook issues.

---

## 📊 Database Schema (Overview)

| Table | Purpose | Key Columns |
|-------|---------|-----------|
| `users` | Registered users | id, phone, full_name, account_type, active_plan |
| `otp_sessions` | Auth sessions (OTP) | phone, code, is_current, verified_at |
| `listings` | User listings | id, user_id, title, price, city, category, images, status |
| `platform_connections` | Marketplace tokens | user_id, platform, access_token, refresh_token |
| `publish_jobs` | Overall publish task | id, user_id, listing_id, status |
| `publish_job_platforms` | Per-platform result | job_id, platform, status, url, error |
| `pgboss.*` | Job queue (internal) | — |

**See Also:** [DB_HANDOFF.md](./DB_HANDOFF.md) for full schema.

---

## 🚀 Priority: What to Work On

**In order of importance:**

### 1. **Migrate to Telegram Auth** (1 week)
   - **Impact:** Fixes OTP reliability (blocking everyone)
   - **Effort:** ~3 days backend, ~2 days frontend, ~1 day testing
   - **Files:** `src/routes/auth.ts`, `src/services/userService.ts`, middleware
   - **See:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) #1

### 2. **Fix Puppeteer on Railway** (3-4 days)
   - **Impact:** Publishing works reliably in production
   - **Effort:** Rewrite connectors to use Puppeteer
   - **Files:** `src/connectors/*.ts`
   - **See:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) #2

### 3. **Complete Platform Connectors** (2-3 days)
   - **Impact:** Users can publish to Alan.az & Birja.com
   - **Effort:** Implement 2 connectors (~200 lines each)
   - **Files:** `src/connectors/alanaConnector.ts`, `src/connectors/birjacomConnector.ts`
   - **See:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) #5

### 4. **Write E2E Tests** (2-3 days)
   - **Impact:** Catch regressions before production
   - **Effort:** Jest + Supertest for API; Puppeteer for connector smoke tests
   - **Files:** `tests/` (new directory)
   - **See:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) #4

### 5. **Add Monitoring & Alerts** (1-2 days)
   - **Impact:** Catch failures in production early
   - **Tools:** Sentry (errors), LogRocket (sessions), CloudWatch (logs)
   - **See:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🧪 Testing

### Unit Tests

```bash
npm test
```

Tests live in `src/**/*.test.ts` (if you create them).

**Example test:**
```typescript
// src/services/otpService.test.ts
describe('otpService', () => {
  it('should generate a 4-digit code', async () => {
    const code = generateRandomCode();
    expect(code).toMatch(/^\d{4}$/);
  });
  
  it('should verify correct OTP', async () => {
    await sendOtp('+994501234567');
    // In test, we'd mock SMS and get code from DB
    const result = await verifyOtp('+994501234567', '1234');
    expect(result.success).toBe(true);
  });
});
```

### API Tests (Smoke Tests)

```bash
npm run smoke:backend
```

Runs `src/dev/smokeTest.ts` — basic HTTP checks.

**To add new test:**
```typescript
// src/dev/smokeTest.ts
async function testPublish() {
  const response = await fetch(`${API_URL}/api/publish/123`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  assert(response.status === 201, 'POST /api/publish failed');
  console.log('✓ POST /api/publish');
}
```

### Connector Smoke Tests

```bash
npm run smoke:publish-connectors
```

Runs `src/dev/publishConnectorSmoke.ts` — tests Tap.az & Lalafo with real credentials.

**Requires env vars:**
```bash
TAPAZ_LOGIN_PHONE=+994501234567
TAPAZ_OTP_CODE=1234
LALAFO_LOGIN_PHONE=...
```

---

## 🐛 Common Tasks

### Add a New API Endpoint

**Example:** `GET /api/listings/:id/comments`

**Step 1:** Create route handler
```typescript
// src/routes/listings.ts
router.get('/:id/comments', async (req, res) => {
  const user = getCurrentUser(req); // Throws 401 if not logged in
  const { id } = req.params;
  
  try {
    const comments = await listingService.getComments(id, user.id);
    res.json({ success: true, comments });
  } catch (err) {
    throw err; // AppError handler catches
  }
});
```

**Step 2:** Add service function
```typescript
// src/services/listingService.ts
export async function getComments(listingId: string, userId: string) {
  // Verify user owns listing
  const listing = await pool.query(
    'SELECT * FROM listings WHERE id = $1 AND user_id = $2',
    [listingId, userId]
  );
  if (!listing.rows.length) throw new AppError('Not found', 404);
  
  // Get comments
  const result = await pool.query(
    'SELECT * FROM comments WHERE listing_id = $1 ORDER BY created_at DESC',
    [listingId]
  );
  return result.rows;
}
```

**Step 3:** Test
```bash
curl http://localhost:4000/api/listings/123/comments \
  -H "Cookie: salex_session=..." # Requires auth
```

---

### Modify Database Schema

**Example:** Add `external_id` field to listings table.

**Step 1:** Update schema
```sql
-- src/db/schema.sql
ALTER TABLE listings ADD COLUMN external_id TEXT;
CREATE INDEX idx_listings_external_id ON listings(external_id);
```

**Step 2:** Run migration
```bash
npm run db:bootstrap
```

**Step 3:** Update TypeScript types
```typescript
// src/types/index.ts or service
interface Listing {
  id: string;
  externalId?: string; // New field
  title: string;
  // ... other fields
}
```

**Step 4:** Update service code
```typescript
const listing = {
  id: result.rows[0].id,
  externalId: result.rows[0].external_id, // Camel case
  title: result.rows[0].title,
  // ...
};
```

---

### Debug a Failing Publish Job

**Situation:** User tried to publish; listing never appeared on Tap.az. 

**Investigation:**

```bash
# 1. Check job status
curl http://localhost:4000/api/publish/job-123/status

# 2. Check job table
psql $DATABASE_URL -c "SELECT * FROM publish_jobs WHERE id = 'job-123';"

# 3. Check per-platform results
psql $DATABASE_URL -c "SELECT * FROM publish_job_platforms WHERE job_id = 'job-123';"

# 4. Check pg-boss queue
psql $DATABASE_URL -c "SELECT * FROM pgboss.job WHERE id = '...' LIMIT 5;"

# 5. Check server logs
# Look for error messages in npm run server:dev console
```

**Common Issues:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Button not found: Daxil ol" | Selector changed | Update connector; try `clickByText('Daxil ol')` |
| "Chrome process crashed" | Out of memory | Reduce headless; check Railway resources |
| "Timeout waiting for navigation" | Site slow or blocked | Increase `TAPAZ_SELENIUM_TIMEOUT_MS` |
| "OTP timeout" | No OTP provided | Set `TAPAZ_OTP_CODE` or `TAPAZ_OTP_FILE` |

---

## 📚 Documentation Index

| Doc | Purpose |
|-----|---------|
| [README.md](../README.md) | Project overview, setup, deployment |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data flows, diagrams |
| [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | Critical bugs, migration roadmap |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | All env variables explained |
| [API_HANDOFF.md](./API_HANDOFF.md) | HTTP API endpoints & requests |
| [DB_HANDOFF.md](./DB_HANDOFF.md) | Database schema & queries |
| [PLATFORM_CONNECTORS.md](./PLATFORM_CONNECTORS.md) | Selenium automation per-platform |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Production setup (Vercel, Railway) |
| [RUNBOOK.md](./RUNBOOK.md) | Operations & common commands |

---

## 💬 Questions?

1. **"How do I...?"** → Check [RUNBOOK.md](./RUNBOOK.md)
2. **"Why is...?"** → Check [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **"What's this error?"** → Check [KNOWN_ISSUES.md](./KNOWN_ISSUES.md)
4. **"What endpoint...?"** → Check [API_HANDOFF.md](./API_HANDOFF.md)

---

**Last updated:** May 2026  
**Quick Links:** [GitHub](https://github.com/ArazFlutter/salex) · [Vercel](https://salex-next.vercel.app) · [Railway](https://salex-api.railway.app)
