# PropManage SaaS

A landlord management SaaS built with React, Vite, Express, TypeScript, Prisma, and PostgreSQL.

This project is currently in active development. The frontend and route structure are already in place, and the backend is being moved from demo in-memory data toward a real persisted database layer.

## Current status

Implemented:
- React + Vite frontend with landlord, tenant, and admin screens
- JWT auth flow and protected routes
- Property and unit management UI
- Tenant invitation flow and acceptance flow
- Express API with rate limits and security middleware
- Prisma schema for the core SaaS entities
- Postgres-ready setup for the next deployment stage

In progress:
- full database-backed persistence for every route
- Stripe-based rent payment integration
- production deployment config
- final testing and cleanup

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
   - `APP_URL`
   - `RESEND_API_KEY` (optional)
   - `EMAIL_FROM` (optional)

4. Make sure PostgreSQL is running locally and create a database named `propmanage`.

5. Generate Prisma client and run migrations:

   npx prisma generate
   npx prisma migrate dev --name init

6. Seed the database with demo landlord and tenant data:

   npm run db:seed

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

This is the foundation for the landlord SaaS workflow: properties owned by landlords, rental units inside properties, tenant assignments, invite-based onboarding, and rent/maintenance records.

## Security notes

- JWT secrets should never be committed to source control.
- Use a real Postgres database instead of in-memory arrays for production data.
- Keep tenant invitation tokens single-use and short-lived.
- Do not expose admin secrets or private keys in frontend code.

## Next milestones

1. finish all database-backed CRUD routes
2. complete tenant invite acceptance persistence
3. add Stripe-based rent payment workflow
4. add file upload and document storage
5. deploy to a real environment and harden production config

## License

MIT
