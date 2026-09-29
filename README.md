# Taimoor portfolio — independent deployment

Portable Next.js application for Vercel, Supabase Postgres/Auth/Storage and Resend. No ChatGPT subscription is required to run this source on your own hosting accounts.

## Current status

Source migration is prepared. No remote Supabase schema, Vercel deployment, or Resend domain has been configured by this package. The original Sites deployment is separate and remains unchanged. Initial résumé, projects and CV are bundled. Existing live CMS changes, messages and uploaded files have NOT been exported from Sites; preserve and migrate those before switching URLs.

## 1. Supabase

Use a dedicated project where possible. In its SQL editor run `supabase/migrations/001_portfolio.sql`, then `supabase/002_seed.sql`. The first script is one-time setup, not an idempotent migration. It creates only portfolio-prefixed tables and a private `portfolio-files` bucket.

In Authentication, create a confirmed email/password user for the owner. Disable public signup. Authorize that user with:

```sql
insert into public.portfolio_admins(user_id)
select id from auth.users where email = 'taimooraliwaris13@gmail.com'
on conflict do nothing;
```

Check the user exists and the insert succeeded. Login at `/admin/login`. There is no public registration page. Admin access is enforced in server routes and database row-level security. Use Supabase dashboard for password resets until a verified Auth SMTP provider is configured.

## 2. Environment

Copy `.env.example` to `.env.local` for local development. Add the same variables securely in Vercel project settings for Production (and Preview only if needed):

- NEXT_PUBLIC_SUPABASE_URL: project API URL.
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: public publishable key.
- SUPABASE_SECRET_KEY: server-only secret key (legacy service_role also supported). Never prefix it NEXT_PUBLIC_.
- SITE_URL: exact deployed HTTPS origin, without a trailing slash.
- RATE_LIMIT_SECRET: random secret; generate with `openssl rand -hex 32`.
- RESEND_API_KEY: sending key, ideally restricted to the verified sending domain.
- RESEND_FROM_EMAIL: sender on that verified domain.
- CONTACT_TO_EMAIL: owner's destination inbox.

Do not commit credentials or paste them into public issues/chat. Redeploy after environment changes. This server assumes Vercel's trusted forwarded-IP header; other hosts must strip spoofed forwarding headers and provide a trusted x-real-ip value.

## 3. Resend

Add a domain you own in Resend and publish its requested DNS records. Wait for verification. Set sender and API key above. No domain is currently configured in the connected account. No test email has been sent.

Contact submissions are stored before an email notification is attempted. A provider failure does not discard a stored message. Admin inbox displays notification status and allows retry. The API's `sent` status means provider accepted the message, not guaranteed inbox delivery. Retry uses an idempotency key; retries outside Resend's retention window can resend a notification. Free plans have quotas and require checking current pricing.

## 4. Deploy to Vercel

Use Node 22+, enable Corepack, then:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm typecheck
pnpm build
```

Push this folder to your own private Git repository, import it in Vercel as Next.js, and set environment values before production deployment. `vercel.json` includes the build settings. Vercel Hobby is limited to qualifying personal/non-commercial usage; check eligibility if the site promotes commercial services. No separate server is required: Next.js API routes run as serverless functions.

For other Node hosts: run the same build and `pnpm start`, set the environment, and configure HTTPS/reverse proxy. The application is not a static export because admin, contact and storage authorization need server execution.

## Availability and verification

Free hosting does not guarantee uninterrupted uptime. Supabase Free can pause inactive projects. On database errors the public homepage falls back to the bundled initial content and the CV route falls back to the bundled PDF. This snapshot will not include subsequent admin edits. Contact submission and admin require a healthy Supabase project; direct email/phone/WhatsApp links remain useful fallback contact methods.

Before cutover, verify admin/non-admin permissions, unpublished projects and private files, a real contact submission and email receipt, notification retry, CV upload/view/download, mobile dock, and iframe/external project previews. Uploaded files are limited to 4 MB. Some third-party live projects block embedding and must use the external-tab link.

Source includes SQL grants/RLS, atomic contact rate limiting (five messages per IP per hour), honeypot and input checks. End-to-end checks require an actual configured project. Run Supabase security advisors after applying the schema. Retain backups/export data according to the provider plan.

Official references: https://supabase.com/docs/guides/platform/free-project-pausing · https://vercel.com/docs/plans/hobby · https://resend.com/pricing
