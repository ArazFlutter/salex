# Məlum Problemlər və Yol Xəritəsi — SALex

Kritik xətalar, dizayn çatışmamazlıqları və düzəlişə ehtiyac olan elementlər. Prioritet əsasında təşkil olunmuşdur.

---

## 🔴 KRİTİK

### 1. Autentifikasiya: OTP Sistemi Qeyri-etibarlı

**Vəziyyət:** Produksiyada pozulmuş; Telegram `initData` + JWT-yə miqrasiya lazımdır

**Problem:**
- Cari sistem SMS OTP yoxlamadan istifadə edir
- OTP kodu **loqlara açıq şəkildə yazılır** (`otpService.ts`)
- SMS çatdırılması qeyri-etibarlı (yavaş, bağlı, çatmayan)
- Qlobal sesiya modeli (cihaz/brauzer tabı başına deyil)
- Düzgün sesiya tokenləri yoxdur (DB bayrağı `is_current` istifadə edir)

**Cari Kod:**
```typescript
// src/services/otpService.ts
log.info('auth.otp.sent', { phone, code }); // ❌ Açıq kod yazılıb!
```

**Niyə Dəyişməli:**
- Applikasiya **Telegram**-ın içində çalışır → istifadəçi artıq orada autentifikasiyalanıb
- SMS lazım deyil; Telegram imzalı `initData` sübut əmn
- JWT tokenləri DB sesiya bayraqlarından daha təhlükəsiz və miqyaslanabilir

**Həll (Telegram initData + JWT):**

1. **SMS asılılığını silin:**
   - Frontend: `window.Telegram.WebApp.initData` əlçat edin
   - Backend-ə göndərin: `POST /api/auth/telegram { initData }`

2. **Backend imzanı yoxlayır:**
   ```typescript
   // Telegram bot tokenindən istifadə edərək
   const isValid = verifyTelegramWebAppData(initData, BOT_TOKEN);
   if (!isValid) return 401;
   
   const userId = parseTelegramUser(initData).id;
   ```

3. **JWT token verim:**
   ```typescript
   const token = jwt.sign(
     { userId, iat: Date.now() },
     JWT_SECRET,
     { expiresIn: '30d' }
   );
   ```

4. **Klient tokeni saxlayır:**
   ```typescript
   localStorage.setItem('auth_token', token);
   // Bütün sorğulara daxil et: Authorization: Bearer <token>
   ```

5. **OTP cədvəllərini silin:**
   - `otp_sessions` cədvəlini burax
   - `src/services/otpService.ts` silin
   - Auth məntiqini sadələşdir

**Faydaları:**
- ✅ SMS asılılığı yoxdur
- ✅ Ani yoxlama (Telegram istifadəçi artıq yoxlamışdır)
- ✅ Daha təhlükəsiz (imzalı tokenləri, DB bayraqları deyil)
- ✅ Cihaz başına tokenləri (JWT ID-li)
- ✅ Daha yaxşı mobil UX (OTP gözləməsi yoxdur)
- ✅ Loglar etimadnamelər ekspos etməyəcək

**Əmək Xərcləri:** ~2-3 gün (1 gün backend, 1 gün frontend, 1 gün sınaq)

**Dəyiştirilməli Fayllar:**
- `src/routes/auth.ts` — Yeni `/api/auth/telegram` nöqtə
- `src/services/userService.ts` — Sesiya lookupa əvəzinə JWT yoxlaması
- `src/middleware/authenticate.ts` — Sesiya bayrağı əvəzinə JWT yoxla
- `app/page.tsx` — Telegram initData istifadə et, JWT localStorage-də saxla
- `lib/api.ts` — Bütün API sorğularına JWT daxil et

**Sınaq:**
- Telegram imzasının yoxlanılması üçün unit testləri
- Həqiqi Telegram Mini App-ında E2E sınaq (dev rejimi)
- Çıxışın tokeni təmizlədiyini doğrula

---

### 2. Railway-dəki Puppeteer/Selenium: Chrome Etibarlı Şəkildə İşləmir

**Vəziyyət:** Qismən işləyir; mürəkkəb saytlarda qəza edir

**Problem:**
- Railway mühitində Chrome/Chromium düzgün qonfigur olmaya bilər
- Selenium konnektorları uğursuz olur:
  - Düymə tapılmır (selector problemləri)
  - Bazarlara daxil olmaqda uğursuz (CDP timeout-ları)
  - Formları doldurmaqda uğursuz (JavaScript injection uğursuzluqları)
- **Xəta Mesajları:**
  - `ChromeDriver version mismatch`
  - `Button not found: Daxil ol` (Tap.az "Login" düyməsi)
  - `Chrome process crashed`

**Cari Workaround-lar:**
- `CHROME_BIN` env var Chrome yolunu təyin etməsi
- `clickByText()` köməkçi daha etibarlı düymə tapmaması üçün əlavə olunmuş
- Debug rejimi: `TAPAZ_DEBUG_REQUEST_LOG=1` şəbəkə çağırılarını loqla
- CDP gövdə yenidən yazma euristika ilə: `TAPAZ_LOGIN_FETCH_OVERRIDE`

**Niyə Hələ Qırılır:**
1. **Versiya fərqi:** Quraşdırılmış Chrome ≠ chromedriver versiyası
2. **Railway sandbox məhdudiyyətləri:** Chrome daha çox sistem resursuna ehtiyaç duyur
3. **Platform yenilmələri:** Bazarlar UI/API dəyişdirirlər; selectorlər köhnələşir
4. **Headless məhdudiyyətləri:** Bəzi saytlar headless Chrome-u aşkar edir və blok edir

**Həll (İki Seçənək):**

**Seçənək A: Railway-da Puppeteer istifadə edin (Tövsiyə Olunur)**
- Headless avtomasyonu üçün daha etibarlı
- Quraşdırılmış Chrome bundling (düzgün versiya)
- JavaScript-ağır saytların daha yaxşı idarəçiliyi
- Selenium-u Puppeteer ilə dəyişdir

**Addımlar:**
1. Quraşdırın: `npm install puppeteer`
2. Konnektorları yenidən yazın:
   ```typescript
   // Köhnə (Selenium)
   const driver = buildChromeDriver();
   await driver.findElement(By.css('input[name=phone]')).sendKeys(phone);
   
   // Yeni (Puppeteer)
   const browser = await puppeteer.launch();
   const page = await browser.newPage();
   await page.goto(url);
   await page.$eval('input[name=phone]', el => el.value = phone);
   await page.click('button:contains("Login")');
   ```
3. Railway-da yerli sınaq (Railway CLI)
4. Env varlarını yeniləyin (`PUPPETEER_EXECUTABLE_PATH`)

**Seçənək B: Ayrı Xidmətindən istifadə edin**
- Başqa platformada ayrı Selenium/Chrome xidmətini deploy edin
- SALex backend API vasitəsilə çağırır: `POST https://selenium-service.railway.app/publish { platform, listing }`
- Artılar: İzolə; daha asan miqyas
- Mənfilər: Daha mürəkkəb; gecikmə əlavə edir

**Əmək Xərcləri (Seçənək A):** ~3-4 gün (konnektorları yenidən yaz, hər platform sınaq)

**Dəyiştirilməli Fayllar:**
- `src/connectors/seleniumSession.ts` → Puppeteer ilə dəyişdir
- `src/connectors/tapazConnector.ts` və s. — Puppeteer API istifadə edərək yenidən yaz
- `.env.example` — Chrome/Puppeteer env varlarını yeniləyin
- `Dockerfile` (istifadə olunarsa) — Puppeteer asılılıqlarını təmin edin

**Sınaq:**
- `npm run smoke:publish-connectors` ilə konnektorları yerli çalıştırın
- Railway dev mühitinə deploy; hər bazar ilə sınaq
- headless=true və headless=false ilə sınaq

---

### 3. Telegram Mini App DB Truncate-dan Sonra Köhnə (Stale) İstifadəçi Məlumatı Göstərir

**Vəziyyət:** Düzəldilmiş (v1.0.1 hydration + cache-bust)

**Problem (Tarix):**
- DB truncate edildi (bütün istifadəçilər silindi)
- `/api/me` 401 qaytardı (düzgün)
- BUT: Telegram Mini App köhnə qeydiyyat məlumatını göstərdi
- Kök səbəb: Telegram WebView localStorage-i agresiv şəkildə keşir + React state

**Tətbiq Olunan Həllər:**
1. **Hydration Qəfili (v1.0.0):**
   - `isHydrating` state əlavə edin
   - `/api/me` tamamlanana qədər bütün UI render etməyi blok edin
   - Hydration zamanı `LoadingScreen` göstərin
   - Stale UI flaşının məqsidinə bağlamasını qeyd et

2. **Keş-Busting (v1.0.1):**
   - `APP_VERSION` implicit-dən explicit '1.0.1'-ə qaldır
   - `invalidateStaleAppVersion()` versiya dəyişikliyini aşkar edir
   - Versiya fərqində localStorage-in hamısını təmizlə
   - Telegram-a sonrakı açmada yeniləməsi üçün məcbur et

**Niyə Bir Problemdir:**
- Telegram localStorage-i `browser.clear()` sonra da keşir
- React komponenti dərhal initial state ilə render edir
- Frontend `/api/me` tamamlanana qədər məlumatları göstərmədən əvvəl gözləmir

**Nəticə:**
- ✅ Stale məlumat flaşı yoxdur
- ✅ Versiya nəhü keşi təmizləyir
- ✅ İstifadəçilər həmişə sıx vəziyyət görürlər

**Long-term Həll:**
- JWT-dən əsaslandırılmış autentifikasiya (localStorage asılılığı yoxdur)
- Tokenləri memory-də və ya httpOnly cookies-də saxla
- Persistent stale vəziyyət yoxdur

---

## 🟡 ORTA

### 4. Platform Yayımı Sona Qədər Sınaqdan Keçmədi

**Vəziyyət:** Qismən işləyir; E2E sınaq lazımdır

**Problem:**
- Tap.az & Lalafo: Konnektorlar mövcuddur, yerli sınaqdan keçmiş
- Alan.az, Laylo.az, Birja.com: **Konnektoru skeletləri yalnız**
- Heç bir avtomatlaşdırılmış E2E sınaqu yoxdur (yayımla → bazarda siyahı görünməsini doğrula)
- Yerli sınaq vaxt aparıcı; UI dəyişiklikləri pozulur

**Nə Çatışmır:**
- [ ] Tam Alan.az konnektoru (`src/connectors/alanaConnector.ts`)
- [ ] Tam Laylo.az konnektoru
- [ ] Tam Birja.com konnektoru
- [ ] E2E sınaq yığını: `npm run test:e2e` (bütün 5 bazara yayımla, URL-ləri doğrula)
- [ ] CI/CD pipeline hər deployment-dən əvvəl testləri çalıştırması

**Həll:**
1. **Çatışan konnektorları tətbiq edin:** Tap.az/Lalafo kopyala, hər platformaya uyğunlaştır
2. **E2E testləri yaz:**
   ```bash
   # E2E sınaq: Siyahı yaratma, bütün 5 bazara yayımla, URL-ləri doğrula
   npm run test:e2e
   ```
3. **CI-yə əlavə edin:** GitHub Actions produksiyaya deployment əvvəl E2E çalıştırır

**Əmək Xərcləri:** ~4-5 gün (konnektoru başına 1-2 gün, sınaq framework üçün 1 gün)

**Yaradılacaq Fayllar:**
- `src/connectors/alanaConnector.ts`
- `src/connectors/layloConnector.ts`
- `src/connectors/birjacomConnector.ts`
- `tests/e2e/publish.test.ts`
- `.github/workflows/e2e.yml` (GitHub Actions)

---

### 5. Alan.az & Birja.com Konnektorları Tətbiq Olunmadı

**Vəziyyət:** Yalnız skelet; heç bir funksionallıq yoxdur

**Cari Kod:**
```typescript
export class AlanazConnector implements PlatformConnector {
  async publishListing(): Promise<PublishResult> {
    throw new Error('Not implemented');
  }
}
```

**Niyə Əhəmiyyətli:**
- İstifadəçilər bu bazarlara yayımla bilmirlər ("Not implemented" xətası alacaqlar)
- Backend 400 qaytarır, amma UX çaşdırıcıdır

**Nə Edilməli:**
1. **Hər platformanın UI axınını analiz edin:**
   - Daxil olmaq necə (telefon + OTP?)
   - Siyahı yaratma forması harada?
   - Hansı sahələr tələb olunur?
   - Necə təqdim edib URL almaq?

2. **Konnektoru tətbiq edin:**
   ```typescript
   export class AlanazConnector implements PlatformConnector {
     async publishListing(listing: NormalizedListing): Promise<PublishResult> {
       const driver = buildChromeDriver();
       try {
         // 1. alan.az-ə keç
         // 2. Daxil olmaq (Tap.az-a oxşar)
         // 3. Siyahı yaratma səhifəsinə keç
         // 4. Form sahələrini doldur
         // 5. Təqdim et
         // 6. Siyahı URL-ni çıxar
         return { success: true, url: '...' };
       } catch (err) {
         return { success: false, error: this.normalizeError(err) };
       }
     }
   }
   ```

3. **Sınaq:** Yerli sınaq + E2E yığını

**Əmək Xərcləri:** Hər biri ~1-2 gün

**Fayllar:**
- `src/connectors/alanaConnector.ts` — ~200 sətir
- `src/connectors/birjacomConnector.ts` — ~200 sətir

---

### 6. OTP üçün Həqiqi SMS İnteqrasiyası Yoxdur

**Vəziyyət:** Qismən tətbiq olunmuş

**Problem:**
- OTP kodu konsola yazılır (`console.log` dev-də)
- Heç bir SMS provayderı inteqrasiya edilmədi (Twilio, Vonage, AWS SNS, və s.)
- Həqiqi SMS üçün kod mövcud amma şərh ləstirildi

**Cari Axın:**
```typescript
// src/services/otpService.ts
const code = generateRandomCode(); // məs., '1234'
log.info('auth.otp.sent', { phone, code }); // Server yazır
// ❌ Həqiqi SMS göndərilmir
```

**Niyə Kritik Deyil:**
- Yerli dev üçün işləyir (loglardan kodu oxu)
- Frontend SMS göndər uğursuzluğundan 401 idarə edə bilər

**Həll:**
- SMS provayderini inteqrasiya (Azərbaycan əhatəsi üçün Twilio tövsiyə olunur)
- OTP-ni ayrı xidmətə və ya iş sırasına keç
- **Daha yaxşı:** Tamamilə Telegram auth-ə keç (bax #1)

**Əmək Xərcləri:** ~2 gün (SMS edirsinizsə) və ya 0 gün (Telegram-a keçsənizsə)

---

## 🟢 AŞ PRIORITET

### 7. İşçi vs Server İdarəçi Qeydiyyatı

**Vəziyyət:** İşləyir amma çaşdırıcı

**Problem:**
- `src/server.ts` pg-boss başlat və idarəçiləri qeydə alır
- `src/queue/worker.ts` də pg-boss başlat və idarəçiləri qeydə alır
- Hər ikisini eynilə çalıştırmaq işləri iki dəfə emal etmə riski
- Produksiyada hansı setup istifadə etməli olduğu aydın deyil

**Cari Setup:**
```bash
# Seçənək 1: Server-dəki yerləşdirilmiş işçi
npm run server:dev

# Seçənək 2: Müstəqil işçi
ENABLE_WORKER_IN_SERVER=false npm run worker:dev
npm run server:dev (başqa terminalda)
```

**Niyə Çaşdırıcı:**
- pg-boss iş kilidləməsində; iki dəfə emal adətən baş vermir
- Lakin dizayn açıq deyil; sənədlər seçimi izah etmir
- Produksiyada tövsiyə olunanlar hansı aydın deyil

**Ən Yaxşı Təcrübə:**
- İnkişaf: Server yerləşdirilmiş işçi ilə çalıştırın (`ENABLE_WORKER_IN_SERVER=true`, default)
- Produksiya: Ayrı xidmətlər
  - API xidməti: `npm run start` (işçi deaktiv)
  - İşçi xidməti: Ayrı dyno/xidmət (`ENABLE_WORKER_IN_SERVER=false npm run start`)

**Həll:**
- README-dəki sənədlər: Hansı seçənəyi siqnallı qarar ağacı
- `server.ts`-yə şərhlər əlavə edin seçməni izah edən
- Env var `ENABLE_WORKER_IN_SERVER` tutarlı olduğuna əmin olun

**Əmək Xərcləri:** ~1 gün (sənədlər + kod review)

---

### 8. Platform Bağlantısı Axını Qismən Tətbiq Olunmuş

**Vəziyyət:** Tap.az & Lalafo üçün işləyir; sınaq lazımdır

**Problem:**
- Frontend popup platform bağlantısı işləyir
- Backend access tokenləri `platform_connections`-ə saxlayır
- Amma tokenləri yayımlanarkən istifadə olunmur (əvəzinə yenidən daxil olunur)
- Uğursuz platform bağlantılarından bərpa sınaqdan keçmədi

**Nə İşləyir:**
- İstifadəçi "Tap.az-ı Bağla" klikidir
- Popup Selenium daxıl olmaqla açılır
- Token çıxarılır və saxlanılır
- Cavab: "Bağlandı ✓"

**Nə Olmur:**
- Token sonrakı yayımlanmada yenidən istifadə (hər dəfə yenidən daxil olmaq əvəzinə)
- Token yeniləmə (provayderdir dəstəkləyirsə)
- Token müddəti ötmə və yenilənə
- Platformanı ayırmaq

**Həll:**
- Mövcud token üçün `platform_connections`-i yoxlamaq konnektoru dəyişdir
- Əgər etibarlı: Daxıl olmaqdan keç, tokeni birbaşa istifadə et
- Əgər müddəti ötdi: refresh_token sınaq ve ya yenidən daxil ol

**Əmək Xərcləri:** ~1-2 gün (hər konnektorda)

---

### 9. Bərpa Sırası və Təkrar Məntiqləri

**Vəziyyət:** Tətbiq olunmuş amma tam sınaqdan keçmədi

**Problem:**
- Bərpa işi hər 10 dəqiqə çalışır (`RECOVERY_SCHEDULE_CRON`)
- Uğursuz yayımlamaları `MAX_RECOVERY_RETRIES`-ə qədər yenidən cəhd edir
- Bərpa davamlı uğursuz olarsa monitorinq/xəbərdarlıq yoxdur
- Bərpa qismən uğursuzluqları düzgün idarə edib-etmədyi aydın deyil

**Nə İşləyir:**
- Cədvəlləşdirilmiş cron iş uğursuz sıraları sorğulamaq
- Yenidən sırala
- Backoff ilə emal

**Nə Aydın Deyil:**
- Bərpa bazar dərəcə məhdudiyyətlərini idarə edir mi?
- Bazar API aşağı olsa necə? Seçənəkləri sona qədər yenidən cəhd et mi?
- Bərpa 1000 uğursuz iş üçün nə qədər vaxt çəkər?

**Həll:**
- Monitorinq əlavə edin: Xəbərdar əgər failed_jobs cədvəli böyüyürsə
- Backoff əlavə edin: Yenidən cəhd arasında eksponensial gecikmə (1m, 5m, 15m, və s.)
- Dövrə qaynağı əlavə edin: Bazar API aşağı olarsa yenidən cəhd etməyi dayandır

**Əmək Xərcləri:** ~2-3 gün

---

## 📋 Miqrasiya Yoxlama Siyahısı

OTP-dən Telegram auth-ə keçərkən:

- [ ] Yeni `/api/auth/telegram` nöqtə yaratma
- [ ] Telegram imzasını yoxlama tətbiq
- [ ] Təsdiqlənəndə JWT tokenləri ver
- [ ] Frontend `initData` istifadə et
- [ ] API kliyenti bütün sorğulara `Authorization` başlığını daxil et
- [ ] Bütün autentifikasiya edilən marşrutları JWT yoxlamağa yeniləş
- [ ] Bütün testləri çalıştır
- [ ] Çıxışın tokenləri təmizlədiyini yoxla
- [ ] Köhnə OTP kodunu sil
- [ ] `otp_sessions` cədvəl miqrasiyasını silin
- [ ] Staging-ə deploy; E2E yoxla
- [ ] Dəyişən dəyişikliyi duyur edin changelog-da
- [ ] Köhnə istifadəçiləri miqrasiya edin (lazım olsa)
- [ ] Produksiyaya deploy

---

## 🔗 Əlaqəli Sənədləşdirmə

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Sistem dizaynı
- [BACKEND_DEVELOPER_GUIDE.md](./BACKEND_DEVELOPER_GUIDE.md) — Sonra nə işləmə
- [PLATFORM_CONNECTORS.md](./PLATFORM_CONNECTORS.md) — Selenium avtomasyonu təfərrüatları

---

**Son Yeniləmə:** May 2026  
**Prioritet:** #1 (auth) düzəlt, sonra #2 (Puppeteer/Railway), sonra #4 (E2E testləri)
