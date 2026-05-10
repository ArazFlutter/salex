# 📋 Məlum Problemlər — SALex

> Prioritetə görə təşkil olunmuş. Nə düzəltməli olduğunu bilin.

---

## 🔴 KRİTİK (Dərhal Düzəlt)

### #1: Autentifikasiya OTP Sistemi Qeyri-etibarlı

**Vəziyyət:** Produksiyada pozulmuş

**Problem:**
- SMS OTP qeyri-etibarlı (yavaş, tez-tez çatmır)
- OTP kodu loqlara açıq yazılır (təhlükəsizlik riski)
- Qlobal sesiya (cihaz başına deyil)
- JWT tokenləri yoxdur

**Nə etməli:**
- Telegram `initData` + JWT-ə keç
- `POST /api/auth/telegram` nöqtəsi əlavə et
- SMS məntiqini sil
- Frontend `localStorage` əvəzinə httpOnly cookies istifadə et

**Əmək:** ~3 gün (1 backend, 1 frontend, 1 sınaq)

**Fayllar:**
- `src/routes/auth.ts`
- `src/middleware/authenticate.ts`
- `app/page.tsx`
- `lib/api.ts`

---

### #2: Railway-da Selenium/Chrome Etibarlı Şəkildə İşləmir

**Vəziyyət:** Qismən işləyir, çox emal edirlər

**Problem:**
- Chrome qəzaları (version mismatch)
- Düymə seçiciləri tapılmır
- Headless məhdudiyyətləri
- Platform saytları Chrome-u blok edirlər

**Nə etməli:**
- Selenium-u Puppeteer-ə dəyişdir
- Ya ayrı Selenium xidmətindən istifadə et

**Əmək:** ~3-4 gün (Puppeteer seçənəyi)

**Fayllar:**
- `src/connectors/*.ts` — Puppeteer API-yə rewrite

---

## 🟡 ORTA (Bu Həftə)

### #4: Platform Yayımlaması Sona Qədər Sınaqdan Keçmədi

**Vəziyyət:** Tap.az & Lalafo işləyir, Alan.az/Laylo/Birja skeletdir

**Problem:**
- 3 platformada konnektoru yoxdur
- Heç bir E2E sınaqu yoxdur
- UI dəyişiklikləri sınaqları pozur

**Nə etməli:**
- Çatışan 3 konnektoru tətbiq et
- E2E sınaqu yazma: `npm run test:e2e`
- CI/CD pipeline-ə əlavə et

**Əmək:** ~4-5 gün

**Fayllar:**
- `src/connectors/alanaConnector.ts`
- `src/connectors/layloConnector.ts`
- `src/connectors/birjacomConnector.ts`
- `tests/e2e/publish.test.ts`

---

### #5: Alan.az & Birja.com Konnektorları Tətbiq Olunmadı

**Vəziyyət:** Yalnız `throw new Error('Not implemented')`

**Problem:**
- İstifadəçilər bu bazarlara yayımla bilmirlər

**Nə etməli:**
- Her birin UI axınını analiz et
- Konnektoru tətbiq et (Tap.az-dan kopyala + uyğunlaştır)
- Sınaq

**Əmək:** ~1-2 gün hər biri

---

### #8: Platform Bağlantı Axını Qismən Tətbiq Olunmuş

**Vəziyyət:** Tap.az/Lalafo işləyir, token reuse etmir

**Problem:**
- Tokenləri saxlanırız amma istifadə etmirik
- Hər yayımlamada yenidən daxıl olur (yavaş)
- Token yenilənməsi yoxdur

**Nə etməli:**
- Konnektoru mövcud tokeni yoxlamağa dəyişdir
- Token müddəti ötərsə refresh/yenidən daxıl ol
- Test

**Əmək:** ~1-2 gün

---

## 🟢 AŞ PRIORITET (Sonra)

### #6: OTP üçün Həqiqi SMS İnteqrasiyası Yoxdur

**Vəziyyət:** Konsolda loq yazılır yalnız

**Problem:**
- Heç bir SMS provayderı inteqrasiya edilmədi

**Nə etməli:**
- Twilio/Vonage inteqrasiyası (2 gün)
- **YA** Telegram auth-ə keç (#1-dən — daha yaxşı)

---

### #7: İşçi vs Server İdarəçi Qeydiyyatı Çaşdırıcı

**Vəziyyət:** İşləyir amma aydın deyil

**Problem:**
- Server və worker idarəçiləri qeydə alır
- Hansı setup produksiya üçün? Aydın deyil

**Nə etməli:**
- Sənədləri aydınlaş
- Best practice izah et: dev (embedded), prod (separate services)

**Əmək:** ~1 gün (sənədlər)

---

### #9: Bərpa Sırası Məntiqləri Tam Sınaqdan Keçmədi

**Vəziyyət:** Tətbiq olunmuş amma monitorinq yoxdur

**Problem:**
- Bərpa uğursuzsa, xəbərdarlıq yoxdur
- Backoff strategiyası yoxdur
- 1000 uğursuz iş nə qədər vaxt çəkər?

**Nə etməli:**
- Monitorinq əlavə et
- Exponential backoff əlavə et
- Rate limiting əlavə et

**Əmək:** ~2-3 gün

---

## 📊 Prioritet Sırası

1. **#1 — Telegram Auth** (🔴 Critical, 3 gün)
2. **#2 — Puppeteer/Railway** (🔴 Critical, 4 gün)
3. **#4 — E2E Testləri** (🟡 Medium, 5 gün)
4. **#5 — Alan.az & Birja** (🟡 Medium, 3 gün)
5. **#8 — Token Reuse** (🟡 Medium, 2 gün)
6. **#6 — Real SMS** (🟢 Low, 2 gün)
7. **#7 — Worker Docs** (🟢 Low, 1 gün)
8. **#9 — Bərpa Monitoring** (🟢 Low, 3 gün)

---

## ✅ Yoxlama Siyahısı

**Hansı prioritet?**
- [ ] #1, #2 (0-2 həftə)
- [ ] #4, #5, #8 (2-4 həftə)
- [ ] #6, #7, #9 (Sonraki sprint)

**Hansı seçim?**
- Telegram auth (#1) — **Tələb olunur**
- Puppeteer vs separate service (#2) — **Puppeteer tövsiyə olunur**
- SMS → Twilio vs skip (#6) — **Skip et, Telegram auth istifadə et**

---

**Son Yeniləmə:** May 2026  
**Hazırlayan:** SALex Komandası