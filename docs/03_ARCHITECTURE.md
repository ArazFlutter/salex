# 🏗 Sistem Arxitekturası — SALex

> Sistem necə işləyir. Data axınları. File struktur.

---

## Məntiqi Arxitektura

```
┌──────────────────────────────────────┐
│  TELEGRAM MINI APP (Next.js)         │
│  localhost:3000                       │
│  ├─ Daxıl olmaq (OTP/Telegram)       │
│  ├─ Siyahı yaratma                   │
│  ├─ Bazarları bağlama                │
│  └─ Yayımla + polling                │
└─────────────┬────────────────────────┘
              │ HTTP /api/*
              ▼
┌──────────────────────────────────────┐
│  EXPRESS BACKEND (Node.js)           │
│  localhost:4000                       │
│  ├─ API marşrutları                  │
│  ├─ pg-boss iş sırası                │
│  ├─ İş idarəçiləri                   │
│  └─ Selenium platform konnektorları  │
└─────────────┬────────────────────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
 TAPAZ     LALAFO    ALAN.AZ ...
(Chrome + Selenium automation)
    │         │         │
    └─────────┼─────────┘
              │
              ▼
        POSTGRESQL
        localhost:5432
```

---

## File Struktur

```
salex-main/
├── app/                          # Next.js Frontend
│   ├── page.tsx                  # Ana Telegram Mini App
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Tailwind + üslublar
├── components/
│   ├── screens/                  # Tam səhifə ekranları
│   ├── ui/                       # Yenidən istifadə UI
│   └── providers/                # Telegram provider
├── lib/
│   ├── api.ts                    # API kliyenti
│   ├── app-state.ts              # Tipləri & sabitlər
│   └── clientSession.ts          # localStorage idarəsi
├── src/                          # Express Backend
│   ├── server.ts                 # Daxıl olmaq nöqtəsi
│   ├── app.ts                    # Express setup
│   ├── routes/                   # API marşrutları
│   │   ├── auth.ts               # /api/auth/*
│   │   ├── listings.ts           # /api/listings
│   │   ├── publish.ts            # /api/publish
│   │   ├── platforms.ts          # /api/platforms
│   │   ├── packages.ts           # /api/packages
│   │   └── me.ts                 # /api/me
│   ├── services/                 # Biznes məntiqləri
│   │   ├── otpService.ts
│   │   ├── userService.ts
│   │   ├── listingService.ts
│   │   ├── publishService.ts
│   │   └── paymentService.ts
│   ├── connectors/               # Selenium automation
│   │   ├── index.ts              # Registry
│   │   ├── tapazConnector.ts
│   │   ├── lalafoConnector.ts
│   │   ├── alanazConnector.ts
│   │   ├── layloConnector.ts
│   │   ├── birjacomConnector.ts
│   │   └── seleniumSession.ts    # Chrome helper
│   ├── queue/                    # pg-boss
│   │   ├── boss.ts               # pg-boss instance
│   │   ├── handlers/             # İş idarəçiləri
│   │   │   ├── publishPlatform.ts
│   │   │   └── recoverPendingLinks.ts
│   │   ├── registerHandlers.ts
│   │   └── worker.ts             # Müstəqil işçi
│   ├── db/
│   │   ├── pool.ts               # PostgreSQL hovuzu
│   │   ├── schema.sql            # Cədvəl tərifləri
│   │   └── env.ts                # Env yükləyici
│   ├── middleware/
│   │   ├── authenticate.ts       # Auth yoxlaması
│   │   └── errorHandler.ts       # Xəta idarəçiliyi
│   └── utils/
│       ├── downloadImages.ts
│       ├── logging.ts
│       └── platforms.ts
├── docs/
│   ├── 01_START_HERE.md          # Sürətli başlanğıc
│   ├── 02_PROBLEMS.md            # Məlum problemlər
│   └── 03_ARCHITECTURE.md        # Bu fayl
├── .env.example                  # Ətraf dəyişən şablonu
├── package.json                  # Asılılıqlar
├── tsconfig.json                 # TypeScript
└── next.config.ts                # Next.js proxy
```

---

## API Nöqtələri

### Autentifikasiya

```
POST /api/auth/send-otp
  { phone: "+994501234567" }
  → { success, expiresAt }

POST /api/auth/verify-otp
  { phone, code: "1234" }
  → { success, user }

POST /api/auth/logout
  → { success }
```

### İstifadəçi

```
GET /api/me
  → { success, user }

GET /api/users/:id
  → { success, user }
```

### Siyahılar

```
GET /api/listings
  → { success, listings[] }

GET /api/listings/:id
  → { success, listing }

POST /api/listings
  { title, price, city, category, description, images, status }
  → { success, listing }

POST /api/listings/upload-image
  multipart form-data
  → { success, url: "/uploads/..." }
```

### Yayımlamaq

```
POST /api/publish/:listingId
  → { success, job: { id, status, platforms[] } }

GET /api/publish/:jobId/status
  → { success, job, platforms[] }
```

### Platformalar

```
GET /api/platforms
  → { success, platforms[] }

POST /api/platforms/connect
  { platform: "tapaz" }
  → { success, platform }
```

### Paketlər & Ödənişlər

```
GET /api/packages/current
  → { success, package: { activePlan, listingLimit } }

POST /api/packages/select
  { plan: "basic" }
  → { success, user, package }

POST /api/payments/create
  { plan: "premium" }
  → { success, paymentOrder, fakePaymentUrl }

POST /api/payments/confirm
  { paymentOrderId }
  → { success, user, package }
```

### Sağlamlıq

```
GET /api/health
  → { status: "ok", uptime, timestamp }
```

---

## Veritabanı Sxemi

### users
```sql
id UUID PRIMARY KEY
phone TEXT UNIQUE
full_name TEXT
account_type TEXT -- 'individual' | 'business'
active_plan TEXT -- 'basic' | 'premium' | 'premiumPlus'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### otp_sessions
```sql
id UUID PRIMARY KEY
phone TEXT
code TEXT
is_current BOOLEAN
verified_at TIMESTAMP
expires_at TIMESTAMP
created_at TIMESTAMP
```

### listings
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
title TEXT
price DECIMAL
city TEXT
category TEXT
description TEXT
images JSONB -- URL massividir
status TEXT -- 'draft' | 'active' | 'sold'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### platform_connections
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
platform TEXT -- 'tapaz', 'lalafo', və s.
access_token TEXT
refresh_token TEXT
expires_at TIMESTAMP
created_at TIMESTAMP
updated_at TIMESTAMP
```

### publish_jobs
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
listing_id UUID REFERENCES listings(id)
status TEXT -- 'processing' | 'success' | 'failed'
created_at TIMESTAMP
updated_at TIMESTAMP
```

### publish_job_platforms
```sql
id UUID PRIMARY KEY
job_id UUID REFERENCES publish_jobs(id)
platform TEXT
status TEXT -- 'waiting' | 'processing' | 'success' | 'failed'
external_listing_id TEXT
external_url TEXT
error TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## Data Axınları

### Autentifikasiya Axını

```
1. POST /api/auth/send-otp { phone }
   → OTP kodunu yaratma, cədvələ saxla, loqla

2. İstifadəçi kodu daxıl edir

3. POST /api/auth/verify-otp { phone, code }
   → Kodu yoxla, təsdiq et, is_current = TRUE

4. Sonrakı sorğular GET /api/me
   → DB-dən cari istifadəçini al (is_current sesiyadan)

5. POST /api/auth/logout
   → is_current = FALSE (bütün cihazlar çıxır)
```

### Yayımlamağı Axını

```
1. POST /api/publish/:listingId
   → Yayım işi yaratma, publish_jobs daxil et
   → Hər platform üçün pg-boss-a işi qəbul et
   → Cavab: { job }

2. Frontend polling: GET /api/publish/:jobId/status
   → publish_jobs_platforms-dən nəticələr al
   → { job, platforms[] }

3. [Arxa Plan] pg-boss iş handler: handlePublishPlatform
   → Siyahı al
   → Chrome + Selenium başlat
   → Platform-a daxıl ol
   → Formu doldur
   → Təqdim et
   → URL al
   → publish_job_platforms yəniləş

4. [Bərpa] Hər 10 dəq: handleRecoverPendingLinks
   → Uğursuz işləri tap
   → MAX_RECOVERY_RETRIES-ə qədər yenidən cəhd et
```

---

## Komponent Əlaqələri

### Frontend Seçdiyim

| Komponent | Məqsəd |
|-----------|--------|
| `app/page.tsx` | Ana Mini App (state, routing) |
| `components/screens/*` | Tam səhifə ekranları |
| `lib/api.ts` | API sorğuları |
| `lib/app-state.ts` | Global state typləri |

**Vəziyyət İdarəçiliyi:**
- React hook state (local)
- localStorage (cari istifadəçi ID)
- LanguageContext (dil seçimi)

### Backend Seçdiyim

| Katman | Məqsəd |
|--------|--------|
| Routes | HTTP idarəçiləri |
| Services | Biznes məntiqləri (istənməmiş DB detallı) |
| Connectors | Platform avtomasyonu |
| Queue | Async işlər |
| DB | SQL sorğuları |

**Error Handling:**
- AppError (custom class)
- errorHandler middleware
- JSON cavablar

---

## Platform Konnektorları

Hər platformanın (Tap.az, Lalafo, Alan.az, Laylo.az, Birja.com) öz konnektoru:

```typescript
interface PlatformConnector {
  publishListing(listing: NormalizedListing): Promise<PublishResult>;
  getListingUrl(result: PublishResult): string;
  normalizeError(error: any): string;
}
```

**Axın:**
1. Chrome başlat
2. Platform-a daxıl ol (telefon + OTP)
3. Siyahı yaratma səhifəsinə keç
4. Formu doldur
5. Təqdim et
6. URL al
7. Brauzer qapat

---

## pg-boss İş Sırası

```
┌─ API qəbul edir: POST /api/publish/:listingId
│
└─ publishService.createPublishJob()
   ├─ publish_jobs daxil et
   ├─ publish_job_platforms daxil et
   └─ Hər platform üçün:
      └─ boss.send('QUEUE_PUBLISH_PLATFORM', { ... })
      
┌─ Worker pollines pg-boss
│
└─ handlePublishPlatform(job)
   ├─ Siyahı yüklə
   ├─ Konnektoru çağırma
   └─ Nəticəni DB-yə saxla

┌─ Cron hər 10 dəq
│
└─ handleRecoverPendingLinks()
   ├─ Uğursuz işləri tap
   └─ Yenidən sırala
```

---

## Ətraf Dəyişənləri (Qısa)

| Dəyişən | Nümunə | Nə üçün |
|----------|--------|--------|
| `DATABASE_URL` | `postgres://...` | PostgreSQL |
| `PORT` | `4000` | Backend port |
| `NEXT_PUBLIC_BACKEND_URL` | `http://localhost:4000` | Frontend proxy |
| `{PLATFORM}_LOGIN_PHONE` | `+994501234567` | Platform login |
| `{PLATFORM}_OTP_CODE` | `1234` | Static OTP |
| `{PLATFORM}_OTP_FILE` | `.tapaz-otp` | File-based OTP |
| `CHROME_BIN` | `/usr/bin/chromium` | Chrome yolu |
| `RECOVERY_SCHEDULE_CRON` | `*/10 * * * *` | Bərpa cəd |
| `MAX_RECOVERY_RETRIES` | `5` | Əngil |

Bütün ətraf dəyişənlər üçün: bax `.env.example`

---

## İmportant Patterns

### Parametrləşdirilmiş Sorğular (SQL Injection-dən Təhlükəli)

```typescript
// ✓ TƏHLÜKƏSIZ
await pool.query('SELECT * FROM users WHERE id = $1', [userId])

// ✗ TAHLÜKƏLİ
await pool.query(`SELECT * FROM users WHERE id = ${userId}`)
```

### Error Handling

```typescript
// Services throw AppError
throw new AppError('Listing not found', 404)

// Routes catch everything → errorHandler → JSON
// Clients get: { error: { message, statusCode } }
```

### Async Jobs

```typescript
// Qəbul et, dərhal qaytarma
const job = await publishService.createPublishJob(...)
return res.json({ success: true, job })

// Worker eşzamanlı emal edir
// Client polling: GET /api/publish/:jobId/status
```

---

## Deployment Arxitekturası

```
Internet
   │
   ▼ HTTPS (reverse proxy)
┌─────────────┐
│ nginx/Caddy │ (TLS termination)
└──────┬──────┘
       │
   ┌───┴────────┐
   │            │
   ▼            ▼
Next.js    Express
:3000      :4000
   │            │
   └───┬────────┘
       │
       ▼
   PostgreSQL
    :5432
```

**Başlanğıc Sırası:**
1. PostgreSQL
2. Express (db bağlantısı + pg-boss)
3. Next.js (frontend /api proxy)

---

## Sözlük

| Termin | Məna |
|--------|------|
| **Mini App** | Telegram-ın içində çalışan web applikasiyası |
| **pg-boss** | PostgreSQL-dən iş sırası (Redis yoxdur) |
| **Connector** | Platform avtomasyonu (Selenium + Chrome) |
| **OTP** | Bir dəfəlik Parol (SMS ya fayl-əsaslı) |
| **Job** | Async işi (məs., yayımlamağı) |
| **Publishing** | Siyahıyı platformalara göndərmə |
| **Recovery** | Uğursuz yayımlamaları yenidən cəhd |

---

**Son Yeniləmə:** May 2026  
**Oxudu?** [02_PROBLEMS.md](./02_PROBLEMS.md)-ə keçin