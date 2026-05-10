# Sistem Arxitekturası — SALex

SALex-in sistem dizaynı, məlumat axınları və komponent əlaqələrinə hərtərəfli bələdçi.

---

## 1. Məntiqi Arxitektura

```
┌──────────────────────────────────────────────────────────────────────┐
│                         TELEGRAM                                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  Telegram Mini App (Next.js Frontend)                        │   │
│  │  Brauzer: http://localhost:3000                             │   │
│  │  ┌────────────────────────────────────────────────────────┐ │   │
│  │  │  • Daxil olma ekranı (OTP təsdiqləməsi)                │ │   │
│  │  │  • Siyahı yaratma (forma, şəkil yükləməsi)            │ │   │
│  │  │  • Bazarları bağlama (Selenium popup)                 │ │   │
│  │  │  • Yayımla və vəziyyəti izlə (polling)                │ │   │
│  │  └────────────────────────────────────────────────────────┘ │   │
│  └────────────────────────────────────────────────────────────────┘   │
│         │                                                                │
└─────────┼────────────────────────────────────────────────────────────┘
          │ HTTP sorğuları
          │ (Next.js proxy yenidən yazması vasitəsilə)
          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     EXPRESS BACKEND (Node.js)                        │
│  Port: 4000 (dəyişdirilə bilinən)                                    │
│  Daxil olma: src/server.ts                                           │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  API Marşrutları (src/routes/*.ts)                           │ │
│  │  • POST /api/auth/send-otp, /verify-otp                      │ │
│  │  • GET /api/me (cari istifadəçi)                             │ │
│  │  • POST /api/listings, GET /api/listings/:id                 │ │
│  │  • POST /api/listings/upload-image                           │ │
│  │  • POST /api/platforms/connect                               │ │
│  │  • POST /api/publish/:listingId (işlər yaradır)              │ │
│  │  • GET /api/publish/:id/status (iş vəziyyəti)                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│         │                                                              │
│  ┌──────┴─────────────────────────────────────────────────────────┐ │
│  │  pg-boss İş Sırası (PostgreSQL-dən ehtiyat)                  │ │
│  │  • QUEUE_PUBLISH_PLATFORM                                    │ │
│  │  • QUEUE_RECOVER_PENDING_LINKS                               │ │
│  │  • Cədvəlləşdirilmiş bərpa cron işi                           │ │
│  └──────┬─────────────────────────────────────────────────────────┘ │
│         │                                                              │
│  ┌──────▼─────────────────────────────────────────────────────────┐ │
│  │  İş İdarəçiləri (src/queue/handlers/)                        │ │
│  │  • handlePublishPlatform: Bir bazara yayımla                 │ │
│  │  • handleRecoverPendingLinks: Uğursuz yayımları yenidən cəhd et │
│  └──────┬─────────────────────────────────────────────────────────┘ │
│         │                                                              │
│  ┌──────▼─────────────────────────────────────────────────────────┐ │
│  │  Platform Konnektorları (src/connectors/)                    │ │
│  │  • TapazConnector (Chrome + Selenium)                        │ │
│  │  • LalafoConnector                                           │ │
│  │  • AlanazConnector                                           │ │
│  │  • LayloConnector                                            │ │
│  │  • BirjacomConnector                                         │ │
│  │                                                               │ │
│  │  Hər biri: login() → fillForm() → submit() → getUrl()        │ │
│  └──────┬─────────────────────────────────────────────────────────┘ │
└─────────┼────────────────────────────────────────────────────────────┘
          │ Selenium avtomasyonu
          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     BAZAR PLATFORMALARI                              │
│  • Tap.az     (Chrome + Selenium headless)                           │
│  • Lalafo     (Chrome + Selenium headless)                           │
│  • Alan.az    (Chrome + Selenium headless) [Hələ tətbiq olunmadı]   │
│  • Laylo.az   (Chrome + Selenium headless)                           │
│  • Birja.com  (Chrome + Selenium headless) [Hələ tətbiq olunmadı]   │
└──────────────────────────────────────────────────────────────────────┘

          │ Veritabanı oxunuş/yazışları
          │ (eyni DATABASE_URL)
          ▼
┌──────────────────────────────────────────────────────────────────────┐
│                        POSTGRESQL                                    │
│  Cədvəllər:                                                          │
│  • users: id, phone, full_name, account_type, active_plan          │
│  • listings: id, user_id, title, price, city, category, images    │
│  • otp_sessions: phone, code, is_current, verified_at              │
│  • platform_connections: user_id, platform, access_token, və s.   │
│  • publish_jobs: id, user_id, listing_id, status, created_at      │
│  • publish_job_platforms: job_id, platform, status, url           │
│  • pgboss.*: Daxili pg-boss sırası sxemi                           │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Komponent Boşluğu

### 2.1 Frontend (Next.js)

**Fayl:** `app/page.tsx` (əsas Telegram Mini App)

**Ekranlar:**
- `StartScreen`: Salamlaşma, "Hesab yaratma" düyməsi
- `LanguageScreen`: Dil seçin (Azərbaycanca, Rus, İngilis)
- `RegistrationScreen`: Telefon nömrəsi daxil edin, OTP kodu təsdiqləsin
- `RegistrationSuccessScreen`: "Yaratmağa başla" düyməsi
- `DashboardScreen`: Siyahıları görün, yeni yaradın, hesabı idarə edin
- `CreateListingScreen`: Başlıq, qiymət, şəkillər, kateqoriya, şəhər, təsvir forması
- `ImageUploadScreen`: Şəkilləri yüklə və yenidən düzən
- `PlatformActivationScreen`: Hansı bazarları istifadə etməyi seçin
- `PlatformConnectionScreen`: Bazar hesablarını bağla (Selenium popup)
- `SharePlanScreen`: Bu siyahı üçün bazarları seçin
- `ShareProgressScreen`: Hər bazara yayım irəliləməsini göstərin
- `ListingSuccessScreen`: Təsdiq ekranı
- `MyListingsScreen`: İstifadəçinin yayımlanmış siyahılarını sıralay
- `StatisticsScreen`: Analytics-i görün/redaktə edin
- `PackagesScreen`: Qiymət planını seçin (basic/premium/premiumPlus)
- `ProfileScreen`: Profili görün, bağlı bazarları, çıxış

**Əsas Kontekstlər:**
- `LanguageContext`: Dil seçimini idarə edir, tərcəmə funksiyasını sağlayır
- `TelegramMiniAppProvider`: Telegram Web App SDK-nı işə salır; applikasiya həyat siklusunu idarə edir

**Vəziyyət İdarəçiliyi:**
- `app/page.tsx`-də yerli React vəziyyəti (ekran, siyahılar, profil, draft)
- Dil seçimi üçün localStorage
- `localStorage.getItem('salex_client_user_id')` istifadəçini cari brauzer tabbına bağlamaq üçün

---

### 2.2 Backend API (Express)

**Daxil olma:** `src/server.ts`

**Addımlar:**
1. `.env`-dən ətraf dəyişənləri yüklə
2. PostgreSQL bağlantısını yoxla
3. pg-boss başlat (iş sırası)
4. İş idarəçilərini qeydə al (`registerHandlers`)
5. Express applikasiyasını `PORT`-da (default 4000) bağla

**Marşrutlar (src/routes/):**
- `auth.ts`: OTP göndər/təsdiqə al, çıxış
- `listings.ts`: CRUD əməliyyatları, şəkil yüklə
- `publish.ts`: Yayım işlərini yaradın, vəziyyəti alın
- `platforms.ts`: Bazar hesablarını bağla
- `me.ts`: Cari istifadəçi profilini al

**Xidmətlər (src/services/):**
- `otpService`: OTP kodlarını yaratma, göndər, təsdiqə
- `userService`: İstifadəçiləri al/yarat, sesiayaları idarə et
- `listingService`: Siyahıları doğrula, yarat, al
- `publishService`: İşlər yaratma, yayımlamağı əlaqələndir
- `paymentService`: Premium paket ödənişlərini idarə et

**Middleware (src/middleware/):**
- `authenticate`: Cari istifadəçi sesiyasını yoxla
- `errorHandler`: AppError tutun və JSON qaytarın

**Veritabanı Girişi (src/db/):**
- `pool.ts`: PostgreSQL bağlantı hovuzu
- `schema.sql`: Cədvəl tərifləri
- Xidmətlər `pool.query()` istifadə edərək parametrləşdirilmiş sorğularla sorğu göndərir

---

### 2.3 İş Sırası (pg-boss)

**Kitabxana:** pg-boss eyni PostgreSQL misjəsində çalışır

**Sıralar:**
1. `QUEUE_PUBLISH_PLATFORM` — Siyahı başına platform başına bir iş
   - Yaradıldı: `POST /api/publish/:listingId`
   - İdarəçi: `handlePublishPlatform`
   - Yük: `{ listingId, platform, userId }`

2. `QUEUE_RECOVER_PENDING_LINKS` — Bərpa işi
   - Cədvəldə çalışır: `RECOVERY_SCHEDULE_CRON` (məs., `*/10 * * * *` = hər 10 dəq)
   - İdarəçi: `handleRecoverPendingLinks`
   - Uğursuz yayımlamaları `MAX_RECOVERY_RETRIES` sayıncadək yenidən cəhd et

**İdarəçi Qeydiyyatı:**
- `src/server.ts`-də çağırılır (API idarəçiləri çalıştırır)
- `src/queue/worker.ts`-də də çağırılır (müstəqil işçi prosesi)
- **⚠️ Dizayn qeydləri:** Produksiyada hər ikisini niyyətləndirilmiş olmasa çalıştırmakdan çəkinən (işləri iki dəfə emal etmə riski)

---

### 2.4 Selenium Platform Konnektorları

**Reyestr:** `src/connectors/index.ts`

```typescript
const connectors: Map<PlatformId, PlatformConnector> = new Map([
  ['tapaz', new TapazConnector()],
  ['lalafo', new LalafoConnector()],
  ['alanaz', new AlanazConnector()],
  ['laylo', new LayloConnector()],
  ['birjacom', new BirjacomConnector()],
]);
```

**İnterfeys (baseConnector.ts):**
```typescript
interface PlatformConnector {
  publishListing(listing: NormalizedListing): Promise<PublishResult>;
  getListingUrl(result: PublishResult): string;
  normalizeError(error: any): string;
}
```

**Axın (hər konnektord):**
1. **Daxil olmaq:** Chrome seçənlərini qur, headless brauzer başlat, daxil olma formasını doldur, OTP-ni təsdiqə
2. **Naviqasiya:** Siyahı yaratma səhifəsinə keç
3. **Form Doldur:** Standartlaşdırılmış siyahı məlumatını platforma spesifik sahələrə xəritələ
4. **Təqdim Et:** Yaratma/yayım düyməsinə klik et
5. **URL Alın:** Siyahı URL-ni brauzerdən və ya API cavabından çıxarın
6. **Təmizləmə:** Brauzer qapat, cookies təmizlə

**Platforma Spesifik Təfərrüatlar:**
- **Tap.az:** Şəbəkə sorğularını intercept/override etmək üçün Chrome DevTools Protocol (CDP) istifadə edir; OTP fayl və ya konsol vasitəsilə göndərilir
- **Lalafo:** Oxşar daxil olma axını; fərqli forma struktur
- **Alan.az, Laylo.az, Birja.com:** Konnektoru skeletləri mövcud; tam sınaqdan keçməyib

---

### 2.5 Veritabanı Sxemi

**Əsas Cədvəllər:**

```sql
-- İstifadəçilər
CREATE TABLE users (
  id UUID PRIMARY KEY,
  phone TEXT UNIQUE,
  full_name TEXT,
  account_type TEXT, -- 'individual' və ya 'business'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- OTP Sesilaşdırma (autentifikasiya)
CREATE TABLE otp_sessions (
  id UUID PRIMARY KEY,
  phone TEXT,
  code TEXT,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  verified_at TIMESTAMP,
  is_current BOOLEAN DEFAULT FALSE,
  attempt_count INT DEFAULT 0
);

-- Siyahılar
CREATE TABLE listings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  price DECIMAL,
  city TEXT,
  category TEXT,
  description TEXT,
  images JSONB, -- URL-lərin massividir
  status TEXT, -- 'draft', 'active', 'sold', 'archived'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Platform Bağlantıları (istifadəçinin bazar hesabları)
CREATE TABLE platform_connections (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  platform TEXT, -- 'tapaz', 'lalafo' və s.
  access_token TEXT,
  refresh_token TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Yayım İşləri (ümumi işi izlə)
CREATE TABLE publish_jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  listing_id UUID REFERENCES listings(id),
  status TEXT, -- 'processing', 'completed', 'failed'
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Yayım İş Platformaları (hər-platform nəticə)
CREATE TABLE publish_job_platforms (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES publish_jobs(id),
  platform TEXT,
  status TEXT, -- 'pending', 'completed', 'failed'
  url TEXT, -- Yayımlanmış siyahı URL-i
  error TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- pgboss.* (daxili sırası sxemi, pg-boss tərəfindən avtomatik yaradılır)
```

---

## 3. Autentifikasiya Axını

### Cari: OTP + Qlobal Sesiya

**Sorğu → Cavab:**
1. Brauzer: `POST /api/auth/send-otp { phone: "+994501234567" }`
   - Backend: `otp_sessions` sırasını yaradır, kodu konsola yazır
   - Cavab: `{ expiresAt: timestamp }`

2. Backend (server loqları): Kodu çıxarır `[17:30] OTP code: 1234` kimi

3. Brauzer: `POST /api/auth/verify-otp { phone, code: "1234" }`
   - Backend: Telefon üçün ən son `otp_sessions` sırasını tapır, kodu yoxlayır
   - Uğurda: `getOrCreateUser()` çağırır, sesiada `is_current = TRUE` qəbul edir, digər `is_current` sıraları təmizləyir
   - Cavab: `{ user: { id, phone, fullName, accountType, activePlan } }`

4. Sonrakı sorğular: Backend `getCurrentUser()` çağırır:
   - Sorğu: `SELECT users.* FROM users JOIN otp_sessions ON is_current = TRUE WHERE verified_at IS NOT NULL LIMIT 1`
   - Tapılsa: İstifadəçi autentifikasiyalanıb
   - Tapılmasa: 401 Unauthorized qaytarma

**Çıxış:**
- Brauzer: `POST /api/auth/logout`
- Backend: Bütün `otp_sessions` sıralarda `is_current = FALSE` qəbul et
- Effekt: `getCurrentUser()` bütün tablar/brauzerlərdə uğursuz olacaq

**Problemlər:**
- ❌ OTP SMS vasitəsilə göndərilir (qeyri-etibarlı, inteqrasiya lazımdır)
- ❌ Kod açıq şəkildə yazılır (təhlükəsizlik riski)
- ❌ Qlobal sesiya (cihaz başına deyil; çıxış bütün tabları təsir edir)
- ❌ JWT yoxdur; sesiya vəziyyəti yalnız DB-də

### Gələcək: Telegram initData + JWT

**Niyə:** Applikasiya Telegram-ın içində çalışır; istifadəçi artıq orada autentifikasiyalanıb.

**Axın:**
1. Telegram Mini App `window.Telegram.WebApp.initData` (Telegram tərəfindən imzalanan) göndərir
2. Brauzer: `POST /api/auth/telegram { initData: "..." }`
3. Backend: Telegram bot token istifadə edərək imzanı yoxlayır
4. Uğurda: JWT verir (access + refresh tokens)
5. Sonrakı sorğular: `Authorization: Bearer <JWT>` daxil et
6. Faydaları: SMS yoxdur, stateless (DB sesiya lookupa yoxdur), cihaz başına tokens

**Vəziyyət:** Hələ tətbiq olunmadı. [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) baxın.

---

## 4. Yayım Axını

**İstifadəçi Perspektivi:**
1. İstifadəçi siyahı yaradır, bazarları seçir, "Yayımla" klikidir
2. Səhifə "Yayımlanır..." göstərir bazarların irəliləmə çubuqları ilə
3. Hər bazar: Gözləmə → Yayımlanır → Tamamlandı/Uğursuz
4. İstifadəçi bazar URL-lərinin siyahısını görür

**Backend axını:**

```
POST /api/publish/:listingId
  ↓
publishService.createPublishJob()
  ├─ publish_jobs daxil et (status='processing')
  ├─ publish_job_platforms sıraları daxil et (platform başına bir)
  └─ Hər bazar üçün:
     └─ boss.send(QUEUE_PUBLISH_PLATFORM, { listingId, platform, userId })
  ↓
Cavab: { success, job: { id, status, platforms } }
  ↓
Frontend polling: GET /api/publish/:jobId/status
  ├─ Cavab: { job, platforms: [ { name, status, url?, error? } ] }
  └─ UI-ni hər 1-2 saniyəyə yenilə

[Arxa Plan] Sırası idarəçi: handlePublishPlatform
  ├─ DB-dən siyahı yüklə
  ├─ Siyahı məlumatını doğrula
  ├─ Platforma spesifik yükə xəritələ
  ├─ Chrome + Selenium başlat
  ├─ connector.publishListing()
  │   └─ Daxil ol → Form doldur → Təqdim et → URL al
  ├─ publish_job_platforms sırasını yenilə (status='completed', url='...')
  └─ finishJob() çağırırsa bütün bazarlar tamamlandı
       └─ publish_jobs yəniləyir (status='completed'/'failed')

[Uğursuzluq halında] Bərpa işi hər 10 dəqiqədə çalışır
  ├─ Uğursuz publish_job_platforms-ı sorğula
  ├─ MAX_RECOVERY_RETRIES sayıncadək yenidən cəhd et
  └─ Uğursuz işləri yenidən sırala
```

---

## 5. Şəkil Yükləməsi və Saxlama

**Axın:**

```
Frontend: POST /api/listings/upload-image (multipart form-data, sahə: 'image')
  ↓
Backend (Express + Multer):
  ├─ Faylın şəkil olduğunu doğrula (MIME tipi)
  ├─ Ölçüyü məhdudlaştır (8 MB)
  ├─ uploads/ direktoriyasına yaz
  └─ Unikal faylı adını yaratma

Cavab: { success: true, url: "/uploads/abc123.jpg" }
  ↓
Frontend: URL-i siyahı.images massivinə saxlayır

Yayımlanarkən:
  ├─ İşçi siyahı şəkillərlə yüklə: [ "/uploads/abc123.jpg", ... ]
  ├─ Nisbi URL olarsa: PUBLIC_API_ORIGIN istifadə edərək həll et
  │   məs., "http://localhost:4000/uploads/abc123.jpg"
  ├─ Şəkli temp direktoriyaya endir
  └─ Platforma Selenium istifadə edərək yüklə
```

**Saxlama:**
- İnkişaf: `uploads/` repo-da direktoriya (git-də yoxdur)
- Produksiya: Railway davamlı volume və ya xarici saxlama (S3, və s.)

---

## 6. Məlumat Axını: Bazar Platforması Bağlantısı

**İstifadəçi bazar hesabı bağlayır (məs., Tap.az):**

```
Frontend: Selenium popup başlat
  POST /api/platforms/connect
  ├─ Gövdə: { platform: 'tapaz' }
  └─ Backend: Chrome başlat, tap.az-ə keç, DevTools aç
    
İstifadəçi (popup-da): Telefon daxil et, OTP al, kodu daxil et
  ├─ Selenium daxil olma uğurunu aşkar et (URL dəyişikliyi və ya DOM marker)
  ├─ CDP daxil olma POST sorğusunu intercept et
  └─ Cavabdan auth token/cookie çıxar

Backend platform_connections-a saxlayır:
  ├─ platform: 'tapaz'
  ├─ access_token: 'girişdən token'
  ├─ refresh_token: (dəstəklənirsə)
  └─ expires_at: (hesablanmış)

Frontend-ə cavab: { success: true, platform: 'tapaz' }
  ↓
Frontend: "Tap.az — Bağlandı ✓" göstərir

Daha sonra, yayımlanarkən:
  ├─ Selenium platform_connections-dən access_token alır
  ├─ Token yenidən daxil olmaqdan çekinir
  └─ Siyahı daha sürətli yayımlanır
```

**Vəziyyət:** Qismən tətbiq olunmuş. Tap.az və Lalafo daxil olma axınlarına sahibdir. Alan.az, Laylo.az, Birja.com əsaslı skeletlərdir.

---

## 7. Deployment Arxitekturası

### Frontend (Vercel)

```
GitHub repo → Vercel webhook
  ↓
Main-ə push-da:
  ├─ Asılılıqları quraşdır
  ├─ Next.js quru (next build)
  ├─ Vercel CDN-ə deploy et
  └─ URL təyin et: https://salex-next.vercel.app

Ətraf dəyişənlər:
  ├─ NEXT_PUBLIC_BACKEND_URL=https://salex-api.railway.app
  └─ (klient tərəfdən; brauzerə əlçatan)
```

### Backend (Railway)

```
GitHub repo → Railway webhook
  ↓
Main-ə push-da (və ya manual deploy):
  ├─ Asılılıqları quraşdır (npm install)
  ├─ Qur (tsc)
  ├─ Xidmətləri başlat (npm run server:dev və ya npm start)
  │   ├─ Express API
  │   └─ pg-boss (yerləşdirilmiş və ya işçi xidməti vasitəsilə)
  └─ URL təyin et: https://salex-api.railway.app

Ətraf dəyişənlər:
  ├─ DATABASE_URL=postgres://...@railway.db....:5432/salex
  ├─ PORT=8080 (Railway təyin edir)
  ├─ NODE_ENV=production
  ├─ Bütün platform konnektoru ətraf dəyişənləri (LOGIN_PHONE, OTP_FILE, və s.)
  └─ (xüsusi; brauzerdən əlçatmayan)

İşçi Xidməti (ayrı Railway xidməti):
  ├─ Eyni repo, eyni ətraf dəyişənlər
  ├─ Əmr: ENABLE_WORKER_IN_SERVER=false npm run worker:dev
  └─ Yayım işlərini emal et async
```

### Veritabanı (Railway PostgreSQL)

```
Railway PostgreSQL idarə olunan xidməti
  ├─ Avtomatik ehtiyatlıqlar
  ├─ Bağlantı hovuzlaması PgBouncer vasitəsilə (isteğe bağlı)
  └─ DATABASE_URL API və işçi xidmətləri arasında paylaşılır
```

---

## 8. Əsas Fayllar və Məsuliyyətlər

| Fayl / Direktoriya | Məqsəd |
|------------------|---------|
| `app/page.tsx` | Əsas Telegram Mini App; ekran vəziyyəti, naviqasiya, UI məntiqləsi |
| `src/server.ts` | Backend daxıl olma nöqtəsi; Express, pg-boss, idarəçiləri başlatma |
| `src/app.ts` | Express applikasiya setup; marşrutlar, middleware, xəta idarəçi |
| `src/routes/*.ts` | API nöqtə idarəçiləri (auth, siyahılar, yayım, və s.) |
| `src/services/*.ts` | Biznes məntiqləsi (OTP, istifadəçi, siyahı, yayım, ödəniş) |
| `src/connectors/*.ts` | Hər bazar üçün Selenium avtomasyonu |
| `src/queue/handlers/*.ts` | İş idarəçiləri (yayım, bərpa) |
| `src/db/schema.sql` | Cədvəl tərifləri |
| `src/db/pool.ts` | PostgreSQL bağlantı hovuzu |
| `next.config.ts` | Next.js konfigu; `/api/*` backend-ə yenidən yazma |
| `.env.example` | Ətraf dəyişənləri şablonu |
| `docs/ARCHITECTURE.md` | Bu fayl |
| `docs/KNOWN_ISSUES.md` | Xətalar və TODO-lar |
| `docs/BACKEND_DEVELOPER_GUIDE.md` | Backend developerləri üçün onboarding |

---

## 9. Deployment Yoxlama Siyahısı

- [ ] Ətraf dəyişənlər Vercel (frontend) və Railway (backend) üzərində təyin edilmiş
- [ ] Veritabanı miqrasiyaları tətbiq olunmuş (`npm run db:bootstrap`)
- [ ] Telegram bot yaradılmış; bot token Railway ətraf dəyişənində saxlanılmış
- [ ] Chrome/Chromium Railway-ə quraşdırılmış (və ya headless seçəni istifadə et)
- [ ] SSL sertifikatları (Vercel & Railway tərəfindən avtomatik təmin olunur)
- [ ] Webhook git push-a avtomatik deploy üçün konfigur olunmuş
- [ ] Xəta loqlaşdırma setup (Sentry, LogRocket, və s.)
- [ ] Monitorinq/xəbərdarlıq konfigur olunmuş (uptime, iş uğursuzluqları, və s.)
- [ ] PostgreSQL üçün ehtiyat strategiyası (Railway idarə edir, yoxla)

---

## 10. Sözlük

| Termin | Tərif |
|--------|--------|
| **Mini App** | Telegram-ın içində çalışan Telegram applikasiyası; URL-dən veb interfeys yüklə |
| **OTP** | Birdəfəlik Parol (məs., SMS-də 4 rəqəmli kod) |
| **Selenium** | WebDriver avtomasyonu kitabxanası; headless Chrome-u kontrolluya |
| **Konnektoru** | Bazarı (məs., Tap.az) avtomatlaşdıran Selenium skripti |
| **pg-boss** | PostgreSQL-dən ehtiyat iş sırası; Redis lazım deyil |
| **Sırası** | FIFO iş siyahısı; idarəçilər işləri emal edə asinkron |
| **Yayım İşi** | Siyahıyı bütün bağlı bazarlara poslamaq üçün tapşırıq |
| **Platform Bağlantısı** | Saxlanmış bazar autentifikasiyası (token, cookie, və s.) istifadəçi üçün |
| **DevTools Protokolu (CDP)** | Chrome uzaq debugging API; şəbəkəni intercept et, sorğuları dəyişdir |

---

**Son Yeniləmə:** May 2026
