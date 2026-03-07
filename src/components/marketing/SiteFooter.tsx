import { Link } from "react-router-dom";
import "../../pages/Marketing.css";

const SiteFooter = () => {
  return (
    <footer className="nexa-site-footer">
      <div className="nexa-site-footer__inner">
        <div>
          <Link to="/" className="nexa-logo" aria-label="NexaOS home">
            Nexa<span>OS</span>
          </Link>
          <p className="nexa-site-footer__tagline">
            Revenue recovery for contractors who cannot afford to lose the next call.
          </p>
        </div>

        <div className="nexa-site-footer__grid">
          <div>
            <h3>Product</h3>
            <Link to="/product/lead-recovery">Lead Recovery</Link>
            <Link to="/product/pipeline">Pipeline</Link>
            <Link to="/product/reputation">Reputation</Link>
          </div>

          <div>
            <h3>Company</h3>
            <Link to="/pricing">Pricing</Link>
            <Link to="/trust">Trust &amp; Security</Link>
            <Link to="/demo">Contact</Link>
          </div>

          <div>
            <h3>Legal</h3>
            <Link to="/legal/privacy">Privacy Policy</Link>
            <Link to="/legal/terms">Terms of Service</Link>
          </div>

          <div>
            <h3>Industries</h3>
            <Link to="/industry/hvac">HVAC</Link>
            <span>Plumbing (Coming Soon)</span>
            <span>Electrical (Coming Soon)</span>
            <span>Roofing (Coming Soon)</span>
          </div>
        </div>
      </div>

      <div className="nexa-site-footer__bottom">NexaOS 2026. All rights reserved.</div>
    </footer>
  );
};

export default SiteFooter;
