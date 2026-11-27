import React, { useState, useEffect, useRef } from "react";
import { FiRefreshCw, FiLogOut, FiChevronDown, FiShield } from "react-icons/fi";
import "./AdminNavbar.css";

const PAGE_TITLES = {
  overview: "Overview",
  leads: "Sales Leads",
  properties: "Properties",
  tenants: "Tenants",
  subscriptions: "Subscriptions",
  system: "System Health",
  settings: "Settings",
};

const AdminNavbar = ({
  collapsed,
  activePage = "overview",
  setActivePage,
  onRefresh,
  isRefreshing = false,
  onLogout,
}) => {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  // Retrieve logged-in admin email from session
  const adminEmail = (() => {
    try {
      const raw = localStorage.getItem("stayops_admin_session");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.email) return parsed.email;
      }
    } catch {}
    return "admin@stayops.in";
  })();

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileOpen) return;
    const handleOutsideClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [profileOpen]);

  const currentTitle = PAGE_TITLES[activePage] || "Console";

  return (
    <header className={`admin-navbar ${collapsed ? "navbar-collapsed" : ""}`}>
      {/* Left: Clean Breadcrumbs */}
      <nav className="admin-navbar__breadcrumbs" aria-label="Breadcrumb">
        <span className="admin-navbar__crumb admin-navbar__crumb--root">
          StayOps
        </span>
        <span className="admin-navbar__crumb-sep">/</span>

        {activePage === "tenant-detail" ? (
          <>
            <button
              type="button"
              className="admin-navbar__crumb admin-navbar__crumb--link"
              onClick={() => setActivePage && setActivePage("tenants")}
            >
              Tenants
            </button>
            <span className="admin-navbar__crumb-sep">/</span>
            <span className="admin-navbar__crumb admin-navbar__crumb--current">
              Account Details
            </span>
          </>
        ) : activePage === "property-detail" ? (
          <>
            <button
              type="button"
              className="admin-navbar__crumb admin-navbar__crumb--link"
              onClick={() => setActivePage && setActivePage("properties")}
            >
              Properties
            </button>
            <span className="admin-navbar__crumb-sep">/</span>
            <span className="admin-navbar__crumb admin-navbar__crumb--current">
              Property Details
            </span>
          </>
        ) : activePage === "lead-detail" ? (
          <>
            <button
              type="button"
              className="admin-navbar__crumb admin-navbar__crumb--link"
              onClick={() => setActivePage && setActivePage("leads")}
            >
              Sales Leads
            </button>
            <span className="admin-navbar__crumb-sep">/</span>
            <span className="admin-navbar__crumb admin-navbar__crumb--current">
              Lead Details
            </span>
          </>
        ) : (
          <span className="admin-navbar__crumb admin-navbar__crumb--current">
            {currentTitle}
          </span>
        )}
      </nav>

      {/* Right: Status, Refresh & Minimal Profile */}
      <div className="admin-navbar__actions">
        {/* Subtle Operational Status */}
        <div
          className="admin-navbar__status"
          title="All platform services are operational"
        >
          <span className="admin-navbar__status-dot" />
          <span className="admin-navbar__status-text">Operational</span>
        </div>

        {/* Sync/Refresh Action */}
        <button
          type="button"
          className={`admin-navbar__icon-btn ${isRefreshing ? "is-spinning" : ""}`}
          onClick={onRefresh}
          title="Refresh metrics & sync"
          aria-label="Refresh"
          disabled={isRefreshing}
        >
          <FiRefreshCw size={14} />
        </button>

        <div className="admin-navbar__divider" />

        {/* Minimal Profile Dropdown */}
        <div className="admin-navbar__profile-wrap" ref={profileRef}>
          <button
            type="button"
            className={`admin-navbar__profile-btn ${profileOpen ? "is-open" : ""}`}
            onClick={() => setProfileOpen((prev) => !prev)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
          >
            <div className="admin-navbar__avatar">
              <span>{adminEmail.charAt(0).toUpperCase()}</span>
            </div>
            <span className="admin-navbar__email">{adminEmail}</span>
            <FiChevronDown
              size={13}
              className={`admin-navbar__chevron ${profileOpen ? "is-flipped" : ""}`}
            />
          </button>

          {profileOpen && (
            <div className="admin-navbar__dropdown">
              <div className="admin-navbar__dropdown-header">
                <div className="admin-navbar__dropdown-identity">
                  <FiShield size={13} className="admin-navbar__shield-icon" />
                  <span className="admin-navbar__dropdown-role">Super Admin</span>
                </div>
                <span className="admin-navbar__dropdown-email">{adminEmail}</span>
              </div>

              <div className="admin-navbar__dropdown-divider" />

              <button
                type="button"
                className="admin-navbar__dropdown-item admin-navbar__dropdown-item--danger"
                onClick={() => {
                  setProfileOpen(false);
                  if (onLogout) onLogout();
                }}
              >
                <FiLogOut size={13} />
                <span>Sign out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
