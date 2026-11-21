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
