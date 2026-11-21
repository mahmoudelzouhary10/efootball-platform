# Architecture

Source of truth: **eFootball Competitive Platform — Architecture Proposal v1.0** (Claude project doc,
approved 2026-11-21). This file records what the code implements and any deviation from that doc.

## Approved decisions (summary)

- Modular monolith: NestJS API + Next.js web, PostgreSQL, Redis. TypeScript end to end.
- New web-first product; the API is designed to serve a future Flutter app unchanged.
- Login with email **or** username + password. Email is required and verified. No OAuth at launch.
- One player profile per account; a player belongs to at most one clan at a time.
- Clan creation and organizer status go through admin-reviewed applications.
- Tournaments and leagues share one competition / stage / entry / match model.
  Entries are either a player or a clan.
- Clan matches: players per side set per competition; winner = most individual games won.
  Level games: league/group stages → draw (default 1 point each); knockout stages → a decider game is required.
- Arabic is the default language (RTL); English second. Browser language is not auto-detected.

## Deviations from the proposal (Phase 1)

| Proposal       | Implemented                     | Why                                                                                                                                                                                                 |
| -------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Prisma ORM     | Drizzle ORM + SQL migrations    | Prisma needs engine binaries downloaded at install; the build environment blocks that host. Drizzle is pure JS, expresses CHECKs and partial indexes in the schema, and was the listed alternative. |
| Testcontainers | Real Postgres/Redis via env URL | No Docker daemon in the dev environment. Tests still run against real services (CI uses service containers).                                                                                        |
| HIBP always on | Local list + optional HIBP      | HIBP is a third-party network call; it is enabled per environment (`HIBP_ENABLED`) and fails open.                                                                                                  |

## Request path

Production: reverse proxy → `/api/*` to the API, everything else to Next.js (same origin, first-party cookies).
Development: Next.js rewrites `/api/*` to the API. The rewrite target is fixed at **build** time.

Client IPs for rate limiting come from `req.ip` with `trust proxy = TRUST_PROXY_HOPS`. Set it to the exact
number of proxies in front of the API; never route production API traffic through the Next.js rewrite,
or every user would share the Next server's IP.

## Security model (implemented)

- Sessions: 256-bit random token in an `httpOnly`, `SameSite=Lax` cookie (`__Host-` prefix + `Secure` in
  production). Only its SHA-256 is stored. 7-day sliding idle expiry, 30-day absolute limit.
  Password change revokes other sessions; password reset revokes all.
- Passwords: Argon2id (OWASP baseline parameters), transparent rehash on login.
- CSRF: SameSite cookies + Origin/Referer check on every non-GET request.
- Every route requires a session unless marked `@Public()`. Platform permissions are defined in code
  (`modules/access/permissions.ts`).
- Login errors are identical for unknown accounts and wrong passwords, with equalised timing.
- Rate limits (Redis, shared across instances): see `modules/identity/identity.constants.ts`.
- Errors are RFC 9457 problem+json with stable codes; no stack traces reach clients.
- Audit log for registrations, verification, password changes/resets and role grants.

## Phase 2 decisions (players and clans)

- **Game ID ownership is never self-declared as verified.** Profiles store `game_id_verified_at` (null by
  default); there is no endpoint that sets it yet. Changing the game ID clears verification. The UI labels
  every individually shown ID "not verified" and explains why (no Konami verification API).
- Game IDs are unique on a normalized form (uppercase, spaces and dashes removed).
- A clan exists only after approval. Applications hold name, tag, logo, description and an https contact
  link; reviewers (admin or moderator) approve or reject with a reason shown to the applicant.
- Name and tag are fixed after approval; the leader can edit logo, description and contact link.
- Roles: leader / co-leader / member (rules in `modules/clans/clan.policy.ts`). The leader must transfer
  leadership before leaving. Clans cap at 50 members.
- Concurrency: every roster change locks the clan row, then the joining player's row, then the
  invitation/request row (fixed order, so no deadlocks). Partial unique indexes enforce one active clan per
  player, one leader per clan, one pending invitation/request/application.
- Images are decoded and re-encoded server-side (512×512 WebP, metadata stripped, SVG refused) and stored
  through a `Storage` port; Phase 2 ships the local-disk driver.

## Outstanding (tracked, not done)

| Item                                    | Origin                | Status                                                                                                                                                                 |
| --------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lighthouse mobile pass                  | Phase 1 exit criteria | Audited in Phase 2: 6 of 7 public pages ≥ 91 performance, all 100 accessibility/best-practices/SEO. Clan page 81–83 (see `docs/quality/lighthouse.md`). Not yet in CI. |
| Tested Docker dev environment           | Phase 1 exit criteria | CI job `docker-dev-env` added in Phase 2 (compose up, migrate, boot, email to Mailpit, tests). Counts as done only once that job is green on GitHub.                   |
| Game ID ownership verification workflow | Phase 2               | Column exists; review/verification process not designed yet.                                                                                                           |
| S3/R2 storage driver                    | Phase 2               | Local disk only; needs object storage for multi-instance deployment.                                                                                                   |
| Orphaned upload cleanup                 | Phase 2               | Uploads never attached to a profile/clan are kept; needs a periodic job.                                                                                               |
| Clan disband / sole-leader exit         | Phase 2               | A leader who is the only member cannot leave (no disband yet).                                                                                                         |
| Notifications for invitations/decisions | Phase 5               | Users see them on the dashboard only.                                                                                                                                  |
