# Salex Backend — API Contract

All endpoints are prefixed with `/api`. All request/response bodies are JSON.

## Common Response Patterns

**Success responses** include `"success": true` at the top level.

**Error responses** use the shape:

```json
{
  "error": {
    "message": "Human-readable error message",
    "statusCode": 400
  }
}
```

Common status codes: `400` (bad input), `401` (not authenticated), `403` (limit reached), `404` (not found), `429` (rate limited).

---

## Authentication

### `POST /api/auth/send-otp`

Send a one-time password to a phone number.

**Request body:**

```json
{ "phone": "+994501234567" }
```

**Response `200`:**

```json
{
  "success": true,
  "phone": "+994501234567",
  "expiresAt": "2026-04-07T20:02:00.000Z"
}
```

### `POST /api/auth/verify-otp`

Verify the OTP code and authenticate the user.

**Request body:**

```json
{ "phone": "+994501234567", "code": "1234" }
```

**Response `200`:**

```json
{
  "success": true,
  "user": {
    "id": "user-994501234567",
    "fullName": "User 4567",
    "phone": "+994501234567",
    "accountType": "individual",
    "activePlan": "basic",
    "platformConnections": {}
  }
}
```

---

## Current User

### `GET /api/me`

Get the currently authenticated user profile.

**Response `200`:**

```json
{
  "success": true,
  "user": {
    "id": "user-994501234567",
    "fullName": "User 4567",
    "phone": "+994501234567",
    "accountType": "individual",
    "activePlan": "basic",
    "platformConnections": {
      "tapaz": true,
      "lalafo": true
    }
  }
}
```

**Key fields:**

| Field | Type | Values |
|---|---|---|
| `activePlan` | string | `"basic"`, `"premium"`, `"premiumPlus"` |
| `platformConnections` | object | Keys are platform IDs, value is `true` if connected |

---

## Packages

### `GET /api/packages/current`

Get the current user's active package and listing limit.

**Response `200`:**

```json
{
  "success": true,
  "package": {
    "activePlan": "basic",
    "listingLimit": 3
  }
}
```

**Listing limits by plan:**

| Plan | Limit |
|---|---|
| `basic` | 3 |
| `premium` | 10 |
| `premiumPlus` | unlimited (`null`) |

### `POST /api/packages/select`

Switch to the **free basic** plan immediately. Paid plans (`premium`, `premiumPlus`) must be activated via the payment flow (`POST /api/payments/create` then `POST /api/payments/confirm`).

**Request body:**

```json
{ "plan": "basic" }
```

**Response `200`:** Same shape as before (`user`, `package`).

**Error `400`:** If `plan` is `premium` or `premiumPlus`, returns a message directing the client to the payments API.

---

## Payments (development / fake checkout)

No real payment provider is integrated. Orders are stored in PostgreSQL; confirming marks the order paid and updates the user’s `active_plan`.

### `POST /api/payments/create`

**Request body:**

```json
{ "plan": "premium" }
```

`plan` must be `"premium"` or `"premiumPlus"`. Amounts: premium **10 AZN**, premiumPlus **20 AZN** (configurable in code).

**Response `201`:**

```json
{
  "success": true,
  "paymentOrder": {
    "id": "payment-…",
    "userId": "user-…",
    "plan": "premium",
    "amount": 10,
    "currency": "AZN",
    "status": "pending",
    "createdAt": "…",
    "updatedAt": "…"
  },
  "fakePaymentUrl": "http://localhost:3000/?devPaymentOrderId=payment-…"
}
```

### `POST /api/payments/confirm`

**Request body:**

```json
{ "paymentOrderId": "payment-…" }
```

Also accepts `id` as an alias for `paymentOrderId`.

**Response `200`:** `{ "success": true, "paymentOrder", "user", "package" }` — same `user` / `package` shapes as other authenticated responses.

**Error `400`:** Order not `pending` (e.g. already paid).

### `GET /api/payments/:id`

Returns the payment order if it belongs to the current user.

**Response `200`:** `{ "success": true, "paymentOrder": { … } }`

---

## Platforms

### `GET /api/platforms`

List all supported platforms and their connection status.

**Response `200`:**

```json
{
  "success": true,
  "platforms": [
    { "id": "tapaz", "name": "Tap.az", "connected": true },
    { "id": "lalafo", "name": "Lalafo", "connected": false },
    { "id": "alanaz", "name": "Alan.az", "connected": false },
    { "id": "laylo", "name": "Laylo.az", "connected": false },
    { "id": "birjacom", "name": "Birja.com", "connected": false }
  ]
}
```

**Platform IDs:** `tapaz`, `lalafo`, `alanaz`, `laylo`, `birjacom`

### `POST /api/platforms/connect`

Connect the current user to a platform.

**Request body:**

```json
{ "platform": "tapaz" }
```

Accepts platform ID (`tapaz`), display name (`Tap.az`), or alias (`tap.az`).

**Response `200`:**

```json
{
  "success": true,
  "message": "Tap.az connected successfully",
  "platform": {
    "id": "tapaz",
    "name": "Tap.az",
    "connected": true
  },
  "user": { "...full user object..." }
}
```

---

## Listings

### `POST /api/listings`

Create a new listing.

**Request body:**

```json
{
  "title": "iPhone 15 Pro",
  "category": "Elektronika",
  "price": 1500,
  "city": "Bakı",
  "description": "Brand new, sealed box",
  "images": ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  "status": "active"
}
```

All fields are required. `status` must be `"draft"` or `"active"`. `images` is an array of URL strings.

**Response `201`:**

```json
{
  "success": true,
  "listing": {
    "id": "listing-abc-123",
    "userId": "user-994501234567",
    "title": "iPhone 15 Pro",
    "category": "Elektronika",
    "price": 1500,
    "city": "Bakı",
    "description": "Brand new, sealed box",
    "images": ["https://example.com/photo1.jpg"],
    "status": "active",
    "createdAt": "2026-04-07T20:00:00.000Z"
  }
}
```

**Error `403`:** `"Listing limit reached for current package"` — user must upgrade plan.

### `GET /api/listings`

Get all listings for the current user.

**Response `200`:**

```json
{
  "success": true,
  "listings": [
    { "...listing object..." },
    { "...listing object..." }
  ]
}
```

Listings are ordered by `createdAt` descending (newest first).

### `GET /api/listings/:id`

Get a single listing by ID.

**Response `200`:**

```json
{
  "success": true,
  "listing": { "...listing object..." }
}
```

---

## Publishing

### `POST /api/publish/:listingId`

Publish a listing to all connected platforms. Returns immediately — actual publishing happens in background.

**Response `201`:**

```json
{
  "success": true,
  "job": {
    "id": "publish-job-abc-123",
    "userId": "user-994501234567",
    "listingId": "listing-abc-123",
    "status": "processing",
    "platforms": [
      {
        "platform": "Tap.az",
        "status": "waiting",
        "externalListingId": null,
        "externalUrl": null,
        "publishMetadata": null
      },
      {
        "platform": "Lalafo",
        "status": "waiting",
        "externalListingId": null,
        "externalUrl": null,
        "publishMetadata": null
      }
    ]
  }
}
```

**Error `400`:** `"No connected platforms found"` — user must connect at least one platform first.

### `GET /api/publish/:id/status`

Poll the status of a publish job. Use this to track progress after creating a publish job.

**Response `200`:**

```json
{
  "success": true,
  "id": "publish-job-abc-123",
  "listingId": "listing-abc-123",
  "status": "processing",
  "platforms": [
    {
      "platform": "Tap.az",
      "status": "success",
      "externalListingId": "12345",
      "externalUrl": "https://tap.az/elanlar/12345",
      "publishMetadata": {
        "normalizedListingId": "listing-abc-123",
        "listingTitle": "iPhone 15 Pro",
        "listingPrice": 1500
      }
    },
    {
      "platform": "Lalafo",
      "status": "published_pending_link",
      "externalListingId": "67890",
      "externalUrl": null,
      "publishMetadata": {
        "normalizedListingId": "listing-abc-123"
      }
    }
  ]
}
```

**Job-level `status` values:**

| Value | Meaning |
|---|---|
| `processing` | At least one platform is still being published |
| `success` | All platforms completed (at least one succeeded) |
| `failed` | All platforms failed |

**Per-platform `status` values:**

| Value | Meaning | Frontend action |
|---|---|---|
| `waiting` | Queued, not started yet | Show spinner |
| `processing` | Currently publishing | Show spinner |
| `success` | Published, URL available | Show link to `externalUrl` |
| `published_pending_link` | Published but URL not yet recovered | Show "Published" without link |
| `failed` | Platform publish failed | Show error from `publishMetadata` |

**Polling strategy:** Call `GET /api/publish/:id/status` every 3–5 seconds until `status` is `"success"` or `"failed"`.

---

## Health

### `GET /api/health`

**Response `200`:**

```json
{
  "status": "ok",
  "uptime": 123.456,
  "timestamp": "2026-04-07T20:00:00.000Z"
}
```

---

## Frontend Integration Guide

### Authentication Flow

1. Call `POST /api/auth/send-otp` with phone number
2. User enters OTP code
3. Call `POST /api/auth/verify-otp` with phone + code
4. On success, user is authenticated (session-based via OTP table)
5. All subsequent requests use the authenticated session

### Package & payment flow (dev)

1. **Basic (free):** `POST /api/packages/select` with `{ "plan": "basic" }` — immediate.
2. **Premium / Premium+:** `POST /api/payments/create` with `{ "plan": "premium" | "premiumPlus" }`, then show the in-app dev checkout and `POST /api/payments/confirm` with `{ "paymentOrderId": "…" }`. The user’s `active_plan` updates only on successful confirm.

### Publishing Flow

1. Ensure user has connected platforms (`GET /api/platforms`)
2. Ensure user has a listing (`POST /api/listings` or `GET /api/listings`)
3. Call `POST /api/publish/:listingId` — returns instantly with job ID
4. Poll `GET /api/publish/:jobId/status` every 3–5 seconds
5. Display per-platform results as they complete
6. When job `status` is `success` or `failed`, stop polling

### Platform Status Display

For each platform in the status response:

- **`waiting`** → gray spinner, "Queued"
- **`processing`** → blue spinner, "Publishing..."
- **`success`** → green check, link to `externalUrl`
- **`published_pending_link`** → yellow check, "Published (link pending)"
- **`failed`** → red X, show error from `publishMetadata.errorMessage`

### Error Handling

All errors return `{ error: { message, statusCode } }`. The `message` field is always a user-friendly string suitable for display.
