import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import "./Marketing.css";

const LegalTerms = () => {
  useMarketingPage();

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />
      <main id="main-content">
        <section className="nexa-section nexa-legal">
          <header className="nexa-section-head">
            <div className="nexa-eyebrow">Legal</div>
            <h1 className="nexa-h1">Terms of Service</h1>
            <p className="nexa-hero-sub">
              These summary terms outline the general operating model for using NexaOS. They are not a
              substitute for a formal customer agreement.
            </p>
          </header>

          <div className="nexa-legal__content">
            <section>
              <h2>Service scope</h2>
              <p>
                NexaOS provides software for missed-call recovery, lead qualification, pipeline tracking,
                review workflows, and related operational tooling for local service businesses.
              </p>
            </section>

            <section>
              <h2>Customer responsibilities</h2>
              <p>
                Customers are responsible for lawful use of phone numbers, message content, internal user access,
                and compliance with carrier and regional communication rules.
              </p>
            </section>

            <section>
              <h2>Billing and cancellation</h2>
              <p>
                Standard plans are billed month-to-month unless a separate agreement states otherwise. Paid service
                can be canceled at the end of the current billing period.
              </p>
            </section>

            <section>
              <h2>Availability</h2>
              <p>
                NexaOS is provided on a commercially reasonable basis. We work to maintain uptime and communicate
                material incidents, but no consumer-facing summary page can replace a negotiated SLA where one is required.
              </p>
            </section>

            <section>
              <h2>Support</h2>
              <p>
                Support levels vary by plan. Higher tiers may include faster response times, onboarding support, and
                custom implementation assistance.
              </p>
            </section>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};

export default LegalTerms;
