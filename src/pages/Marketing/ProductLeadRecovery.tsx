import React from "react";
import { Link } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import "../Marketing.css";

const ProductLeadRecovery = () => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-hero" style={{ paddingTop: "120px" }}>
          <div className="nexa-hero-grid">
            <div className="nexa-fade-up">
              <div className="nexa-eyebrow">Lead Recovery</div>
              <h1 className="nexa-h1">Never let a service request die in voicemail.</h1>
              <p className="nexa-hero-sub">
                NexaOS follows up missed calls by text, captures service details, and sends your team a qualified lead
                card ready for the next callback or dispatch decision.
              </p>
              <div className="nexa-hero-actions">
                <Link className="nexa-btn nexa-btn-primary" to="/demo">
                  Book Demo
                </Link>
                <Link className="nexa-btn nexa-btn-ghost" to="/pricing">
                  View Pricing
                </Link>
              </div>
            </div>

            <div className="nexa-hero-panel nexa-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="nexa-flow-block">
                <div className="nexa-flow-row">
                  <div className="nexa-flow-label">Step 1</div>
                  <div className="nexa-flow-value">Missed call detected</div>
                </div>
                <div className="nexa-flow-row">
                  <div className="nexa-flow-label">Step 2</div>
                  <div className="nexa-flow-value">SMS sent in seconds</div>
                </div>
                <div className="nexa-flow-row">
                  <div className="nexa-flow-label">Step 3</div>
                  <div className="nexa-flow-value">Job type and urgency captured</div>
                </div>
                <div className="nexa-flow-row">
                  <div className="nexa-flow-label">Step 4</div>
                  <div className="nexa-flow-value">Lead card delivered to dispatch</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="nexa-section">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">How lead recovery works</h2>
          </header>
          <div className="nexa-grid nexa-grid-3">
            <article className="nexa-card">
              <h3>Instant first response</h3>
              <p>The customer hears from you while the problem is still fresh instead of waiting for voicemail triage.</p>
            </article>
            <article className="nexa-card">
              <h3>Structured qualification</h3>
              <p>NexaOS asks for the details your office actually needs, including service type, urgency, and location.</p>
            </article>
            <article className="nexa-card">
              <h3>Cleaner handoff</h3>
              <p>Your team opens one lead record instead of piecing together a callback from scattered notes.</p>
            </article>
          </div>
        </section>

        <section className="nexa-section nexa-section-soft">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">Designed for the contractor use case</h2>
          </header>
          <div className="nexa-grid nexa-grid-2">
            <article className="nexa-card">
              <h3>What it captures</h3>
              <p>Repair vs install, urgency, message context, and location details before dispatch picks up the lead.</p>
            </article>
            <article className="nexa-card">
              <h3>What it avoids</h3>
              <p>Cold callbacks, lost scribbled notes, and the "we will call you back later" loop that kills close rate.</p>
            </article>
          </div>
        </section>

        <section className="nexa-footer-cta">
          <h2 className="nexa-h2">Stop losing jobs to voicemail.</h2>
          <p className="nexa-hero-sub">See the full recovery flow in a short demo tailored to your trade.</p>
          <div className="nexa-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="nexa-btn nexa-btn-primary" to="/demo">
              Book Demo
            </Link>
            <Link className="nexa-btn nexa-btn-ghost" to="/pricing">
              View Pricing
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ProductLeadRecovery;
