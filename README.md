# PropManage SaaS

A privacy-first property management SaaS for landlords, tenants, and platform admins, built with React 19, Vite, Express, TypeScript, Prisma 7, and PostgreSQL.

## Visual direction & palette

All screens use one palette and one type scale:

- **Ivory** `#FAF8F3` — page backgrounds
- **Sand** `#E8DDCC` — borders, dividers, selected states
- **Taupe** `#B9A58B` — accents, small labels
- **Espresso** `#332D29` — primary text and primary actions
- **Accent** `#397451` — success and confirming actions

Surfaces are white, radii are consistent (`rounded-2xl` for panels and media, `rounded-xl` for controls, `rounded-full` only for chips and pills), and glass effects are limited to a few deliberate places. Status colors (success, warning, danger) are kept distinct from the brand neutrals.

Dashboard metrics, property rows, and payment figures are **illustrative sample data**, not reported customer results.

## Current status

**Implemented**

- React + Vite frontend for public, landlord, tenant, and admin areas
- Role-based routing on the client and role checks on the API
- Public marketing pages: landing, pricing, about, contact, privacy, thank-you, 404
- Contact form that persists an inquiry and only redirects on a successful response
- JWT login/register with bcrypt password hashing and 2-hour tokens
- Landlord/tenant invitation flow (`/invite/:token`) with hashed, single-use tokens
- Vacant-unit publishing and tenant viewing requests
- Fraud/conduct reports with admin review, explicit trust-score adjustment, and blacklist flags
- Express API with helmet CSP, CORS allowlist, and per-route rate limiting
- Prisma schema for all core entities
- Verification status fields scaffolded (email, phone, identity, property authorization, business registration, income, payout)

**Not done yet**

- No Prisma migration has been applied in this environment; `prisma/migrations/` does not exist
- Most dashboard data still comes from in-memory fixtures rather than the database
- No rent payment provider, KYC vendor, OTP provider, or payout onboarding
- No verification email, password reset, or refresh-token flow
- Production deployment and hardening

## Tech stack

| Area | Choice |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, React Router 7, Tailwind CSS v4, motion, lucide-react |
| Backend | Express 4 in `server.ts`, TypeScript via `tsx` |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Database | PostgreSQL + Prisma 7 (`@prisma/adapter-pg`) |
| Security | helmet, CORS allowlist, `express-rate-limit` |
| Email | Resend (optional, used for tenant invitations only) |

## Requirements

- Node.js 20+
- PostgreSQL 14+ running locally (or a connection string you control)
- A `JWT_SECRET` of **at least 32 characters** — the server refuses to start without it

## Local setup

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file in the project root. It is git-ignored, so it never reaches GitHub.

3. Fill in `.env`:

   | Key | Required | Notes |
   | --- | --- | --- |
   | `PORT` | no | Defaults to `3000`; the Vite dev server runs inside Express on this port |
   | `APP_URL` | yes | Used to build invitation links, e.g. `http://localhost:3000` |
   | `ALLOWED_ORIGINS` | no | Comma-separated CORS allowlist; defaults to `http://localhost:3000` |
   | `JWT_SECRET` | yes | Minimum 32 characters. The server throws at startup if it is shorter |
   | `DATABASE_URL` | yes | PostgreSQL connection string for the `propmanage` database |
   | `DEV_SEED_PASSWORD` | for seeding | Local demo accounts only, 12+ characters. Seeding is blocked in production |
   | `RESEND_API_KEY` | no | Enables invitation email delivery; without it the invite link is returned instead |
   | `EMAIL_FROM` | no | Defaults to `PropManage <onboarding@resend.dev>` |
   | `GEMINI_API_KEY` | no | Only needed for the document-scan endpoint; returns `500` when unset |

4. Start PostgreSQL and create the database:

   ```
   createdb propmanage
   ```

5. Generate the Prisma client and apply the schema:

   ```
   npx prisma generate
   npx prisma migrate dev --name init
   ```

   `prisma/migrations/` does not exist yet, so this command creates the first migration. Do not run it against a shared or production database without review.

6. Optional — seed demo accounts:

   ```
   npm run db:seed
   ```

   The seed upserts `admin@propmanage.saas`, `landlord@propmanage.saas`, and `tenant@propmanage.saas`, all using your local `DEV_SEED_PASSWORD`. No credentials are prefilled in the UI.

7. Start the app:

   ```
   npm run dev
   ```

8. Open `http://localhost:3000`.

## Useful commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Express + Vite in middleware mode on one port |
| `npm run lint` | `tsc --noEmit` — the reliable verification gate |
| `npm run build` | Vite production build plus the bundled server |
| `npm run start` | Run `dist/server.cjs` (requires a prior build) |
| `npm run prisma:generate` | Regenerate the Prisma client |
| `npm run prisma:migrate` | `prisma migrate dev --name init` |
| `npm run db:seed` | Seed local demo accounts and fixtures |

Use `npx prisma migrate status` to check whether the database is in sync with `schema.prisma`.

## Auth and sessions

The auth surface is small and intentionally unforgiving. Current behavior:

- **Registration**: first name, last name, email, password, role (`landlord` or `tenant`), optional phone. Admin accounts cannot self-register.
- **Password rule**: 12–72 UTF-8 bytes, enforced on the server. Passwords are trimmed before hashing, so leading/trailing spaces are not part of the password.
- **Login**: email is lowercased; email and password errors both return the same message so the response does not reveal whether an account exists.
- **Session**: a signed JWT with a unique `jti`, valid for **2 hours**. There is no refresh token, so sessions end silently after expiry.
- **Storage**: the token and a copy of the user object live in `localStorage` (`propmanage_token`, `propmanage_user`). On mount, the app calls `GET /api/auth/me` and logs the user out if that call fails.
- **Endpoints**: `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, `/api/auth/logout-all`, `/api/auth/me`, `/api/auth/rotate-admin-password`.
- **Revocation**: logout blacklists the token's `jti`; logout-all records a per-user cutoff. Both are held in memory and are lost on restart.

### Rate limits

| Scope | Limit |
| --- | --- |
| All `/api/*` | 100 requests / minute / IP |
| Everything under `/api/auth/*` | 5 requests / 15 minutes / IP (successful requests are skipped) |
| `/api/auth/register` | 5 requests / hour / IP (all attempts count) |

These limits are deliberately tight, and they are currently the most common cause of a "broken" login during development.

### Error responses

| Status | Meaning |
| --- | --- |
| `400` | Missing or invalid field, including a password outside 12–72 bytes |
| `401` | Invalid credentials, missing token, or expired/revoked token |
| `403` | Role not allowed for the request |
| `409` | Email already registered |
| `429` | A rate limiter rejected the request |
| `503` | The database could not be reached or queried |

`503` is the important one: auth reads and writes have **no in-memory fallback**. If PostgreSQL is down, or the schema has not been migrated, login and registration fail with "Account service is temporarily unavailable" rather than pretending to succeed. Legacy dashboard CRUD routes still fall back to fixtures, but account, report, and contact writes do not.

## Troubleshooting login and signup

| Symptom | Cause | Fix |
| --- | --- | --- |
| `npm run dev` exits immediately with a `JWT_SECRET` error | Secret is shorter than 32 characters | Generate one: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and paste it into `.env` |
| Login/register returns `503` | Database unreachable, or `prisma migrate dev` never ran | Start PostgreSQL, confirm `DATABASE_URL`, then run `npx prisma migrate dev --name init` |
| Login returns `429` | Too many failed attempts, or repeated `/api/auth/me` calls with a stale token | Wait for the window to pass, or clear `propmanage_token` from `localStorage` |
| Registration returns `429` | Five registration attempts (including failed validation) in an hour | Wait, or restart the dev server to reset the in-memory store |
| Registration returns `400` about password length | Server requires 12+ characters while the form allows 8 | Use a longer password until the form and server rules are aligned |
| You are logged out right after reloading | `/api/auth/me` failed, so the client cleared the session | Check the API log; a `401` here usually means the token expired |
| Invitation email never arrives | `RESEND_API_KEY` is unset | The API returns the invite link directly instead of sending mail |

## Routes

### Public (no session)

| Route | Purpose |
| --- | --- |
| `/` | Landing page |
| `/pricing` | Pricing overview (**illustrative**, no billing integration) |
| `/about` | Product background |
| `/contact` | Contact form, persisted as a `ContactInquiry` |
| `/privacy` | Privacy policy draft — not legal advice |
| `/thank-you` | Post-submission confirmation |
| `/login` | Login and registration in one view |
| `/invite/:token` | Tenant invitation acceptance |
| `*` | Not found |

### Landlord (`/landlord`, role `landlord`)

Dashboard, `properties`, `properties/:id`, `units`, `viewings`, `tenants`, `payments`, `reports`, `messages`, `maintenance`, `analytics`, `settings`.

### Tenant (`/tenant`, role `tenant`)

Dashboard, `homes`, `payments`, `maintenance`, `messages`, `documents`, `settings`.

### Admin (`/admin`, role `admin`)

Dashboard, `properties`, `units`, `tenants`, `payments`, `messages`, `maintenance`, `analytics`, `reports`, `settings`.

Access is enforced twice: `RequireAuth` guards routes on the client, and the API re-checks the token and role on every non-public path. A missing, expired, or wrong-role token produces `401` or `403` rather than data.

## Verification status and data minimization

Signup collects a name, email, role, and an optional phone number. It does not collect government ID numbers or images, property deeds, bank details, payslips, income documents, or emergency contacts, and signup is **not** identity verification.

The schema carries status fields for email, phone, identity, property authorization, business registration, tenant income, and payout verification. They are scaffolding: `pending` or `not_started` until a provider or reviewer completes and records the check. No KYC vendor, OTP provider, or payout provider is configured, so no "verified" badge is ever shown.

When providers are selected, prefer hosted or tokenized collection and retain only provider references, check type, status, timestamps, and limited audit metadata. Never expose source documents to landlords or tenants. Collect emergency-contact details only when needed, with notice and consent from the person providing them.

Initial verification market: **Nigeria**. Payouts are expected to use payment-provider connected-account onboarding; bank details should not be collected or stored directly.

## Fraud reports and legal requests

The report UI and API support submission, an admin review status, explicit trust-score adjustments, and manual blacklist flags. These are review tools: they do not automatically suspend accounts, freeze payouts, or block login. Reports require durable database storage and return an error when persistence is unavailable.

Reports are not a substitute for contacting emergency services or law enforcement. Never disclose a user's hidden identity, private address, ID, or financial details directly to another user. Any disclosure to law enforcement or a court must follow lawful process, be limited to what is required, and be logged under a defined retention and access policy.

The platform does not process rent through a connected provider, verify property ownership, run automated KYC, or maintain secure vault storage for verification documents. Do not claim these protections are live until integrations, controls, incident procedures, and legal review are complete.

## Database model

`User`, `Property`, `Unit`, `Tenant`, `TenantInvitation`, `Payment`, `MaintenanceRequest`, `Message`, `Document`, `Report`, `ContactInquiry`.

Agents, guards, and report endpoints read through Prisma. Most legacy dashboard list endpoints still serve in-memory fixtures when the database is unavailable, so a working dashboard does **not** prove the database is connected.

## Project structure

```
server.ts                     Express app: security middleware, auth, API routes, Vite middleware
prisma/schema.prisma          Data model
prisma/seed.ts                Local demo accounts and fixtures
prisma.config.ts              Prisma 7 config (datasource + migrations path)
src/App.tsx                   Route table and role-guarded layouts
src/index.css                 Tailwind v4 theme tokens
src/hooks/useAuth.tsx         Token storage, session bootstrap, fetchWithAuth
src/layouts/                  PublicLayout, DashboardLayout
src/components/               AnimatedContent, GlideSelect, ReportModal
src/pages/public/index.tsx    Barrel that re-exports the public pages
src/pages/public/Landing.tsx  Composes the landing page from ./landing/*
src/pages/public/landing/     One module per section plus theme.ts and sampleData.ts
src/pages/public/*.tsx        Pricing, About, Contact, PrivacyPolicy, ThankYou, NotFound, LoginRegister
src/pages/landlord|tenant|admin/
```

### Landing page modules

`landing/theme.ts` holds the shared class recipes (`pageShell`, `sectionY`, `eyebrow`, `displayHeading`, `primaryButton`, `glassPanel`) so every section uses the same spacing, radius, and type scale. `landing/sampleData.ts` holds the fixture rows, FAQ copy, and photo metadata. Each section is its own component: `Hero`, `StorySection`, `WorkspaceSection`, `TenantSection`, `WorkflowSection`, `AvailabilitySection`, `FaqSection`, `CtaSection`.

## Security notes

- Never commit `JWT_SECRET`, `DATABASE_URL` credentials, API keys, or seeded passwords. `.env*` is git-ignored.
- Use a real PostgreSQL database for anything shared; in-memory fixtures are volatile and must never be treated as a successful write.
- Account, report, and contact writes return errors instead of false successes when persistence fails.
- Apply migrations deliberately. Do not run `migrate reset`, and do not point migration commands at production without review.
- Keep invitation tokens single-use and short-lived; only hashes are stored.
- Token revocation is in memory, so restarts clear it. Move it to shared storage before running more than one instance.
- Do not accept identity, income, property-title, or bank documents until provider-hosted or separately secured storage, retention, and access policy exist.

## Next milestones

1. Fix the auth blockers listed in Troubleshooting: raise `JWT_SECRET` to 32+ characters, apply the first migration, align the password rule between form and server, and scope the login limiter to `/api/auth/login` only.
2. Return a stable user object from `GET /api/auth/me` (map `sub` to `id`) so the stored session shape does not change after reload.
3. Add verification email, password reset, and refresh-token rotation.
4. Persist the remaining dashboard CRUD routes and retire the in-memory fallbacks.
5. Integrate a Nigeria-focused payment provider for rent and connected-account payouts.
6. Select KYC/OTP providers, implement provider callbacks, and audit every status change.
7. Obtain Nigeria-specific legal review of the privacy policy and disclosure procedures.
8. Deploy, then harden config, logging, backup, and incident response.

## License

MIT
