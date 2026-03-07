# Implementation Decisions and Status (2026-03-05)

## Implemented Direction

- Research-first artifacts were completed (Notion/Figma + local evidence)
- Marketing redesign executed with contractor-simple emphasis
- Contractor-only positioning pass executed (HVAC-first)
- Hero lock line implemented on homepage

## Frontend Decisions Locked

1. CTA route semantics:
   - Primary CTA: `/demo`
   - Secondary CTA: `/signup`
2. Industries:
   - HVAC live
   - Plumbing/Electrical shown as Coming Soon
3. Hero messaging:
   - Exact headline lock
   - Subhead explains office workflow in plain language
4. Accessibility:
   - Dropdowns click + keyboard + escape
   - ARIA state wiring improved
5. Motion:
   - Subtle demo-thread animation only
   - Reduced-motion compliance retained

## Validation Snapshot

- `npm run build`: pass
- `npm run test`: pass
- Main JS chunk: `498.61 kB` (within `<500 kB` target)

## Relevant Edited Paths

- `src/pages/Index.tsx`
- `src/pages/Marketing.css`
- `src/components/marketing/GlobalNavbar.tsx`
- `src/pages/DemoBooking.tsx`
- `src/pages/Marketing/ProductLeadRecovery.tsx`
- `src/pages/Marketing/ProductPipeline.tsx`
- `src/pages/Marketing/ProductReputation.tsx`

## Deferred

- Non-contractor vertical expansion copy (spa/barber/restaurant) intentionally deferred
- Backend Twilio onboarding implementation deferred (blueprint documented separately)

