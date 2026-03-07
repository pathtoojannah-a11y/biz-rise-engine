import React from "react";
import { Link } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import "./Marketing.css";

const trustCards = [
  {
    title: "Encrypted transport and storage",
    body: "NexaOS is built to protect customer communication and lead data in transit and at rest.",
  },
  {
    title: "Role-based workspace access",
    body: "Owners, office staff, and operators can be scoped to the parts of the workspace they actually need.",
  },
  {
    title: "Operational monitoring",
    body: "Workflow activity, delivery status, and system health are tracked so issues can be surfaced quickly.",
  },
  {
    title: "Messaging compliance aware",
    body: "The product is designed around lawful business messaging and carrier-aware operational practices.",
  },
  {
    title: "Incident communication",
    body: "If service issues affect customer communication, NexaOS should provide clear updates and recovery guidance.",
  },
  {
    title: "Audit-friendly workflow logs",
    body: "Lead activity and workflow events are stored as structured records for operational review and troubleshooting.",
  },
];

const Trust = () => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-section" style={{ paddingTop: "72px" }}>
          <header className="nexa-section-head">
            <div className="nexa-eyebrow">Trust &amp; Security</div>
            <h1 className="nexa-h1">Built for reliable contractor operations, not a fragile demo stack.</h1>
            <p className="nexa-hero-sub">
              NexaOS handles missed-call recovery, customer messaging, and lead handoff in a way that prioritizes
              stable delivery, access control, and clear operational visibility.
            </p>
          </header>

          <div className="nexa-grid nexa-grid-3">
            {trustCards.map((card) => (
              <article key={card.title} className="nexa-card">
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="nexa-section nexa-section-soft">
          <header className="nexa-section-head">
            <h2 className="nexa-h2">What this page is and is not</h2>
          </header>
          <div className="nexa-grid nexa-grid-2">
            <article className="nexa-card">
              <h3>What it covers</h3>
              <p>
                High-level operating principles for security, uptime, messaging compliance, and internal controls.
              </p>
            </article>
            <article className="nexa-card">
              <h3>What it does not cover</h3>
              <p>
                It does not claim certifications, SLAs, or formal compliance attestations that are not explicitly documented.
              </p>
            </article>
          </div>
        </section>

        <section className="nexa-footer-cta">
          <h2 className="nexa-h2">Need a deeper technical review?</h2>
          <p className="nexa-hero-sub">
            We can walk through infrastructure, data handling, and rollout questions during your demo.
          </p>
          <Link className="nexa-btn nexa-btn-primary" to="/demo">
            Book Demo
          </Link>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Trust;
