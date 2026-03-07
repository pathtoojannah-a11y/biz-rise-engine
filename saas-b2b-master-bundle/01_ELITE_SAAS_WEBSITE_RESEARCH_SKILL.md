---
name: elite-saas-website-research
description: Reverse-engineer top SaaS sites and convert findings into implementation-ready specs for NexaOS.
---

# Elite SaaS Website Research (Consolidated)

## Objective
Produce an evidence-backed, build-ready website spec from 10-15 websites with concrete implementation outputs.

## Required Inputs
- Product name
- ICP
- Primary CTA goal
- Brand constraints
- Desired vibe
- Competitor set
- Offer constraints
- Proof availability

## Site Selection Rules
1. Total sites: 10-15
2. Must include anchors: Stripe, Linear, Vercel
3. Include at least 6 from: Stripe, Linear, Vercel, Notion, Figma, Webflow, Slack, Intercom, Airtable, HubSpot
4. Include 2-4 vertical peers for NexaOS
5. Vertical peers must be <= 40% of final set
6. Include user-requested sites first while preserving constraints

## Per-Site Evidence Requirements
1. URL + access timestamp
2. Desktop homepage screenshot
3. Mobile hero screenshot
4. Pricing screenshot or `No public pricing`
5. Notes on hero, nav, CTA stack, proof blocks, footer
6. Inspect findings for hero headline, primary CTA, proof module, one grid/card module
7. Performance signals (media weight, script heaviness, animation smoothness)

## Weighted Scoring Rubric (0-100)
- Clarity 20
- Trust 15
- CTA Architecture 15
- Proof Quality 10
- Pricing Communication 10
- Motion Quality 10
- Layout System 10
- Performance Signals 10

Formula:
`Weighted Score = sum((score/5)*weight)`

## Pattern Extraction Rules
Keep pattern only if:
- Seen in >=2 strong sites, or
- Seen in 1 elite anchor with score >=85

Pattern card fields:
- Pattern name
- Problem solved
- Structural recipe
- Copy formula
- Visual/motion rules
- Implementation notes
- Anti-patterns

## NexaOS Translation Rules
- Replace abstract claims with concrete operational outcomes
- Prioritize owner-operator clarity: speed, booking, office workflow
- Prefer specific proof over generic social proof
- Avoid hype language and unverified claims
- Keep motion restrained and readability-first

## Output Contract (A-I)
A) Executive summary  
B) Teardown table (10-15 sites)  
C) Top 20 patterns  
D) IA + page list  
E) Homepage copy/layout spec  
F) Tokens + motion  
G) CTA map  
H) Build checklist (7-day + 30-day)  
I) Truth check

## Hard QA Gate (Pass/Fail)
- Site count and composition constraints pass
- Every site has evidence and weighted score
- Pattern evidence threshold passes
- A-I output complete and ordered
- Claims separated into safe vs proof-required

