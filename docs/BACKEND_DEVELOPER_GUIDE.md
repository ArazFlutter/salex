# Backend Developer Bələdçəsi — SALex

SALex layihəsinə qoşulan yeni backend developer üçün tam onboarding bələdçəsi.

---

## 🎯 Nə Qurmaqdasınız

**SALex** bir **Telegram Mini Applikasiyasıdır** ki, Azərbaycan satıcılarına bir siyahı yaratıb bütün bazarlara avtomatik yayımlamaq imkanı verir.

**Sizin rolu:** Aşağıdakıları idarə edən Express backend qur və saxla:
- İstifadəçi autentifikasiyası (cari OTP; Telegram `initData`-ya miqrasiya)
- Siyahı CRUD (yaratma, oxu, yəniləmə, silmə)
- Bazar bağlantıları (Selenium avtomasyonu)
- Yayımla (iş sırası + eşzamanlı işçilər)
- Ödəniş emalı (premium planlar)

---

## 🏗 Arxitektur Icmalı (60 saniyə)

```
İstifadəçi Telegram açır → Next.js frontend yüklə (port 3000)
                    ↓
İstifadəçi siyahı yaradır, "Yayımla" klikidir
                    ↓
Frontend göndərir: POST /api/publish/:listingId
                    ↓
Backend (Express :4000) pg-boss sırasında işlər yaradır
                    ↓
İşçi eşzamanlı işləri emal edir:
  • DB-dən siyahı yüklə
  • Chrome başlat
  • Bazara daxil olmaq (Selenium)
  • Siyahı məlumatlarını form ilə doldur
  • Təqdim et → URL al
  • Nəticəni DB-də saxla
                    ↓
Frontend polling: GET /api/publish/:jobId/status
                    ↓
Göstər: "Tap.az ✓ | Lalafo ✓ | Alan.az ✗ (10 dəq sonra yenidən cəhd)"
```

**Əsas Texnologiyalar:**
- **Express** — HTTP serveri
- **PostgreSQL** — Veritabanı
- **pg-boss** — İş sırası (eyni DB, Redis lazım deyil)
- **Selenium** — Brauzer avtomasyonu (daxil olmaq, form doldurma)

**Həm də Baxın:** Ətraflı diaqramlar və məlumat axınları üçün [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## ⚡ Sürətli Başlanğıc (15 dəqiqə)

### 1. Klonla və Quraşdır

```bash
git clone https://github.com/ArazFlutter/salex.git
cd salex
npm install
```

### 2. Ətraf Dəyişənləri Quraşdır

```bash
cp .env.example .env
```

`.env` redaktə edin:
```bash
DATABASE_URL=postgres://postgres:password@localhost:5432/salex
PORT=4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
APP_URL=http://localhost:3000
```

PostgreSQL-in yerli və ya əlçatan olduğuna əmin olun.

### 3. Veritabanını İşə Sal

```bash
npm run db:bootstrap
```

Bu `src/db/schema.sql` tətbiq edir — bütün cədvəlləri, indeksləri, pg-boss sxemini yaradır.

### 4. Backend Başlat

```bash
# Terminal 1
npm run server:dev
```

Görməniz lazım:
```
✓ Database connected
✓ pg-boss started
✓ Server listening on http://localhost:4000
```

### 5. API Sınaq

```bash
# Terminal 2
curl -X POST http://localhost:4000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"+994501234567"}'
```

Gözlənilən cavab:
```json
{
  "success": true,
  "phone": "+994501234567",
  "expiresAt": "2026-05-10T12:30:00Z"
}
```

---

## 📂 Kod Təşkili

### `src/routes/` — API Nöqtələri

Hər fayl bir məntiqi marşrut qrupu:

- **`auth.ts`** — `POST /api/auth/send-otp`, `/verify-otp`, `/logout`
- **`listings.ts`** — `GET|POST /api/listings`, `/upload-image`
- **`publish.ts`** — `POST /api/publish/:id`, `GET /api/publish/:id/status`
- **`platforms.ts`** — `POST /api/platforms/connect`
- **`me.ts`** — `GET /api/me` (cari istifadəçi profili)
- **`packages.ts`** — `GET /api/packages` (qiymət planları)

**Nümunə:** Hər marşrutun idarəçi funksiyası var + xidmətləri çağırır.

**Misal:** `POST /api/listings`

```typescript
// src/routes/listings.ts
router.post('/', async (req, res) => {
  const user = getCurrentUser(req); // Daxil olmamışsa 401 atır
  const input = req.body;
  
  try {
    const listing = await listingService.createListing(user.id, input);
    res.json({ success: true, listing });
  } catch (err) {
    // AppError idarəçi JSON qaytarır
    throw err;
  }
});
```

### `src/services/` — Biznes Məntiqləsi

Hər xidmət modullar ilə modul:

- **`otpService.ts`** — OTP kodlarını yaratma, göndər, təsdiqə
- **`userService.ts`** — İstifadəçi CRUD, cari istifadəçi al, sesiayaları idarə et
- **`listingService.ts`** — Siyahı CRUD, yoxlama, məhdudiyyətlər
- **`publishService.ts`** — Yayım işləri yaratma, platforma yayımlamasını əlaqələndir
- **`paymentService.ts`** — Telegram ödəniş callback-lərini idarə et
- **`platformService.ts`** — Bazar bağlantılarını idarə et

**Nümunə:** Xidmətlər veritabanı, utilities, xarici API-ləri çağırır. HTTP haqqında bilmir.

**Misal:** `userService.ts`

```typescript
export async function getCurrentUser(req: Request): Promise<User> {
  // Sorğu: SELECT users.* FROM users
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
  // Girişi yoxla
  validateCreateInput(input);
  
  // Siyahı məhdudiyyətini yoxla
  const count = await getActiveListingCount(userId);
  if (count >= packageLimits[plan]) {
    throw new AppError('Listing limit reached', 403);
  }
  
  // DB-ə daxil et
  const result = await pool.query(
    'INSERT INTO listings (...) VALUES (...) RETURNING *',
    [userId, input.title, input.price, ...]
  );
  
  return result.rows[0];
}
```

### `src/connectors/` — Bazar Avtomasyonu

Hər bazarın daxil olmaq + yayımlamağı avtomatlaşdıran konnektoru var:

- **`tapazConnector.ts`** — Tap.az (daxil olmaq intercepti üçün Chrome DevTools Protocol istifadə)
- **`lalafoConnector.ts`** — Lalafo
- **`alanaConnector.ts`** — Alan.az (skelet)
- **`layloConnector.ts`** — Laylo.az
- **`birjacomConnector.ts`** — Birja.com (skelet)

**İnterfeys:**
```typescript
export interface PlatformConnector {
  publishListing(listing: NormalizedListing): Promise<PublishResult>;
  getListingUrl(result: PublishResult): string;
  normalizeError(error: any): string;
}
```

**Axın:**
1. `buildChromeDriver()` ilə Chrome-u başlat
2. Bazara daxıl olmaq (telefon + OTP)
3. Siyahı yaratma səhifəsinə keç
4. Standartlaşdırılmış sahələrlə formu doldur (başlıq, qiymət, şəhər, kateqoriya, və s.)
5. Formu təqdim et
6. Siyahı URL-ni çıxar
7. `{ url: '...' }` və ya `{ error: '...' }` qaytarma

**Misal:** Tap.az konnektoru parçası

```typescript
export class TapazConnector implements PlatformConnector {
  async publishListing(listing: NormalizedListing): Promise<PublishResult> {
    const driver = buildChromeDriver();
    try {
      // Addım 1: Daxıl olmaq
      await driver.get('https://tap.az');
      await driver.findElement(By.css('a:contains("Login")')).click();
      await driver.findElement(By.name('phone')).sendKeys(TAPAZ_LOGIN_PHONE);
      // ... OTP yoxlaması ...
      
      // Addım 2: Siyahı yaratmaq səhifəsinə keç
      await driver.get('https://tap.az/my/add');
      
      // Addım 3: Formu doldur
      await driver.findElement(By.name('title')).sendKeys(listing.title);
      await driver.findElement(By.name('price')).sendKeys(listing.price);
      // ... daha çox sahə ...
      
      // Addım 4: Təqdim et
      await driver.findElement(By.css('button[type=submit]')).click();
      
      // Addım 5: URL al
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

**Həm də Baxın:** Hər-bazar təfərrüatlar üçün [PLATFORM_CONNECTORS.md](./PLATFORM_CONNECTORS.md).

### `src/queue/` — İş Sırası (pg-boss)

- **`boss.ts`** — pg-boss bağlantısını işə sal
- **`queues.ts`** — Sırası adlarını təyin et (sabitlər)
- **`handlers/`** — İş idarəçi funksiyaları
  - **`publishPlatform.ts`** — Bir yayım işini idarə et (konnektoru çağırma)
  - **`recoverPendingLinks.ts`** — Uğursuz yayımlamaları yenidən cəhd et
- **`worker.ts`** — Müstəqil işçi prosesi (API-dən ayrı çalıştırılsın)

**Nümunə:** İş yaratma → Idarəçi eşzamanlı emal.

**Misal:** `publishPlatform.ts` idarəçi

```typescript
export async function handlePublishPlatform(job: PgBossJob) {
  const { listingId, platform, userId } = job.data;
  
  try {
    // 1. DB-dən siyahı yüklə
    const listing = await getListingById(listingId, userId);
    if (!listing) throw new Error('Listing not found');
    
    // 2. Məlumatı bazar sxemasına normallaş
    const normalized = normalizeListing(listing);
    
    // 3. Konnektoru al
    const connector = getConnector(platform);
    if (!connector) throw new Error(`Platform ${platform} not supported`);
    
    // 4. Konnektoru çağırma (Selenium avtomasyonu)
    const result = await connector.publishListing(normalized);
    
    // 5. DB-nə nəticə ilə yəniləş
    await pool.query(
      'UPDATE publish_job_platforms SET status = $1, url = $2, error = $3 WHERE ...',
      [result.success ? 'completed' : 'failed', result.url, result.error]
    );
  } catch (err) {
    // İş uğursuz; pg-boss sonrakı bərpa dövrəsində yenidən cəhd edəcək
    throw err;
  }
}
```

### `src/db/` — Veritabanı

- **`schema.sql`** — Cədvəl tərifləri (CREATE TABLE, INDEX, və s.)
- **`pool.ts`** — PostgreSQL bağlantı hovuzu (`pg.Pool`)
- **`env.ts`** — `.env`-dən `DATABASE_URL` yüklə

**Nümünə:** Bütün sorğular `pool.query(sql, params)` ilə parameterləşdirilmiş sorğulardan istifadə edir (SQL injection-dən təhlükəlidir).

**Misal:** Parametr ilə sorğu

```typescript
// ✓ Təhlükəsiz: Parametrlər kaçqın ediliblər
const result = await pool.query(
  'SELECT * FROM users WHERE id = $1',
  [userId]
);

// ✗ TAHLÜKƏLİ: Sətir birləşməsi
const result = await pool.query(`SELECT * FROM users WHERE id = ${userId}`);
```

---

## 🔑 Quracağınız/Dəyişdirəcəyiniz Əsas API-lər

### Autentifikasiya (KRİTİK — Miqrasiya Lazımdır)

**Cari Nöqtələr:**
- `POST /api/auth/send-otp { phone }` → `expiresAt` qaytarır
- `POST /api/auth/verify-otp { phone, code }` → istifadəçi qaytarır
- `POST /api/auth/logout` → Sesiayı təmizlə

**Cari Tətbiq:** `src/routes/auth.ts` + `src/services/otpService.ts`

**Problem:** SMS vasitəsilə OTP qeyri-etibarlı; loqlarda açıq kodlar.

**Sizin Tapşırığınız:** Telegram `initData` + JWT-ə miqrasiya.

**Yeni Nöqtələr (Tətbiq etmə):**
```typescript
POST /api/auth/telegram
{
  "initData": "user=123&..." // window.Telegram.WebApp.initData-dan
}

Cavab:
{
  "success": true,
  "user": { id, phone, fullName, activePlan },
  "token": "eyJhbGc..." // JWT
}
```

**Niyə Əhəmiyyətli:** Hamını blok edir. Birinci düzəlt.

**Həm də Baxın:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) — Məsələ #1.

---

### Siyahılar

**Nöqtələr (artıq tətbiq olunmuş):**
- `POST /api/listings` — Siyahı yaratma
- `GET /api/listings` — İstifadəçinin siyahılarını sıralay
- `GET /api/listings/:id` — Tək siyahı al
- `POST /api/listings/upload-image` — Şəkil faylını yüklə

**Tətbiq:** `src/routes/listings.ts` + `src/services/listingService.ts`

**Sizin Tapşırığınız:** Adətən just xəta düzəltmələri və ya sahə əlavəsi. KNOWN_ISSUES #4 baxın.

---

### Yayımla

**Nöqtələr (tətbiq olunmuş amma sınaq lazımdır):**
- `POST /api/publish/:listingId` — Bütün bazarlar üçün yayım işi yaratma
- `GET /api/publish/:jobId/status` — İş vəziyyətini polling

**Tətbiq:** `src/routes/publish.ts` + `src/services/publishService.ts` + `src/queue/handlers/`

**Sizin Tapşırığınız:**
- [ ] Alan.az & Birja.com konnektorlarını tamamla (Məsələ #5)
- [ ] E2E testlər yazma (Məsələ #4)
- [ ] Railway Chrome məsələsini düzəltmə (Məsələ #2)

---

### Platformalar

**Nöqtələri:**
- `POST /api/platforms/connect { platform }` — Bazar bağlantısını başlat (popup açar)
- `GET /api/platforms` — Bağlı platformaları sıralay

**Tətbiq:** `src/routes/platforms.ts` + konnektorlar

**Sizin Tapşırığınız:** Token yenidən istifadənin işlədiyini yoxla; tam disconnect axınını tətbiq et.

---

### Paket Planları (Premium)

**Nöqtələri:**
- `GET /api/packages` — Mövcud planları sıralay (basic, premium, premiumPlus)
- `GET /api/package/current` — İstifadəçinin cari plan + siyahı məhdudiyyəti
- `POST /api/package/select { plan }` — Plan dəyişdir
- `POST /api/payments/create { plan }` — Telegram ödəniş linki yaratma

**Tətbiq:** `src/routes/packages.ts` + `src/services/paymentService.ts`

**Sizin Tapşırığınız:** Adətən işləyir. Ödəniş webhook problemlərini monitorinq.

---

## 📊 Veritabanı Sxemi (Icmal)

| Cədvəl | Məqsəd | Əsas Sütunlar |
|-------|--------|-----------|
| `users` | Qeydiyyatlı istifadəçilər | id, phone, full_name, account_type, active_plan |
| `otp_sessions` | Auth sesilaşdırması (OTP) | phone, code, is_current, verified_at |
| `listings` | İstifadəçi siyahıları | id, user_id, title, price, city, category, images, status |
| `platform_connections` | Bazar tokenləri | user_id, platform, access_token, refresh_token |
| `publish_jobs` | Ümumi yayım tapşırığı | id, user_id, listing_id, status |
| `publish_job_platforms` | Hər-bazar nəticə | job_id, platform, status, url, error |
| `pgboss.*` | İş sırası (daxili) | — |

**Həm də Baxın:** Tam sxema üçün [DB_HANDOFF.md](./DB_HANDOFF.md).

---

## 🚀 Prioritet: Nə Üzərində İşləmə

**Əhəmiyyət sırasında:**

### 1. **Telegram Auth-ə Miqrasiya** (1 həftə)
   - **Impact:** OTP etibarlılığını düzəltir (hamını blok edir)
   - **Əmək:** ~3 gün backend, ~2 gün frontend, ~1 gün sınaq
   - **Fayllar:** `src/routes/auth.ts`, `src/services/userService.ts`, middleware
   - **Baxın:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) #1

### 2. **Railway-da Puppeteer Düzəltmə** (3-4 gün)
   - **Impact:** Produksiyada yayımla etibarlı işləyir
   - **Əmək:** Konnektorları Puppeteer-ə yenidən yaz
   - **Fayllar:** `src/connectors/*.ts`
   - **Baxın:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) #2

### 3. **Platform Konnektorlarını Tamamla** (2-3 gün)
   - **Impact:** İstifadəçilər Alan.az & Birja.com-a yayımla bilər
   - **Əmək:** 2 konnektoru tətbiq (hər biri ~200 sətir)
   - **Fayllar:** `src/connectors/alanaConnector.ts`, `src/connectors/birjacomConnector.ts`
   - **Baxın:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) #5

### 4. **E2E Testlər Yazma** (2-3 gün)
   - **Impact:** Regresiyaları produksiyadan əvvəl tutunsun
   - **Əmək:** Jest + Supertest API-si; konnektoru smok testləri Puppeteer
   - **Fayllar:** `tests/` (yeni direktoriya)
   - **Baxın:** [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) #4

### 5. **Monitorinq və Xəbərdarlıq Əlavə Edin** (1-2 gün)
   - **Impact:** Produksiyada uğursuzluqları tez tutu
   - **Alətlər:** Sentry (xətalar), LogRocket (sesialar), CloudWatch (loglar)
   - **Baxın:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🧪 Sınaq

### Unit Testləri

```bash
npm test
```

Testlər `src/**/*.test.ts`-də yaşayır (yarats).

**Misal testi:**
```typescript
// src/services/otpService.test.ts
describe('otpService', () => {
  it('should generate a 4-digit code', async () => {
    const code = generateRandomCode();
    expect(code).toMatch(/^\d{4}$/);
  });
  
  it('should verify correct OTP', async () => {
    await sendOtp('+994501234567');
    // Testdə SMS-ni mock-layıp codeu DB-dən al
    const result = await verifyOtp('+994501234567', '1234');
    expect(result.success).toBe(true);
  });
});
```

### API Testləri (Smok Testləri)

```bash
npm run smoke:backend
```

`src/dev/smokeTest.ts`-ni çalıştırır — əsas HTTP yoxlaması.

**Yeni test əlavə etmə:**
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

### Konnektoru Smok Testləri

```bash
npm run smoke:publish-connectors
```

`src/dev/publishConnectorSmoke.ts`-ni çalıştırır — Tap.az & Lalafo-nu həqiqi etimadnamələrlə sınar.

**Tələb edir env varları:**
```bash
TAPAZ_LOGIN_PHONE=+994501234567
TAPAZ_OTP_CODE=1234
LALAFO_LOGIN_PHONE=...
```

---

## 🐛 Ümumi Tapşırıqlar

### Yeni API Nöqtəsi Əlavə Edin

**Misal:** `GET /api/listings/:id/comments`

**Addım 1:** Marşrut idarəçi yaratma
```typescript
// src/routes/listings.ts
router.get('/:id/comments', async (req, res) => {
  const user = getCurrentUser(req); // Daxıl olmamışsa 401 atır
  const { id } = req.params;
  
  try {
    const comments = await listingService.getComments(id, user.id);
    res.json({ success: true, comments });
  } catch (err) {
    throw err; // AppError idarəçi JSON qaytarır
  }
});
```

**Addım 2:** Xidmət funksiyası əlavə edin
```typescript
// src/services/listingService.ts
export async function getComments(listingId: string, userId: string) {
  // İstifadəçi siyahıyı sahibliyi yoxla
  const listing = await pool.query(
    'SELECT * FROM listings WHERE id = $1 AND user_id = $2',
    [listingId, userId]
  );
  if (!listing.rows.length) throw new AppError('Not found', 404);
  
  // Şərhlər al
  const result = await pool.query(
    'SELECT * FROM comments WHERE listing_id = $1 ORDER BY created_at DESC',
    [listingId]
  );
  return result.rows;
}
```

**Addım 3:** Sınaq
```bash
curl http://localhost:4000/api/listings/123/comments \
  -H "Cookie: salex_session=..." # Auth tələbi
```

---

### Veritabanı Sxemini Dəyişdir

**Misal:** Siyahılar cədvəlinə `external_id` sahəsi əlavə edin.

**Addım 1:** Sxemi yəniləş
```sql
-- src/db/schema.sql
ALTER TABLE listings ADD COLUMN external_id TEXT;
CREATE INDEX idx_listings_external_id ON listings(external_id);
```

**Addım 2:** Miqrasiyası çalıştır
```bash
npm run db:bootstrap
```

**Addım 3:** TypeScript tipləri yəniləş
```typescript
// src/types/index.ts və ya xidmət
interface Listing {
  id: string;
  externalId?: string; // Yeni sahə
  title: string;
  // ... digər sahələri
}
```

**Addım 4:** Xidmət kodunu yəniləş
```typescript
const listing = {
  id: result.rows[0].id,
  externalId: result.rows[0].external_id, // Camel case
  title: result.rows[0].title,
  // ...
};
```

---

### Uğursuz Yayım İşini Debug Edin

**Vəziyyət:** İstifadəçi yayımlamağa cəhd edir; siyahı Tap.az-da heç vaxt görünmür.

**Araştırma:**

```bash
# 1. İş vəziyyətini yoxla
curl http://localhost:4000/api/publish/job-123/status

# 2. İş cədvəlini yoxla
psql $DATABASE_URL -c "SELECT * FROM publish_jobs WHERE id = 'job-123';"

# 3. Hər-bazar nəticələri yoxla
psql $DATABASE_URL -c "SELECT * FROM publish_job_platforms WHERE job_id = 'job-123';"

# 4. pg-boss sırasını yoxla
psql $DATABASE_URL -c "SELECT * FROM pgboss.job WHERE id = '...' LIMIT 5;"

# 5. Server loqlarını yoxla
# npm run server:dev konsolunda xəta mesajları axtarın
```

**Ümumi Problemlər:**

| Simptom | Səbəb | Düzəltmə |
|---------|-------|----------|
| "Button not found: Daxıl ol" | Selectorlik dəyişdi | Konnektoru yəniləş; `clickByText('Daxıl ol')` cəhd et |
| "Chrome process crashed" | Yaddaş çatmadı | Headless azalt; Railway resurslarını yoxla |
| "Timeout waiting for navigation" | Sayt yavaş və ya bağlı | `TAPAZ_SELENIUM_TIMEOUT_MS` artır |
| "OTP timeout" | OTP verilmədi | `TAPAZ_OTP_CODE` və ya `TAPAZ_OTP_FILE` qəbul et |

---

## 📚 Sənədləşdirmə İndeksi

| Sənəd | Məqsəd |
|-------|--------|
| [README.md](../README.md) | Layihə icmalı, setup, deployment |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Sistem dizaynı, məlumat axınları, diaqramlar |
| [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) | Kritik xətalar, miqrasiya yol xəritəsi |
| [ENVIRONMENT.md](./ENVIRONMENT.md) | Bütün ətraf dəyişənlər izahlı |
| [API_HANDOFF.md](./API_HANDOFF.md) | HTTP API nöqtələri və sorğular |
| [DB_HANDOFF.md](./DB_HANDOFF.md) | Veritabanı sxemi və sorğular |
| [PLATFORM_CONNECTORS.md](./PLATFORM_CONNECTORS.md) | Selenium avtomasyonu hər-bazar |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Produksiya setup (Vercel, Railway) |
| [RUNBOOK.md](./RUNBOOK.md) | Əməliyyatlar və ümumi əmrlər |

---

## 💬 Suallar?

1. **"Necə...?"** → [RUNBOOK.md](./RUNBOOK.md) yoxlayın
2. **"Niyə...?"** → [ARCHITECTURE.md](./ARCHITECTURE.md) yoxlayın
3. **"Bu xəta nə?"** → [KNOWN_ISSUES.md](./KNOWN_ISSUES.md) yoxlayın
4. **"Hansı nöqtə...?"** → [API_HANDOFF.md](./API_HANDOFF.md) yoxlayın

---

**Son Yeniləmə:** May 2026  
**Sürətli Linkləri:** [GitHub](https://github.com/ArazFlutter/salex) · [Vercel](https://salex-next.vercel.app) · [Railway](https://salex-api.railway.app)
