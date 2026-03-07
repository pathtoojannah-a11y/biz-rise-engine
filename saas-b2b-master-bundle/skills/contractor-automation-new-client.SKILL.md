---
name: contractor-automation-new-client
description: "Create and deploy a new client instance of the Contractor Automation System (Next.js + Prisma + Twilio). Use when onboarding a new contractor client: copying/cloning the template, configuring `.env`, resetting/migrating the database, deploying, and setting up Twilio webhooks + cron."
---

# Contractor Automation: New Client Setup

Follow this workflow to spin up a clean client instance from the `contractor-automation/` template, configure integrations, and verify production readiness.

## Workflow (in order)

### 0) Gather client inputs

Collect:
- Business name, phone, email, city, address
- Services list (comma-separated) and (optional) per-service descriptions
- Years in business
- Portfolio link (optional)
- Google review link
- Owner notification email
- Admin dashboard password
- Twilio: account SID, auth token, sending phone number (E.164)
- SMTP: host, port, user, app password
- Production domain/URL (for `NEXT_PUBLIC_BASE_URL`)

### 1) Create a clean client project folder

Prefer Git clone if available; otherwise copy the template.

PowerShell copy option (avoid copying build artifacts and secrets):
- Copy `contractor-automation/` to a new client folder
- Exclude `node_modules/`, `.next/`, `.env`, and `prisma/dev.db*` to avoid stale data and secrets

Then:
- Run `npm install` in the new client folder

### 2) Configure environment (`.env`)

Use the repo’s template file name:
- Copy `env.example` -> `.env` (note: this repo uses `env.example`, not `.env.example`)

Fill in `.env`:
- Client branding/content: `NEXT_PUBLIC_*` variables
- Owner notification: `OWNER_EMAIL`
- Admin access: `ADMIN_PASSWORD`
- SMS: `TWILIO_*`
- Email: `SMTP_*`
- Cron auth: `CRON_SECRET`
- Production URL: set `NEXT_PUBLIC_BASE_URL="https://<client-domain>"` so survey links don’t default to localhost

Note:
- If Twilio or SMTP values are missing, the app will simulate SMS/email by logging to the server console.

### 3) Initialize the database (Prisma + SQLite)

Create a clean DB for each client:
- Ensure `prisma/dev.db` is not copied from another client
- If unsure, delete `prisma/dev.db` and `prisma/dev.db-journal`

Run:
- `npx prisma migrate deploy`
- `npx prisma generate`

### 4) Verify locally

Run:
- `npm run dev`

Check:
- Public pages load and reflect the `.env` values
- Contact form submits and creates a lead
- Admin login works at `/admin/login` with `ADMIN_PASSWORD`
- If Twilio/SMTP are not configured, confirm the "SIMULATED" logs appear for SMS/email events

### 5) Deploy

Deploy to the chosen host (Vercel or a Node host) and set all `.env` values in the host’s environment settings.

Verify production build:
- `npm run build`
- `npm start`

### 6) Configure Twilio webhooks (production)

Set Twilio to `POST` to:
- SMS webhook: `https://<domain>/api/webhooks/twilio/sms`
- Voice status callback: `https://<domain>/api/webhooks/twilio/voice`

Signature validation:
- In `NODE_ENV=production`, requests are validated via `x-twilio-signature`
- Ensure the Twilio Console webhook URL exactly matches the deployed endpoint URL (scheme/host/path/trailing slash)

### 7) Set up cron to process scheduled jobs

Schedule the job runner to call every minute:
- URL: `GET https://<domain>/api/cron/process-jobs`
- Header: `Authorization: Bearer <CRON_SECRET>`

### 8) Produce a final "Client Setup Summary"

At the end, output a concise handoff summary containing:
- Deployed URL
- Admin URL (`/admin/login`) and password delivery note (do not paste secrets into chat logs)
- Twilio webhook URLs
- Cron URL and required auth header format (redact `CRON_SECRET`)
- Any remaining TODOs (DNS, domain verification, Twilio number purchase, etc.)

## Common issues to check first

- Cron returns `401`: missing/incorrect `Authorization: Bearer <CRON_SECRET>`
- Survey links point to `localhost`: `NEXT_PUBLIC_BASE_URL` not set
- SMS/email show "SIMULATED": missing Twilio/SMTP env vars
- Twilio signature invalid: webhook URL mismatch or wrong `TWILIO_AUTH_TOKEN`
