# Project Handoff

## Project
PropManage SaaS: React 19, TypeScript, Vite, Express, Prisma 7, and PostgreSQL. The product has public, landlord, tenant, and admin areas.

## Current Worktree
There are 13 existing changed files to include in the next commit:

- `README.md`
- `prisma.config.ts`
- `prisma/schema.prisma`
- `server.ts`
- `src/App.tsx`
- `src/layouts/PublicLayout.tsx`
- `src/pages/admin/Reports.tsx`
- `src/pages/landlord/Payments.tsx`
- `src/pages/landlord/Tenants.tsx`
- `src/pages/public/index.tsx`
- `src/pages/tenant/Payments.tsx`
- `src/pages/tenant/index.tsx`
- `src/components/ReportModal.tsx` (new)

Do not discard or overwrite user changes. `AGENTS.md` is an additional handoff file created after that 13-file set was counted.

## Implemented In This Work
- Public landing page sections for FAQs, internal links, illustrative workflows, response-time expectation, and above-fold/mobile CTAs.
- Privacy, pricing, thank-you, and 404 routes; contact submissions use a database record and only navigate to thank-you after a successful response.
- Admin report review interface and report create/list/update API, including status, notes, explicit trust-score adjustments, and manual blacklist flags.
- Signup no longer collects ID digits, home address, deeds, income documents, or emergency-contact information. New verification status fields remain pending/not-started; signup is not identity verification.
- Signup/login tab animation uses one persistent CSS transform indicator. No demo credentials are prefilled.
- Legacy CRUD routes retain a logged in-memory fallback for degraded development behavior. Durable account/report/contact writes must return errors rather than claim success if persistence fails.

## Sensitive Data / Product Constraints
- Initial verification market: Nigeria. KYC vendor: not selected; current choice is status-only until a provider is selected.
- Payout handling should use payment-provider connected-account onboarding. Do not collect or store bank details directly.
- Do not build raw ID, deed, payslip, bank-statement, or income-document uploads into the ordinary app database. Prefer hosted provider verification and retain only provider references, statuses, timestamps, and minimal audit data.
- Do not show a verified badge unless a provider/reviewer has actually completed and recorded verification.
- No real customer reviews or measured case studies were supplied. Keep workflows labeled illustrative and do not fabricate testimonials or results.
- Privacy policy is a product draft, not legal advice or a claim of NDPA/NDPR compliance. Obtain Nigeria-specific legal review before launch.
- Law-enforcement disclosures require lawful process, review, minimum necessary disclosure, and audit/retention controls. Never expose hidden identity data to another user.

## Database Status / Next Steps
- Prisma schema includes `Report`, `ContactInquiry`, user verification statuses, trust score, and blacklist state.
- Prisma client was generated and schema validation passed.
- Local Postgres at `localhost:5432` was not running (Prisma P1001), so the migration was not applied and database-backed flows were not end-to-end tested.
- Start the intended development database, verify `DATABASE_URL` in the existing local `.env` without exposing it, then run `npx prisma migrate dev --name add_report_contact_verification`.
- Do not run a database reset or point migrations at production without explicit review.
- After migration, test registration/login persistence, report creation/listing/admin review, contact submission/thank-you redirect, landlord-tenant report ownership, and fallback behavior when DB reads fail.

## Validation
- `npm run lint` passed after the TypeScript changes.
- Prisma schema validation and client generation passed.
- Production build was attempted, but its final completion output was not captured; rerun `npm run build` and record the result.
- Browser checks confirmed public routes, mobile sticky CTA, and login/register tab selection. The signup/login tab interaction passed in both directions. Recheck the country flag after restarting the server for the updated CSP.

## Useful Commands
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm exec -- prisma validate`
- `npm exec -- prisma generate`
- `npx prisma migrate dev --name add_report_contact_verification`
