# API Handoff — SALex

**Base path:** **`/api`** on Express (`src/app.ts`).  
**Browser:** same paths on Next origin (**`http://localhost:3000/api/...`**) via rewrite to backend (**✅ VERIFIED** `next.config.ts`).

**Auth:** **✅ VERIFIED** — No `Authorization` header. Authenticated routes call `getCurrentUser()` which requires **`otp_sessions.is_current = TRUE`** + verified user. Unauthenticated → **401** (`AppError`).

**Errors:** **✅ VERIFIED** — JSON `{ error: { message, statusCode } }` unless otherwise noted.

Tags: **✅ VERIFIED** from `src/routes/*` + controllers/services.

---

## Active hosts — ✅ VERIFIED

| Client path | Proxies to |
|-------------|------------|
| `http://localhost:3000/api/*` | `NEXT_PUBLIC_BACKEND_URL` + `/api/*` (default `:4000`) |
| Direct API | `http://localhost:4000/api/*` (or `PORT`) |

---

## Auth — `src/routes/auth.ts`

### `POST /api/auth/send-otp` — ✅ VERIFIED

| | |
|--|--|
| **Body** | `{ phone: string }` |
| **Response** | `{ success: true, phone, expiresAt }` |
| **Auth** | No |
| **Errors** | 400 if phone empty (`AppError`) |

### `POST /api/auth/verify-otp` — ✅ VERIFIED

| | |
|--|--|
| **Body** | `{ phone: string, code: string }` |
| **Response** | `{ success: true, user }` (`user` shape from `userService`) |
| **Auth** | No |
| **Errors** | 400/404/429 — see `otpService.verifyOtp` |

### `POST /api/auth/logout` — ✅ VERIFIED

| | |
|--|--|
| **Body** | — |
| **Response** | `{ success: true }` |
| **Auth** | **✅ VERIFIED** does not call `getCurrentUser`; clears **all** `is_current` OTP rows (`clearGlobalAuthSession`) |
| **Note** | ❗ Global logout for “current session” model |

---

## Me — `src/routes/me.ts`

### `GET /api/me` — ✅ VERIFIED

| | |
|--|--|
| **Response** | User payload (via `getMeController` / `userService`) |
| **Auth** | Yes (401 if no current OTP session) |

---

## Listings — `src/routes/listings.ts`

### `POST /api/listings/upload-image` — ✅ VERIFIED

| | |
|--|--|
| **Content-Type** | `multipart/form-data`, field name **`image`** |
| **Response** | `{ success: true, url: "/uploads/..." }` |
| **Auth** | **✅ VERIFIED** `getCurrentUser()` in controller |
| **Errors** | 400 no file; 400 non-image (multer/AppError) |
| **Limit** | 8MB (**✅ VERIFIED** `listingImageUpload.ts`) |

### `POST /api/listings` — ✅ VERIFIED

| | |
|--|--|
| **Body** | JSON; validated fields: title, category, price, city, description, images[], status (`draft`|`active`) — see `listingService.validateCreateInput` |
| **Response** | `{ success: true, listing }` |
| **Auth** | Yes |
| **Errors** | 400 validation; 403 listing limit (`packagePlans`) |

### `GET /api/listings` — ✅ VERIFIED

| | |
|--|--|
| **Response** | `{ success: true, listings: [...] }` for current user |
| **Auth** | Yes |

### `GET /api/listings/:id` — ✅ VERIFIED

| | |
|--|--|
| **Response** | `{ success: true, listing }` |
| **Auth** | Yes |
| **Errors** | 404 not found / not owner |

---

## Publish — `src/routes/publish.ts`

### `POST /api/publish/:listingId` — ✅ VERIFIED

| | |
|--|--|
| **Response** | `{ success: true, job }` — see `publishService.createPublishJob` |
| **Auth** | Yes |
| **Errors** | 400 no platforms; 403 plan vs platform rules; etc. |

### `GET /api/publish/:id/status` — ✅ VERIFIED

| | |
|--|--|
| **Param** | `:id` = **publish job id** (not listing id) |
| **Response** | `{ success, id, listingId, status, platforms: [...] }` |
| **Auth** | Yes |
| **Errors** | 404 |

---

## Platforms — `src/routes/platforms.ts`

### `GET /api/platforms` — ✅ VERIFIED

| | |
|--|--|
| **Response** | `{ success: true, platforms: [...] }` with `id`, `name`, `connected`, `allowedByPlan` |
| **Auth** | **Yes** — `getCurrentUser()` inside `buildPlatforms()` |

### `POST /api/platforms/connect` — ✅ VERIFIED

| | |
|--|--|
| **Body** | `{ platform: string }` |
| **Response** | From `connectPlatform` (returns updated user context) |
| **Auth** | **Yes** |
| **Errors** | 400 unsupported platform; 403 not in plan |

---

## Packages — `src/routes/packages.ts`

### `GET /api/packages/catalog` — ✅ VERIFIED

### `GET /api/packages/current` — ✅ VERIFIED

### `POST /api/packages/select` — ✅ VERIFIED

| **Body** | `{ plan: string }` |

---

## Payments — `src/routes/payments.ts`

### `POST /api/payments/create` — ✅ VERIFIED

| **Body** | `{ plan: string }` |

### `POST /api/payments/confirm` — ✅ VERIFIED

| **Body** | `{ paymentOrderId` or `id` |

### `GET /api/payments/:id` — ✅ VERIFIED

---

## Health — `src/routes/health.ts`

### `GET /api/health` — ✅ VERIFIED

| **Response** | `{ status: 'ok', uptime, timestamp }` (`healthService.ts`) |
| **Auth** | No |

---

## Static

### `GET /uploads/*` — ✅ VERIFIED

Served by Express (`express.static('uploads')`); proxied through Next `/uploads/*`.
