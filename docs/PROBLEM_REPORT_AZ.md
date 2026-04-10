# SALex — layihə problemləri hesabatı (cari kod bazası)

**Əsas:** `src/`, `app/`, `lib/`, `components/`, `docs/` və kök konfiqurasiyanın statik icmalı. **Yoxlanmayıb:** canlı marketplace publish, SMS çatdırılması və ya production deploy. Davranış yalnız koddan çıxarılıbsa, **fərziyyə** kimi qeyd olunur.

---

## 1. Kritik maneələr

Əsas “qeydiyyat → elan → publish” MVP axınını dayandıra və ya ciddi şəkildə təhrif edə bilən məsələlər.

### 1.1 Tətbiqdə “platforma qoşulması” marketplace-ə daxil olmur

- **Problem:** `POST /api/platforms/connect` yalnız PostgreSQL-də `platform_connections.connected = true` yazır. Brauzer açmır, cookie toplamır, etibarlılıq yoxlamır.
- **Niyə vacibdir:** İstifadəçi Tap.az / Lalafo və s. “qoşulub” görür, amma **`platform_sessions` boş** qalır, ta ki connector işləyib cookie saxlamasın. İlk publish üçün hələ də mühitdə **`TAPAZ_LOGIN_PHONE` (və oxşar) + OTP faylı/kodu** və ya həmin `userId` üçün əvvəlki uğurlu Selenium login lazımdır.
- **Sübut:** `src/services/platformService.ts` — yalnız platform id, plan yoxlaması və `connectCurrentUserPlatform`. Connector-lərdə `ensureAuthenticated` env telefon və/və ya DB sessiyası tələb edir (`tapazConnector.ts` ~601–679, `lalafoConnector.ts` ~211–229).
- **Növbəti addım:** Məhsul mətnini/axını dəyişin (məs. “burada publish üçün işarələ”) və ya real qoşulma (cookie import, OAuth, və ya eyni user üçün bələdçi Selenium sessiyası).

### 1.2 SALex OTP SMS ilə göndərilmir; kodlar server loglarına yazılır

- **Problem:** `sendOtp` sıra əlavə edir və uğur qaytarır; SMS provayderi çağırmır. **`log.info('auth.otp.sent', { phone, code })` OTP-ni açıq mətn kimi loglayır** (`otpService.ts` 35–41).
- **Niyə vacibdir:** Developer olmayan MVP demo bloklanır, ta ki API loglarına baxsınlar və ya **`db:seed`** istifadə etsinlər (seed telefon üçün `123456`). Production-da log aqreqasiyası ilə sızmalar.
- **Sübut:** `src/services/otpService.ts`; `docs/KNOWN_ISSUES.md` (Auth / OTP).
- **Növbəti addım:** SMS (və ya email) inteqrasiyası; OTP-ni loglardan çıxarmaq; “son sıra” semantikasını düzəltmək (aşağıdakı orta məsələ).

### 1.3 “Cari istifadəçi” tək qlobal DB sətiridir, brauzer başına sessiya deyil

- **Problem:** `getCurrentUser()` `otp_sessions`-də **`is_current = TRUE`** olan sətirlə birləşir (`userService.ts` 96–112). `verifyOtp` bütün current bayraqlarını təmizləyir (`otpService.ts` 100–108). **`logout` bütün cari sessiyaları silir**.
- **Niyə vacibdir:** İki brauzer, iki tester və ya köhnə tab **eyni məntiqi user-i bölüşür və ya toqquşur**. `lib/clientSession.ts` yalnız **`localStorage` `salex_client_user_id` ilə `/me` uyğunluğunu** yoxlayır — server tərəfdə qlobal vəziyyəti düzəltmir.
- **Sübut:** `src/services/userService.ts`, `src/services/otpService.ts`, `lib/clientSession.ts` (şərhlər 2–4).
- **Növbəti addım:** Cookie/JWT sessiyaları və ya tokenlə scope olunmuş sessiya cədvəli; və ya “yalnız tək operator” kimi sənədləşdirin.

### 1.4 Seed elanın kateqoriyası taksonomiya həll edicisi ilə uyğun gəlmir (həmin sətir üçün publish uğursuz olar)

- **Problem:** `seed.ts`-də `category: 'electronics'` (tək seqment). `resolveSalexTaxonomy` strukturlaşdırılmış yollar gözləyir (məs. `Elektronika`, `Daşınmaz əmlak`, və ya `Avtomobillər` ilə avtomobil yolu). Tək `'electronics'` **tanınmayan kök** / ailə çatışmazlığı verir.
- **Niyə vacibdir:** **Seed elanı** ilə smoke/demo publish **mapping/taksonomiya xətası** ilə worker-də düşə bilər, DB və növbə sağ olsa belə.
- **Sübut:** `src/db/seed.ts` (~17–26); `src/catalog/resolveSalexTaxonomy.ts`; worker `normalizeListing` + validasiya (`publishPlatform.ts` 75–84).
- **Növbəti addım:** Seed `category`-ni tam SALex path string ilə uyğunlaşdırın ki, `GLOBALLY_MAPPED_FAMILIES`-dən keçsin (`listingMappingValidation.ts`).

### 1.5 Publish yolu Chrome, chromedriver, mühit sirrləri və şəkillər üçün düzgün API çatımlılığından asılıdır

- **Problem:** Bütün beş connector **`buildChromeDriver`**, login env dəyişənləri və isteğe bağlı cookie inject istifadə edir. **`downloadImages`** `/uploads/...` üçün `PUBLIC_API_ORIGIN` / `127.0.0.1:$PORT` (`downloadImages.ts` 16–22).
- **Niyə MVP demo üçün vacibdir:** Chrome yoxdursa, versiya uyğunsuzluğu, env qurulmayıbsa və ya worker API host-a çata bilmirsə (Docker, səhv `PORT`/`PUBLIC_API_ORIGIN`) uğursuzluq və ya qeyri-sabitlik.
- **Sübut:** Connector sinifləri; `src/utils/downloadImages.ts`; `docs/KNOWN_ISSUES.md` (Selenium).
- **Növbəti addım:** Tək “blessed” lokal topologiya sənədləşdirin; sağlamlıq yoxlamaları; worker üçün obyekt saxlama URL-ləri.

---

## 2. Orta prioritetli məsələlər

Təhlükəsizlik, sabitlik və ya düzgünlük üçün vacib; idarə olunan tək maşın demosunda həmişə bloklamır.

### 2.1 OTP yoxlaması “yalnız son sıra”; hər `send-otp` yeni sıra əlavə edir

- **Problem:** `verifyOtp` telefon üçün ən son `otp_sessions` sətirini götürür. Yeni göndərmə əvvəlki kodları etibarsız etmir.
- **Sübut:** `otpService.ts`; `docs/KNOWN_ISSUES.md`.
- **Növbəti addım:** Yeni göndərmədə köhnə sıraları etibarsız etmək və ya aktiv göndərmə id ilə uyğunlaşdırmaq.

### 2.2 Publish job `success` ola bilər, platform sətirləri isə hələ `published_pending_link`

- **Problem:** `maybeFinishJob` yalnız `waiting` / `processing` olmayanları gözləyir (`finishJob.ts` 11–17). **`published_pending_link`** “bitmiş” sayılır, valideyn job **`success`** ola bilər, permalinklər hələ yoxdur.
- **Növbəti addım:** `published_pending_link`-i job tamamlanması üçün gözlənilən kimi saymaq və ya `partial` / `pending_links` statusu.

### 2.3 Taksonomiya / publish validasiyası müəyyən ailə dəstinə məhduddur

- **Problem:** `GLOBALLY_MAPPED_FAMILIES` (`listingMappingValidation.ts`). `CreateListingScreen.tsx` bir çox ağac qurur; bu `familyId`-lərə map olunmayan budaqlar worker-də uğursuz olur.
- **Növbəti addım:** UI-ni dəstəklənən yollarla məhdudlaşdırmaq və ya mapper + cədvəlləri genişləndirmək.

### 2.4 Tap.az: kövrək login (DOM, CDP Fetch override, debug log)

- **Problem:** Selenium selektorları, defolt **CDP Fetch body rewrite**, **`TAPAZ_DEBUG_REQUEST_LOG`** bəzi POST bədənlərini loglaya bilər.
- **Növbəti addım:** Paylaşılan mühitdə debug söndürmək; dar log; inteqrasiya testləri.

### 2.5 Server və ayrıca worker hər ikisi pg-boss işçilərini qeydiyyata alır

- **Problem:** `server.ts` və `worker.ts` hər ikisi `registerHandlers` çağırır — README-də hər ikisini işlətmək resurs və əməliyyat qarışıqlığı yaradır. **Fərziyyə:** pg-boss kilidləmə ilə təhlükəli olmaya bilər, amma konfiqurasiya asanlıqla səhv gedir.
- **Növbəti addım:** “API tək” vs “API+worker” sənədləşdirin; env ilə bir prosesdə handler söndürmək.

### 2.6 Ödənişlər yalnız dev/simulyasiya

- **Problem:** `fakePaymentUrl`, `confirmPaymentOrder` real PSP olmadan plan yeniləyir (`paymentService.ts`).
- **Növbəti addım:** Ödəmə şluzu və ya dev xaricində funksiyanı bağlamaq.

### 2.7 Frontend fon yeniləmələrində xətalar udurulur

- **Problem:** `refreshPlatforms` / `refreshListings` boş `catch` (`app/page.tsx` ~220–237).
- **Növbəti addım:** Toast, retry və ya dev log.

### 2.8 Hidrasiya — `eslint-disable` exhaustive-deps

- **Problem:** `hydrateFromApi` üçün qəsdən asılılıqlar kənara qoyulub (`app/page.tsx` ~281); genişləndirmə zamanı səhv riski.
- **Növbəti addım:** Effekt/refaktor.

---

## 3. Aşağı prioritet / təmizlik

- **`@google/genai` / `GEMINI_API_KEY`:** Repoda `*.ts`/`*.tsx`/`*.js` altında istinad tapılmayıb — **ölü asılılıq** ola bilər.
- **Kök səviyyəli bir dəfəlik skriptlər** (`add_*.js`, `update_*.js`, `generate_modals.js`, `app/applet/insert_realestate_modals.js` və s.): işə salındıqda böyük faylları dəyişə bilər.
- **`package.json` `name`:** hələ `ai-studio-applet`.
- **`hooks/use-mobile.ts`**, bəzi form komponentləri: istifadəsiz ola bilər.
- **README vs `docs/`:** indeks uyğunsuzluğu.

---

## 4. Platforma üzrə status

**Üsul:** Kod həcmi, `ensureAuthenticated` + env `*_LOGIN_PHONE` + OTP faylı/kodu, kateqoriya naviqasiyası. **Bu auditdə yoxlanmayıb:** canlı saytlarla E2E.

### Tap.az

| Sahə | Qiymət |
|------|--------|
| **Kodda işləyən** | Tam Selenium: login, sessiya təmizləmə/CDP, isteğe bağlı Fetch override, publish, `fetchListingUrl`, cookie persist. |
| **Qismən** | `isSessionValid` heuristik DOM; CDP mühitdə olmaya bilər; override POST heuristikasına bağlıdır. |
| **Risk / qırıq ola bilər** | **Fərziyyə:** UI dəyişiklikləri selektorları sındırır; debug log təhlükəlidir. |

### Lalafo

| Sahə | Qiymət |
|------|--------|
| **Kodda işləyən** | Böyük `publishListing`, bir neçə “yeni elan” URL namizədi, kateqoriya, şəkil yükləmə, nəticə çıxarışı, axtarışla recovery. |
| **Qismən** | Eyni env/sessiya modeli; sayt strukturu dəyişəndə URL-lər köhnələ bilər. |
| **Risk** | **Fərziyyə:** E2E sabitliyi naməlum. |

### Alan.az

| Sahə | Qiymət |
|------|--------|
| **Kodda işləyən** | Namizəd URL-lər, mətnlə kateqoriya, forma, `ALANAZ_ID_RE`. |
| **Qismən** | Mapper-dan gələn path-lərin canlı saytla uyğunluğu. |
| **Risk** | **Fərziyyə:** E2E təsdiqlənməyib. |

### Laylo.az

| Sahə | Qiymət |
|------|--------|
| **Kodda işləyən** | Oxşar arxitektura; `LAYLO_ID_RE`. |
| **Risk** | **Fərziyyə:** E2E təsdiqlənməyib. |

### Birja.com

| Sahə | Qiymət |
|------|--------|
| **Kodda işləyən** | Oxşar pattern; `BIRJA_ID_RE`. |
| **Risk** | **Fərziyyə:** E2E təsdiqlənməyib. |

---

## 5. MVP risk xülasəsi

**Bu gün təmiz MVP demonu nə çətinləşdirir**

1. **Auth:** SMS yox; OTP logda; qlobal sessiya — yalnız tək developer + log üçün rahat.
2. **“Qoşulma” UX vs reallıq:** UI “qoşulub” göstərir; hazırlıq **mühit + Selenium + cookie**-dir.
3. **Publish etibarlılığı:** **Canlı üçüncü tərəf UI** — düymə demosu üçün təbii qeyri-sabitlik.
4. **Məlumat uyğunluğu:** Seed kateqoriya / taksonomiya smoke-u sındıra bilər.
5. **Ödəniş:** Yalnız simulyasiya.

**Əvvəlcə düzəlməli**

1. Seed və dəstəklənən kateqoriya yollarını taksonomiya ilə uyğunlaşdırmaq (və ya UI-ni daraltmaq).
2. Qlobal OTP sessiyasını əvəz etmək və ya sənədləşdirmək; OTP loglarını dayandırmaq.
3. Platform qoşulması UX-i ilə sessiya toplanmasını uyğunlaşdırmaq.
4. Bir platform üçün E2E + Chrome/env checklist.
5. Worker topologiyası və `published_pending_link` job status semantikası.

---

## 6. Növbəti developer üçün tövsiyə olunan addımlar

1. `db:bootstrap` / `db:seed`, sonra seed `category`-ni düzəltmək; `docs/RUNBOOK.md` üzrə smoke skriptləri (**fərziyyə:** mühit uyğundur).
2. SMS (və ya dev OTP paneli) və **`auth.otp.sent` kodunu** loglardan çıxarmaq.
3. `getCurrentUser()` üçün real sessiya (cookie/JWT).
4. Məhsul: “Connect platform” — sessiya qurulumu və ya mətn dəyişikliyi.
5. `CreateListingScreen` yollarını `GLOBALLY_MAPPED_FAMILIES` ilə üzbəüz yoxlamaq.
6. `maybeFinishJob` / `published_pending_link` üçün API/UI-də düzgün status.
7. `TAPAZ_DEBUG_REQUEST_LOG`-u paylaşılan mühitdə söndürmək.
8. Tək worker modeli seçmək; README/ARCHITECTURE uyğunlaşdırmaq.
9. `@google/genai` təmizləmək və ya istifadə etmək; `.env.example` yeniləmək.
10. Kök `*.js` generatorlarını arxivləmək və ya sənədləşdirmək.

---

*Bu fayl tərcümə və strukturlaşdırılmış hesabatdır; orijinal texniki məzmun ingilis dilindəki kod auditinə əsaslanır.*
