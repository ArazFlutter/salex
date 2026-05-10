# SALex — Multi-Marketplace Siyahılandırma Avtomasyonu

> **Telegram Mini Applikasiyası** Azərbaycan bazarlarında məhsulları bir sırada satışa çıxarmaq üçün.

**SALex** (Smart Auto Listing Exchange) satıcılara bir siyahı yaradıb **Tap.az**, **Lalafo**, **Alan.az**, **Laylo.az** və **Birja.com**-a avtomatik yayımlamaq imkanı verir — hamısı Telegram-dan.

---

## 🎯 SALex Nə Edir?

1. **Satıcı Telegram vasitəsilə daxil olur** → OTP təsdiqləməsi (Telegram `initData`-ya miqrasiya lazımdır)
2. **Bir siyahı yaradır** → Başlıq, qiymət, şəkillər, təsvir, kateqoriya
3. **Bazarların hesablarını bağlayır** → Selenium avtomasyonu hər platformada daxil olur
4. **Bir kliklə yayımlayır** → Backend işlər yaradır; işçi bütün platformalara paralel yayımlar
5. **Vəziyyəti izləyir** → Real vaxt statusu; uğursuz yayımlamaları avtomatik bərpa edir

---

## 🛠 Texnologiya Yığını

| Səviyyə | Texnologiya | Qeydlər |
|--------|-----------|-------|
| **Frontend** | Next.js 15, React 19, Tailwind CSS | Telegram Mini App qabı; `localhost:3000`-də çalışır |
| **Backend** | Express 5 (Node.js) | REST API `localhost:4000`-də; autentifikasiya, siyahılar, işləri idarə edir |
| **Veritabanı** | PostgreSQL | İstifadəçiləri, siyahıları, bazarların bağlantılarını, yayım işlərini saxlayır |
| **İş Sırası** | pg-boss | Yayımlamağı işçi prosesləri arasında miqyaslandırır; eyni DB-də çalışır |
| **Avtomasyonu** | Selenium WebDriver + Chromium | Bazarlarda daxil olur; formları doldurur; siyahıları təqdim edir |
| **Deployment** | Vercel (frontend) + Railway (backend + DB) | Frontend git push-a avtomatik deploy olur; backend Railway vasitəsilə |

---

## 📁 Layihə Struktur

```
salex-main/
├── app/                        # Next.js applikasiyası (brauzer UI)
│   ├── page.tsx                # Əsas Telegram Mini App komponenti
│   ├── layout.tsx              # Root layout (Telegram provider)
│   └── globals.css             # Tailwind + qlobal üslublar
├── components/
│   ├── screens/                # Tam səhifə ekranları (Dashboard, CreateListing, və s.)
│   ├── ui/                     # Yenidən istifadə olunan UI komponentləri (Button, Input, və s.)
│   └── providers/              # Context provayderləri (TelegramMiniAppProvider)
├── contexts/                   # React kontekstləri (LanguageContext, və s.)
├── hooks/                      # Xüsusi React hooku
├── lib/
│   ├── api.ts                  # API kliyenti (fetch qabı)
│   ├── app-state.ts            # Tipləri və sabitləri (UserProfile, Listing, və s.)
│   ├── clientSession.ts        # localStorage idarəçiliyi (APP_VERSION, istifadəçi ID bağlanması)
│   └── listingLocalization.ts  # Kateqoriya/şəhər tərcimələri
├── src/                        # Express backend (TypeScript)
│   ├── app.ts                  # Express applikasiya setup (middleware, marşrutlar)
│   ├── server.ts               # Daxil olma nöqtəsi (serveri + pg-boss başladır)
│   ├── middleware/             # Autentifikasiya, xəta idarəçiliyi
│   ├── routes/                 # API marşrutları (/api/auth, /api/listings, /api/publish, və s.)
│   ├── services/               # Biznes məntiqləri (OTP, siyahılar, yayım, ödəniş)
│   ├── connectors/             # Selenium platformu konnektorları (TapazConnector, LalafoConnector, və s.)
│   ├── queue/                  # pg-boss setup + iş idarəçiləri (yayım, bərpa)
│   ├── db/                     # Veritabanı konfigu, bağlantı hovuzu, sxem
│   └── utils/                  # Köməkçilər (downloadImages, logging, və s.)
├── docs/                       # Developer sənədləşdirmə
│   ├── ARCHITECTURE.md         # Sistem dizaynı və məlumat axınları
│   ├── KNOWN_ISSUES.md         # Xətalər, riskləri və TODO-lar
│   ├── BACKEND_DEVELOPER_GUIDE.md  # Setup və üzərində işləmə
│   ├── ENVIRONMENT.md          # Ətraf dəyişənləri
│   ├── API_HANDOFF.md          # HTTP API spesifikasiyası
│   ├── DB_HANDOFF.md           # Veritabanı sxemi
│   ├── PLATFORM_CONNECTORS.md  # Selenium avtomasyonu təfərrüatları
│   ├── DEPLOYMENT.md           # Produksiya setup
│   └── RUNBOOK.md              # Əmrlər və əməliyyatlar
├── .env.example                # Yerli .env üçün şablon
├── package.json                # Asılılıqlar və skriptlər
├── tsconfig.json               # TypeScript konfigu
└── next.config.ts              # Next.js konfigu (API proxy yenidən yazma)
```

---

## 🚀 Başlanğıc

### Tələblər

- **Node.js** 18+ (LTS tövsiyə olunur)
- **PostgreSQL** 12+ (yerli və ya uzaq)
- **Google Chrome / Chromium** (Selenium konnektorları üçün; `CHROME_BIN` vasitəsilə yol isteğe bağlı)
- **Git** (versiya nəzarəti üçün)

### Yerli Setup (5 dəqiqə)

**1. Klonlayın və quraşdırın:**
```bash
git clone https://github.com/ArazFlutter/salex.git
cd salex
npm install
```

**2. Ətraf dəyişənləri konfigur edin:**
```bash
cp .env.example .env
```

Sonra `.env` redaktə edin:
```bash
# Tələb olunan
DATABASE_URL=postgres://postgres:password@localhost:5432/salex

# İsteğe bağlı (göstərilən parametrlər)
PORT=4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
APP_URL=http://localhost:3000
```

**3. Veritabanını işə salın:**
```bash
npm run db:bootstrap
```

Bu bütün cədvəlləri, indeksləri və pg-boss sxemini yaradır.

**4. Xidmətləri başladın (üç terminal):**

**Terminal 1 — Backend API + yerləşdirilmiş pg-boss:**
```bash
npm run server:dev
```
`src/` dəyişiklikləri izləyir. `http://localhost:4000`-də çalışır.

**Terminal 2 — İş işçisi (siyahıları yayımlamaq):**
```bash
ENABLE_WORKER_IN_SERVER=false npm run worker:dev
```
İsteğe bağlı iş yayımlamasını test etmədiyiniz halda. Sıradakı yayım işlərini emal edir.

**Terminal 3 — Frontend:**
```bash
npm run dev
```
`http://localhost:3000`-də çalışır. Brauzerə açın və ya Telegram Mini App ön izləməsinə açın.

---

## 🔗 Yerli Hostlar

| Xidmət | URL | Məqsəd |
|--------|-----|---------|
| **Frontend** | `http://localhost:3000` | Next.js applikasiyası; Telegram Mini App burada çalışır |
| **Backend API** | `http://localhost:4000` | Express REST API; autentifikasiya, siyahılar, işləri idarə edir |
| **PostgreSQL** | `DATABASE_URL`-dən | Applikasiya məlumatları + pg-boss iş sırası |
| **Admin paneli** | `http://localhost:4000/admin` | (tətbiq olunarsa) İş monitorinqi |

**Qeyd:** Next.js avtomatik olaraq `/api/*` və `/uploads/*` 3000 portundan 4000 portuna **yenidən yazır**. API-yə birbaşa `:4000`-də və ya Next.js proxy vasitəsilə vura bilərsiniz.

---

## 📋 Sürətli Əmrlər

```bash
npm run dev                    # Bütün üç xidmətini başlat (server + işçi + next)
npm run server:dev             # API + yerləşdirilmiş işlər
npm run worker:dev             # Müstəqil işçi
npm run db:bootstrap           # Cədvəlləri yarat
npm run db:seed                # Test məlumatını daxil et
npm run lint                   # ESLint-i çalıştır
npm run build                  # Produksiya üçün qurun
npm run start                  # Produksiya qurmasını çalıştırın
npm run smoke:backend          # API nöqtələrini test et
npm run smoke:publish-connectors  # Selenium konnektorlarını test et
```

---

## 🌐 Deployment

### Frontend (Vercel)
- `main` branşina push üzrə avtomatik deploy
- **Live URL:** `https://salex-next.vercel.app` (və ya sizin Vercel layihə)
- Ətraf dəyişən: `NEXT_PUBLIC_BACKEND_URL` Railway backend-ə işarə edir

### Backend (Railway)
- Git push və ya Railway CLI vasitəsilə deploy
- **Live URL:** `https://salex-api.railway.app` (və ya Railway layihə domeni)
- Ətraf dəyişən: `DATABASE_URL` Railway PostgreSQL-ə işarə edir
- İşçi ayrı dyno/xidmət olaraq çalışır

### Telegram Bot
- **Bot Username:** `@YourSALexBot` (`.env` → `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`-da konfigur edin)
- İstifadəçilər Telegram-da `/start` əmri vasitəsilə əlaqə qururlar
- Mini App Vercel frontend-dən yüklənir

---

## 📚 Sənədləşdirmə

| Sənəd | Məqsəd | Auditoriya |
|-------|--------|-----------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Sistem dizaynı, məlumat axınları, komponent əlaqələri | Bütün developerləri |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | Kritik xətalar, riskləri, TODO-lar | Bütün developerləri |
| [docs/BACKEND_DEVELOPER_GUIDE.md](docs/BACKEND_DEVELOPER_GUIDE.md) | Backend developerləri üçün onboarding; nə qurmaq | Backend mühəndisləri |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Bütün ətraf dəyişənlər izahlı | DevOps, bütün developerləri |
| [docs/API_HANDOFF.md](docs/API_HANDOFF.md) | HTTP API marşrutları, request/response spesifikasiyası | Frontend & backend developerləri |
| [docs/DB_HANDOFF.md](docs/DB_HANDOFF.md) | Veritabanı sxemi, cədvəl əlaqələri | Backend developerləri |
| [docs/PLATFORM_CONNECTORS.md](docs/PLATFORM_CONNECTORS.md) | Selenium avtomasyonu necə işləyir; platform spesifik təcrübələr | Backend developerləri |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Produksiya yoxlama siyahısı, Railway setup, SSL sertifikatları | DevOps mühəndisləri |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Ümumi əməliyyatlar (yenidən başlat, loglar, veritabanı miqrasiyaları) | DevOps & on-call |

---

## 🔐 Autentifikasiya (Cari və Gələcək)

### Cari: OTP + Qlobal Sesiya
- İstifadəçi telefon daxil edir → SMS-də 4 rəqəmli kod alır
- Backend kodu `otp_sessions` cədvəlinə saxlayır; `is_current = TRUE` təsdiqlənir
- **⚠️ Problemlər:** Qeyri-etibarlı SMS, loqda açıq kod, qlobal sesiya (hər tabda deyil)

### Gələcək: Telegram `initData` + JWT
- Applikasiya Telegram-ın içində çalışır → istifadəçi artıq autentifikasiyalanıb
- Sorğu Telegram tərəfindən imzalanan `initData` ehtiva edir
- Backend imzanı yoxlayır → JWT token verir
- **Faydaları:** Etibarlı (SMS yoxdur), daha təhlükəsiz, cihaz başına sesiası, daha yaxşı UX

[docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md)-də detallar baxın.

---

## 🛟 Problemləşdirmə

### "PostgreSQL-ə bağlana bilmədi"
```bash
# .env-də DATABASE_URL-ni yoxlayın
# PostgreSQL-in çalışdığını yoxlayın
psql $DATABASE_URL -c "SELECT version();"
```

### "4000 portu artıq istifadə olunur"
```bash
# .env-də PORT-u dəyişin və ya mövcud prosesi öldürün
lsof -i :4000  # Prosesi tap
kill -9 <PID>  # Onu öldür
```

### "Chrome tapılmadı" (Selenium xətası)
```bash
# Chrome quraşdırın və ya yolu təyin edin
export CHROME_BIN=/usr/bin/google-chrome
npm run worker:dev
```

### "Telegram Mini App yüklənməyəcək"
- `NEXT_PUBLIC_BACKEND_URL` faktiki backend ilə uyğun olduğunu yoxlayın
- Brauzer konsolu (F12) `/api/me`-də 401 xətası göstərməməlidir
- Telegram applikasiyası keşini təmizləyin və yenidən yükləyin

---

## 📞 Dəstək

- **Problemlər:** Bu depo-da GitHub Issues
- **Suallar:** Texniki icmala baxmaq üçün [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) 
- **Başlanğıc:** [docs/BACKEND_DEVELOPER_GUIDE.md](docs/BACKEND_DEVELOPER_GUIDE.md) baxın

---

## 📄 Lisenziya

(Lisenziyalı buraya əlavə edin)

---

**Son Yeniləmə:** May 2026  
**Saxlayanlar:** SALex komandası
