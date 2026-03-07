import React from "react";
import { Link } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import "../Marketing.css";

const ProductReputation = () => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-hero" style={{ paddingTop: "120px" }}>
          <div className="nexa-hero-grid">
            <div className="nexa-fade-up">
              <div className="nexa-eyebrow">Reputation</div>
              <h1 className="nexa-h1">Review automation that compounds every completed job.</h1>
              <p className="nexa-hero-sub">
                When work is marked complete, NexaOS can request feedback by text, route strong responses toward
                public review links, and keep lower ratings in a private follow-up path.
              </p>
              <div className="nexa-hero-actions">
                <Link className="nexa-btn nexa-btn-primary" to="/demo">
                  Book Demo
                </Link>
                <Link className="nexa-btn nexa-btn-ghost" to="/product/pipeline">
                  See Pipeline
                </Link>
              </div>
            </div>

            <div className="nexa-hero-panel nexa-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="nexa-flow-row">
                <div className="nexa-flow-label">Trigger</div>
                <div className="nexa-flow-value">Job marked complete</div>
              </div>
              <div className="nexa-flow-row">
                <div className="nexa-flow-label">Ask</div>
                <div className="nexa-flow-value">Rate service 1 to 5</div>
              </div>
              <div className="nexa-flow-row">
                <div className="nexa-flow-label">4-5</div>
                <div className="nexa-flow-value">Send public review link</div>
              </div>
              <div className="nexa-flow-row">
                <div className="nexa-flow-label">1-3</div>
                <div className="nexa-flow-value">Create internal recovery task</div>
              </div>
            </div>
          </div>
        </section>

        <section className="nexa-section">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">Why it matters</h2>
          </header>
          <div className="nexa-grid nexa-grid-2">
            <article className="nexa-card">
              <h3>Protect the brand</h3>
              <p>Private follow-up routes unhappy customers back to your team instead of straight to a public complaint.</p>
            </article>
            <article className="nexa-card">
              <h3>Increase review consistency</h3>
              <p>Review requests stop depending on who remembers after a long day in the field.</p>
            </article>
          </div>
        </section>

        <section className="nexa-section nexa-section-soft">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">Fits the full revenue loop</h2>
          </header>
          <div className="nexa-grid nexa-grid-3">
            <article className="nexa-card">
              <h3>Recover the lead</h3>
              <p>Start with the missed call and turn it into an active SMS conversation.</p>
            </article>
            <article className="nexa-card">
              <h3>Book the job</h3>
              <p>Move the qualified lead through a simple dispatch process with clear status visibility.</p>
            </article>
            <article className="nexa-card">
              <h3>Capture the review</h3>
              <p>Let completed jobs produce reputation lift instead of disappearing after the invoice is sent.</p>
            </article>
          </div>
        </section>

        <section className="nexa-footer-cta">
          <h2 className="nexa-h2">Let completed jobs build your reputation automatically.</h2>
          <p className="nexa-hero-sub">See the full review automation flow in a short demo.</p>
          <div className="nexa-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="nexa-btn nexa-btn-primary" to="/demo">
              Book Demo
            </Link>
            <Link className="nexa-btn nexa-btn-ghost" to="/product/pipeline">
              See Pipeline
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ProductReputation;
