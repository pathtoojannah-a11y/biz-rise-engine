# NexaOS Master Combined Playbook

## 1) Positioning Direction

- Primary market surface now: contractor-first
- Active vertical page: HVAC
- Signals in nav: Plumbing and Electrical marked Coming Soon
- Core hero line lock:
  - `Turn missed calls into booked jobs automatically.`

## 2) Messaging Rules

- Use office + dispatch language
- Describe mechanism plainly:
  - missed call -> instant text follow-up -> qualification -> ready-to-book dispatch card
- Avoid vague language and avoid unverified performance claims
- Keep two CTA intents only:
  - Primary: `/demo`
  - Secondary: `/signup`

## 3) Homepage Conversion Spine

1. Hero with email capture and free-trial CTA
2. Guided demo fallback link
3. Product-in-use workflow panel
4. Proof/integration strip
5. 3-step process
6. Operational outcomes block
7. Old way vs NexaOS comparison
8. Pricing snapshot
9. FAQ
10. Final CTA

## 4) IA and Navigation

Top-level nav:
- Product
- Pricing
- Industries
- ROI
- Trust
- Log In
- Book Demo

Industries behavior:
- HVAC: link live
- Plumbing: visible, non-clickable, Coming Soon
- Electrical: visible, non-clickable, Coming Soon

## 5) UX/Visual System Rules

- Contractor-simple design:
  - clean, high contrast, low visual noise
  - larger touch targets and short copy blocks
- Use real workflow visuals over abstract art
- Max two CTAs per section
- Motion:
  - subtle opacity/transform only
  - respect `prefers-reduced-motion`

## 6) Performance and Quality Rules

- Route-level lazy loading for marketing pages
- Main JS target: `< 500 KB`
- Accessibility:
  - keyboard-usable nav/dropdowns
  - proper ARIA (`aria-expanded`, `aria-controls`, `aria-haspopup`)
  - visible focus states

## 7) Build/QA Checklist

- Hero lock line exact match
- No conflicting multi-industry framing on homepage
- Contractor terminology consistent across homepage/product/demo
- CTA semantics consistent (`/demo`, `/signup`)
- `npm run build` passes
- `npm run test` passes
- Main bundle remains under budget

## 8) Source References Used For This Bundle

- `source-docs/nexa_os_build_ready_spec_v2.md.resolved`
- `source-docs/saas_deep_teardown.md.resolved`
- `evidence/*.md` (12-site research evidence notes)

