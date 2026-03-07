import { Link } from "react-router-dom";
import "@/pages/Marketing.css";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";

type IndustryComingSoonProps = {
  eyebrow: string;
  title: string;
  description: string;
};

const IndustryComingSoon = ({ eyebrow, title, description }: IndustryComingSoonProps) => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />
      <main id="main-content">
        <section className="nexa-section" style={{ paddingTop: "72px" }}>
          <header className="nexa-section-head">
            <div className="nexa-eyebrow">{eyebrow}</div>
            <h1 className="nexa-h1">{title}</h1>
            <p className="nexa-hero-sub">{description}</p>
          </header>

          <div className="nexa-coming-soon-shell">
            <div className="nexa-coming-soon-shell__badge">Coming Soon</div>
            <h2 className="nexa-h2">Same engine, trade-specific workflow next.</h2>
            <p>
              NexaOS is expanding the missed-call recovery flow beyond HVAC with trade-specific copy,
              qualification prompts, and dispatch handoff for {eyebrow.toLowerCase()} teams.
            </p>
            <div className="nexa-hero-actions" style={{ justifyContent: "center" }}>
              <Link className="nexa-btn nexa-btn-primary" to="/demo">
                Book Demo
              </Link>
              <Link className="nexa-btn nexa-btn-ghost" to="/industry/hvac">
                View HVAC Page
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default IndustryComingSoon;
