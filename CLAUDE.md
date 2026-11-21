# eFootball Competitive Platform — engineering rules

Read before changing code. The approved architecture lives in `docs/architecture.md`
(source of truth: the "Architecture Proposal v1.0" doc in the Claude project).

## Non-negotiables

- Business rules are enforced on the server and, where possible, by database constraints.
  The web app only reflects them. Never add a rule to the frontend alone.
- Every route is authenticated by default. Opt out only with `@Public()` and a reason.
- Platform permissions go through `@RequirePermissions(...)`; resource-scoped checks
  (clan leader, competition staff) go in a per-module policy, checked inside the transaction.
- Expected failures throw `AppError` with a stable `ErrorCode` from `@efp/contracts`.
  Never rename a shipped code.
- Request bodies are validated with strict Zod schemas from `@efp/contracts` via `ZodPipe`.
- Multi-row changes run in one `db.transaction`; audit-log writes take the same `tx`.
- Time comes from the injected `Clock`, never `new Date()` in business code.
- No mock data, placeholder logic, or buttons that do nothing.
- A feature is done only when its integration tests (real Postgres + Redis) pass.

## Layout

- `apps/api` — NestJS modular monolith. One folder per module in `src/modules`; a module owns
  its tables and other modules call its service, never its tables.
- `apps/web` — Next.js (App Router), Arabic RTL first, English second.
- `packages/contracts` — Zod request schemas, response types, error codes shared by both.

## Database

- Schema: `apps/api/src/db/schema.ts`. After changing it: `pnpm --filter @efp/api db:generate`,
  review the SQL, and hand-edit for anything Drizzle can't express. CI fails on schema drift.
- Never edit a migration that has been merged.

## Commands

```bash
docker compose up -d                       # postgres, redis, mailpit
pnpm install
pnpm --filter @efp/contracts build
pnpm --filter @efp/api db:migrate:dev
pnpm --filter @efp/api dev                 # API on :4000
pnpm --filter @efp/web dev                 # web on :3000
pnpm test                                  # all tests (needs postgres + redis)
```
