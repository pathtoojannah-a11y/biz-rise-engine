import React from "react";
import { Link } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import "../Marketing.css";

const ProductPipeline = () => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-hero" style={{ paddingTop: "120px" }}>
          <div className="nexa-hero-grid">
            <div className="nexa-fade-up">
              <div className="nexa-eyebrow">Pipeline</div>
              <h1 className="nexa-h1">Dispatch-ready lead cards, not another inbox to babysit.</h1>
              <p className="nexa-hero-sub">
                Once a lead is qualified by text, it lands in one clear workflow so the office can schedule, assign,
                and track status without copy-pasting between tools.
              </p>
              <div className="nexa-hero-actions">
                <Link className="nexa-btn nexa-btn-primary" to="/demo">
                  Book Demo
                </Link>
                <Link className="nexa-btn nexa-btn-ghost" to="/product/lead-recovery">
                  See Lead Recovery
                </Link>
              </div>
            </div>

            <div className="nexa-hero-panel nexa-fade-up" style={{ animationDelay: "120ms" }}>
              <div className="nexa-flow-row">
                <div className="nexa-flow-label">Inbound</div>
                <div className="nexa-flow-value">Awaiting callback</div>
              </div>
              <div className="nexa-flow-row">
                <div className="nexa-flow-label">Qualified</div>
                <div className="nexa-flow-value">Repair. Urgent. 77002.</div>
              </div>
              <div className="nexa-flow-row">
                <div className="nexa-flow-label">Scheduled</div>
                <div className="nexa-flow-value">Today, 2:00 PM</div>
              </div>
              <div className="nexa-flow-row">
                <div className="nexa-flow-label">Completed</div>
                <div className="nexa-flow-value">Ready for review request</div>
              </div>
            </div>
          </div>
        </section>

        <section className="nexa-section">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">What the pipeline replaces</h2>
          </header>
          <div className="nexa-table-container">
            <div className="nexa-row nexa-table-header">
              <div className="nexa-cell">Current friction</div>
              <div className="nexa-cell">Pipeline benefit</div>
            </div>
            <div className="nexa-row">
              <div className="nexa-cell old">Office staff copy details from texts into a separate dispatch workflow.</div>
              <div className="nexa-cell new">Qualified leads are already structured into a dispatch-ready record.</div>
            </div>
            <div className="nexa-row">
              <div className="nexa-cell old">Technicians and office staff lose context across multiple tools and threads.</div>
              <div className="nexa-cell new">Conversation history stays attached to the lead card.</div>
            </div>
            <div className="nexa-row">
              <div className="nexa-cell old">Nobody knows the status of a recovered lead until much later.</div>
              <div className="nexa-cell new">The board shows whether the lead is new, scheduled, dispatched, or complete.</div>
            </div>
          </div>
        </section>

        <section className="nexa-section nexa-section-soft">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">Built for the front seat of a truck and the office desk</h2>
          </header>
          <div className="nexa-grid nexa-grid-3">
            <article className="nexa-card">
              <h3>Fast status visibility</h3>
              <p>Owners and dispatchers can see what happened to every recovered lead without searching message threads.</p>
            </article>
            <article className="nexa-card">
              <h3>Manual in the right places</h3>
              <p>The MVP keeps dispatch decisions human while automating the repetitive intake and handoff steps.</p>
            </article>
            <article className="nexa-card">
              <h3>Ready for workflow expansion</h3>
              <p>As the operation grows, the same lead card can power reviews, reporting, and internal accountability.</p>
            </article>
          </div>
        </section>

        <section className="nexa-footer-cta">
          <h2 className="nexa-h2">See dispatch-ready lead cards in action.</h2>
          <p className="nexa-hero-sub">Book a short demo and we will map the pipeline to your office workflow.</p>
          <div className="nexa-hero-actions" style={{ justifyContent: "center" }}>
            <Link className="nexa-btn nexa-btn-primary" to="/demo">
              Book Demo
            </Link>
            <Link className="nexa-btn nexa-btn-ghost" to="/product/lead-recovery">
              See Lead Recovery
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ProductPipeline;
