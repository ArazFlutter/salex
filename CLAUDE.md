# CLAUDE.md

Project guidance for working in `salex-main`.

## Overview

SALex is a multi-marketplace listing tool built with:

- Next.js frontend
- Express API
- PostgreSQL
- `pg-boss` workers
- Selenium-based publishing connectors

Key docs:

- [docs/DEVELOPER_HANDOFF.md](docs/DEVELOPER_HANDOFF.md)
- [docs/RUNBOOK.md](docs/RUNBOOK.md)
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md)
- [docs/API_HANDOFF.md](docs/API_HANDOFF.md)
- [docs/DB_HANDOFF.md](docs/DB_HANDOFF.md)
- [docs/PLATFORM_CONNECTORS.md](docs/PLATFORM_CONNECTORS.md)

## Local Hosts

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000`
- API via Next rewrite: `http://localhost:3000/api/...`
- Uploads via Next rewrite: `http://localhost:3000/uploads/...`

## Environment

- Copy `.env.example` to `.env` in the project root.
- `DATABASE_URL` is required for the backend.
- `NEXT_PUBLIC_BACKEND_URL` defaults to `http://localhost:4000`.
- `APP_URL` defaults to `http://localhost:3000`.

## Common Commands

```bash
npm install
npm run db:bootstrap
npm run server:dev
npm run worker:dev
npm run dev
npm run build
npm run start
npm run lint
```

Windows note: if `npm run dev` hits a spawn issue, use `npm.cmd run dev` or `run-dev.cmd`.

## Recommended Local Flow

1. Start PostgreSQL.
2. Create `.env` from `.env.example`.
3. Run `npm run db:bootstrap`.
4. Start the backend with `npm run server:dev`.
5. Start the frontend with `npm run dev`.
6. Start the worker only when needed, using `npm run worker:dev`.

## Codebase Notes

- Next.js app files live in `app/`.
- Shared UI code lives in `components/`, `contexts/`, `hooks/`, and `lib/`.
- Server code lives in `src/`.
- Avoid duplicate worker registration when the worker runs separately from the server.
- Keep `NEXT_PUBLIC_BACKEND_URL` aligned with the backend port so rewrites keep working.

## Working Rules

- Prefer reading the repo docs before changing behavior.
- Preserve existing user changes unless explicitly asked to touch them.
- Use non-destructive edits.
- Prefer `rg` for searches and `apply_patch` for file edits.
- Keep changes focused and update docs when behavior or commands change.

