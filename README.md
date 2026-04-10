# SALex (ai-studio-applet)

Multi-marketplace listing tool: **Next.js** frontend, **Express** API, **PostgreSQL**, **pg-boss** workers, and **Selenium**-based publishers (Tap.az, Lalafo, Alan.az, Laylo.az, Birja.com).

**📚 Full handoff pack:** [docs/DEVELOPER_HANDOFF.md](docs/DEVELOPER_HANDOFF.md) · [docs/RUNBOOK.md](docs/RUNBOOK.md) · [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## Tech stack — ✅ VERIFIED

| Layer | Technology |
|--------|------------|
| Frontend | Next.js 15, React 19, Tailwind |
| API | Express 5 (`src/app.ts`, `src/server.ts`) |
| Database | PostgreSQL (`pg`) |
| Queue | pg-boss (`schema: pgboss`) |
| Automation | selenium-webdriver, chromedriver |

---

## Prerequisites — ✅ VERIFIED

- Node.js (see `package.json` engines if added; otherwise LTS recommended)
- PostgreSQL
- Google Chrome / Chromium (for Selenium connectors; path via `CHROME_BIN` optional)

---

## Quick start — ✅ VERIFIED

```bash
npm install
cp .env.example .env   # edit DATABASE_URL etc.
npm run db:bootstrap
```

**Terminal 1 — API + embedded pg-boss:**

```bash
npm run server:dev
```

**Terminal 2 — Worker (consumes publish / recovery queues):**

```bash
npm run worker:dev
```

**Terminal 3 — Next.js:**

```bash
npm run dev
```

---

## Active hosts — ✅ VERIFIED

| Service | Default | Notes |
|---------|---------|--------|
| **Frontend** | `http://localhost:3000` | `next dev` (no custom port in `package.json`) |
| **Backend API** | `http://localhost:4000` | `PORT` from `.env` or **4000** (`src/server.ts`) |
| **DB** | `DATABASE_URL` | Required; see `.env.example` |
| **Rewrites** | Next → API | `next.config.ts` proxies `/api/*` and `/uploads/*` to `NEXT_PUBLIC_BACKEND_URL` (default `http://localhost:4000`) |

External platforms (Selenium): Tap.az, Lalafo, Alan.az, Laylo.az, Birja.com — see [docs/PLATFORM_CONNECTORS.md](docs/PLATFORM_CONNECTORS.md).

---

## Useful scripts — ✅ VERIFIED

| Script | Purpose |
|--------|---------|
| `npm run dev` | Next.js dev server |
| `npm run server:dev` | Express + pg-boss (watch) |
| `npm run worker:dev` | Standalone worker (watch) |
| `npm run db:bootstrap` | Apply `src/db/schema.sql` |
| `npm run db:seed` | Seed data |
| `npm run smoke:backend` | API smoke test |
| `npm run smoke:publish-connectors` | Connector smoke |
| `npm run lint` | ESLint |

---

## Documentation index

| Doc | Purpose |
|-----|---------|
| [docs/DEVELOPER_HANDOFF.md](docs/DEVELOPER_HANDOFF.md) | Status, flows, onboarding |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design |
| [docs/RUNBOOK.md](docs/RUNBOOK.md) | Commands & operations |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment variables |
| [docs/API_HANDOFF.md](docs/API_HANDOFF.md) | HTTP routes |
| [docs/DB_HANDOFF.md](docs/DB_HANDOFF.md) | Schema & data model |
| [docs/PLATFORM_CONNECTORS.md](docs/PLATFORM_CONNECTORS.md) | Selenium publishers |
| [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md) | Risks & bugs |

---

*Legacy AI Studio banner/URL in git history may appear above in older copies; this repo is documented as SALex stack per `src/` layout.*
