import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../../pages/Marketing.css";

type MenuKey = "product" | "industries" | "resources";

const menuItems: Record<
  MenuKey,
  Array<{ to?: string; title: string; description: string; disabled?: boolean }>
> = {
  product: [
    {
      to: "/product/lead-recovery",
      title: "Lead Recovery",
      description: "Reply to missed calls in seconds",
    },
    {
      to: "/product/pipeline",
      title: "Pipeline Ops",
      description: "Keep jobs moving without manual follow-up",
    },
    {
      to: "/product/reputation",
      title: "Reputation Engine",
      description: "Request and route reviews automatically",
    },
  ],
  industries: [
    {
      to: "/industry/hvac",
      title: "HVAC",
      description: "Handle seasonal spikes without losing leads",
    },
    { title: "Plumbing", description: "Coming soon", disabled: true },
    { title: "Electrical", description: "Coming soon", disabled: true },
    { title: "Roofing", description: "Coming soon", disabled: true },
  ],
  resources: [
    {
      to: "/resources/roi-calculator",
      title: "ROI Calculator",
      description: "Estimate recovered monthly revenue",
    },
    {
      to: "/trust",
      title: "Trust",
      description: "Security and platform reliability",
    },
  ],
};

const GlobalNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;

  const renderMenu = (key: MenuKey) => {
    const isOpen = openMenu === key;
    const label = key === "product" ? "Product" : key === "industries" ? "Industries" : "Resources";

    return (
      <div className="nexa-dropdown-wrapper">
        <button
          type="button"
          className="nexa-nav-item"
          aria-haspopup="menu"
          aria-expanded={isOpen}
          aria-controls={`nexa-menu-${key}`}
          onClick={() => setOpenMenu((prev) => (prev === key ? null : key))}
        >
          {label}
          <span className={`nexa-chevron ${isOpen ? "open" : ""}`}>▾</span>
        </button>
        <div id={`nexa-menu-${key}`} className={`nexa-dropdown-content ${isOpen ? "open" : ""}`}>
          {menuItems[key].map((item) =>
            item.disabled ? (
              <div key={item.title} className="nexa-dropdown-link disabled" aria-disabled="true">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </div>
            ) : (
              <Link key={item.title} to={item.to || "#"} className="nexa-dropdown-link">
                <strong>{item.title}</strong>
                <span>{item.description}</span>
              </Link>
            ),
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <a className="nexa-skip-link" href="#main-content">
        Skip to content
      </a>

      <nav ref={navRef} className={`nexa-nav ${scrolled ? "scrolled" : ""}`}>
        <Link to="/" className="nexa-logo" aria-label="NexaOS Home">
          Nexa<span>OS</span>
        </Link>

        <div className="nexa-nav-mobile-actions">
          <Link className="nexa-btn nexa-btn-primary nexa-mobile-demo" to="/demo">
            Book Demo
          </Link>
          <button
            type="button"
            className="nexa-mobile-toggle"
            aria-expanded={mobileOpen}
            aria-controls="nexa-mobile-nav"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            Menu
          </button>
        </div>

        <div className="nexa-nav-desktop">
          {renderMenu("product")}
          {renderMenu("industries")}
          <Link className={`nexa-nav-link ${isActive("/pricing") ? "active" : ""}`} to="/pricing">
            Pricing
          </Link>
          {renderMenu("resources")}
          <Link className="nexa-btn nexa-btn-ghost nexa-nav-auth" to="/login">
            Log In
          </Link>
          <Link className="nexa-btn nexa-btn-primary" to="/demo">
            Book Demo
          </Link>
        </div>

        <div id="nexa-mobile-nav" className={`nexa-mobile-panel ${mobileOpen ? "open" : ""}`}>
          <div className="nexa-mobile-section">
            <div className="nexa-mobile-heading">Product</div>
            {menuItems.product.map((item) => (
              <Link key={item.title} to={item.to || "#"} className="nexa-mobile-link">
                {item.title}
              </Link>
            ))}
          </div>
          <div className="nexa-mobile-section">
            <div className="nexa-mobile-heading">Industries</div>
            {menuItems.industries.map((item) =>
              item.disabled ? (
                <span key={item.title} className="nexa-mobile-link disabled" aria-disabled="true">
                  {item.title} (Coming Soon)
                </span>
              ) : (
                <Link key={item.title} to={item.to || "#"} className="nexa-mobile-link">
                  {item.title}
                </Link>
              ),
            )}
          </div>
          <Link to="/pricing" className="nexa-mobile-link">
            Pricing
          </Link>
          <div className="nexa-mobile-section">
            <div className="nexa-mobile-heading">Resources</div>
            {menuItems.resources.map((item) => (
              <Link key={item.title} to={item.to || "#"} className="nexa-mobile-link">
                {item.title}
              </Link>
            ))}
          </div>
          <div className="nexa-mobile-actions">
            <Link className="nexa-btn nexa-btn-ghost" to="/login">
              Log In
            </Link>
            <Link className="nexa-btn nexa-btn-primary" to="/demo">
              Book Demo
            </Link>
          </div>
        </div>
      </nav>
    </>
  );
};

export default GlobalNavbar;
