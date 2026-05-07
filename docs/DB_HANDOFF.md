# Database Handoff — SALex

**✅ VERIFIED** from `src/db/schema.sql` + service usage.

---

## Connection — ✅ VERIFIED

- `**DATABASE_URL`** required at backend startup (`src/db/env.ts`).
- Pool: `src/db/pool.ts`.

---

## Bootstrap — ✅ VERIFIED

- `**npm run db:bootstrap**` runs `src/db/bootstrap.ts` → executes full `**schema.sql**` in a transaction.

---

## Tables — ✅ VERIFIED

### `users`


| Column                                                       | Purpose                                    |
| ------------------------------------------------------------ | ------------------------------------------ |
| `id`                                                         | PK (text), e.g. `user-{digits}` from phone |
| `full_name`, `phone` (unique), `account_type`, `active_plan` | Profile + plan                             |
| `created_at`, `updated_at`                                   | Timestamps                                 |


### `platform_connections`


| Column                           | Purpose                |
| -------------------------------- | ---------------------- |
| `user_id` → `users`              | Owner                  |
| `platform_id`                    | e.g. `tapaz`, `lalafo` |
| `connected`                      | Boolean                |
| UNIQUE(`user_id`, `platform_id`) |                        |


### `otp_sessions` — OTP + implicit “session”


| Column                                    | Purpose                                          |
| ----------------------------------------- | ------------------------------------------------ |
| `phone`, `code`, `expires_at`, `attempts` | OTP challenge                                    |
| `verified_at`                             | Set on success                                   |
| `is_current`                              | **Global** “logged in” flag for `getCurrentUser` |
| `user_id`                                 | Set after verify                                 |


**Logic — ✅ VERIFIED** (`otpService.ts`):

- `sendOtp`: INSERT new row, `is_current = FALSE`.
- `verifyOtp`: match **latest** row by phone (`ORDER BY created_at DESC, id DESC`); on success set **all** `is_current` false then set winner `is_current = TRUE`.
- `logout`: all `is_current = FALSE`.

**Indexes — ✅ VERIFIED:** `(phone, created_at DESC)`.

### `listings`


| Column                                              | Purpose                    |
| --------------------------------------------------- | -------------------------- |
| `id` (text PK), `user_id`                           | Owner                      |
| `title`, `category`, `price`, `city`, `description` | Core fields                |
| `images`                                            | JSONB array of URL strings |
| `status`                                            | `draft` | `active`         |
| `created_at`                                        |                            |


### `publish_jobs`


| Column                                  | Purpose                                         |
| --------------------------------------- | ----------------------------------------------- |
| `id` (text PK), `user_id`, `listing_id` | Job envelope                                    |
| `status`                                | `waiting` | `processing` | `success` | `failed` |
| `created_at`, `updated_at`              |                                                 |


**Note — ⚠️ PARTIAL:** `createPublishJob` inserts with status `**processing`** (`publishService.ts`); schema allows `waiting` as well.

### `publish_job_platforms`


| Column                                                    | Purpose                                                                   |
| --------------------------------------------------------- | ------------------------------------------------------------------------- |
| `publish_job_id`                                          | FK                                                                        |
| `platform`                                                | Display name string (e.g. `Tap.az`) per insert code                       |
| `status`                                                  | Platform row status (includes `published_pending_link` etc. in app types) |
| `external_listing_id`, `external_url`, `publish_metadata` | Outcome                                                                   |


### `platform_sessions`


| Column                                              | Purpose                               |
| --------------------------------------------------- | ------------------------------------- |
| `user_id`, `platform_id`                            | Per-user marketplace Selenium session |
| `cookies` (JSONB), `local_storage`, `session_valid` | Persisted browser state               |
| `last_login_at`                                     |                                       |


Used by `**platformSessionService**` for connector auth persistence (**✅ VERIFIED** imports in connectors).

### `payment_orders`


| Column                                                  | Purpose          |
| ------------------------------------------------------- | ---------------- |
| `id`, `user_id`, `plan`, `amount`, `currency`, `status` | Checkout records |


---

## pg-boss — ✅ VERIFIED

- Separate schema `**pgboss`** (not in `schema.sql` — created by pg-boss library).
- Queues: publish platform, recover pending links (`src/queue/boss.ts`).

---

## Relationships (ER summary) — ✅ VERIFIED

```text
users 1──* platform_connections
users 1──* listings
users 1──* publish_jobs
users 1──* platform_sessions
users 1──* payment_orders
listings 1──* publish_jobs
publish_jobs 1──* publish_job_platforms
otp_sessions.user_id ──► users (nullable until verify)
```

---

## Active hosts


| Resource   | Config         |
| ---------- | -------------- |
| PostgreSQL | `DATABASE_URL` |


