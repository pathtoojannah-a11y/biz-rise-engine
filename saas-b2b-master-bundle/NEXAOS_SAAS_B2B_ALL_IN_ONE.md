# NexaOS SaaS B2B All-In-One

This is the single merged reference for the SaaS/B2B strategy work.

## A) Core Positioning

- Current go-to-market surface: contractor-first
- Live industry page: HVAC
- Expansion signal only: Plumbing and Electrical (Coming Soon)
- Hero lock:
  - `Turn missed calls into booked jobs automatically.`

## B) Value Mechanism (Homepage Truth)

Missed call -> instant text follow-up -> qualification prompts -> ready-to-book dispatch card.

## C) CTA Contract

- Primary CTA: `/demo`
- Secondary CTA: `/signup`
- Keep route semantics consistent across homepage/nav/pricing/footer.

## D) Information Architecture

Primary routes:
- `/`
- `/pricing`
- `/demo`
- `/trust`
- `/industry/hvac`
- `/product/*`
- `/resources/roi-calculator`

## E) Elite SaaS Research Framework

- Site set: 10-15 with required anchors (Stripe, Linear, Vercel)
- Evidence requirements per site:
  - URL + timestamp
  - desktop screenshot
  - mobile screenshot
  - pricing evidence
  - CTA/proof/nav/layout observations
  - inspect-element findings
- Weighted rubric categories:
  - Clarity, Trust, CTA Architecture, Proof Quality, Pricing, Motion, Layout, Performance
- Output contract:
  - A-I sections including Truth Check and hard Pass/Fail QA gate.

## F) Implementation Quality Rules

- Accessibility:
  - keyboard nav and escape for menus
  - proper ARIA state attributes
  - visible focus states
- Motion:
  - subtle transform/opacity only
  - reduced-motion fallback
- Performance:
  - route-level code splitting
  - target main JS under 500 KB

## G) Current Status Snapshot

- Frontend contractor-simple redesign pass completed
- Contractor-only copy lock pass completed
- Build/test status:
  - `npm run build`: pass
  - `npm run test`: pass
  - main chunk: `498.61 kB`

## H) Twilio Easy Setup Blueprint (Planned)

Recommended onboarding model:
1. NexaOS provisions Twilio subaccount + number
2. Customer forwards missed calls from current line
3. NexaOS runs SMS + qualification + dispatch handoff automatically

Proposed endpoints:
- `POST /api/onboarding/twilio/provision`
- `POST /api/onboarding/twilio/test`
- `POST /webhooks/twilio/voice`
- `POST /webhooks/twilio/sms`
- `POST /webhooks/twilio/status`

## I) Bundle File Map

- `00_README.md`
- `01_ELITE_SAAS_WEBSITE_RESEARCH_SKILL.md`
- `02_MASTER_COMBINED_PLAYBOOK.md`
- `03_IMPLEMENTATION_DECISIONS_AND_STATUS.md`
- `04_TWILIO_EASY_SETUP_BACKEND_BLUEPRINT.md`
- `05_SKILLS_CATALOG_FROM_SESSION.md`
- `source-docs/nexa_os_build_ready_spec_v2.md.resolved`
- `source-docs/saas_deep_teardown.md.resolved`
- `evidence/*.md` (12 files)
- `skills/*.SKILL.md`

