import "./HelpCenterNavbar.css";
import Container from "../../common/Container/Container";
import logo from "../../../assets/logo/stayops-logo.png";
import { HiOutlineViewGrid } from "react-icons/hi";
import { FiExternalLink, FiSearch } from "react-icons/fi";
import { LuLifeBuoy } from "react-icons/lu";
import { Link } from "react-router-dom";

function HelpCenterNavbar({ onFocusSearch }) {
  const scrollToCategories = () => {
    const el = document.getElementById("hc-categories-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToSupport = () => {
    const el = document.getElementById("hc-support-section");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <header className="hc-navbar">
      <Container>
        <div className="hc-navbar-inner">
          <div className="hc-nav-left">
            <Link to="/help" className="hc-logo-link">
              <img src={logo} alt="StayOps" className="hc-logo" />
            </Link>
            <span className="hc-divider">/</span>
            <div className="hc-badge">
              <span className="hc-badge-glow"></span>
              HELP CENTER
            </div>
          </div>

          <div className="hc-nav-center">
            <button className="hc-nav-item" onClick={scrollToCategories} title="Browse knowledge categories">
              <HiOutlineViewGrid className="hc-nav-icon" />
              <span className="hc-nav-text">All Categories</span>
            </button>
            {onFocusSearch && (
              <button className="hc-nav-search-btn" onClick={onFocusSearch} title="Quick Search">
                <FiSearch className="hc-nav-search-icon" />
                <span>Search docs...</span>
                <kbd className="hc-kbd">⌘K</kbd>
              </button>
            )}
          </div>

          <div className="hc-nav-right">
            <div className="hc-status-chip" title="All StayOps Cloud & OTA sync services are running normally">
              <span className="hc-status-dot">
                <span className="hc-status-ping"></span>
              </span>
              <span className="hc-status-text">All Systems Operational</span>
            </div>

            <button className="hc-support-btn" onClick={scrollToSupport}>
              <LuLifeBuoy className="hc-support-icon" />
              <span>Get Support</span>
            </button>

            <Link to="/dashboard" className="hc-mainapp-link">
              <button className="hc-mainapp-btn">
                <span>Dashboard</span>
                <FiExternalLink className="hc-mainapp-icon" />
              </button>
            </Link>
          </div>
        </div>
      </Container>
    </header>
  );
}

export default HelpCenterNavbar;