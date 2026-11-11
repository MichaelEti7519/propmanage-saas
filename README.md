
# PropManage SaaS

A premium, privacy-first landlord management SaaS built with React, Vite, Express, TypeScript, Prisma, and PostgreSQL.

## Visual Direction & Palette

PropManage uses a premium, consistent palette for all UI/UX:

- **Ivory** `#FAF8F3` (backgrounds)
- **Sand** `#E8DDCC` (borders, selected states)
- **Taupe** `#B9A58B` (accents)
- **Espresso** `#332D29` (primary text/actions)
- **Accent** `#397451` (success, primary CTA)

All screens (login, dashboard, properties, tenant profiles, rent collection, maintenance, settings, public, error, and legal pages) use this palette. No default Tailwind or off-brand colors remain. UI elements, forms, and cards are visually unified for a premium, modern experience.

---

This project is currently in active development. The frontend and route structure are already in place, and the backend is being moved from demo in-memory data toward a real persisted database layer.


## Current status

**Implemented:**
- React + Vite frontend with landlord, tenant, and admin screens
- JWT auth flow and protected routes
- Property and unit management UI
- Tenant invitation flow and acceptance flow
- Landlords can publish vacant units; tenants can request viewings with their account email, and landlords confirm or decline without automatic assignment
- Express API with rate limits and security middleware
- Prisma schema for the core SaaS entities
- Postgres-ready setup for the next deployment stage
- All UI/UX on-brand with premium palette

**In progress:**
- Full database-backed persistence for every route
- Apply and test the home-listing/viewing-request migration after PostgreSQL credentials are corrected
- Stripe-based rent payment integration
- Production deployment config
- Final testing and visual QA


## Tech stack

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Auth: JWT + bcrypt
- Database: PostgreSQL + Prisma
- Security: helmet, CORS, rate limiting
- Email: Resend-ready for tenant invites


## Local setup

1. Install dependencies:

   npm install

2. Create a local `.env` file using the sample file:

   copy .env.example .env

3. Update the values in `.env`:

   - `PORT`
   - `JWT_SECRET`
   - `ALLOWED_ORIGINS`
   - `DATABASE_URL`
   - `DEV_SEED_PASSWORD` (local seed accounts only; use a unique password of at least 12 characters)
   - `APP_URL`
   - `RESEND_API_KEY` (optional)
   - `EMAIL_FROM` (optional)

4. Make sure PostgreSQL is running locally and create a database named `propmanage`.

5. Generate Prisma client and run migrations:

   npx prisma generate
   npx prisma migrate dev --name init

6. Seed the database with demo landlord and tenant data:

   npm run db:seed

   The seed creates `admin@propmanage.saas`, `landlord@propmanage.saas`, and `tenant@propmanage.saas` as ordinary database accounts. All three use your locally configured `DEV_SEED_PASSWORD`; demo seeding is blocked in production.

7. Start the app:

   npm run dev

8. Open the app in the browser:

   http://localhost:3000

## Useful commands

- Start dev app:
   npm run dev
- Type-check:
   npm run lint

- Generate Prisma client:

  npm run prisma:generate

- Run Prisma migration:

  npm run prisma:migrate

- Seed database:

  npm run db:seed

## Project structure

- `server.ts` — Express backend, auth, route logic, API endpoints
- `src/App.tsx` — app routing and protected screens
- `src/pages/` — landlord, tenant, admin, and public pages
- `src/hooks/` — auth and app state logic
- `prisma/schema.prisma` — database schema
- `prisma/seed.ts` — sample seed data
- `prisma.config.ts` — Prisma 7 config

## What You Can Actually Access (And How)

Access in this app is role-based and enforced in both the frontend and backend. The user must log in with a valid JWT, and the route or API call is then checked against their role.

### Public access
Anyone can view:
- landing page
- about page
- contact page
- login / register page
- tenant invite page via a token URL such as `/invite/:token`

These pages do not require an authenticated session.

### Landlord access
A user with the `landlord` role can access the dashboard at `/landlord` and the following sections:
- Dashboard
- Properties
- Units
- Tenants
- Payments
- Reports
- Messages
- Maintenance
- Analytics
- Settings

This area is protected by `RequireAuth allowedRoles={['landlord']}` in the frontend and `requireRole('landlord')`-style checks on the backend when data is being accessed or modified.

### Tenant access
A user with the `tenant` role can access the dashboard at `/tenant` and the following sections:
- Dashboard
- Payments
- Maintenance
- Messages
- Documents
- Settings

A tenant sees only the tenant-specific views and should not be able to reach landlord-only routes.

### Admin access
A user with the `admin` role can access the full platform dashboard at `/admin` and see administrative views for:
- system overview
- global directory
- all units
- user accounts
- platform revenue
- support desk
- system health
- global metrics
- compliance logs
- settings

This is reserved for internal platform administration and should not be exposed to normal landlords or tenants.

### How access is enforced
The app checks access in two places:
1. Frontend route guards prevent users from opening unauthorized pages.
2. Backend auth middleware and role validation protect API endpoints.

If a token is missing, expired, or not allowed for the resource, the API responds with a `401` or `403` error instead of returning user data.

### Verification status and data minimization
The current signup flow collects account name, email, role, and an optional phone number. New email and phone values are not verified by OTP yet. Registration does not collect government ID images or numbers, property deeds, bank details, payslips, or emergency-contact information.

The schema now has status fields for email, phone, identity, property authorization, business registration, tenant income, and payout verification. These statuses are scaffolding only; a status must not be shown as verified until a configured provider or approved reviewer has completed and recorded the check. No KYC vendor, OTP provider, or connected payout provider is configured yet.

When providers are selected, use hosted or tokenized collection where possible. Store only the provider reference, check type, status, timestamps, and limited audit metadata. Do not expose source documents to landlords or tenants. Emergency-contact details should only be collected when needed, with notice and consent from the person providing them.

## Fraud reports and legal requests

The report UI and API support submission, an admin review status, and explicit admin trust-score or blacklist changes. Those changes are review tools and do not automatically suspend accounts or freeze payouts. Report persistence and the new schema require a database migration before use.

Reports are not a substitute for contacting emergency services or law enforcement. Do not disclose a user's hidden identity, private address, ID, or financial details directly to another user. Any disclosure to law enforcement or a court must be reviewed and handled only through lawful process, limited to what is required, and logged under a defined retention and access policy.

The platform does not currently process rent through a connected payment provider, verify property ownership, run automated KYC, or maintain secure vault storage for verification documents. Do not claim these protections are live until integrations, controls, incident procedures, and legal review are complete.

## Database model

The current schema includes:
- User
- Property
- Unit
- Tenant
- TenantInvitation
- Payment
- MaintenanceRequest
- Message
- Document
- Report
- ContactInquiry

This is the foundation for the landlord SaaS workflow: properties owned by landlords, rental units inside properties, tenant assignments, invite-based onboarding, and rent/maintenance records.

## Security notes

- JWT secrets should never be committed to source control.
- Use a real Postgres database instead of in-memory arrays for production data.
- Legacy CRUD routes fall back to in-memory data when the database is unavailable to keep development screens responsive; that data is volatile and must not be treated as a successful production write.
- Report and contact submissions require durable database storage and return an error when persistence is unavailable rather than reporting a false success.
- Apply the pending Prisma schema changes after configuring and starting the intended development database; do not point migration commands at production without review.
- Keep tenant invitation tokens single-use and short-lived.
- Do not expose admin secrets or private keys in frontend code.
- Do not accept identity, income, property-title, or bank documents until a provider-hosted or separately secured storage flow and retention policy are in place.

## Next milestones

1. finish all database-backed CRUD routes
2. complete tenant invite acceptance persistence
3. add Stripe-based rent payment workflow
4. select Nigeria-focused KYC, OTP, and payout providers; obtain privacy/legal review
5. implement provider-hosted verification callbacks and audited status changes
6. define lawful disclosure, retention, access, and incident-response procedures before handling sensitive documents
7. deploy to a real environment and harden production config

## License

MIT
