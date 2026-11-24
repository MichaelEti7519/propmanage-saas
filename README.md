# PropManage

A privacy-first property management platform for landlords, tenants, and platform staff. One Node process serves the JSON API and, in development, the Vite SPA.

**Status: pre-release.** Rent payments, identity/property verification, and phone OTP are not integrated. Account email flows are implemented, but production startup requires a Resend API key, a verified sender, and a webhook signing secret. See [Product constraints](#product-constraints); marketing copy, dashboards, and seeded rows remain illustrative until real providers/data are connected.

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
- PostgreSQL-backed JWT auth with bcrypt (12 rounds), role checks, 2-hour access tokens, 30-day rotating refresh tokens, and session revocation.
- Password reset with hashed, single-use, 60-minute tokens; email confirmation with hashed, single-use, 24-hour tokens.
- Required authenticator-app TOTP and single-use recovery codes for admin accounts. Admin APIs remain locked until enrollment is complete.
- Profile updates, password changes, avatar validation, active-session listing, and sign-out-everywhere.
- Tenant invitation flow with hashed, single-use, expiring tokens and optional Resend delivery.
- Property, unit, tenant, payment, maintenance, message, and document CRUD; vacant-unit publishing and tenant viewing requests.
- Fraud/conduct reports with admin review, explicit trust-score adjustment, and manual blacklist flags.
- Admin area: overview metrics, user directory, verification review queue, contact enquiry inbox, and an append-only admin action log.
- Verification decisions are recorded as a `VerificationReview` (reviewer + basis + from/to status), not inferred from a checkbox.
- Helmet CSP, CORS allowlist, per-route rate limiting, and a global auth gate over `/api`.
- Six committed Prisma migrations.

**Not built yet**

- Configure the production Resend sender and webhook in the provider dashboard, and set their secrets in the production environment. Resend alerts and durable email event history remain operational setup work.
- Payment provider, KYC vendor, OTP provider, and payout onboarding.
- Durable persistence for remaining legacy dashboard routes — several still fall back to in-memory fixtures.
- Durable access-token revocation, cookie-based browser sessions, and shared rate-limit state for multi-instance deployments.
- Production deployment, observability, backup/restore procedures, and a CI test gate.

## Stack

| Area | Choice |
| --- | --- |
| Frontend | React 19, React Router 7, Vite 6, Tailwind CSS v4, motion, lucide-react, Recharts |
| Backend | Express 4 in a single `server.ts`, executed with `tsx` |
| Auth | `jsonwebtoken` (HS256, 2h) + `bcryptjs` |
| Data | PostgreSQL 18 + Prisma 7 via `@prisma/adapter-pg` |
| Hardening | `helmet` CSP, CORS allowlist, `express-rate-limit` |
| Email | Resend; invitations, password-reset links, and email-confirmation links |

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

The repo runs its own PostgreSQL cluster in `.pgdata` (git-ignored, port `5433`), so it needs neither the Windows service nor admin rights. The `trust` authentication below is only for a loopback-only local development cluster; do not expose this listener or reuse this authentication mode in a shared or production environment:

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
| `RESEND_API_KEY` | yes in production | Resend API key for invitation, password-reset, and email-confirmation mail. The app refuses to start in production without it. |
| `EMAIL_FROM` | yes in production | Sender identity on a domain verified in Resend. The development default `PropManage <onboarding@resend.dev>` is rejected in production. |
| `RESEND_WEBHOOK_SECRET` | yes in production | Signing secret for the `/api/webhooks/resend` endpoint. Add that HTTPS endpoint in Resend and subscribe to sent, delivered, delayed, bounced, failed, suppressed, and complained events. |
| `AUTH_RATE_LIMIT_MAX` | no | Failed `/api/auth/*` requests allowed per IP per 15-minute window; defaults to `5`. |
| `NODE_ENV` | no | `production` serves `dist/` statically, drops dev WebSocket CSP entries, and blocks seeding. |
| `PG_BIN`, `DB_PORT` | no | Override the PostgreSQL binaries directory or cluster port for `scripts/db.mjs`. |

Never commit `.env`. `.env*`, `.pgdata/`, `uploads/`, and `AGENTS.md`, are git-ignored.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | `tsx server.ts` — Express + Vite middleware on one port. No file watching on `server.ts`; restart after server edits. |
| `npm run lint` | `tsc --noEmit`. This is the gate that matters. |
| `npm run build` | Vite production build, then esbuild bundles `server.ts` to `dist/server.cjs` without source maps. |
| `npm run start` | Runs `dist/server.cjs` (build first). |
| `npm run prisma:generate` | Regenerates the Prisma client. Required after every schema change. |
| `npm run prisma:migrate` | `prisma migrate dev --name init` — adjust the name for new migrations. |
| `npm run db:seed` | Seeds demo accounts and fixtures. |
| `npm run db:start` / `db:stop` / `db:status` | Control and inspect the local `.pgdata` cluster. |
| `node scripts/verify-security.mjs` | Runs account/session/reset/email/MFA regression checks against the configured database and a running server. Use only with a disposable local test database. |
| `node scripts/temp-ui-security.mjs create|clean` | Temporary browser-check admin helper; requires `ALLOW_TEMP_QA_ADMIN=true`, refuses production, and only accepts loopback database hosts. Use only with a disposable local database. |
| `NODE_ENV=production node scripts/bootstrap-admin.mjs --confirm-bootstrap` | One-time production bootstrap; prompts for the first administrator and a hidden initial password. Refuses to run if an admin already exists. The created account must enroll MFA before admin APIs unlock. |
| `node scripts/recover-admin-mfa.mjs admin@example.com` | Operator recovery after independent identity verification. Requires distinct `ADMIN_RECOVERY_OPERATOR` and `ADMIN_RECOVERY_APPROVER`; revokes sessions and records an audit event. Add `--confirm-production-recovery` in production. |
| `npm run clean` | `rm -rf dist server.js` — Unix shells only; delete `dist/` by hand on PowerShell. |

`npx prisma migrate status` tells you whether the database is in sync with `schema.prisma`.

## Request pipeline

Order matters when debugging CORS, auth, or 429s:

1. `helmet` CSP — allows self, Google Fonts, `images.unsplash.com`, and dev WebSockets only.
2. CORS with an explicit origin allowlist. Requests without an `Origin` header pass; anything else must be listed in `ALLOWED_ORIGINS`.
3. Body parsers: JSON up to 10 MB, urlencoded up to 32 KB (avatar uploads use their own raw parser).
4. `/uploads` static serving for avatars, cached for 7 days.
5. Rate limiters: `/api` 100/min, `/api/auth` 5 per 15 min (successful requests skipped), registration 5/hour, invitation create 20/hour, invitation accept 10/15 min.
6. **Global auth gate**: every `/api` path not in the public list is wrapped in `authMiddleware`, so an unknown `/api` path returns `401`, not `404`. Public paths include health, the signed Resend webhook, login/register/logout/refresh, password-reset request/confirm, email-confirmation confirm, MFA sign-in verification, contact, listings, and `/api/tenant-invitations/<64-hex-token>` plus its `/accept`. Unenrolled admins receive `403` for privileged routes until MFA setup is complete.
7. Route handlers, then a role check via `requireRole(...)` where a role is required.

## Auth and sessions

- **Registration** takes first name, last name, email, password, role (`landlord` | `tenant`), and an optional phone. Admins cannot self-register.
- **Passwords**: 12–72 UTF-8 bytes, trimmed before hashing, bcrypt cost 12. The same rule applies to registration, invitation acceptance, profile password change, and admin password rotation.
- **Login** lowercases the email and returns one message for both bad email and bad password.
- **Session**: signed HS256 access JWT valid for **2 hours**, plus a **30-day rotating refresh token**. Only the SHA-256 hash of each refresh token is stored in PostgreSQL. Replaying a rotated token revokes active refresh sessions for that user.
- **Storage**: access token, refresh token, and user profile are stored in `localStorage`. On mount the app calls `GET /api/auth/me`; an expired access token is refreshed when possible. XSS can steal browser-stored tokens; HttpOnly cookies with CSRF protection are a safer production target.
- **Password reset**: request responses do not reveal whether an email exists. Reset tokens are stored hashed, expire in 60 minutes, are single-use, and revoke refresh sessions after a successful reset.
- **Email confirmation**: one-time link expires after 24 hours and creates a `VerificationReview`. This proves inbox access only, not identity, phone, or property ownership.
- **Admin MFA**: required authenticator-app TOTP with hashed, single-use recovery codes. Password-only login for an unenrolled admin grants access only to MFA enrollment, account identity, and session management endpoints. Admin APIs are checked against the current database MFA state.
- **Endpoints**: auth register/login/logout/logout-all/refresh/sessions/password-reset/email-confirmation/MFA/admin-password-rotation; account profile/password/avatar endpoints.
- **Revocation**: refresh-token revocation is database-backed. Access-token `jti` blacklist and in-process cutoff checks remain memory-based; a restart loses those checks, and multiple instances do not share them. A revoked access JWT may remain usable until its two-hour expiry.
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
`AUTH_RATE_LIMIT_MAX` overrides the failed-request limit (default `5`). Rate-limit counters use the process-local default store; configure a shared store before horizontal scaling.

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

Routes under `/api` are JSON. Storage is noted per group — that is where the remaining risk lives.

| Group | Routes | Storage |
| --- | --- | --- |
| Health | `GET /api/health`, `POST /api/webhooks/resend` | none; webhook signature verified |
| Public | `POST /api/contact`, `GET /api/listings` | DB / fixtures |
| Auth | register, login, logout, logout-all, refresh, sessions, password reset, email confirmation, MFA, rotate-admin-password, me | DB |
| Account | `PATCH /api/users/me`, `POST /api/users/me/password`, `POST /api/users/me/avatar` | DB + disk |
| Invitations | create (landlord), fetch by token, accept | DB |
| Admin | `overview`, `users`, `contact-inquiries` (list + status), `audit`, `users/:id/verification` (read + record) | DB |
| Dashboard | `GET /api/dashboard-stats` | DB counts |
| Reports | create, list, review (`PATCH /api/reports/:id`) | DB |
| Properties | list, read, create, update, delete | DB with fixture fallback |
| Units | list, create, update, delete, `PUT /api/units/:id/listing` | DB with fixture fallback |
| Tenants | list, create, update, delete | DB with fixture fallback |
| Payments / maintenance / messages / documents | list + create, maintenance update | mixed; payments remain records only, not provider transactions |
| Viewing requests | tenant create/list, landlord update | DB |

Admin-only routes are the ones under `/api/admin` plus `PATCH /api/reports/:id`. Reviewing a report can adjust `trustScore` and set `blacklisted`; both are recorded in the audit log with the acting admin.

## Data model

17 models: `User`, `Property`, `Unit`, `Tenant`, `TenantInvitation`, `Payment`, `MaintenanceRequest`, `Message`, `Document`, `ViewingRequest`, `Report`, `ContactInquiry`, `AuditLog`, `RefreshToken`, `PasswordResetToken`, `EmailVerificationToken`, `VerificationReview`.

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
20261116094932_add_sessions_and_second_factor
```

Apply with `npx prisma migrate dev` locally and `npx prisma migrate deploy` anywhere shared. Never run `migrate reset` against a database you care about.

## Frontend map

| Area | Routes |
| --- | --- |
| Public | `/`, `/about`, `/pricing`, `/contact`, `/privacy`, `/thank-you`, `/login`, `/reset-password`, `/verify-email`, `/invite/:token`, `*` |
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
- **Document scanning.** Document scanning is not available. Any future implementation must include explicit consent/disclosure, strict file type and size validation, and retention limits before sending content to a provider.
- **No raw bank details.** Payouts belong to payment-provider connected-account onboarding.
- **Nigeria first.** Initial verification market is Nigeria; currency, legal review, and provider selection follow from that.
- **Illustrative means illustrative.** No fabricated testimonials, customer counts, or measured results. Maintained-list items like online rent payments, identity/property verification, and phone OTP stay labelled "coming next" until they ship.
- **Law-enforcement requests** require lawful process, minimum-necessary disclosure, and audit/retention controls. Hidden identity data is never disclosed to another user.

The privacy policy is a product draft, not legal advice and not a claim of NDPA/NDPR compliance. Obtain Nigeria-specific legal review before launch.

### Nigeria-first provider shortlist

These are candidates for evaluation, not integrated or selected providers. Confirm commercial terms, regulatory fit, supported account types, data retention, and the platform's marketplace/payout model with each provider before implementation.

- **Payments and payout exploration: Paystack first; Flutterwave as an alternative.** Paystack documents Nigerian payment channels and split payments to subaccounts, and its transfer feature is limited to registered businesses. Confirm whether the proposed landlord rent flow and platform role qualify before relying on splits or transfers. [Paystack payment channels](https://paystack.com/docs/v2/payments/channels), [split payments](https://paystack.com/docs/v2/payments/split-payments), [transfer requirements](https://support.paystack.com/en/articles/2132866). Flutterwave documents Nigerian bank payouts; verify settlement and marketplace eligibility for this product. [Flutterwave payouts](https://developer.flutterwave.com/docs/payout-outflow/introduction).
- **Identity verification candidate: Prembly.** Its service directory lists Nigerian NIN, BVN, phone, and document verification endpoints. Use provider-hosted collection where available and retain only references/results permitted by the chosen workflow. [Prembly verification services](https://docs.prembly.com/guides/reference/verification-services?type=kyc).
- **Phone OTP candidate: Termii.** Its docs provide messaging and token products with an account-specific API base URL. Validate delivery to target carriers, fraud controls, and pricing in a sandbox first. [Termii developer docs](https://developers.termii.com/).

## Security posture and known gaps

Implemented: parameterised Prisma access, bcrypt hashing, role gates, Helmet CSP, CORS allowlist, route-specific rate limits, magic-byte avatar validation, hashed single-use invitation/reset/verification tokens, rotating database-backed refresh tokens, required admin TOTP with hashed recovery codes, restricted password-only admin enrollment, one-time bootstrap and audited two-operator MFA recovery scripts, audit records for admin decisions, and production static-file rules that withhold server bundles and source maps.

Close these before production:

- **Monitor email delivery.** Production startup requires Resend credentials, a non-default sender, and a webhook secret. `/api/webhooks/resend` verifies signed events; health exposes the latest in-process event/state, and logs omit recipient addresses and message content. Configure the endpoint and Resend dashboard alerts for delayed delivery, bounces, complaints, and failures. Password-reset responses remain generic to avoid account enumeration, while naming support as the fallback if no email arrives. This app-side health state is not a durable event history.
- **Protect browser sessions from XSS.** Access and refresh tokens are stored in `localStorage`; move them to HttpOnly, Secure, SameSite cookies with CSRF protection before production.
- **Make access-token revocation durable.** Refresh-token revocation is in PostgreSQL, but the access-token `jti` blacklist and logout-all cutoff are in memory. A restart loses them and multiple instances do not share them.
- **Use shared rate-limit state when scaling.** The default `express-rate-limit` store is process-local; use a shared store such as Redis for multiple instances.
- **Remove fixture fallbacks.** Legacy dashboard CRUD may serve in-memory fixtures on database errors; remove those paths before relying on production persistence.
- **Keep QA scripts local-only.** `scripts/temp-ui-security.mjs` contains a fixed admin test credential and deletes/recreates the same test email. It must only be run against a disposable local database.
- **Add operational checks.** There is no CI test gate, structured logging, metrics/alerting, or verified backup/restore procedure yet.

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
| Invitation email never arrives | Resend is not configured or the provider rejected the send | In development, check the server log for the invitation link; in production, inspect Resend logs and the signed delivery webhook state |
| `npm run build` exits non-zero after printing `✓ built` | PowerShell turns npm's stderr notes into a native-command error | Check for `dist/server.cjs`; the build itself succeeded |

## Roadmap

1. **Production account security**: move tokens to HttpOnly cookies; make access-session revocation durable across restarts and instances.
2. **Account email**: set production secrets and a verified sender; configure Resend events and alerts, then add durable delivery-event history while keeping reset responses account-enumeration safe.
3. **Payments**: a Nigeria-capable provider for rent and connected-account payouts, with webhooks and reconciliation.
4. **Verification providers**: KYC and phone-OTP vendors, provider callbacks, automatic expiry, and audit on every status change.
5. **Persistence pass**: move remaining dashboard CRUD off fixtures and delete the fallbacks.
6. **Deployment hardening**: use a shared rate-limit store when scaling, and add dependency/security checks to CI.
7. **Legal and operations**: Nigeria-specific privacy review, retention policy, production deployment, backups, restore drills, and incident response.

## Conventions

- `npm run lint` must pass. It is the only automated gate in the repo today.
- Migrations are additive and named for what they change. Never reset a shared database.
- Durable writes fail loudly. Do not reintroduce "success" responses for work that did not persist.
- New admin actions must write an `AuditLog` entry and must not copy user-submitted prose into it.
- Statuses that imply trust (`verified`, badges) require a recorded reviewer and basis.
- Keep copy honest: if a feature is planned, say planned.

## License

MIT
