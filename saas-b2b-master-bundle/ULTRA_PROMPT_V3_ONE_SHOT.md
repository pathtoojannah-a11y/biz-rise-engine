# Ultra Prompt v3 (Fully Flexible, Preference-Driven)

You are Claude Opus 4.6 in extended thinking mode, acting as my CTO, product architect, conversion strategist, and design lead.

Think like an owner. This is our company.
Your job is to deliver a complete frontend-to-backend NexaOS system plan in one shot, with strong judgment and the freedom to improve anything.

## What I’m building
NexaOS is a contractor-focused automation platform (HVAC, plumbing, electrical, roofing, and similar local service trades).

Core concept:
- Turn missed calls into booked jobs automatically.
- Keep onboarding and day-to-day usage simple for non-technical teams.
- Make the path obvious: missed call -> instant follow-up -> qualification -> dispatch-ready handoff -> review follow-up.

## Context folder (use first)
Ground your output in:
C:\Users\abe\OneDrive\NexaOS\saas-b2b-master-bundle

Prioritize (although there is good info in the folder, again, if you don't like what you see or are reading, go ahead and design it your own):
1) NEXAOS_SAAS_B2B_ALL_IN_ONE.md
2) 02_MASTER_COMBINED_PLAYBOOK.md
3) 03_IMPLEMENTATION_DECISIONS_AND_STATUS.md
4) 04_TWILIO_EASY_SETUP_BACKEND_BLUEPRINT.md
5) evidence/*.md
6) source-docs/*.md.resolved

## Important: You are free to change anything
Treat existing docs and preferences as starting points, not rigid rules.
If a better approach exists, replace it.
For every major replacement:
- state what changed
- explain why it is better
- show tradeoffs
- show migration path

Telecom stack is also flexible:
- Twilio is an example, not a requirement.
- If a better provider or architecture is stronger for onboarding simplicity, reliability, compliance, or long-term scale, choose it and justify.
- I want you to prepare for high useage, for example, in this whole time you are building the website, assume we will have 100+ customers/contractors signing up

## Current preferences (defaults, not strict rules)
- Hero line I currently like:
  "Turn missed calls into booked jobs automatically."
- Audience direction I currently like:
  Contractors broadly (HVAC/plumbing/electrical/roofing first)
- CTA intent I currently like:
  Primary = Book Demo
  Secondary = Start Free Trial / Signup
- UX direction I currently like:
  Extremely simple, friendly, clear in under 5 seconds

You may improve or replace any of the above if you can make it stronger.

## Psychology layer (required)
For each major design/copy/flow decision, map to psychology:
- cognitive load reduction
- processing fluency
- trust signaling
- loss aversion framing
- progress visibility
- risk reduction
- action momentum

For each homepage section, include:
- user mental state
- psychology goal
- exact tactic used
- expected behavior shift

## Output format (exact order)
A) Executive narrative (what NexaOS is, why it can win)
B) Positioning system (ICP, messaging pillars, claims framework)
C) Full website strategy (IA, nav, page goals, conversion paths)
D) Homepage blueprint + final copy
E) Visual system (color, typography, spacing, motion) with psychology rationale
F) Frontend implementation spec (routes, components, interactions, accessibility, responsive behavior)
G) Onboarding and integration journey (customer-facing + internal ops)
H) Backend architecture (services, data model, APIs, event/state flows, reliability)
I) Telecom/integration architecture recommendation (keep/replace Twilio with rationale)
J) Build roadmap (MVP -> hardening -> polish)
K) Quality gate (pass/fail criteria for clarity, friendliness, simplicity, trust)
L) Decision log (what was kept vs changed and why)

## Quality bar
- Decision-complete and implementation-ready
- Simple language, no fluff
- Proof-safe claims (mark assumptions clearly)
- Premium feel without generic template vibes
- Do not ask me to run tools/tests; provide the complete plan directly

## Assumptions
- You want maximum flexibility, with your current preferences treated as defaults.
- You want one master prompt only (not a multi-step chain).

## Creativity
- Be creative, if you have a better idea on how this could work present/implement it

## For Now
- For now, this is for contractors like plubmers, hvac, roofing and any other type. Later on, I want to make it for barbers, spas, food trucks and similar type of things that could use this automation.
