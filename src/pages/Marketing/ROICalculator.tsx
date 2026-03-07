import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import GlobalNavbar from "@/components/marketing/GlobalNavbar";
import SiteFooter from "@/components/marketing/SiteFooter";
import { useMarketingPage } from "@/hooks/useMarketingPage";
import "../Marketing.css";

const ROICalculator = () => {
  const [callsPerMonth, setCallsPerMonth] = useState(150);
  const [missedRate, setMissedRate] = useState(30);
  const [recoveryRate, setRecoveryRate] = useState(40);
  const [closeRate, setCloseRate] = useState(25);
  const [jobValue, setJobValue] = useState(1200);

  useMarketingPage();

  const model = useMemo(() => {
    const missedCalls = Math.round(callsPerMonth * (missedRate / 100));
    const recoveredLeads = Math.round(missedCalls * (recoveryRate / 100));
    const newJobs = Math.floor(recoveredLeads * (closeRate / 100));
    const monthlyRevenue = newJobs * jobValue;
    const annualRevenue = monthlyRevenue * 12;

    return { missedCalls, recoveredLeads, newJobs, monthlyRevenue, annualRevenue };
  }, [callsPerMonth, missedRate, recoveryRate, closeRate, jobValue]);

  return (
    <div className="nexa-marketing-page">
      <GlobalNavbar />

      <main id="main-content">
        <section className="nexa-section" style={{ paddingTop: "72px" }}>
          <header className="nexa-section-head">
            <div className="nexa-eyebrow">ROI Calculator</div>
            <h1 className="nexa-h1">Estimate recovered revenue from missed calls.</h1>
            <p className="nexa-hero-sub">
              Use your own assumptions to model possible upside. This tool is directional and not a performance guarantee.
            </p>
          </header>

          <div className="nexa-grid nexa-grid-2">
            <article className="nexa-card">
              <div className="nexa-range-group">
                <label htmlFor="callsPerMonth">Inbound calls per month: {callsPerMonth}</label>
                <input id="callsPerMonth" type="range" min="50" max="1000" step="10" value={callsPerMonth} onChange={(event) => setCallsPerMonth(Number(event.target.value))} />
              </div>

              <div className="nexa-range-group">
                <label htmlFor="missedRate">Missed-call rate: {missedRate}%</label>
                <input id="missedRate" type="range" min="5" max="80" step="5" value={missedRate} onChange={(event) => setMissedRate(Number(event.target.value))} />
              </div>

              <div className="nexa-range-group">
                <label htmlFor="recoveryRate">Recovery rate assumption: {recoveryRate}%</label>
                <input id="recoveryRate" type="range" min="10" max="90" step="5" value={recoveryRate} onChange={(event) => setRecoveryRate(Number(event.target.value))} />
              </div>

              <div className="nexa-range-group">
                <label htmlFor="closeRate">Close rate on recovered leads: {closeRate}%</label>
                <input id="closeRate" type="range" min="5" max="70" step="5" value={closeRate} onChange={(event) => setCloseRate(Number(event.target.value))} />
              </div>

              <div className="nexa-range-group">
                <label htmlFor="jobValue">Average job value: ${jobValue.toLocaleString()}</label>
                <input id="jobValue" type="range" min="200" max="10000" step="100" value={jobValue} onChange={(event) => setJobValue(Number(event.target.value))} />
              </div>
            </article>

            <article className="nexa-card nexa-roi-summary">
              <h3>Estimated monthly impact</h3>
              <div className="nexa-roi-summary__value">${model.monthlyRevenue.toLocaleString()}</div>
              <p>Estimated monthly recovered revenue</p>

              <div className="nexa-grid nexa-grid-2">
                <div className="nexa-card nexa-roi-mini-card">
                  <strong>{model.missedCalls}</strong>
                  <span>Missed calls</span>
                </div>
                <div className="nexa-card nexa-roi-mini-card">
                  <strong>{model.recoveredLeads}</strong>
                  <span>Recovered leads</span>
                </div>
                <div className="nexa-card nexa-roi-mini-card">
                  <strong>{model.newJobs}</strong>
                  <span>Estimated jobs booked</span>
                </div>
                <div className="nexa-card nexa-roi-mini-card">
                  <strong>${model.annualRevenue.toLocaleString()}</strong>
                  <span>Annualized upside</span>
                </div>
              </div>

              <div className="nexa-hero-actions" style={{ marginTop: "20px" }}>
                <Link className="nexa-btn nexa-btn-primary" to="/demo">
                  Book Demo
                </Link>
                <Link className="nexa-btn nexa-btn-ghost" to="/pricing">
                  View Pricing
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
};

export default ROICalculator;
