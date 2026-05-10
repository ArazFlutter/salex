# SALex — Telegram Mini App for Multi-Marketplace Listings

> **One click, all markets.** Telegram-ın içində Azərbaycan bazarlarına otomatik olaraq məhsul yayımlayın.

**SALex** (Smart Auto Listing Exchange) satıcılara bir siyahı yaradıb **Tap.az**, **Lalafo**, **Alan.az**, **Laylo.az** və **Birja.com**-a eyni anda yayımlamaq imkanı verir.

---

## 🚀 Başlamaq

👉 **Yeni Developer misiniz?** [docs/01_START_HERE.md](docs/01_START_HERE.md) oxuyun (5 dəq setup).

---

## 📚 Sənədləşdirmə

| Oxumalı | Əgər... |
|-----------|--------|
| [**01_START_HERE.md**](docs/01_START_HERE.md) | Yeni misiniz, setup lazımdır |
| [**02_PROBLEMS.md**](docs/02_PROBLEMS.md) | Nə düzəltməli olduğunu bilin |
| [**03_ARCHITECTURE.md**](docs/03_ARCHITECTURE.md) | Sistem necə işləyir |

---

## 🛠 Texnologiya Yığını

- **Frontend:** Next.js 15 + Telegram Mini App
- **Backend:** Express 5 + Node.js
- **Database:** PostgreSQL + pg-boss (job queue)
- **Automation:** Selenium + Chrome (platform connectors)
- **Deploy:** Vercel (frontend) + Railway (backend)

---

## 📋 Sürətli Əmrlər

```bash
npm run dev              # Hamısını başlat (frontend + backend + worker)
npm run server:dev       # Yalnız backend
npm run db:bootstrap     # Veritabanı sxemini qur
npm run lint            # Kod yoxlaması
npm run build           # Produksiyaya quruluş
```

---

## 🎯 Sistem İcmalı

```
Telegram Mini App (Next.js, :3000)
         ↓ /api/* proxy
Express Backend (:4000)
  ├─ API marşrutları
  ├─ pg-boss job queue
  └─ Selenium platform konnektorları
         ↓
PostgreSQL + Tap.az + Lalafo + Alan.az + Laylo.az + Birja.com
```

---

## 📍 Yerli URL-lər

| | | |
|---|---|---|
| Frontend | http://localhost:3000 | Telegram Mini App |
| Backend | http://localhost:4000 | REST API |
| Health | http://localhost:4000/api/health | Status yoxlaması |

---

## 🔧 CLAUDE.md

Project-spesifik instructions üçün: [CLAUDE.md](./CLAUDE.md)

---

## 📞 Dəstək

- **Setup problemlər:** [01_START_HERE.md](docs/01_START_HERE.md)
- **Məlum xətalar:** [02_PROBLEMS.md](docs/02_PROBLEMS.md)
- **Sistem dizaynı:** [03_ARCHITECTURE.md](docs/03_ARCHITECTURE.md)
- **GitHub Issues:** Bug report edin

---

**Last Updated:** May 2026  
**Tech Stack:** Next.js + Express + PostgreSQL + Selenium