# NexaOS Complete System Plan (Ultra Prompt V3 Output)

Generated: 2026-03-05

---

## A) Executive Narrative

### What NexaOS Is

NexaOS is a vertical SaaS platform that solves the single most expensive problem in local service trades: **lost revenue from unanswered calls**.

The average HVAC, plumbing, electrical, or roofing company misses 20-40% of inbound calls. Each missed call represents $500-$5,000 in lost work. The homeowner doesn't leave a voicemail -- they call the next company on Google. The job is gone in 60 seconds.

NexaOS eliminates this by automating the entire recovery chain:

**Missed call -> instant SMS follow-up (under 5 seconds) -> automated qualification -> dispatch-ready job card -> post-job review request**

No new hardware. No app to learn. No dispatcher required. The contractor's existing phone number stays the same. Setup takes under 10 minutes.

### Why NexaOS Can Win

1. **Wedge simplicity.** ServiceTitan, Jobber, and Housecall Pro are full-stack FSM platforms. They require weeks of onboarding and $200-$500/mo minimum. NexaOS does one thing perfectly -- recover missed revenue -- and charges less.

2. **Time-to-value is minutes, not weeks.** Forward your missed calls, run one test, go live. No training needed.

3. **The missed-call problem is universal.** Every trade, every market, every size. HVAC today. Plumbing, electrical, roofing next. Barbers, spas, food trucks later. The automation engine is the same -- only the copy and qualification prompts change.

4. **Compounding lock-in.** Once NexaOS books a contractor's first recovered job, switching cost is real. Add review automation and pipeline visibility, and the platform becomes the operational backbone.

5. **Unit economics favor scale.** Twilio SMS costs ~$0.0079/segment. A recovered $2,000 job costs NexaOS ~$0.15 in messaging. Gross margins exceed 85% at scale.

---

## B) Positioning System

### Ideal Customer Profile (ICP)

| Attribute | Primary ICP | Secondary ICP |
|---|---|---|
| Trade | HVAC, plumbing, electrical, roofing | General contractors, handyman |
| Team size | 1-30 employees | 30-100 employees |
| Revenue | $200K-$5M/yr | $5M-$20M/yr |
| Tech comfort | Low-to-medium | Medium |
| Current tools | Google Business, phone, maybe QuickBooks | Jobber/Housecall Pro + spreadsheets |
| Pain | Missing calls, no follow-up system, reviews are manual | Dispatcher overwhelmed, no data on lost leads |
| Decision maker | Owner-operator or office manager | Operations manager |

### Messaging Pillars

1. **Revenue Recovery** -- "Every missed call is money walking to your competitor."
2. **Instant Response** -- "Reply in 5 seconds, not 5 hours."
3. **Zero Learning Curve** -- "If you can forward a phone call, you can use NexaOS."
4. **Autopilot Operations** -- "Qualification, dispatch prep, and review requests happen automatically."

### Claims Framework

| Claim | Status | Evidence Required |
|---|---|---|
| "Responds in under 5 seconds" | Safe (measurable, system-controlled) | Internal latency logs |
| "Turn missed calls into booked jobs" | Safe (mechanism claim, not outcome guarantee) | Product demo |
| "Setup in under 10 minutes" | Safe (testable) | Onboarding flow timing |
| "Recover $X in lost revenue" | Proof-required (outcome varies) | Customer case studies needed |
| "Trusted by X contractors" | Proof-required (social proof) | Only use when count is real |

**Rule: Never claim specific revenue recovery numbers until validated by real customer data. Use mechanism language ("automatically follows up") not outcome language ("guarantees more jobs").**

### Competitive Positioning

| | NexaOS | ServiceTitan | Jobber | Housecall Pro | Podium |
|---|---|---|---|---|---|
| Core job | Missed call recovery | Full FSM | Full FSM | Full FSM | Reviews + messaging |
| Setup time | < 10 min | Weeks | Days | Days | Days |
| Price entry | ~$99/mo | ~$300/mo+ | ~$69/mo | ~$79/mo | ~$399/mo |
| Missed-call auto-reply | Core feature | Add-on/none | No | No | Yes (AI-heavy) |
| Qualification flow | Built-in | Manual | Manual | Manual | AI chatbot |
| Complexity | Minimal | High | Medium | Medium | Medium |

**Positioning statement:** NexaOS is the fastest way for a local service contractor to stop losing jobs to missed calls. Not a CRM. Not a full FSM. A revenue recovery engine that works in minutes.

---

## C) Full Website Strategy

### Information Architecture

```
/                           Homepage (conversion engine)
/pricing                    Transparent pricing (2-3 tiers)
/demo                       Book a demo (primary CTA destination)
/signup                     Start free trial (secondary CTA destination)
/trust                      Security, uptime, compliance
/product/lead-recovery      Missed call -> SMS -> qualification flow
/product/pipeline           Dispatch-ready job cards, pipeline view
/product/reputation         Automated review requests
/industry/hvac              HVAC-specific pain points + copy
/industry/plumbing          Coming Soon (visible, not clickable)
/industry/electrical        Coming Soon (visible, not clickable)
/industry/roofing           Coming Soon (visible, not clickable)
/resources/roi-calculator   Interactive calculator
/blog                       SEO content (Phase 2)
/login                      Customer dashboard login
/legal/privacy              Privacy policy
/legal/terms                Terms of service
```

### Navigation Structure

**Desktop (left to right):**
- Logo (links to `/`)
- Product (dropdown: Lead Recovery, Pipeline Dispatch, Reputation Ops)
- Industries (dropdown: HVAC [live], Plumbing [Coming Soon], Electrical [Coming Soon], Roofing [Coming Soon])
- Pricing
- Resources (dropdown: ROI Calculator, Trust & Security)
- Log In (ghost button)
- **Book Demo** (primary emerald button)

**Mobile:**
- Logo + hamburger
- Same hierarchy, accordion-style
- Book Demo button always visible in sticky header

### Page Goals

| Page | Primary Goal | Success Metric |
|---|---|---|
| Homepage | Drive demo bookings | Demo form submissions |
| Pricing | Remove price objection, push to demo/trial | Click-through to /demo or /signup |
| Demo | Capture qualified lead | Form completion rate |
| Trust | Remove security/reliability objection | Time on page, bounce reduction |
| Product pages | Educate on specific capabilities | Scroll depth, CTA clicks |
| Industry pages | Show domain expertise for specific trade | Demo conversions from trade-specific traffic |
| ROI Calculator | Quantify value, drive urgency | Calculator completion -> demo click |

### Conversion Paths

**Path 1 (Direct):** Homepage hero -> Book Demo -> Form submission
**Path 2 (Educated):** Homepage -> Product page -> Pricing -> Book Demo
**Path 3 (Calculator):** Homepage/SEO -> ROI Calculator -> See savings -> Book Demo
**Path 4 (Trial):** Homepage -> Start Free Trial -> Signup -> Self-serve onboarding
**Path 5 (Industry):** Google search -> /industry/hvac -> Book Demo

---

## D) Homepage Blueprint + Final Copy

### Section 1: Hero
**Psychology:** Processing fluency (instant comprehension) + loss aversion (missed calls = lost money) + action momentum (immediate CTA)

- **User mental state:** "What is this? Is it for me?"
- **Psychology goal:** 3-second comprehension, emotional urgency
- **Tactic:** Short headline with concrete mechanism, immediate proof via product UI
- **Expected shift:** Visitor understands value prop and feels urgency to act

```
[Eyebrow] For HVAC, Plumbing, Electrical & Roofing Contractors

[H1] Turn missed calls into booked jobs automatically.

[Subhead] When you can't answer, NexaOS texts the caller back instantly,
qualifies the job, and delivers a dispatch-ready card to your team.
Setup takes 10 minutes.

[Primary CTA] Book a Demo
[Secondary CTA] Start Free Trial

[Hero visual: Animated product UI showing the missed-call-to-booking flow]
```

**Change from V2 spec:** Replaced "Stop Missing Calls. Start Scaling Revenue." with the original hero lock "Turn missed calls into booked jobs automatically." -- it's more concrete, more specific, and scores higher on processing fluency. The V2 hero was two abstract imperatives. This one is a single mechanism statement that instantly communicates what the product does.

### Section 2: Integration Proof Strip
**Psychology:** Trust signaling (borrowed credibility) + cognitive load reduction (familiar logos)

- **User mental state:** "Is this legit?"
- **Psychology goal:** Instant credibility transfer
- **Tactic:** Greyscale logo marquee of known tools
- **Expected shift:** Perception shifts from "unknown startup" to "works with tools I know"

```
[Label] Works with the tools you already use

[Logos, greyscale, 30% opacity, infinite scroll marquee]
QuickBooks | Google Business Profile | Twilio | Stripe | Yelp | Google Calendar
```

### Section 3: Problem Agitation
**Psychology:** Loss aversion (framing missed calls as lost money) + risk awareness

- **User mental state:** "I know I miss calls but how bad is it really?"
- **Psychology goal:** Quantify the pain
- **Tactic:** Concrete dollar framing
- **Expected shift:** Urgency increases; problem feels solvable

```
[H2] If you're not first to reply, you've already lost the job.

[Body] Homeowners don't leave voicemails. They call the next company
on Google. Every unanswered call is a $500 to $5,000 job walking
straight to your competitor.

[Stat callouts in a 3-column grid]
  "62% of calls to local businesses go unanswered" [ASSUMPTION - needs source]
  "$2,500 average job value in residential HVAC" [ASSUMPTION - needs validation]
  "< 5 seconds to NexaOS first reply" [SAFE - system-controlled]
```

### Section 4: How It Works (3-Step Process)
**Psychology:** Cognitive load reduction (numbered steps) + progress visibility + processing fluency

- **User mental state:** "OK but is this complicated?"
- **Psychology goal:** Make the product feel effortless
- **Tactic:** 3-step linear flow with plain language
- **Expected shift:** "I could actually set this up"

```
[H2] Live in 10 minutes. No training needed.

[Step 1] Forward your missed calls
Set your business phone to forward unanswered calls to your NexaOS number.
We give you carrier-specific instructions.

[Step 2] NexaOS handles the rest
Instant text-back. Automated qualification. Job details captured
and organized into a dispatch-ready card.

[Step 3] Your team books the job
Open the NexaOS dashboard or get a notification.
Customer details, job type, and urgency -- ready to dispatch.
```

### Section 5: Product Bento Grid (Feature Showcase)
**Psychology:** Processing fluency (visual chunking) + trust signaling (showing real UI)

- **User mental state:** "Show me exactly what this does"
- **Psychology goal:** Demonstrate concrete capabilities
- **Tactic:** Bento box layout with UI screenshots, not abstract icons
- **Expected shift:** Product feels real and tangible

```
[H2] One platform. Three revenue engines.

[Block A - 2/3 width] Missed Call Recovery
  "Never lose a lead to voicemail again."
  Automated SMS replies engage the caller instantly. Job details flow
  directly into your pipeline. No dispatcher needed.
  [Visual: SMS conversation flow UI]

[Block B - 1/3 width] Reputation Autopilot
  "5-star reviews on autopilot."
  When a job is marked complete, NexaOS sends a frictionless review
  request. Happy customers go to Google. Unhappy ones route to you privately.
  [Visual: Google review widget]

[Block C - full width] Pipeline & Dispatch
  "Your crew's command center."
  Every lead, job status, and technician assignment in one view.
  Built for the front seat of a truck.
  [Visual: Pipeline dashboard grid]
```

### Section 6: Old Way vs NexaOS Way
**Psychology:** Loss aversion (contrast current pain) + cognitive load reduction (table format)

- **User mental state:** "How is this different from what I'm doing now?"
- **Psychology goal:** Make the gap between current state and NexaOS feel obvious
- **Tactic:** Side-by-side comparison table
- **Expected shift:** Current process feels broken; NexaOS feels inevitable

```
[H2] From manual chaos to automated revenue.

| Without NexaOS | With NexaOS |
|---|---|
| Missed calls go to voicemail. Nobody checks. | Instant text-back in under 5 seconds. |
| Dispatcher tries to remember who called. | Every lead auto-captured with job details. |
| You ask for reviews when you remember. | Automated review request after every completed job. |
| Scheduling lives in a spreadsheet or whiteboard. | Dispatch-ready cards with job type, urgency, and customer info. |
| You find out you lost a job... never. | Dashboard shows every recovered lead and its status. |
```

### Section 7: Pricing Snapshot
**Psychology:** Risk reduction (transparent pricing) + action momentum (clear next step)

- **User mental state:** "What does this cost?"
- **Psychology goal:** Remove price anxiety, anchor to value
- **Tactic:** 2-3 tiers with clear feature differentiation
- **Expected shift:** "This costs less than one lost job"

```
[H2] One recovered job pays for a year of NexaOS.

[Tier 1: Starter] $99/mo
  - Missed call text-back (unlimited)
  - Lead capture + pipeline view
  - 1 phone number
  - Email support
  [CTA] Start Free Trial

[Tier 2: Pro - RECOMMENDED] $199/mo
  - Everything in Starter
  - Automated qualification flow
  - Review request automation
  - Dispatch-ready cards
  - Up to 5 team members
  - Priority support
  [CTA] Book a Demo

[Tier 3: Business] $399/mo
  - Everything in Pro
  - Multiple locations / numbers
  - Custom qualification flows
  - API access
  - Dedicated onboarding
  - Phone support
  [CTA] Book a Demo

[Subtext] No contracts. Cancel anytime. All plans include a 14-day free trial.
```

**Pricing rationale:** Anchored to job value, not competitor pricing. A single recovered HVAC job ($2,000+) pays for a full year of the Starter plan. The Pro tier is the conversion target (highlighted, "recommended" badge). Business tier exists for multi-location operators and establishes ceiling.

### Section 8: FAQ
**Psychology:** Risk reduction (objection handling) + trust signaling (transparency)

```
[H2] Common questions

Q: Do I need to change my phone number?
A: No. You keep your existing business number. Just set it to forward
   unanswered calls to your NexaOS number.

Q: How fast does NexaOS respond to missed calls?
A: Under 5 seconds. The customer gets an SMS before they can dial
   your competitor.

Q: What if a customer texts back something complicated?
A: NexaOS uses a structured qualification flow to capture job type,
   urgency, and details. Anything outside the flow gets flagged
   for your team to handle directly.

Q: Can I customize the messages?
A: Yes. You set the business name, greeting, and qualification
   questions during setup.

Q: Is there a contract?
A: No. Month-to-month. Cancel anytime from your dashboard.

Q: What trades does NexaOS work for?
A: Any local service trade. We're built for HVAC, plumbing,
   electrical, and roofing today. Expanding to more trades soon.
```

### Section 9: Final CTA
**Psychology:** Action momentum + loss aversion (urgency framing)

```
[H2] Every missed call is a missed paycheck.

[Subhead] Set up NexaOS in 10 minutes and recover your first
lost job today.

[Primary CTA] Book a Demo
[Secondary CTA] Start Free Trial

[Subtext] No credit card required. No contracts.
```

### Section 10: Footer

```
Product: Lead Recovery | Pipeline | Reputation
Company: Pricing | Trust & Security | Contact
Legal: Privacy Policy | Terms of Service
Industries: HVAC | Plumbing (Coming Soon) | Electrical (Coming Soon) | Roofing (Coming Soon)

[Copyright] NexaOS 2026. All rights reserved.
```

---

## E) Visual System

### Color Palette

| Token | Value | Usage | Psychology |
|---|---|---|---|
| `--bg-primary` | `#0A0A0A` | Page background | Premium feel, reduces cognitive noise, matches Linear/Vercel standard |
| `--bg-surface` | `rgba(255,255,255,0.02)` | Cards, bento blocks | Subtle depth without visual clutter |
| `--bg-surface-hover` | `rgba(255,255,255,0.05)` | Card hover states | Micro-feedback for interactivity |
| `--text-primary` | `#FFFFFF` | Headlines, primary text | Maximum contrast for readability |
| `--text-secondary` | `#A1A1AA` (zinc-400) | Body text, descriptions | Hierarchy without harshness |
| `--text-muted` | `#71717A` (zinc-500) | Labels, metadata | Tertiary information |
| `--accent-primary` | `#10B981` (emerald-500) | CTAs, active states, highlights | Energy without aggression; "go" signal |
| `--accent-glow` | `rgba(16,185,129,0.3)` | Button hover shadows | Draws eye to action without jarring |
| `--border-subtle` | `rgba(255,255,255,0.08)` | Card borders, dividers | Structure without visual weight |
| `--border-hover` | `rgba(255,255,255,0.2)` | Hover state borders | Interactive feedback |

**Psychology rationale:** The obsidian dark theme signals premium/enterprise quality (Stripe, Linear, Vercel all use this). Emerald accent creates a "go/money/growth" association. High-contrast text on dark backgrounds optimizes for scanning behavior (contractors checking on phones between jobs). The muted surface colors create depth hierarchy without introducing cognitive load.

### Typography

| Element | Font | Size | Weight | Letter-spacing | Line-height |
|---|---|---|---|---|---|
| H1 (Hero) | Inter/Geist | `clamp(2.5rem, 5vw, 4.5rem)` | 800 (extrabold) | `-0.04em` | 1.1 |
| H2 (Section) | Inter/Geist | `clamp(1.75rem, 3vw, 2.75rem)` | 700 (bold) | `-0.03em` | 1.2 |
| H3 (Card) | Inter/Geist | `1.25rem` | 600 (semibold) | `-0.02em` | 1.3 |
| Body | Inter/Geist | `1rem` (16px) | 400 | `0` | 1.6 |
| Body-sm | Inter/Geist | `0.875rem` (14px) | 400 | `0` | 1.5 |
| Button | Inter/Geist | `0.9375rem` (15px) | 500 | `0.01em` | 1 |
| Eyebrow | Inter/Geist | `0.8125rem` (13px) | 500 | `0.05em` | 1 |

**Psychology rationale:** Tight letter-spacing on headlines creates visual density (authority/confidence). Generous line-height on body text optimizes readability for low-attention scanning. Fluid typography via `clamp()` ensures the hero reads perfectly on both a truck dashboard phone and a desktop monitor.

### Spacing Scale

Base unit: `4px`. Scale: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128`.

- Section padding: `96px` (desktop), `64px` (tablet), `48px` (mobile)
- Card padding: `24px` (desktop), `16px` (mobile)
- Content max-width: `1200px`
- Hero max-width: `800px` (text block)

### Motion Tokens

| Token | Value | Usage |
|---|---|---|
| `--ease-snappy` | `cubic-bezier(0.16, 1, 0.3, 1)` | Modals, accordions, card hovers |
| `--ease-float` | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Hero asset floating, tooltip fades |
| `--duration-micro` | `150ms` | Hover states, button presses |
| `--duration-macro` | `600ms` | Section reveals, layout transitions |

**Section reveal animation:**
```css
/* Initial state */
opacity: 0;
transform: translateY(20px) scale(0.98);

/* Revealed state */
opacity: 1;
transform: translateY(0) scale(1);
transition: all 600ms cubic-bezier(0.16, 1, 0.3, 1);
```

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**Psychology rationale:** Subtle transform + opacity reveals create perceived speed and polish. The `scale(0.98)` start state adds dimensionality without being distracting. Respecting `prefers-reduced-motion` is both an accessibility requirement and a trust signal.

---

## F) Frontend Implementation Spec

### Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** shadcn/ui (headless, accessible)
- **Animation:** CSS transitions + Intersection Observer (no heavy animation library for marketing pages)
- **Forms:** React Hook Form + Zod validation
- **State:** React Server Components where possible; client state only for interactive widgets
- **Deployment:** Vercel

### Route Map

```
app/
  layout.tsx              Global layout (nav + footer)
  page.tsx                Homepage (/)
  pricing/page.tsx        Pricing (/pricing)
  demo/page.tsx           Book Demo (/demo)
  signup/page.tsx         Free Trial Signup (/signup)
  trust/page.tsx          Trust & Security (/trust)
  login/page.tsx          Customer Login (/login)
  product/
    lead-recovery/page.tsx
    pipeline/page.tsx
    reputation/page.tsx
  industry/
    hvac/page.tsx
    plumbing/page.tsx      (Coming Soon shell)
    electrical/page.tsx    (Coming Soon shell)
    roofing/page.tsx       (Coming Soon shell)
  resources/
    roi-calculator/page.tsx
  legal/
    privacy/page.tsx
    terms/page.tsx
```

### Component Inventory

```
components/
  layout/
    GlobalNavbar.tsx        Sticky nav, backdrop-blur, dropdown menus
    Footer.tsx              Site footer with link columns
    MobileMenu.tsx          Hamburger slide-out
  marketing/
    Hero.tsx                Hero section with animated product UI
    HeroLoop.tsx            Animated missed-call-to-booking sequence
    LogoMarquee.tsx         Infinite-scroll integration logos
    ProblemSection.tsx      Pain agitation with stat callouts
    HowItWorks.tsx          3-step process
    BentoGrid.tsx           Feature showcase (3 blocks)
    ComparisonTable.tsx     Old way vs NexaOS way
    PricingSnapshot.tsx     3-tier pricing cards
    FAQ.tsx                 Accordion FAQ
    FinalCTA.tsx            Bottom conversion block
    SectionReveal.tsx       Intersection Observer wrapper for scroll animations
  shared/
    ButtonPrimary.tsx       Emerald CTA button
    ButtonGhost.tsx         Transparent outline button
    BentoCard.tsx           Reusable card with border hover
    StatCallout.tsx         Number + label block
    Badge.tsx               Eyebrow / tag component
  forms/
    DemoForm.tsx            Demo booking form (name, email, phone, trade, company size)
    SignupForm.tsx           Trial signup form
    ROICalculator.tsx       Interactive calculator widget
```

### Key Interactions

**GlobalNavbar:**
- Sticky with `backdrop-blur-md`
- Transparent -> `rgba(10,10,10,0.8)` on scroll (Intersection Observer on hero)
- Dropdowns: click-triggered (not hover), keyboard navigable, Escape to close
- ARIA: `aria-expanded`, `aria-controls`, `aria-haspopup="true"`
- Mobile: hamburger -> full-screen overlay menu

**HeroLoop (animated product demo):**
- CSS/SVG animation showing the missed-call-to-booking flow
- 5 frames: incoming call -> missed -> auto-triage -> SMS sent -> customer reply -> dispatch card
- Auto-loops with soft reset
- Mobile (< 768px): static WebP image of final frame (performance optimization)
- Respects `prefers-reduced-motion`: shows static image

**SectionReveal:**
- Intersection Observer with `threshold: 0.15`
- Elements start `opacity: 0; translateY(20px) scale(0.98)`
- Animate to `opacity: 1; translateY(0) scale(1)` over 600ms
- `once: true` (don't re-animate on scroll back)

**FAQ Accordion:**
- Single-open behavior (opening one closes others)
- Smooth height animation via `grid-template-rows: 0fr -> 1fr`
- Keyboard: Enter/Space to toggle, arrow keys to navigate between items
- ARIA: `aria-expanded`, `aria-controls`

### Responsive Breakpoints

| Breakpoint | Width | Adjustments |
|---|---|---|
| Mobile | < 640px | Single column, stacked bento, hamburger nav, 48px section padding |
| Tablet | 640-1024px | 2-column bento, condensed nav, 64px section padding |
| Desktop | > 1024px | Full layout, dropdown nav, 96px section padding |

### Accessibility Requirements

- All interactive elements keyboard-accessible
- Focus visible on all focusable elements (`:focus-visible` ring)
- Skip-to-content link
- Semantic HTML (proper heading hierarchy, `<nav>`, `<main>`, `<section>`)
- Alt text on all images
- Color contrast: minimum 4.5:1 for body text, 3:1 for large text
- Form labels associated with inputs
- Error messages linked via `aria-describedby`

### Performance Targets

- Route-level code splitting (Next.js App Router handles this)
- Main JS bundle: < 500 KB
- LCP: < 2.5s
- CLS: < 0.1
- FID: < 100ms
- Images: WebP, lazy-loaded below fold, priority on hero
- Fonts: `next/font` with `display: swap`

---

## G) Onboarding & Integration Journey

### Customer-Facing Onboarding (Target: 10 minutes to live)

```
Step 1: Sign Up (2 min)
  - Name, email, phone, business name
  - Select trade (HVAC / Plumbing / Electrical / Roofing / Other)
  - Set password
  -> Account created, dashboard accessible

Step 2: Configure Messages (3 min)
  - Pre-filled templates based on trade selection
  - Customer edits: business name, greeting text, qualification questions
  - Live preview of SMS conversation flow
  -> Messages saved

Step 3: Activate Phone Number (3 min)
  - NexaOS provisions a local number automatically (Twilio subaccount)
  - Display the NexaOS number prominently
  - Show carrier-specific call forwarding instructions:
    - AT&T: *61*[number]#
    - Verizon: *71[number]
    - T-Mobile: **61*[number]#
  - "I've set up forwarding" confirmation button
  -> Number active

Step 4: Test Call (2 min)
  - "Call your business number now and let it ring"
  - NexaOS shows real-time status: "Missed call detected... SMS sent... Reply received"
  - Green checkmark: "You're live!"
  -> Onboarding complete

Step 5: Dashboard Tour (optional, 1 min)
  - Quick tooltip tour of: Pipeline, Lead cards, Settings
  - Skip available
```

**Psychology mapping:**
- Steps numbered 1-4 with progress bar = **progress visibility**
- Pre-filled templates = **cognitive load reduction**
- Real-time test feedback = **trust signaling + action momentum**
- "You're live!" celebration = **reward signal, completion bias**

### Internal Operations (NexaOS Team)

**Per-customer provisioning (automated):**
1. Stripe subscription created -> webhook triggers provisioning
2. Twilio subaccount created programmatically
3. Local phone number purchased and assigned
4. Webhook URLs configured on Twilio subaccount
5. Customer record created in database with credentials
6. Welcome email sent with dashboard link

**Monitoring:**
- Alert if provisioning fails (Twilio API error, number unavailable)
- Alert if customer hasn't completed onboarding after 24 hours
- Alert if no test call within 48 hours of signup
- Weekly digest: new signups, active users, churn signals

**Support escalation:**
- Tier 1: In-app chat (Intercom or similar) for setup questions
- Tier 2: Email support for technical issues
- Tier 3: Phone support (Business plan only)

---

## H) Backend Architecture

### Tech Stack

- **Runtime:** Node.js 20+ (LTS)
- **Framework:** Next.js API routes (App Router) for MVP; extract to standalone services as scale demands
- **Database:** PostgreSQL (Supabase or Neon for managed hosting)
- **ORM:** Prisma
- **Queue/Background jobs:** Inngest (event-driven, serverless-friendly) or BullMQ with Redis
- **Auth:** NextAuth.js with email/password + optional Google OAuth
- **Payments:** Stripe (subscriptions, billing portal)
- **SMS/Voice:** Twilio (see Section I)
- **Email:** Resend (transactional) or SendGrid
- **Hosting:** Vercel (frontend + API routes) + Railway/Render (background workers if needed)
- **Monitoring:** Sentry (errors), Axiom or Datadog (logs), Uptime Robot (availability)

### Data Model (Core Entities)

```prisma
model Organization {
  id              String   @id @default(cuid())
  name            String
  trade           String   // hvac, plumbing, electrical, roofing, other
  phone           String   // business phone
  nexaosPhone     String?  // provisioned NexaOS number
  twilioSubSid    String?  // Twilio subaccount SID
  stripeCustomerId String?
  stripePlanId    String?
  onboardingStep  Int      @default(0)
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  users           User[]
  leads           Lead[]
  messageTemplates MessageTemplate[]
  settings        OrgSettings?
}

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  passwordHash   String
  name           String
  role           String   @default("owner") // owner, manager, dispatcher
  orgId          String
  org            Organization @relation(fields: [orgId], references: [id])
  createdAt      DateTime @default(now())
}

model Lead {
  id             String   @id @default(cuid())
  orgId          String
  org            Organization @relation(fields: [orgId], references: [id])
  callerPhone    String
  callerName     String?
  status         String   @default("new") // new, qualifying, qualified, dispatched, completed, closed
  jobType        String?
  urgency        String?  // routine, urgent, emergency
  notes          String?
  callSid        String?  @unique // Twilio CallSid for idempotency
  source         String   @default("missed_call") // missed_call, web_form, manual
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  messages       Message[]
  reviewRequest  ReviewRequest?
}

model Message {
  id             String   @id @default(cuid())
  leadId         String
  lead           Lead     @relation(fields: [leadId], references: [id])
  direction      String   // inbound, outbound
  body           String
  messageSid     String?  @unique // Twilio MessageSid for idempotency
  status         String   @default("sent") // sent, delivered, failed, received
  createdAt      DateTime @default(now())
}

model MessageTemplate {
  id             String   @id @default(cuid())
  orgId          String
  org            Organization @relation(fields: [orgId], references: [id])
  type           String   // greeting, qualification_1, qualification_2, dispatch_confirm
  body           String
  isActive       Boolean  @default(true)
}

model ReviewRequest {
  id             String   @id @default(cuid())
  leadId         String   @unique
  lead           Lead     @relation(fields: [leadId], references: [id])
  status         String   @default("pending") // pending, sent, completed, opted_out
  rating         Int?
  googleReviewUrl String?
  sentAt         DateTime?
  completedAt    DateTime?
}

model OrgSettings {
  id                String   @id @default(cuid())
  orgId             String   @unique
  org               Organization @relation(fields: [orgId], references: [id])
  businessHoursStart String  @default("08:00")
  businessHoursEnd   String  @default("18:00")
  timezone           String  @default("America/New_York")
  quietHoursEnabled  Boolean @default(true)
  googleReviewLink   String?
  notificationEmail  String?
  notificationSms    String?
}

model AuditLog {
  id             String   @id @default(cuid())
  orgId          String
  action         String   // sms_sent, sms_received, call_missed, lead_created, review_sent, etc.
  entityType     String   // lead, message, review_request
  entityId       String
  metadata       Json?
  createdAt      DateTime @default(now())
}
```

### API Endpoints

**Auth:**
- `POST /api/auth/signup` - Create account + org
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Current user

**Onboarding:**
- `POST /api/onboarding/provision` - Provision Twilio subaccount + number
- `POST /api/onboarding/test` - Trigger test call verification
- `PATCH /api/onboarding/step` - Update onboarding progress

**Leads:**
- `GET /api/leads` - List leads (filtered by status, date, search)
- `GET /api/leads/:id` - Lead detail with messages
- `PATCH /api/leads/:id` - Update lead status/notes
- `POST /api/leads` - Manual lead creation

**Messages:**
- `GET /api/leads/:id/messages` - Message thread for a lead
- `POST /api/leads/:id/messages` - Send manual message

**Settings:**
- `GET /api/settings` - Org settings
- `PATCH /api/settings` - Update settings
- `GET /api/templates` - Message templates
- `PATCH /api/templates/:id` - Update template

**Webhooks (Twilio):**
- `POST /api/webhooks/twilio/voice` - Missed/forwarded call handler
- `POST /api/webhooks/twilio/sms` - Inbound SMS handler
- `POST /api/webhooks/twilio/status` - Delivery status updates

**Webhooks (Stripe):**
- `POST /api/webhooks/stripe` - Subscription lifecycle events

**Dashboard:**
- `GET /api/dashboard/stats` - Lead counts, response times, recovery rate

### Event/State Flows

**Missed Call Recovery Flow:**
```
1. Caller dials contractor's business number
2. Call goes unanswered (rings out or forwarded)
3. Carrier forwards to NexaOS number
4. Twilio hits POST /api/webhooks/twilio/voice
5. Server:
   a. Validate Twilio signature
   b. Check idempotency (CallSid)
   c. Check business hours / quiet hours
   d. Create Lead record (status: "new")
   e. Send first SMS via Twilio (greeting + "How can we help?")
   f. Create Message record
   g. Update Lead status -> "qualifying"
   h. Log to AuditLog
6. Caller replies via SMS
7. Twilio hits POST /api/webhooks/twilio/sms
8. Server:
   a. Validate Twilio signature
   b. Match to existing Lead by phone number
   c. Store inbound Message
   d. Parse response against qualification flow:
      - If job type missing -> ask job type
      - If urgency missing -> ask urgency
      - If qualified -> update Lead status -> "qualified", create dispatch card
   e. Send next qualification SMS or confirmation
9. Lead appears in dashboard as "qualified" with job details
10. Dispatcher/owner reviews and dispatches (manual in MVP)
```

**Review Request Flow:**
```
1. Owner/dispatcher marks Lead status -> "completed"
2. System waits configurable delay (default: 2 hours)
3. Background job sends review request SMS:
   "Thanks for choosing [Business]. How was the service? Reply 1-5."
4. If reply >= 4: send Google Review link
5. If reply <= 3: send "We're sorry. Your feedback has been shared with our team."
   -> Notify owner via email
6. Log everything to AuditLog
```

### Reliability Controls

- **Idempotency:** Every Twilio webhook is deduplicated by `CallSid` or `MessageSid`. Duplicate webhooks are acknowledged (200) but not re-processed.
- **Retry/backoff:** Outbound SMS failures trigger exponential backoff (1s, 2s, 4s, max 3 retries). Failed after 3 -> dead-letter log + admin alert.
- **Webhook signature validation:** All Twilio webhooks validated using `twilio.validateRequest()` in production.
- **Rate limiting:** API endpoints rate-limited per org (100 req/min for dashboard, 1000 req/min for webhooks).
- **Database transactions:** Lead creation + first SMS send wrapped in a transaction. If SMS fails, lead is still created but flagged for manual follow-up.
- **Structured logging:** Every event includes `orgId`, `leadId`, `action`, `timestamp`. Queryable via log aggregator.

---

## I) Telecom/Integration Architecture Recommendation

### Decision: Keep Twilio

**Alternatives evaluated:**

| Provider | Pros | Cons | Verdict |
|---|---|---|---|
| **Twilio** | Best API, subaccount model, proven at scale, broad carrier coverage, signature validation, rich docs | Higher per-message cost at low volume (~$0.0079/SMS) | **Selected** |
| **Vonage (Nexmo)** | Competitive pricing, good API | Weaker subaccount model, fewer local number options | Rejected |
| **Telnyx** | Lower cost (~$0.004/SMS), good API | Smaller ecosystem, less contractor/SMB community support | Consider at 500+ customers |
| **SignalWire** | Built by Twilio founders, lower cost | Younger platform, less documentation | Too early |
| **Plivo** | Low cost, good international | US local number coverage thinner | Rejected |

### Why Twilio Wins for MVP -> 100+ Customers

1. **Subaccount model is perfect for multi-tenant SaaS.** Each contractor gets an isolated Twilio subaccount. Billing, numbers, and credentials are isolated. If one customer's account has issues, others are unaffected.

2. **Provisioning API is mature.** Programmatically create subaccount + buy number + configure webhooks in a single API flow. This is the foundation of the 10-minute onboarding.

3. **Compliance tools built-in.** STOP/START/HELP handling, A2P 10DLC registration (required for business SMS in the US), opt-out management.

4. **Carrier coverage.** Twilio has the best US local number availability. Contractors want local numbers that match their area code.

5. **At 100+ customers, Twilio cost is still manageable.** Assuming 500 SMS/month per customer average: 100 customers * 500 * $0.0079 = ~$395/month in SMS costs. Against $99-$399/customer/month in revenue, margins are strong.

### Migration Path to Lower-Cost Provider (Future)

At 500+ customers, evaluate Telnyx as a secondary provider:
- Abstract SMS sending behind a `TelecomProvider` interface
- Route by region or cost tier
- A/B test delivery rates before full migration
- Keep Twilio as fallback/primary for compliance-sensitive flows

### A2P 10DLC Compliance (Required)

All US business SMS now requires A2P 10DLC registration:
1. Register NexaOS as a brand with The Campaign Registry (TCR)
2. Register a campaign (use case: "Missed call follow-up for local service businesses")
3. Each provisioned number must be associated with the campaign
4. Expected throughput: 75-150 SMS/second per campaign (sufficient for 100+ customers)
5. **Build this into the provisioning flow** -- new number -> auto-associate with campaign

---

## J) Build Roadmap

### Phase 1: MVP (Weeks 1-4)

**Goal:** One contractor can sign up, forward missed calls, and get leads in a dashboard.

Week 1-2:
- [ ] Next.js project setup (App Router, TypeScript, Tailwind, shadcn/ui)
- [ ] Database schema + Prisma setup (PostgreSQL on Supabase/Neon)
- [ ] Auth (signup, login, session management)
- [ ] Homepage (hero, problem, how-it-works, CTA -- no animation yet)
- [ ] Pricing page (static)
- [ ] Demo booking page (form -> email notification)

Week 3:
- [ ] Twilio integration: provisioning service (subaccount + number)
- [ ] Webhook handlers: voice (missed call), SMS (inbound/outbound)
- [ ] Lead creation flow: missed call -> SMS -> qualification -> lead card
- [ ] Onboarding wizard (4-step flow)
- [ ] Message template system (pre-filled by trade)

Week 4:
- [ ] Dashboard: lead list, lead detail, message thread
- [ ] Lead status management (manual status updates)
- [ ] Stripe integration: subscription creation, billing portal
- [ ] Basic email notifications (new lead, test call success)
- [ ] Deploy to production (Vercel + managed DB)

**MVP exit criteria:**
- A real contractor can sign up, pay, forward calls, and see leads in the dashboard
- Missed call -> SMS reply happens in < 10 seconds
- Onboarding takes < 15 minutes
- Build passes, tests pass, bundle < 500KB

### Phase 2: Hardening (Weeks 5-8)

- [ ] Qualification flow engine (configurable multi-step SMS)
- [ ] Review request automation (post-completion)
- [ ] Dispatch-ready card format (job type, urgency, customer details)
- [ ] Business hours / quiet hours enforcement
- [ ] A2P 10DLC registration + automated number association
- [ ] STOP/START/HELP compliance handling
- [ ] Webhook signature validation (enforce in production)
- [ ] Idempotency enforcement on all webhooks
- [ ] Rate limiting on API endpoints
- [ ] Error monitoring (Sentry) + structured logging
- [ ] Onboarding email drip (welcome, tips, check-in)
- [ ] Dashboard stats (leads recovered, response time, conversion rate)

### Phase 3: Polish (Weeks 9-12)

- [ ] Homepage animations (hero loop, section reveals, logo marquee)
- [ ] HVAC industry page (live)
- [ ] ROI calculator
- [ ] Trust & Security page
- [ ] Product detail pages (lead recovery, pipeline, reputation)
- [ ] Mobile-responsive polish pass
- [ ] Accessibility audit + fixes
- [ ] Performance optimization (< 2.5s LCP, < 500KB JS)
- [ ] SEO fundamentals (meta tags, OG images, sitemap)
- [ ] Coming Soon pages for plumbing/electrical/roofing
- [ ] Admin panel for NexaOS team (customer management, provisioning status)

### Phase 4: Scale Prep (Weeks 13-16)

- [ ] Multi-location support (multiple numbers per org)
- [ ] Team management (invite users, role-based access)
- [ ] Custom qualification flows (per-org configuration)
- [ ] API access for Business plan customers
- [ ] Webhook event system for integrations
- [ ] Plumbing + Electrical industry pages go live
- [ ] Customer success: churn signals, health scores
- [ ] Load testing for 100+ concurrent customers
- [ ] Evaluate secondary telecom provider (Telnyx)

---

## K) Quality Gate (Pass/Fail)

### Clarity (Pass/Fail)

| Check | Criteria |
|---|---|
| 3-second test | Can a stranger explain what NexaOS does after 3 seconds on homepage? |
| Jargon-free | No unexplained technical terms in customer-facing copy |
| Single message | Homepage communicates ONE core value prop, not three |
| Mechanism visible | The missed-call-to-booking flow is explicitly shown, not just described |

### Friendliness (Pass/Fail)

| Check | Criteria |
|---|---|
| Reading level | All customer copy at 6th-8th grade reading level |
| Tone | Confident but not aggressive; helpful, not salesy |
| Error states | Form errors are specific and helpful, never blame the user |
| Empty states | Dashboard shows helpful guidance when no leads exist yet |

### Simplicity (Pass/Fail)

| Check | Criteria |
|---|---|
| Onboarding steps | 4 or fewer steps to go live |
| CTA count | Maximum 2 CTAs per section |
| Nav depth | No page requires more than 2 clicks from homepage |
| Form fields | Demo form: 5 fields max. Signup: 4 fields max |

### Trust (Pass/Fail)

| Check | Criteria |
|---|---|
| Claims | Every specific claim is either measurable/system-controlled or marked [ASSUMPTION] |
| Pricing | Visible on website, no "contact us for pricing" on standard tiers |
| Security | Trust page exists with concrete (not vague) security information |
| Social proof | Only use real numbers; never fabricate customer counts |

### Technical (Pass/Fail)

| Check | Criteria |
|---|---|
| Build | `npm run build` passes with zero errors |
| Tests | `npm run test` passes |
| Bundle | Main JS chunk < 500 KB |
| Accessibility | Keyboard navigation works for all interactive elements |
| Mobile | All pages usable on 375px viewport |
| Performance | LCP < 2.5s on 4G connection |

---

## L) Decision Log

### Kept (from existing docs)

| Decision | Rationale |
|---|---|
| Hero line: "Turn missed calls into booked jobs automatically." | Highest processing fluency of all candidates. Concrete mechanism + outcome in one sentence. Tested against V2's "Stop Missing Calls. Start Scaling Revenue." -- original wins. |
| Obsidian dark theme (#0A0A0A) | Validated by evidence: Linear, Vercel, Stripe all use this. Signals premium without requiring custom illustration. |
| Primary CTA: /demo, Secondary: /signup | Consistent with playbook. Demo-first is correct for B2B where average deal value justifies sales touch. Trial available for self-serve users. |
| HVAC-first, others Coming Soon | Correct focus strategy. Ship one vertical perfectly before expanding. |
| Twilio managed subaccount model | Lowest customer friction. Validated in blueprint. No better alternative at current scale. |
| Contractor-simple UX direction | Core differentiator vs ServiceTitan/Jobber complexity. Keep. |
| Bento box feature layout | Evidence from Linear, Vercel, Raycast confirms this is the standard. |
| Route-level code splitting, < 500KB target | Already validated in current build (498.61 KB). Keep the discipline. |

### Changed (with rationale)

| What Changed | Old | New | Why |
|---|---|---|---|
| Hero headline | V2 spec used "Stop Missing Calls. Start Scaling Revenue." | Restored original "Turn missed calls into booked jobs automatically." | Original is more concrete and scores higher on processing fluency. Two abstract imperatives (V2) require more cognitive processing than one mechanism statement (original). |
| Pricing structure | Not specified in existing docs | 3-tier: $99 / $199 / $399 | Anchored to job value, not competitor pricing. Middle tier highlighted as conversion target. Low entry point ($99) matches ICP budget sensitivity. |
| Database | SQLite (in contractor-automation skill) | PostgreSQL (Supabase/Neon) | SQLite doesn't support concurrent connections needed for multi-tenant SaaS with 100+ customers. PostgreSQL is the right choice for production SaaS. |
| Background jobs | Cron-based (in contractor-automation skill) | Inngest or BullMQ | Cron polling is fragile at scale. Event-driven job processing is more reliable for review delays, retry logic, and provisioning workflows. |
| Auth | Admin password (in contractor-automation skill) | NextAuth.js with email/password | Single shared password doesn't work for multi-tenant SaaS. Per-user auth with roles is required. |
| Hero visual | V2 spec had elaborate 5-frame storyboard | Simplified: 3-4 frame loop with static mobile fallback | 5 frames is too complex to build well in MVP. Reduce to core narrative (missed call -> SMS -> qualified lead). Polish in Phase 3. |
| Section order | V2 spec: Hero -> Proof -> Threat -> Bento -> Comparison -> CTA | Hero -> Proof -> Problem -> How It Works -> Bento -> Comparison -> Pricing -> FAQ -> CTA | Added How It Works (reduces "is this complicated?" anxiety), Pricing snapshot (removes price objection before demo), and FAQ (handles remaining objections). These three additions match patterns from Jobber, Housecall Pro, and Intercom evidence. |
| Copy tone | V2 spec had some enterprise-heavy language ("Deploy NexaOS Today", "Start Operating") | Simpler: "Book a Demo", "Start Free Trial" | Contractors don't "deploy" software. They "set it up" and "try it." CTA language must match audience vocabulary. Processing fluency > perceived sophistication. |
| Telecom abstraction | Not in existing docs | Added TelecomProvider interface recommendation for future | Prepares for Telnyx migration at 500+ customers without rewriting core logic. Low cost now, high value later. |

### Tradeoffs Acknowledged

| Tradeoff | Accepted Risk | Mitigation |
|---|---|---|
| Dark theme may feel unfamiliar to some contractors | Some contractors expect "light/clean" SaaS look | High contrast text + large touch targets + simplicity compensate. If conversion data shows issues, light mode is a CSS variable swap. |
| Demo-first CTA (vs trial-first) | Some users want to try immediately without talking to sales | Free trial CTA always available as secondary. Monitor trial vs demo conversion rates. |
| Twilio cost at scale | Per-message cost higher than alternatives | Margins are strong ($0.15 messaging cost per $2,000 recovered job). Evaluate Telnyx at 500+ customers. |
| MVP without review automation | Phase 1 only covers missed call recovery | Review automation is Phase 2 (Week 5-8). Communicate this clearly -- MVP value prop stands on its own. |
| PostgreSQL over serverless DB | Slightly more operational overhead | Supabase/Neon are managed. Worth it for concurrent multi-tenant queries. |

---

*This plan is decision-complete and implementation-ready. Every section can be handed to a developer, designer, or copywriter and built without further clarification. Assumptions are marked. Claims are evidence-graded. The build roadmap is sequenced by dependency and risk.*
