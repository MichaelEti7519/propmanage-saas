# PropManage

A privacy-first property management platform for landlords, tenants, and platform staff. One Node process serves the JSON API and, in development, the Vite SPA.

**Status: pre-release.** Rent payments, identity/property verification, OTP, and account email are not integrated yet. Every surface that depends on them says so rather than pretending otherwise — see [Product constraints](#product-constraints). Marketing copy, dashboards, and seeded rows are illustrative until a real provider lands.

---

## Contents

- [What works today](#what-works-today)
- [Stack](#stack)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Scripts](#scripts)
- [Request pipeline](#request-pipeline)
- [Auth and sessions](#auth-and-sessions)
- [API surface](#api-surface)
- [Data model](#data-model)
- [Frontend map](#frontend-map)
- [Product constraints](#product-constraints)
- [Security posture and known gaps](#security-posture-and-known-gaps)
- [Troubleshooting](#troubleshooting)
- [Roadmap](#roadmap)
- [Conventions](#conventions)
- [License](#license)

## What works today

**Implemented**

- Public site: landing, pricing, about, contact, privacy, thank-you, login/register, tenant invitation acceptance, 404.
- Contact form that writes a `ContactInquiry` and only navigates to `/thank-you` on a successful response.
- JWT auth (bcrypt, 12 rounds) over PostgreSQL, with role checks on both client routes and API handlers.
- Tenant invitation flow with hashed, single-use, expiring tokens and optional Resend delivery.
- Property, unit, tenant, payment, maintenance, message, and document CRUD; vacant-unit publishing and tenant viewing requests.
- Fraud/conduct reports with admin review, explicit trust-score adjustment, and manual blacklist flags.
- Admin area: overview metrics, user directory, verification review queue, contact enquiry inbox, and an append-only admin action log.
- Verification decisions are recorded as a `VerificationReview` (reviewer + basis + from/to status), not inferred from a checkbox.
- Helmet CSP, CORS allowlist, per-route rate limiting, and a global auth gate over `/api`.
- Five committed Prisma migrations.

**Not built yet**

- Refresh tokens, password reset, email verification, and admin MFA — the next milestone.
- Payment provider, KYC vendor, OTP provider, and payout onboarding.
- Account email (only tenant invitations send mail).
- Durable persistence for remaining legacy dashboard routes — several still fall back to in-memory fixtures.
- Production deployment, observability, and backup/restore procedures.

## Stack

| Area | Choice |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 6, Tailwind CSS v4, motion, lucide-react, Recharts |
| Backend | Express 4 in a single `server.ts`, executed with `tsx` |
| Auth | `jsonwebtoken` (HS256, 2h) + `bcryptjs` |
| Data | PostgreSQL 18 + Prisma 7 via `@prisma/adapter-pg` |
| Hardening | `helmet` CSP, CORS allowlist, `express-rate-limit` |
| Email | Resend, optional, invitations only |

## Quick start

Prerequisites: Node 20+, PostgreSQL 14+ available locally, and a `JWT_SECRET` of **at least 32 characters** (the server refuses to boot without it).

```bash
npm install
```

Create `.env` (git-ignored) with at minimum:

```dotenv
APP_URL="http://localhost:3000"
JWT_SECRET="<32+ random characters>"
DATABASE_URL="postgresql://postgres@localhost:5433/propmanage?schema=public"
DEV_SEED_PASSWORD="<12+ characters, only needed for seeding>"
```

The repo runs its own PostgreSQL cluster in `.pgdata` (git-ignored, port `5433`), so it needs neither the Windows service nor admin rights:

```bash
initdb -D .pgdata -U postgres -A trust -E UTF8   # once
npm run db:start                                 # after each reboot
createdb -h localhost -p 5433 -U postgres propmanage
```

If the PostgreSQL binaries are not on `PATH`, prefix those commands with `C:\Program Files\PostgreSQL\18\bin\` or set `PG_BIN`.

Apply the schema, optionally seed demo accounts, then run:

```bash
npx prisma generate
npx prisma migrate dev
npm run db:seed   # optional
npm run dev
```

Open <http://localhost:3000>. In development Vite runs in middleware mode, so the API and SPA share one origin and one port.

Seeding is blocked when `NODE_ENV=production` and upserts `admin@propmanage.saas`, `landlord@propmanage.saas`, and `tenant@propmanage.saas` using `DEV_SEED_PASSWORD`. No credentials are prefilled in the UI.

## Environment variables

| Key | Required | Purpose |
| --- | --- | --- |
| `PORT` | no | Defaults to `3000`. The API and the dev SPA both use it. |
| `APP_URL` | yes | Absolute base URL used to build invitation links. |
| `ALLOWED_ORIGINS` | no | Comma-separated CORS allowlist. Defaults to `http://localhost:3000` only. |
| `JWT_SECRET` | yes | HS256 signing key, 32+ characters. Startup fails below that. |
| `DATABASE_URL` | yes | PostgreSQL connection string. The single source of truth for the database target. |
| `DEV_SEED_PASSWORD` | for seeding | Local demo password, 12+ characters. |
| `RESEND_API_KEY` | no | Enables invitation email. Without it the invite link is returned in the response instead. |
| `EMAIL_FROM` | no | Sender identity, defaults to `PropManage <onboarding@resend.dev>`. |
| `NODE_ENV` | no | `production` serves `dist/` statically, drops dev WebSocket CSP entries, and blocks seeding. |
| `PG_BIN`, `DB_PORT` | no | Override the PostgreSQL binaries directory or cluster port for `scripts/db.mjs`. |
| `GEMINI_API_KEY` | no | Legacy: still defined in `vite.config.ts`, but no endpoint reads it. Safe to leave unset. |

Never commit `.env`. `.env*`, `.pgdata/`, `uploads/`, `AGENTS.md`, `.qoder/`, and `.continue/` are git-ignored.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | `tsx server.ts` — Express + Vite middleware on one port. No file watching on `server.ts`; restart after server edits. |
| `npm run lint` | `tsc --noEmit`. This is the gate that matters. |
| `npm run build` | Vite production build, then esbuild bundles `server.ts` to `dist/server.cjs`. |
| `npm run start` | Runs `dist/server.cjs` (build first). |
| `npm run prisma:generate` | Regenerates the Prisma client. Required after every schema change. |
| `npm run prisma:migrate` | `prisma migrate dev --name init` — adjust the name for new migrations. |
| `npm run db:seed` | Seeds demo accounts and fixtures. |
| `npm run db:start` / `db:stop` / `db:status` | Control and inspect the local `.pgdata` cluster. |
| `npm run clean` | `rm -rf dist server.js` — Unix shells only; delete `dist/` by hand on PowerShell. |

`npx prisma migrate status` tells you whether the database is in sync with `schema.prisma`.

## Request pipeline

Order matters when debugging CORS, auth, or 429s:

1. `helmet` CSP — allows self, Google Fonts, `images.unsplash.com`, and dev WebSockets only.
2. CORS with an explicit origin allowlist. Requests without an `Origin` header pass; anything else must be listed in `ALLOWED_ORIGINS`.
3. Body parsers: JSON up to 10 MB, urlencoded up to 32 KB (avatar uploads use their own raw parser).
4. `/uploads` static serving for avatars, cached for 7 days.
5. Rate limiters: `/api` 100/min, `/api/auth` 5 per 15 min (successful requests skipped), registration 5/hour, invitation create 20/hour, invitation accept 10/15 min.
6. **Global auth gate**: every `/api` path not in the public list is wrapped in `authMiddleware`, so an unknown `/api` path returns `401`, not `404`. Public paths: `/api/health`, `/api/auth/login`, `/api/auth/register`, `/api/contact`, `/api/listings`, plus `/api/tenant-invitations/<64-hex-token>` and its `/accept`.
7. Route handlers, then a role check via `requireRole(...)` where a role is required.

## Auth and sessions

- **Registration** takes first name, last name, email, password, role (`landlord` | `tenant`), and an optional phone. Admins cannot self-register.
- **Passwords**: 12–72 UTF-8 bytes, trimmed before hashing, bcrypt cost 12. The same rule applies to registration, invitation acceptance, profile password change, and admin password rotation.
- **Login** lowercases the email and returns one message for both bad email and bad password.
- **Session** is a signed JWT carrying `sub`, `email`, `role`, name, `jti`, valid **2 hours**. There is no refresh token yet, so sessions simply end.
- **Storage**: `propmanage_token` and `propmanage_user` in `localStorage`. On mount the app calls `GET /api/auth/me` and signs out if that fails.
- **Endpoints**: `POST /api/auth/register|login|logout|logout-all|rotate-admin-password`, `GET /api/auth/me`, `PATCH /api/users/me`, `POST /api/users/me/password`, `POST /api/users/me/avatar`.
- **Revocation** blacklists the `jti` on logout and records a per-user cutoff on logout-all. Both live in memory: a restart clears them, and neither is shared across instances. Treat this as single-instance only until it moves to the database.
- **Avatar uploads**: PNG/JPG/GIF only, 800 KB cap, extension derived from the file signature rather than the declared `Content-Type`, served from `/uploads/avatars`.

### Rate limits

| Scope | Limit |
| --- | --- |
| All `/api/*` | 100 requests / minute / IP |
| `/api/auth/*` | 5 requests / 15 minutes / IP, successful responses skipped |
| `/api/auth/register` | 5 requests / hour / IP |
| Invitation create | 20 / hour / landlord |
| Invitation accept | 10 / 15 minutes / IP |

These are tight on purpose and are the most common cause of a "broken" login during development.

### Error contract

| Status | Meaning |
| --- | --- |
| `400` | Missing/invalid field, weak password, or a rejected state transition |
| `401` | Bad credentials, missing/expired/revoked token (also unknown `/api` paths) |
| `403` | Authenticated but the role is not allowed |
| `404` | Known route, unknown record |
| `409` | Email already registered |
| `429` | Rate limited |
| `503` | Database unreachable or query failed |

`503` is deliberate. Account, report, contact, and admin writes have **no** in-memory fallback: if PostgreSQL is down, the API errors instead of faking success. Legacy dashboard CRUD still falls back to fixtures, so a working dashboard does not prove the database is wired.

## API surface

52 routes under `/api`, all JSON. Storage is noted per group — that is where the remaining risk lives.

| Group | Routes | Storage |
| --- | --- | --- |
| Health | `GET /api/health` | none |
| Public | `POST /api/contact`, `GET /api/listings` | DB / fixtures |
| Auth | register, login, logout, logout-all, rotate-admin-password, me | DB |
| Account | `PATCH /api/users/me`, `POST /api/users/me/password`, `POST /api/users/me/avatar` | DB + disk |
| Invitations | create (landlord), fetch by token, accept | DB |
| Admin | `overview`, `users`, `contact-inquiries` (list + status), `audit`, `users/:id/verification` (read + record) | DB |
| Dashboard | `GET /api/dashboard-stats` | DB counts |
| Reports | create, list, review (`PATCH /api/reports/:id`) | DB |
| Properties | list, read, create, update, delete | DB with fixture fallback |
| Units | list, create, update, delete, `PUT /api/units/:id/listing` | DB with fixture fallback |
| Tenants | list, create, update, delete | DB with fixture fallback |
| Payments / maintenance / messages / documents | list + create, maintenance update | mixed |
| Viewing requests | tenant create/list, landlord update | DB |

Admin-only routes are the ones under `/api/admin` plus `PATCH /api/reports/:id`. Reviewing a report can adjust `trustScore` and set `blacklisted`; both are recorded in the audit log with the acting admin.

## Data model

14 models: `User`, `Property`, `Unit`, `Tenant`, `TenantInvitation`, `Payment`, `MaintenanceRequest`, `Message`, `Document`, `ViewingRequest`, `Report`, `ContactInquiry`, `AuditLog`, `VerificationReview`.

Two are security-relevant:

- **`AuditLog`** — who did what to which record. It stores identifiers and the decision (`status`, `trustAdjustment`, `blacklisted`, verification `field`/`from`/`to`), deliberately **not** the report or enquiry text, so the log never becomes a second copy of user-submitted personal data.
- **`VerificationReview`** — one row per recorded verification decision: field, from/to status, the basis the reviewer relied on, and the reviewer. `verified` requires a 25-character basis describing what was actually checked; anything else requires 10.

Migrations are committed and linear:

```
20261111144244_init
20261111153513_add_user_avatar
20261113115307_message_participants
20261114222910_add_audit_log
20261114223608_add_verification_review
```

Apply with `npx prisma migrate dev` locally and `npx prisma migrate deploy` anywhere shared. Never run `migrate reset` against a database you care about.

## Frontend map

| Area | Routes |
| --- | --- |
| Public | `/`, `/about`, `/pricing`, `/contact`, `/privacy`, `/thank-you`, `/login`, `/invite/:token`, `*` |
| Tenant | `/tenant` + `homes`, `payments`, `maintenance`, `messages`, `documents`, `settings` |
| Landlord | `/landlord` + `properties`, `properties/:id`, `units`, `viewings`, `tenants`, `payments`, `reports`, `messages`, `maintenance`, `analytics`, `settings` |
| Admin | `/admin` + `properties`, `units`, `tenants`, `payments`, `messages`, `maintenance`, `analytics`, `reports`, `settings` |

`RequireAuth` guards client routes; the API re-checks token and role on every non-public path, so hiding a route is never the only control.

### Design tokens

One palette, one type scale. Ivory `#FAF8F3` backgrounds, Sand `#E8DDCC` borders and selected states, Taupe `#B9A58B` accents and small labels, Espresso `#332D29` for text and primary actions, plus `#397451` for success. White surfaces, `rounded-2xl` panels, `rounded-xl` controls, `rounded-full` only for chips. Status colours stay distinct from the brand neutrals; never set taupe text on ivory.

The landing page is composed from `src/pages/public/landing/*` with shared recipes in `theme.ts` (`pageShell`, `sectionY`, `eyebrow`, `displayHeading`, `mutedLabel`, `sampleBadge`) and fixtures in `sampleData.ts`. Illustrative figures carry a visible label.

## Product constraints

These are product rules, not preferences. Changing them needs an explicit decision.

- **Signup is not identity verification.** No government ID numbers or images, deeds, payslips, bank statements, income documents, or emergency contacts at registration.
- **No verified badge without a recorded check.** Statuses stay `pending` / `not_started` until a provider or reviewer completes the check and a `VerificationReview` row exists.
- **Hosted providers, minimal retention.** Prefer provider-hosted collection and keep only references, statuses, timestamps, and limited audit metadata. Never expose source documents to landlords or tenants.
- **No raw bank details.** Payouts belong to payment-provider connected-account onboarding.
- **Nigeria first.** Initial verification market is Nigeria; currency, legal review, and provider selection follow from that.
- **Illustrative means illustrative.** No fabricated testimonials, customer counts, or measured results. Maintained-list items like online rent payments, identity/property verification, and phone OTP stay labelled "coming next" until they ship.
- **Law-enforcement requests** require lawful process, minimum-necessary disclosure, and audit/retention controls. Hidden identity data is never disclosed to another user.

The privacy policy is a product draft, not legal advice and not a claim of NDPA/NDPR compliance. Obtain Nigeria-specific legal review before launch.

## Security posture and known gaps

Working: parameterised access via Prisma, bcrypt hashing, role gates, CSP, CORS allowlist, rate limits, magic-byte avatar validation, hashed single-use invitation tokens, audit trail for admin decisions, accountable verification records.

Known gaps to close before this is production-grade:

- Access tokens live in `localStorage`, so any XSS is a full session compromise. HTTP-only cookies with CSRF protection are the intended end state.
- No refresh/rotation, so a stolen token is valid for up to two hours and there is no server-side device list.
- Revocation state is in memory and per-process. Multi-instance deployment would silently break it.
- No password reset, email verification, or MFA yet. Password change requires the current password, which is the only recovery-safe path today.
- Remaining dashboard CRUD still has fixture fallbacks.
- No structured logging, metrics, or alerting.

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Boot fails with a `JWT_SECRET` error | Secret under 32 characters | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste into `.env` |
| Login/register returns `503` | Database down or unmigrated | `npm run db:start`, check `DATABASE_URL`, then `npx prisma migrate dev` |
| `PrismaClient` type errors after a schema edit | Client not regenerated | `npx prisma generate`, then `npm run lint` |
| Login returns `429` | 5 failed `/api/auth/*` requests in 15 minutes | Wait out the window or clear `propmanage_token` |
| CORS error in the server log | Origin not in the allowlist — `127.0.0.1:3000` is **not** the same origin as `localhost:3000` | Use `http://localhost:3000`, or add the origin to `ALLOWED_ORIGINS` |
| Vite modules return `500` in the browser | The same CORS rejection, surfaced through Vite middleware | Same fix as above |
| Logged out immediately after reload | `/api/auth/me` failed, so the client cleared the session | Inspect the API log; usually an expired token |
| `EADDRINUSE :3000` | A previous dev server is still alive | `netstat -ano \| findstr :3000`, then `Stop-Process -Id <pid> -Force` |
| Invitation email never arrives | `RESEND_API_KEY` unset | The API returns the invite link instead |
| `npm run build` exits non-zero after printing `✓ built` | PowerShell turns npm's stderr notes into a native-command error | Check for `dist/server.cjs`; the build itself succeeded |

## Roadmap

1. **Account security**: refresh tokens with rotation and database-backed revocation, password reset, email verification, admin MFA.
2. **Email delivery**: move invitations and account mail onto one provider. Password reset and verification need it before they can be honest.
3. **Payments**: a Nigeria-capable provider for rent and connected-account payouts, with webhooks and reconciliation.
4. **Verification providers**: KYC and OTP vendors, provider callbacks, automatic expiry, and audit on every status change.
5. **Persistence pass**: move the remaining dashboard CRUD off fixtures and delete the fallbacks.
6. **Legal and ops**: Nigeria-specific privacy review, retention policy, deployment, backup, and incident response.

## Conventions

- `npm run lint` must pass. It is the only automated gate in the repo today.
- Migrations are additive and named for what they change. Never reset a shared database.
- Durable writes fail loudly. Do not reintroduce "success" responses for work that did not persist.
- New admin actions must write an `AuditLog` entry and must not copy user-submitted prose into it.
- Statuses that imply trust (`verified`, badges) require a recorded reviewer and basis.
- Keep copy honest: if a feature is planned, say planned.

## License

MIT
