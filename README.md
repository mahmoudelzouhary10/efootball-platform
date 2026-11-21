# eFootball Competitive Platform

Competitive platform for the eFootball Mobile community — players, clans, organizers, tournaments
and leagues. Arabic first.

**Status:** Phase 1 (Foundation) — accounts, authentication, access control, audit log, Arabic/English
web shell. See [`docs/architecture.md`](docs/architecture.md) and [`CLAUDE.md`](CLAUDE.md).

## Run locally

Requirements: Node 22.12+, pnpm 10, Docker (for Postgres, Redis and Mailpit).

```bash
docker compose up -d
pnpm install
cp apps/api/.env.example apps/api/.env
pnpm --filter @efp/contracts build
pnpm --filter @efp/api db:migrate:dev
pnpm --filter @efp/api dev        # http://localhost:4000/api/v1/health
pnpm --filter @efp/web dev        # http://localhost:3000
```

Emails (verification, password reset) appear in Mailpit at http://localhost:8025.

Make the first admin after signing up:

```bash
pnpm --filter @efp/api build && pnpm --filter @efp/api role:grant <username> admin
```

## Tests

```bash
pnpm test                          # unit + API integration (needs Postgres + Redis)
pnpm --filter @efp/api build
pnpm --filter @efp/web test:e2e    # browser tests (Chrome), needs database efp_e2e
```
