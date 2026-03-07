import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import "./Marketing.css";

const LegalPrivacy = () => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />
      <main id="main-content">
        <section className="nexa-section nexa-legal">
          <header className="nexa-section-head">
            <div className="nexa-eyebrow">Legal</div>
            <h1 className="nexa-h1">Privacy Policy</h1>
            <p className="nexa-hero-sub">
              This page explains, at a high level, how NexaOS handles business contact data and
              customer communication records.
            </p>
          </header>

          <div className="nexa-legal__content">
            <section>
              <h2>Information we handle</h2>
              <p>
                NexaOS stores account details, workspace settings, lead records, message history,
                and workflow activity needed to operate missed-call recovery and review workflows.
              </p>
            </section>

            <section>
              <h2>How information is used</h2>
              <p>
                We use this information to route missed calls, send SMS follow-up, create dispatch-ready
                lead records, support account administration, and maintain product reliability.
              </p>
            </section>

            <section>
              <h2>Access and retention</h2>
              <p>
                Workspace access is limited to authorized users. Records are retained only as long as
                needed for product operation, support, legal obligations, and customer-requested history.
              </p>
            </section>

            <section>
              <h2>Third-party services</h2>
              <p>
                NexaOS relies on infrastructure providers for messaging, payments, hosting, and analytics.
                Those providers process limited data needed to deliver their service.
              </p>
            </section>

            <section>
              <h2>Questions</h2>
              <p>
                If you need a full data-handling review for procurement or legal review, use the demo route
                and request a trust walkthrough.
              </p>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default LegalPrivacy;
