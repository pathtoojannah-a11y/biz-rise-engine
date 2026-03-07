import React, { useState } from "react";
import { Link } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import { useToast } from "@/hooks/use-toast";
import "./Marketing.css";

const DemoBooking = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    tradeType: "HVAC",
    companySize: "1-5",
  });

  useMarketingPage();

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    toast({
      title: "Demo request received",
      description: "We will contact you to schedule a workflow walkthrough.",
    });
  };

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-section" style={{ paddingTop: "72px" }}>
          <div className="nexa-grid nexa-grid-2">
            <div className="nexa-card nexa-demo-value">
              <div className="nexa-eyebrow">Book Demo</div>
              <h1 className="nexa-h1">See where missed calls are costing booked jobs.</h1>
              <p className="nexa-hero-sub">
                In about 15 minutes, we will map your current call flow and show how instant follow-up,
                qualification, and dispatch-ready handoff would look for your team.
              </p>

              <div className="nexa-demo-benefits">
                <div>
                  <h3>Missed-call follow-up walkthrough</h3>
                  <p>Review the exact text-back sequence and qualification prompts your office can run.</p>
                </div>
                <div>
                  <h3>Dispatch handoff preview</h3>
                  <p>See how qualified leads arrive ready for booking instead of buried in voicemail and inbox threads.</p>
                </div>
                <div>
                  <h3>Pricing and launch path</h3>
                  <p>We will show the fastest setup path based on trade, team size, and current call volume.</p>
                </div>
              </div>

              <div className="nexa-hero-actions">
                <Link className="nexa-inline-link" to="/pricing">
                  Prefer to compare plans first? View pricing
                </Link>
              </div>
            </div>

            <div className="nexa-card">
              <h2 className="nexa-h2" style={{ fontSize: "2rem" }}>Request your demo</h2>

              <form className="nexa-form-stack" onSubmit={handleSubmit}>
                <div className="nexa-form-grid">
                  <div>
                    <label htmlFor="firstName">First name</label>
                    <input
                      id="firstName"
                      required
                      type="text"
                      value={formData.firstName}
                      onChange={(event) => setFormData({ ...formData, firstName: event.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName">Last name</label>
                    <input
                      id="lastName"
                      required
                      type="text"
                      value={formData.lastName}
                      onChange={(event) => setFormData({ ...formData, lastName: event.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="companyName">Company name</label>
                  <input
                    id="companyName"
                    required
                    type="text"
                    value={formData.companyName}
                    onChange={(event) => setFormData({ ...formData, companyName: event.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="email">Work email</label>
                  <input
                    id="email"
                    required
                    type="email"
                    value={formData.email}
                    onChange={(event) => setFormData({ ...formData, email: event.target.value })}
                  />
                </div>

                <div className="nexa-form-grid">
                  <div>
                    <label htmlFor="phone">Direct phone</label>
                    <input
                      id="phone"
                      required
                      type="tel"
                      value={formData.phone}
                      onChange={(event) => setFormData({ ...formData, phone: event.target.value })}
                    />
                  </div>
                  <div>
                    <label htmlFor="tradeType">Primary trade</label>
                    <select
                      id="tradeType"
                      value={formData.tradeType}
                      onChange={(event) => setFormData({ ...formData, tradeType: event.target.value })}
                    >
                      <option value="HVAC">HVAC</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="Electrical">Electrical</option>
                      <option value="Roofing">Roofing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="companySize">Company size</label>
                  <select
                    id="companySize"
                    value={formData.companySize}
                    onChange={(event) => setFormData({ ...formData, companySize: event.target.value })}
                  >
                    <option value="1-5">1-5 employees</option>
                    <option value="6-15">6-15 employees</option>
                    <option value="16-30">16-30 employees</option>
                    <option value="31+">31+ employees</option>
                  </select>
                </div>

                <button type="submit" className="nexa-btn nexa-btn-primary">
                  Request Demo
                </button>
                <p className="nexa-helper-text">
                  By submitting, you agree to our standard terms and data handling policy.
                </p>
              </form>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default DemoBooking;
