import React from "react";
import { Link } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import "./Marketing.css";

const IndustryHVAC = () => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-section" style={{ paddingTop: "72px" }}>
          <header className="nexa-section-head">
            <div className="nexa-eyebrow">HVAC</div>
            <h1 className="nexa-h1">Built for HVAC teams that lose jobs when the phone rings at the wrong moment.</h1>
            <p className="nexa-hero-sub">
              Seasonal spikes, emergency calls, and overwhelmed office staff make HVAC a perfect fit for instant
              missed-call recovery and structured dispatch intake.
            </p>
            <div className="nexa-hero-actions">
              <Link className="nexa-btn nexa-btn-primary" to="/demo">
                Book HVAC Demo
              </Link>
              <Link className="nexa-btn nexa-btn-ghost" to="/signup">
                Start Free Trial
              </Link>
            </div>
          </header>

          <div className="nexa-grid nexa-grid-3">
            <article className="nexa-card">
              <h3>Emergency call capture</h3>
              <p>Missed service and no-cool calls trigger an immediate text conversation instead of a dead-end voicemail.</p>
            </article>
            <article className="nexa-card">
              <h3>Cleaner office handoff</h3>
              <p>Dispatch sees service type, urgency, zip code, and conversation history before making the callback.</p>
            </article>
            <article className="nexa-card">
              <h3>Review consistency after the job</h3>
              <p>Completed work can trigger review automation so busy seasons do not kill reputation growth.</p>
            </article>
          </div>
        </section>

        <section className="nexa-section nexa-section-soft">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">Why HVAC is the wedge</h2>
          </header>
          <div className="nexa-grid nexa-grid-2">
            <article className="nexa-card">
              <h3>High urgency, high ticket value</h3>
              <p>
                When cooling is out, the customer usually books the first company that replies. That makes response speed a direct revenue lever.
              </p>
            </article>
            <article className="nexa-card">
              <h3>Common office bottleneck</h3>
              <p>
                Small HVAC teams often rely on one dispatcher or owner-operator. NexaOS covers the gap when they are on another call or in the field.
              </p>
            </article>
          </div>
        </section>

        <section className="nexa-footer-cta">
          <h2 className="nexa-h2">Win more HVAC jobs with faster first response.</h2>
          <p className="nexa-hero-sub">See the exact workflow in a short demo tailored to your office and dispatch process.</p>
          <Link className="nexa-btn nexa-btn-primary" to="/demo">
            Book Demo
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default IndustryHVAC;
