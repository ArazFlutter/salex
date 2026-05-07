# Runbook — SALex

All commands **✅ VERIFIED** from root `package.json` unless noted.

---

## 1. Install dependencies

```bash
npm install
```

**Windows PowerShell:** if `npm run dev` is blocked, use `npm.cmd run dev` or `run-dev.cmd` (**✅ VERIFIED** — mentioned in historical README).

---

## 2. Environment setup

```bash
cp .env.example .env
```

Edit **`.env`** at **project root** (required for backend: **`DATABASE_URL`** — see `src/db/env.ts`).

---

## 3. Run database (operator responsibility)

Ensure PostgreSQL is running and a database exists matching `DATABASE_URL` (e.g. `postgres://postgres:postgres@localhost:5432/salex` per `.env.example`).

**Bootstrap schema:**

```bash
npm run db:bootstrap
```

**Optional seed:**

```bash
npm run db:seed
```

---

## 4. Run backend (Express + pg-boss on same process)

```bash
npm run server:dev
```

- **Production build:** `npm run server:build` then `npm run server:start`
- **Port:** `PORT` env or **4000** (`src/server.ts`)

---

## 5. Run worker (standalone)

Use when you want job consumers **without** the HTTP server (or for scaling workers — **🧠 ASSUMPTION:** coordinate with ops to avoid duplicate processing if multiple workers subscribe).

```bash
npm run worker:dev
```

- **Production:** `npm run server:build` then `npm run worker:start` (runs `dist-server/queue/worker.js`)

---

## 6. Run frontend (Next.js)

```bash
npm run dev
```

Default **http://localhost:3000**. **✅ VERIFIED** no `-p` in script; override: `npx next dev -p 3001` if needed (update `NEXT_PUBLIC_BACKEND_URL` / bookmarks accordingly).

**Production:**

```bash
npm run build
npm run start
```

---

## 7. Smoke tests

```bash
npm run smoke:backend
```

Uses `SMOKE_BASE_URL` (default `http://127.0.0.1:4000`) and `DATABASE_URL` (`src/dev/smokeTest.ts`).

```bash
npm run smoke:publish-connectors
```

Connector integration smoke (`src/dev/publishConnectorSmoke.ts`); requires env credentials per platform.

```bash
npm run smoke:recover-links
```

Recovery utility (`src/dev/recoverPendingLinks.ts`).

---

## 8. Lint

```bash
npm run lint
```

---

## 9. Typical local “full stack” session — ✅ VERIFIED scripts

| Terminal | Command |
|----------|---------|
| 1 | `npm run server:dev` |
| 2 | `npm run worker:dev` **🧠 ASSUMPTION:** optional if server already runs handlers; **✅ VERIFIED** server registers same handlers — see team policy |
| 3 | `npm run dev` |

---

## 10. Active hosts — ✅ VERIFIED

| Service | URL |
|---------|-----|
| Frontend | `http://localhost:3000` |
| API (direct) | `http://localhost:4000` (or `PORT`) |
| API (via Next) | `http://localhost:3000/api/...` → rewrite to backend |
| Static uploads | `http://localhost:4000/uploads/...` or proxied via Next `/uploads/` |
