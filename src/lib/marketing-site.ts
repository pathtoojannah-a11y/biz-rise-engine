export type PricingTier = {
  name: string;
  price: string;
  description: string;
  ctaLabel: string;
  ctaTo: string;
  featured?: boolean;
  badge?: string;
  features: string[];
};

export const integrationLogos = [
  "QuickBooks",
  "Google Business Profile",
  "Twilio",
  "Stripe",
  "Yelp",
  "Google Calendar",
];

export const pricingTiers: PricingTier[] = [
  {
    name: "Starter",
    price: "$99/mo",
    description: "For owner-operators who need instant missed-call recovery without extra software overhead.",
    ctaLabel: "Start Free Trial",
    ctaTo: "/signup",
    features: [
      "Missed-call text-back",
      "Lead capture and pipeline view",
      "One phone number",
      "Email support",
    ],
  },
  {
    name: "Pro",
    price: "$199/mo",
    description: "For growing teams that need qualification flows, review automation, and dispatch-ready handoff.",
    ctaLabel: "Book a Demo",
    ctaTo: "/demo",
    featured: true,
    badge: "Recommended",
    features: [
      "Everything in Starter",
      "Automated qualification flow",
      "Review request automation",
      "Dispatch-ready lead cards",
      "Up to 5 team members",
      "Priority support",
    ],
  },
  {
    name: "Business",
    price: "$399/mo",
    description: "For multi-location operators who need multiple numbers, custom flows, and hands-on onboarding.",
    ctaLabel: "Book a Demo",
    ctaTo: "/demo",
    features: [
      "Everything in Pro",
      "Multiple locations and numbers",
      "Custom qualification flows",
      "API access",
      "Dedicated onboarding",
      "Phone support",
    ],
  },
];

export const comparisonRows = [
  {
    oldWay: "Missed calls go to voicemail. Nobody checks.",
    newWay: "Instant text-back in under 5 seconds.",
  },
  {
    oldWay: "Dispatchers try to remember who called and why.",
    newWay: "Every lead is auto-captured with job details.",
  },
  {
    oldWay: "Review requests only happen when someone remembers.",
    newWay: "Every completed job can trigger a review request automatically.",
  },
  {
    oldWay: "Scheduling lives in a spreadsheet, whiteboard, or inbox thread.",
    newWay: "Dispatch-ready cards show job type, urgency, and customer info in one place.",
  },
  {
    oldWay: "You usually find out you lost the job after the fact.",
    newWay: "The dashboard shows every recovered lead and its current status.",
  },
];

export const faqItems = [
  {
    question: "Do I need to change my phone number?",
    answer:
      "No. You keep your existing business number and forward unanswered calls to your NexaOS number.",
  },
  {
    question: "How fast does NexaOS respond to missed calls?",
    answer:
      "The target flow is under 5 seconds, so the customer gets a text before they move to the next company.",
  },
  {
    question: "What if a customer texts back something complicated?",
    answer:
      "NexaOS captures job type, urgency, and core details first. Anything outside the structured flow gets flagged for your team.",
  },
  {
    question: "Can I customize the messages?",
    answer:
      "Yes. You can set the business name, greeting, and qualification prompts during setup.",
  },
  {
    question: "Is there a contract?",
    answer:
      "No. Plans are month-to-month, and all standard tiers include a 14-day free trial.",
  },
  {
    question: "What trades does NexaOS work for?",
    answer:
      "HVAC is live today. Plumbing, electrical, and roofing are on the roadmap with the same missed-call recovery engine.",
  },
];
