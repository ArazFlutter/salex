# SALex — End-to-End QA Checklist

## Prerequisites

### Infrastructure

| # | Check | Command / Action | Expected |
|---|-------|------------------|----------|
| P-1 | PostgreSQL running | `docker ps` shows `salex-pg` or equivalent | Container is `Up` |
| P-2 | Database bootstrapped | `npm run db:bootstrap` | "Schema applied" or no errors |
| P-3 | Backend server running | `$env:PORT=4108; npm run server:dev` | `server.started` log on port 4108 |
| P-4 | pg-boss started | Check server logs | `pgboss.started` log entry |
| P-5 | Frontend dev server running | `npm run dev` | Next.js ready on `http://localhost:3000` |
| P-6 | API proxy configured | See "API Proxy Setup" below | `GET http://localhost:3000/api/health` returns `{ "status": "ok" }` |

### API Proxy Setup

The Next.js frontend makes relative requests to `/api/*`. In development, these must be proxied to the Express backend on port 4108.

Add a `rewrites` section to `next.config.ts`:

```typescript
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: 'http://localhost:4108/api/:path*',
    },
  ];
},
```

**Verification:** Open `http://localhost:3000/api/health` in a browser. Response should be:

```json
{ "status": "ok", "uptime": ..., "timestamp": "..." }
```

### Clean Slate

For a clean test run, reset the database:

```powershell
npm run db:bootstrap
```

This drops and re-creates all tables, clearing users, sessions, listings, publish jobs, and platform connections.

---

## 1. App Start & Language

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 1.1 | Cold start | Open `http://localhost:3000` | Start screen renders with the SALex logo/branding |
| 1.2 | Start → Language | Tap "Get Started" / main CTA | Language screen shows AZ, EN, RU options |
| 1.3 | Select language AZ | Tap AZ | Language persists; UI labels switch to Azerbaijani |
| 1.4 | Select language EN | Tap EN | UI labels switch to English |
| 1.5 | Select language RU | Tap RU | UI labels switch to Russian |
| 1.6 | Continue to onboarding | Tap continue | Onboarding screen renders with intro slides |
| 1.7 | Proceed through onboarding | Swipe/tap through slides | Registration screen appears |

---

## 2. Registration + OTP

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 2.1 | Form visible | Arrive at registration | Full name, phone, account type fields visible |
| 2.2 | Account type toggle | Tap "Individual" / "Business" | Card highlights with indigo border |
| 2.3 | Continue disabled | Leave name or phone empty | Continue button disabled |
| 2.4 | Send OTP | Fill name + phone, tap Continue | Loading spinner shown; network request `POST /api/auth/send-otp` fires; OTP step appears |
| 2.5 | OTP input | 4-digit OTP input fields shown | Each field auto-focuses to the next on entry |
| 2.6 | Verify OTP (success) | Enter correct OTP code (check server logs for code), tap Verify | `POST /api/auth/verify-otp` succeeds; user created in DB; navigates to Platform Activation |
| 2.7 | Verify OTP (wrong code) | Enter wrong OTP | Error message "Invalid OTP code" shown inline; stays on OTP step |
| 2.8 | Back from OTP | Tap back arrow on OTP step | Returns to form step (not onboarding); form values preserved |
| 2.9 | Send OTP failure | Disconnect backend, tap Continue | Error message shown; stays on form step |
| 2.10 | Backend user created | After 2.6, query `SELECT * FROM users` | Row exists with correct phone, fullName, activePlan = "basic" |

---

## 3. Session Hydration (Reload)

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 3.1 | Reload after auth | Complete registration, then reload the page (F5) | App calls `GET /api/me`; receives authenticated user; skips to Dashboard |
| 3.2 | Profile populated | Check dashboard after reload | Profile name matches registration; plan is "basic" |
| 3.3 | Platforms populated | Check dashboard / profile after reload | Connected platforms match what was connected before reload |
| 3.4 | Listings populated | Check dashboard after reload | Previously created listings appear |
| 3.5 | No auth → start screen | Clear DB (`npm run db:bootstrap`), reload | `GET /api/me` returns 401; app stays on Start screen |

---

## 4. Platform Connection

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 4.1 | Activation screen | After registration → Platform Activation | Shows available platforms (Tap.az, Lalafo) and locked platforms (Alan.az, Laylo.az, Birja.com) |
| 4.2 | Connect first platform | Tap "Tap.az" | Platform Connection screen shows phone + OTP flow for Tap.az |
| 4.3 | Send code → enter code → Verify | Go through OTP ceremony, tap Verify | `POST /api/platforms/connect` fires with platform name; success screen appears |
| 4.4 | Connection persisted | After 4.3, query `SELECT * FROM platform_connections` | Row with `platform_id = 'tapaz'`, `connected = true` |
| 4.5 | Platform shows connected | Tap "Done"; return to Activation | Tap.az now shows green check and "Connected" status |
| 4.6 | Connect second platform | Tap "Lalafo", repeat flow | Lalafo connected; two platforms in Active section |
| 4.7 | Continue to success | Tap "Continue" | Registration Success screen |
| 4.8 | Backend platforms updated | `GET /api/platforms` | Both tapaz and lalafo show `connected: true` |

### Platform Connection from SharePlan

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 4.9 | Not-connected prompt | On SharePlan, tap "Connect" on unconnected platform | Modal dialog appears |
| 4.10 | Log in flow | Tap "Log in" in modal | Navigates to PlatformConnection; backScreen = sharePlan |
| 4.11 | Return to SharePlan | Complete connection, tap Done | Returns to SharePlan; platform now shows "Connected" |

---

## 5. Package Selection

### Basic Plan (Default)

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 5.1 | Default plan | Check dashboard | Plan badge shows "Basic"; limit shows X / 3 |
| 5.2 | Available platforms | Check SharePlan | Only Tap.az and Lalafo unlocked; Alan.az / Laylo.az / Birja.com locked |
| 5.3 | Packages screen | Navigate to Packages tab | Three plan cards: Basic (current), Premium, Premium+ |

### Premium Upgrade

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 5.4 | Select Premium | Tap "Activate Premium" | `POST /api/packages/select` with plan="premium"; plan badge changes |
| 5.5 | Limit updated | Check dashboard | Limit shows X / 10 |
| 5.6 | Platforms unlocked | Check SharePlan / PlatformActivation | Alan.az, Laylo.az, Birja.com now unlocked (status = "notConnected") |
| 5.7 | Premium banner | Open SharePlan with new platforms available but not connected | "Premium is active. Connect your accounts..." banner visible |
| 5.8 | Backend synced | `GET /api/packages/current` | Returns `{ activePlan: "premium", listingLimit: 10 }` |

### Premium+ Upgrade

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 5.9 | Select Premium+ | Tap "Activate Premium+" | Plan updates; dashboard shows unlimited badge with infinity symbol |
| 5.10 | No listing cap | Dashboard limit indicator | Shows `X / ∞` |
| 5.11 | Backend synced | `GET /api/packages/current` | Returns `{ activePlan: "premiumPlus", listingLimit: null }` |

---

## 6. Listing Creation

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 6.1 | Start creation | Tap "Create New Listing" on Dashboard | Create Listing screen with category selection |
| 6.2 | Select category | Navigate through nested category tree | Category path populated (e.g., "Elektronika > Telefonlar > Smartfonlar > Apple > iPhone 15 Pro") |
| 6.3 | Fill price | Enter price (e.g., "1500") | Price field shows value |
| 6.4 | Fill city | Select or type city | City field populated |
| 6.5 | Fill description | Enter description text | Description field populated |
| 6.6 | Navigate to images | Tap next/continue | Image Upload screen |
| 6.7 | Upload images | Add 1–3 image URLs or use picker | Images shown as thumbnails |
| 6.8 | Navigate to SharePlan | Tap next/continue | SharePlan screen with platforms and limit indicator |
| 6.9 | Platform pre-selected | Check platform list | Connected platforms show "Connected" checkmarks |
| 6.10 | Limit count correct | Check bottom bar | Shows "(current + 1) / limit" |

---

## 7. Publish Flow

### Happy Path

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 7.1 | Tap Publish | Tap "Publish Listing" button on SharePlan | Loading state briefly shown |
| 7.2 | Listing created via API | Check network tab | `POST /api/listings` fires with title, category, price, city, description, images, status |
| 7.3 | Publish job created | Check network tab | `POST /api/publish/:listingId` fires; returns job ID + platforms array |
| 7.4 | Progress screen | Observe screen transition | ShareProgress screen shows all connected platforms with initial statuses |
| 7.5 | Polling starts | Check network tab | `GET /api/publish/:jobId/status` fires every ~2.5s |
| 7.6 | Status transitions | Watch platform cards | Platforms transition: waiting → processing → success/failed/pending_link |
| 7.7 | Completion | All platforms reach terminal status | After ~800ms delay, navigates to Listing Success screen |
| 7.8 | Success screen | Observe | Green checkmark, listing title, platform links |
| 7.9 | Dashboard toast | Navigate to Dashboard | "Listing published" toast appears briefly |
| 7.10 | Listing in list | Check My Listings tab | New listing appears with correct title, price, platforms |

### Backend Verification

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 7.11 | Listing in DB | `SELECT * FROM listings ORDER BY created_at DESC LIMIT 1` | Row matches frontend data |
| 7.12 | Publish job in DB | `SELECT * FROM publish_jobs ORDER BY created_at DESC LIMIT 1` | Status = "processing" or "success" |
| 7.13 | Platform jobs in DB | `SELECT * FROM publish_job_platforms WHERE job_id = '...'` | One row per connected platform |
| 7.14 | Structured logs | Check server stdout | `publish.job.created`, `publish.job.enqueued`, `publish.platform.start`, `publish.platform.done` events |

---

## 8. Publish Status Scenarios

### All Success

| # | Step | Expected Outcome |
|---|------|------------------|
| 8.1 | All platforms succeed | Every platform card shows green check and "success" |
| 8.2 | Auto-navigation | Screen transitions to Listing Success |
| 8.3 | Job status | `GET /api/publish/:id/status` returns `status: "success"` |

### Mixed Results

| # | Step | Expected Outcome |
|---|------|------------------|
| 8.4 | One success, one pending_link | Success platform: green check. Pending platform: amber clock icon, "link pending" label |
| 8.5 | Auto-navigation still fires | Both are terminal states; progress screen completes |
| 8.6 | Job status | `status: "success"` (at least one succeeded) |

### One Failure

| # | Step | Expected Outcome |
|---|------|------------------|
| 8.7 | One fails, others succeed | Failed platform: red alert icon, "failed" label, Retry button visible |
| 8.8 | Job status | `status: "success"` (some succeeded) |
| 8.9 | Retry button present | Red "Retry" button on failed platform row (UI only; does not re-trigger backend) |

### All Failures

| # | Step | Expected Outcome |
|---|------|------------------|
| 8.10 | All platforms fail | All cards show red failure state |
| 8.11 | Job status | `status: "failed"` |
| 8.12 | Navigation fires | Screen still transitions to Success/completion after terminal |

### Published Pending Link

| # | Step | Expected Outcome |
|---|------|------------------|
| 8.13 | Platform returns pending_link | Amber/yellow card: Clock icon, "link pending" text |
| 8.14 | Treated as terminal | Polling stops; screen completes |
| 8.15 | Platform status in DB | `publish_job_platforms.status = 'published_pending_link'` |

---

## 9. Package Limit Scenarios

### Basic Limit (3 listings)

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 9.1 | Create 3 listings | Publish 3 times | Dashboard shows 3 / 3; progress bar red |
| 9.2 | 4th listing attempt | Tap "Create New Listing" | Redirected to Packages screen with "Limit reached" view |
| 9.3 | Limit reached view | Observe Packages screen | Lock icon, "Limit reached" message, paid plan cards shown |
| 9.4 | Upgrade resolves | Select Premium, return | Can now create listings; limit shows 3 / 10 |

### Premium Limit (10 listings)

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 9.5 | Create 10 listings | Publish 10 times on Premium | Dashboard shows 10 / 10 |
| 9.6 | 11th attempt | Tap "Create New Listing" | Redirected to Packages with limit reached view |
| 9.7 | Premium+ resolves | Select Premium+ | Can create; shows X / ∞ |

### Premium+ (Unlimited)

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 9.8 | No limit block | Create many listings on Premium+ | Never redirected to Packages; counter shows X / ∞ |
| 9.9 | Infinity badge | Dashboard | Blue "Unlimited" badge with infinity icon |

### Upgrade Mid-Flow

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 9.10 | Limit reached during create | Start listing creation, hit limit on Publish | Redirected to Packages with resume flag |
| 9.11 | Upgrade and resume | Select higher plan | Returns to Create Listing screen (not Dashboard) |
| 9.12 | Draft preserved | Check form fields after resume | Category, price, description, images intact |

---

## 10. Recovery & Retry Scenarios

### Pending Link Recovery

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 10.1 | Manual trigger | Run `npm run smoke:recover-links` | Recovery service scans for `published_pending_link` rows |
| 10.2 | Recovery attempt logged | Check server logs | `recovery.scan.start`, `recovery.attempt.start` events |
| 10.3 | Recovery success | If connector resolves URL | Status updated to `success`; `external_url` populated |
| 10.4 | Recovery still pending | If URL still not found | Status stays `published_pending_link`; `retryCount` incremented |
| 10.5 | Recovery exhausted | After 5 failed attempts | `publish_metadata.recoveryState = 'exhausted'`; no more retries |

### Automatic Retry Scheduling

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 10.6 | Cron job registered | Check logs after server start | `pgboss.handlers.registered` includes recover schedule |
| 10.7 | Scheduled execution | Wait for cron interval (default: every 10 min) | `recovery.job.start` log entry appears automatically |
| 10.8 | Retry metadata | Query `publish_job_platforms` with pending status | `publish_metadata` contains `retryCount`, `lastRecoveryAttemptAt` |

### pg-boss Retry (Infrastructure)

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 10.9 | Transient DB failure during publish | Simulate by stopping DB briefly | pg-boss retries job (up to 2 retries, exponential backoff) |
| 10.10 | Connector error (non-transient) | Connector throws `ConnectorError` | Platform marked `failed`; pg-boss does NOT retry (error caught in handler) |

---

## 11. My Listings

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 11.1 | View listings | Navigate to My Listings tab | All created listings shown with title, price, image, platform badges |
| 11.2 | Edit listing | Tap edit on a listing | Create Listing screen pre-filled with listing data |
| 11.3 | Delete listing | Tap delete on a listing | Listing removed from list |
| 11.4 | Repost listing | Tap repost on a listing | New listing created as copy; success toast shown |
| 11.5 | Repost at limit | Repost when at listing limit | Redirected to Packages upgrade view |
| 11.6 | Empty state | Delete all listings | "No listings yet" empty state shown |

---

## 12. Profile

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 12.1 | View profile | Navigate to Profile tab | Shows name, phone, account type, plan label |
| 12.2 | Connected platforms | Scroll to platforms section | Lists all connected platform names |
| 12.3 | Plan badge | Check plan display | Matches selected plan (Basic / Premium / Premium+) |
| 12.4 | Support card | Check support section | "Standard support" for Basic/Premium; "Priority support" for Premium+ |

---

## 13. Logout

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 13.1 | Tap logout | Tap Logout button on Profile screen | Navigates to Start screen |
| 13.2 | State cleared | Check all state | connectedPlatforms, listings, profile, plan all reset to defaults |
| 13.3 | Reload after logout | Reload page | If backend session still valid → auto-hydrates to Dashboard; if not → Start screen |
| 13.4 | Fresh registration | Go through registration again | New OTP flow works; user restored from DB |

---

## 14. Language Persistence

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 14.1 | Language across screens | Select RU, navigate through all screens | All translatable labels in Russian |
| 14.2 | ShareProgress copy | Publish a listing | Progress labels ("waiting", "processing", etc.) in selected language |
| 14.3 | Packages copy | Visit Packages tab | Plan names, features, prices in selected language |

---

## 15. Error Handling

| # | Step | Action | Expected Outcome |
|---|------|--------|------------------|
| 15.1 | Backend down during OTP | Stop backend, try Send OTP | Error message shown: "Failed to send OTP" |
| 15.2 | Backend down during verify | Stop backend, try Verify | Error message shown: "Invalid OTP code" |
| 15.3 | Backend down during connect | Stop backend, try platform Verify | Error message shown: "Connection failed" |
| 15.4 | Backend down during publish | Stop backend, tap Publish | Publish falls through to ShareProgress with null jobId; onComplete fires immediately |
| 15.5 | Polling failure | Kill backend mid-poll | Polling continues silently (no crash); resumes when backend is back |
| 15.6 | 401 on hydration | Clear DB, reload | `GET /api/me` returns 401; app shows Start screen (no error flash) |

---

## 16. Multi-Platform Publish Scenarios

### 2 Platforms (Basic Plan)

| # | Scenario | Expected |
|---|----------|----------|
| 16.1 | Both Tap.az + Lalafo connected; publish | Progress shows 2 rows; both transition through statuses |
| 16.2 | Only Tap.az connected; publish | Progress shows 1 row (Tap.az only) |
| 16.3 | No platforms connected; publish attempt | `POST /api/publish` returns 400; frontend should handle gracefully |

### 5 Platforms (Premium/Premium+)

| # | Scenario | Expected |
|---|----------|----------|
| 16.4 | All 5 connected; publish | Progress shows 5 platform rows |
| 16.5 | 3 connected; publish | Progress shows 3 rows matching connected platforms |
| 16.6 | Mixed results across 5 | Each platform card shows its own status independently |

---

## 17. Structured Logging Verification

| # | Event | When | Key Fields |
|---|-------|------|------------|
| 17.1 | `auth.otp.sent` | After send-otp | `phone` |
| 17.2 | `platform.connected` | After platform connect | `platform`, `userId` |
| 17.3 | `publish.job.created` | After POST /publish | `jobId`, `listingId`, `platformCount` |
| 17.4 | `publish.job.enqueued` | After pg-boss send | `jobId`, `platform` |
| 17.5 | `publish.platform.start` | Worker picks up job | `jobId`, `platform` |
| 17.6 | `publish.platform.done` | Worker completes | `jobId`, `platform`, `status` |
| 17.7 | `publish.platform.failed` | Worker catches error | `jobId`, `platform`, `error` |
| 17.8 | `publish.job.finished` | All platforms done | `jobId`, `finalStatus`, breakdown |
| 17.9 | `recovery.scan.start` | Recovery job runs | count of pending rows |
| 17.10 | `recovery.attempt.exhausted` | Max retries reached | `platform`, `retryCount` |

---

## Bug Recording Template

Use this template to record issues found during QA:

```markdown
### BUG-{number}: {Short title}

**Severity:** Critical / High / Medium / Low
**Area:** Auth | Platforms | Listings | Publish | Packages | Profile | UI | Backend
**Screen:** {Screen name}
**Steps to reproduce:**

1. {Step 1}
2. {Step 2}
3. {Step 3}

**Expected:** {What should happen}
**Actual:** {What actually happens}
**Backend logs:** {Relevant structured log events, if any}
**Network requests:** {Relevant API calls and responses}
**DB state:** {Relevant query results, if applicable}
**Screenshots:** {Attach if applicable}
**Notes:** {Additional context}
```

### Severity Guidelines

| Severity | Definition | Example |
|----------|-----------|---------|
| **Critical** | App is unusable; data loss or corruption | Auth fails for all users; publish silently drops listings |
| **High** | Major feature broken; no workaround | Platform connection never persists; publish polling never stops |
| **Medium** | Feature partially broken; workaround exists | Wrong language on one screen; repost creates duplicate title |
| **Low** | Cosmetic or minor UX issue | Misaligned icon; extra whitespace on one screen |

---

## QA Summary Checklist

Before declaring the app ready for deployment, all of the following must pass:

- [ ] **P-1 to P-6**: All prerequisites met; proxy configured and verified
- [ ] **1.x**: App starts, language selection works for all 3 languages
- [ ] **2.x**: Registration + OTP flow works end-to-end; user created in DB
- [ ] **3.x**: Session hydration on reload works; unauthenticated reload shows Start
- [ ] **4.x**: Platform connection persists in DB; UI reflects connection state
- [ ] **5.x**: Package upgrade calls API; limits and platform availability update correctly
- [ ] **6.x**: Listing creation form works; data passed correctly to API
- [ ] **7.x**: Publish creates listing + job via API; polling shows real statuses
- [ ] **8.x**: All status scenarios render correctly (success, pending_link, failed, mixed)
- [ ] **9.x**: Package limits enforced; upgrade resolves limit; mid-flow upgrade resumes draft
- [ ] **10.x**: Recovery runs; retry metadata persists; exhaustion stops retries
- [ ] **11.x**: My Listings shows correct data; edit/delete/repost work
- [ ] **12.x**: Profile shows correct user data, plan, and platforms
- [ ] **13.x**: Logout clears state; re-registration works
- [ ] **14.x**: All 3 languages render correctly across all screens
- [ ] **15.x**: Error states handled gracefully; no crashes on backend unavailability
- [ ] **16.x**: Multi-platform publish shows correct number of platforms with independent statuses
- [ ] **17.x**: Structured logs present for all key lifecycle events
- [ ] **0 Critical bugs** open
- [ ] **0 High bugs** open

---

## Ready for Deployment After QA?

**YES — if all checklist items pass.**

The app covers the complete user journey:

1. **Authentication** — OTP-based, session-persistent
2. **Platform management** — 5 platforms, connection state persisted
3. **Package management** — 3 tiers with enforced limits
4. **Listing lifecycle** — create, edit, delete, repost
5. **Background publish** — pg-boss workers, per-platform isolation
6. **Real-time progress** — polling-based status updates
7. **Recovery** — automatic retry with exhaustion protection
8. **Observability** — structured JSON logging for all key events

Remaining items for production deployment (outside QA scope):

- HTTPS / TLS termination
- Real domain and DNS
- Environment variable hardening (no dev OTP codes)
- Rate limiting on auth endpoints
- Database backups and connection pooling
- Chrome/ChromeDriver availability on production host for Selenium connectors
- Monitoring/alerting stack (Datadog, Grafana, etc.) consuming structured logs
