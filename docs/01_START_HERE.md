# 🚀 SALex — Başlamaq Üçün Bələdçə

> Yeni developer misiniz? Buradan başlayın.

---

## 5 Dəqiqəlik Setup

### 1. Klonla və Quraşdır

```bash
git clone https://github.com/ArazFlutter/salex.git
cd salex
npm install
```

### 2. Veritabanı Konfiqurasiyası

```bash
cp .env.example .env
```

`.env` açın və əsasən düzəltən:
```bash
DATABASE_URL=postgres://postgres:password@localhost:5432/salex
PORT=4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

PostgreSQL yoxdursa, Docker istifadə edin:
```bash
docker run --name salex-pg \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=salex \
  -p 5432:5432 -d postgres:16
```

### 3. Sxemi Qur

```bash
npm run db:bootstrap
```

### 4. Xidmətləri Başlat (üç terminaldə)

**Terminal 1 — Backend:**
```bash
npm run server:dev
# → http://localhost:4000
```

**Terminal 2 — Frontend:**
```bash
npm run dev
# → http://localhost:3000
```

**Terminal 3 — İşçi (isteğe bağlı):**
```bash
npm run worker:dev
```

---

## 🌐 Yerli URL-lər

| Xidmət | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:4000 |
| API Health | http://localhost:4000/api/health |

---

## 📋 Ətraf Dəyişənlər (Hər Bir Platformada)

### Əsas (Tələb Olunan)

```bash
DATABASE_URL=postgres://user:pass@host:5432/salex
PORT=4000
```

### Frontend

```bash
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
APP_URL=http://localhost:3000
```

### Platform Konnektorları (Hər Biri)

Hər 5 platformanın (Tap.az, Lalafo, Alan.az, Laylo.az, Birja.com) üçün:

```bash
{PLATFORM}_SELENIUM_HEADLESS=true           # Chrome headless mode
{PLATFORM}_SELENIUM_TIMEOUT_MS=15000        # Timeout milliseconds
{PLATFORM}_LOGIN_PHONE=+994501234567        # Platform login phone
{PLATFORM}_OTP_CODE=1234                    # Static OTP (dev only)
{PLATFORM}_OTP_FILE=.tapaz-otp              # Or file-based OTP
{PLATFORM}_OTP_TIMEOUT_MS=120000            # OTP wait time
```

Platform prefiksləri: `TAPAZ_`, `LALAFO_`, `ALANAZ_`, `LAYLO_`, `BIRJACOM_`

### Paylaşılan

```bash
CHROME_BIN=/usr/bin/chromium               # Chrome path (if not default)
RECOVERY_SCHEDULE_CRON=*/10 * * * *        # Pending link recovery schedule
MAX_RECOVERY_RETRIES=5                     # Max recovery attempts
GEMINI_API_KEY=...                         # If using AI features
```

**Həm də baxın:** [Bütün ətraf dəyişənlər üçün 03_ARCHITECTURE.md](./03_ARCHITECTURE.md)

---

## 🚀 Produksiyaya Deploy

### Vercel-ə (Frontend)

1. GitHub-ə push edin
2. Vercel-ə qoşulun: `vercel login && vercel`
3. Ətraf dəyişəni təyin edin:
   - `NEXT_PUBLIC_BACKEND_URL` = Railway backend URL-i

### Railway-ə (Backend)

1. Railway layihəsi yaratın: `railway init`
2. Env varları əlavə edin (bax yuxarıda)
3. `npm run server:build` test edin
4. `railway up` push edin

**Deploy əmrləri:**
```bash
# Backend quruluş
npm run server:build

# Frontend quruluş
NEXT_PUBLIC_BACKEND_URL=https://backend.railway.app npm run build

# Veritabanı miqrasiyası (ilk deploy yalnız)
DATABASE_URL="..." npm run db:bootstrap
```

---

## ✅ İlk 5 Tapşırıq (Yeni Developer)

1. **Setup tamamla** (yuxarıdakı 5 dəq) ✓
2. **API sınaq edin:**
   ```bash
   curl -X POST http://localhost:4000/api/auth/send-otp \
     -H 'Content-Type: application/json' \
     -d '{"phone":"+994501234567"}'
   ```
3. **OTP kodunu sınaq edin** (server loqlarında görsəniz)
4. **Frontend açın:** http://localhost:3000
5. **[02_PROBLEMS.md](./02_PROBLEMS.md) oxuyun** — Ləzim olduqda nə düzəltmələi biləcəyinizi bilin

---

## 🔧 Ümumi Əmrlər

```bash
npm run dev                    # Bütün xidmətləri başlat
npm run server:dev             # Yalnız backend
npm run lint                   # Kod yoxlaması
npm run build                  # Produksiya quruluş
npm start                      # Produksiya başlanğıc
npm test                       # Testləri çalıştır
npm run smoke:backend          # API sağlamlıq yoxlaması
npm run db:seed                # Test məlumatları daxil et
```

---

## 🛟 Problem?

- **PostgreSQL bağlana bilməyəndə:** `DATABASE_URL` yoxlayın, PostgreSQL çalışıb-çalışmadığını yoxlayın
- **Port zangıladığında:** `.env`-də `PORT` dəyişdirin ya `kill -9 <PID>` istifadə edin
- **Chrome tapılmadığında:** `CHROME_BIN=/usr/bin/google-chrome` təyin edin
- **Başqa xəta:** [02_PROBLEMS.md](./02_PROBLEMS.md) yoxlayın

---

## 📚 Daha Çox Məlumat

| Ehtiyacınız | Faylı Oxuyun |
|-----------|------------|
| Sistem necə işləyir | [03_ARCHITECTURE.md](./03_ARCHITECTURE.md) |
| Nə düzəltməli | [02_PROBLEMS.md](./02_PROBLEMS.md) |
| Hər şey | [../README.md](../README.md) |

---

**Son Yeniləmə:** May 2026  
**Vaxt:** Yeni developers üçün 5 dəqiqə setup ✓