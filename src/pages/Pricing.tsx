import React from "react";
import { Link } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import { pricingTiers } from "@/lib/marketing-site";
import "./Marketing.css";

const Pricing = () => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-section" style={{ paddingTop: "72px" }}>
          <header className="nexa-section-head">
            <div className="nexa-eyebrow">Pricing</div>
            <h1 className="nexa-h1">Transparent pricing that stays below the cost of one lost job.</h1>
            <p className="nexa-hero-sub">
              Start with missed-call recovery, then add qualification, review automation, and multi-location support
              as the team grows.
            </p>
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
        </section>

        <section className="nexa-section nexa-section-soft">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">What every plan includes</h2>
          </header>
          <div className="nexa-grid nexa-grid-3">
            <article className="nexa-card">
              <h3>14-day free trial</h3>
              <p>Launch the workflow, run test calls, and see the exact handoff before the first paid cycle starts.</p>
            </article>
            <article className="nexa-card">
              <h3>Keep your current number</h3>
              <p>You do not need to rebrand or retrain customers. NexaOS works behind your existing call flow.</p>
            </article>
            <article className="nexa-card">
              <h3>Month-to-month</h3>
              <p>No annual contract is required on standard plans, so expansion can happen after the first win.</p>
            </article>
          </div>
        </section>

        <section className="nexa-footer-cta">
          <h2 className="nexa-h2">Need help choosing the right tier?</h2>
          <p className="nexa-hero-sub">
            We can map your current call flow and recommend the fastest path to go live.
          </p>
          <div className="nexa-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="nexa-btn nexa-btn-primary" to="/demo">
              Book Demo
            </Link>
            <Link className="nexa-btn nexa-btn-ghost" to="/signup">
              Start Free Trial
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Pricing;
