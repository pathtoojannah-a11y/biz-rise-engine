import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import { comparisonRows, faqItems, integrationLogos, pricingTiers } from "@/lib/marketing-site";
import "./Marketing.css";

const problemStats = [
  {
    value: "$500-$5,000",
    label: "Typical value range of the service jobs that disappear when the phone is missed.",
  },
  {
    value: "< 5 sec",
    label: "Target time for the first SMS so the homeowner hears from you before the next company.",
  },
  {
    value: "10 min",
    label: "Guided setup target for getting forwarding, messaging, and the first workflow live.",
  },
];

const featureBlocks = [
  {
    title: "Missed Call Recovery",
    body: "The moment a call is missed, NexaOS starts the text conversation and captures job details before the lead goes cold.",
    meta: "Lead recovery engine",
    wide: true,
  },
  {
    title: "Reputation Autopilot",
    body: "Completed jobs can trigger review requests automatically, routing happy customers toward public reviews and problems back to your team.",
    meta: "Review engine",
  },
  {
    title: "Pipeline and Dispatch",
    body: "Qualified leads arrive as dispatch-ready cards with service type, urgency, and conversation history in one place.",
    meta: "Operations engine",
    full: true,
  },
];

const RevealSection = ({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.opacity = "1";
      return;
    }
    el.style.opacity = "0";
    el.style.transform = "translateY(20px) scale(0.98)";
    el.style.transition =
      "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1), transform 600ms cubic-bezier(0.16, 1, 0.3, 1)";

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0) scale(1)";
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className={className} style={style}>
      {children}
    </section>
  );
};

const HeroDemo = () => {
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCycle((c) => c + 1), 5200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="nexa-hero-demo-shell" aria-label="NexaOS lead recovery workflow" key={cycle}>
      <div className="nexa-hero-demo-head">
        <span>Live recovery loop</span>
        <span className="nexa-demo-live-dot">Active</span>
      </div>
      <div className="nexa-missed-call-chip step-1">2:14 PM. Missed call: "No cooling, need service today."</div>
      <div className="nexa-msg-thread">
        <div className="nexa-msg-bubble outgoing step-2">
          Hi, this is Northside HVAC. Is this repair, tune-up, or install?
        </div>
        <div className="nexa-msg-bubble incoming step-3">Repair. AC is running but not cooling.</div>
        <div className="nexa-msg-bubble outgoing step-4">
          Got it. What zip code and best time window today?
        </div>
      </div>
      <div className="nexa-demo-card step-5">
        <div className="nexa-flow-label">Dispatch Card Created</div>
        <div className="nexa-flow-value">Repair. Urgent. 77002.</div>
        <div className="nexa-demo-meta">Status: Ready to book. Source: Missed-call SMS.</div>
      </div>
    </div>
  );
};

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="nexa-faq-list" role="list">
      {faqItems.map((item, index) => (
        <div key={item.question} className="nexa-faq-item" role="listitem">
          <button
            type="button"
            className="nexa-faq-trigger"
            aria-expanded={openIndex === index}
            onClick={() => setOpenIndex(openIndex === index ? null : index)}
          >
            {item.question}
            <span className={`nexa-faq-icon ${openIndex === index ? "open" : ""}`}>+</span>
          </button>
          <div className={`nexa-faq-answer ${openIndex === index ? "open" : ""}`}>
            <p>{item.answer}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

const LogoMarquee = () => {
  const doubled = [...integrationLogos, ...integrationLogos];

  return (
    <div className="nexa-marquee-track" aria-label="Integrations" role="list">
      <div className="nexa-marquee-inner">
        {doubled.map((logo, i) => (
          <span key={`${logo}-${i}`} role="listitem">
            {logo}
          </span>
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const navigate = useNavigate();
  const [workEmail, setWorkEmail] = useState("");

  useMarketingPage();

  const handleStartFree = (event: FormEvent) => {
    event.preventDefault();
    const email = workEmail.trim();

    if (!email) {
      navigate("/signup");
      return;
    }

    navigate(`/signup?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-hero">
          <div className="nexa-hero-grid">
            <div className="nexa-hero-content nexa-fade-up">
              <div className="nexa-eyebrow">For HVAC, Plumbing, Electrical and Roofing Contractors</div>
              <h1 className="nexa-h1">Turn missed calls into booked jobs automatically.</h1>
              <p className="nexa-hero-sub">
                When you cannot answer, NexaOS texts the caller back instantly, qualifies the job,
                and delivers a dispatch-ready card to your team. Setup takes about 10 minutes.
              </p>

              <form className="nexa-hero-form" onSubmit={handleStartFree}>
                <input
                  className="nexa-hero-email"
                  type="email"
                  value={workEmail}
                  onChange={(event) => setWorkEmail(event.target.value)}
                  placeholder="Enter your work email"
                  aria-label="Work email"
                />
                <button className="nexa-btn nexa-btn-primary nexa-hero-submit" type="submit">
                  Start Free Trial
                </button>
              </form>

              <div className="nexa-hero-actions">
                <Link className="nexa-btn nexa-btn-primary" to="/demo">
                  Book a Demo
                </Link>
                <Link className="nexa-btn nexa-btn-ghost" to="/signup">
                  Start Free Trial
                </Link>
              </div>

              <p className="nexa-helper-text">No credit card required. Month-to-month. Keep your current number.</p>

              <div className="nexa-hero-microproof" aria-label="Quick setup highlights">
                <span>Keep your business number</span>
                <span>Dispatch-ready lead details</span>
                <span>No new call center process</span>
              </div>
            </div>

            <div className="nexa-hero-panel nexa-fade-up" style={{ animationDelay: "120ms" }}>
              <h3>Missed call workflow</h3>
              <HeroDemo />
              <p className="nexa-helper-text">Built for dispatcher workflows, not a generic shared inbox.</p>
            </div>
          </div>
        </section>

        <RevealSection className="nexa-proof-strip">
          <p>Works with the tools you already use</p>
          <LogoMarquee />
        </RevealSection>

        <RevealSection className="nexa-section">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">If you are not first to reply, you have already lost the job.</h2>
            <p>
              Homeowners usually do not wait around for a callback. Every unanswered call is a repair,
              estimate, or replacement opportunity moving to the next company on Google.
            </p>
          </header>
          <div className="nexa-grid nexa-grid-3">
            {problemStats.map((stat) => (
              <article key={stat.value} className="nexa-card nexa-stat-card">
                <div className="nexa-stat-card__value">{stat.value}</div>
                <p>{stat.label}</p>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="nexa-section nexa-section-soft">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">Live in 10 minutes. No training needed.</h2>
            <p>Three steps remove callback lag and give your office a cleaner booking handoff.</p>
          </header>
          <div className="nexa-grid nexa-grid-3">
            <article className="nexa-card">
              <h3>1. Forward your missed calls</h3>
              <p>
                Point unanswered calls to your NexaOS number. We give carrier-specific instructions so your
                current number stays the same.
              </p>
            </article>
            <article className="nexa-card">
              <h3>2. NexaOS handles the rest</h3>
              <p>
                Instant text-back, automated qualification, and structured job details happen before your office
                team has to chase the lead.
              </p>
            </article>
            <article className="nexa-card">
              <h3>3. Your team books the job</h3>
              <p>
                Open the dashboard or notification feed and book from a lead card that already includes urgency,
                service type, and customer context.
              </p>
            </article>
          </div>
        </RevealSection>

        <RevealSection className="nexa-bento">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">One platform. Three revenue engines.</h2>
            <p>Lead recovery gets the customer back. Pipeline ops keep the job moving. Reputation automation compounds the win.</p>
          </header>

          <div className="nexa-grid nexa-grid-bento">
            {featureBlocks.map((block) => (
              <article
                key={block.title}
                className={`nexa-card ${block.wide ? "nexa-bento-wide" : ""} ${block.full ? "nexa-bento-full" : ""}`}
              >
                <div className="nexa-flow-label">{block.meta}</div>
                <h3>{block.title}</h3>
                <p>{block.body}</p>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="nexa-section">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">From manual chaos to automated revenue.</h2>
          </header>
          <div className="nexa-table-container">
            <div className="nexa-row nexa-table-header">
              <div className="nexa-cell">Without NexaOS</div>
              <div className="nexa-cell">With NexaOS</div>
            </div>
            {comparisonRows.map((row) => (
              <div key={row.oldWay} className="nexa-row">
                <div className="nexa-cell old">{row.oldWay}</div>
                <div className="nexa-cell new">{row.newWay}</div>
              </div>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="nexa-section nexa-section-soft">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">One recovered job pays for a year of NexaOS.</h2>
            <p>No contracts. Cancel anytime. Every plan includes a 14-day free trial.</p>
          </header>

          <div className="nexa-grid nexa-grid-3">
            {pricingTiers.map((tier) => (
              <article key={tier.name} className={`nexa-card nexa-pricing-card ${tier.featured ? "featured" : ""}`}>
                {tier.badge ? <div className="nexa-pricing-card__badge">{tier.badge}</div> : null}
                <h3>{tier.name}</h3>
                <div className="nexa-pricing-card__price">{tier.price}</div>
                <p>{tier.description}</p>
                <ul className="nexa-feature-list">
                  {tier.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <Link className={`nexa-btn ${tier.featured ? "nexa-btn-primary" : "nexa-btn-ghost"}`} to={tier.ctaTo}>
                  {tier.ctaLabel}
                </Link>
              </article>
            ))}
          </div>
        </RevealSection>

        <RevealSection className="nexa-section">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">Common questions</h2>
          </header>
          <FAQAccordion />
        </RevealSection>

        <RevealSection className="nexa-footer-cta">
          <h2 className="nexa-h2">Every missed call is a missed paycheck.</h2>
          <p className="nexa-hero-sub">
            Set up NexaOS in about 10 minutes and recover your next lost job before it hits the next company.
          </p>
          <div className="nexa-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="nexa-btn nexa-btn-primary" to="/demo">
              Book Demo
            </Link>
            <Link className="nexa-btn nexa-btn-ghost" to="/signup">
              Start Free Trial
            </Link>
          </div>
          <p className="nexa-helper-text">No credit card required. No contracts.</p>
        </RevealSection>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Index;
