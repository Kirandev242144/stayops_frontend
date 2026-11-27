import React, { useState, useEffect } from "react";
import AdminLayout from "./components/layout/AdminLayout";
import AdminOverview from "./modules/Overview/AdminOverview";
import AdminProperties from "./modules/Properties/AdminProperties";
import PropertyDetailPage from "./modules/Properties/components/PropertyDetailPage";
import AdminTenants from "./modules/Tenants/AdminTenants";
import TenantDetailPage from "./modules/Tenants/components/TenantDetailPage";
import AdminLeads from "./modules/Leads/AdminLeads";
import LeadDetails from "./modules/Leads/LeadDetails";
import AdminSubscriptions from "./modules/Subscriptions/AdminSubscriptions";
import AdminSystemHealth from "./modules/SystemHealth/AdminSystemHealth";
import AdminSettings from "./modules/Settings/AdminSettings";
import Logo from "../../assets/logo/stayops-logo.png";
import { FiLock, FiMail, FiShield, FiArrowRight } from "react-icons/fi";
import { toast } from "react-toastify";
import "./AdminPanel.css";

const ADMIN_TOKEN_KEY = "stayops_admin_session";

const AdminPanel = () => {
  const [activePage, setActivePage] = useState("overview");
  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return Boolean(localStorage.getItem(ADMIN_TOKEN_KEY));
  });

  // Default credentials ready for immediate login
  const [loginEmail, setLoginEmail] = useState("admin@stayops.in");
  const [loginPassword, setLoginPassword] = useState("admin123");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync title
  useEffect(() => {
    document.title = "StayOps Admin Console";
  }, []);

  const handleAdminLogin = (e) => {
    e.preventDefault();

    const email = (loginEmail || "admin@stayops.in").trim();
    const password = (loginPassword || "admin123").trim();

    setIsSubmitting(true);

    setTimeout(() => {
      // Store dedicated admin session
      localStorage.setItem(
        ADMIN_TOKEN_KEY,
        JSON.stringify({
          role: "SUPER_ADMIN",
          email: email,
          loginAt: new Date().toISOString(),
        })
      );
      setIsAuthenticated(true);
      setIsSubmitting(false);
      toast.success("Welcome to StayOps Platform Console!");
    }, 300);
  };

  const handleAdminLogout = () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    setIsAuthenticated(false);
    toast.info("Signed out of Admin Console.");
  };

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Platform metrics refreshed.");
    }, 600);
  };

  // If not logged in, render the dedicated, isolated Admin Login portal
  if (!isAuthenticated) {
    return (
      <div className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-header">
            <img src={Logo} alt="StayOps" className="admin-login-logo" />
            <div className="admin-login-badge-wrap">
              <span className="admin-login-badge">
                <FiShield size={12} />
                <span>PLATFORM ADMIN CONSOLE</span>
              </span>
            </div>
            <h1 className="admin-login-title">Sign in to Admin Console</h1>
            <p className="admin-login-subtitle">
              Restricted portal for StayOps founders, operators, and platform engineers.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="admin-login-form">
            <div className="admin-form-group">
              <label htmlFor="admin-email">Admin Email Address</label>
              <div className="admin-input-wrapper">
                <FiMail className="admin-input-icon" size={16} />
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@stayops.in"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label htmlFor="admin-password">Master Security Key</label>
              <div className="admin-input-wrapper">
                <FiLock className="admin-input-icon" size={16} />
                <input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="admin-login-btn"
              disabled={isSubmitting}
            >
              <span>{isSubmitting ? "Authenticating..." : "Access Admin Console"}</span>
              <FiArrowRight size={16} />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout
      activePage={activePage}
      setActivePage={setActivePage}
      onLogout={handleAdminLogout}
      onRefresh={handleManualRefresh}
      isRefreshing={isRefreshing}
    >
      {activePage === "overview" && (
        <AdminOverview onNavigate={setActivePage} />
      )}
      {activePage === "leads" && (
        <AdminLeads
          onViewLeadDetail={(leadId) => {
            setSelectedLeadId(leadId);
            setActivePage("lead-detail");
          }}
        />
      )}
      {activePage === "lead-detail" && (
        <LeadDetails
          leadId={selectedLeadId}
          onBack={() => setActivePage("leads")}
          onNavigateToTenant={(tenantId) => {
            setSelectedTenantId(tenantId);
            setActivePage("tenant-detail");
          }}
        />
      )}
      {activePage === "properties" && (
        <AdminProperties
          onViewPropertyDetail={(propertyId) => {
            setSelectedPropertyId(propertyId);
            setActivePage("property-detail");
          }}
          onNavigateToTenant={(tenantId) => {
            setSelectedTenantId(tenantId);
            setActivePage("tenant-detail");
          }}
        />
      )}
      {activePage === "property-detail" && (
        <PropertyDetailPage
          propertyId={selectedPropertyId}
          onBack={() => setActivePage("properties")}
          onNavigateToTenant={(tenantId) => {
            setSelectedTenantId(tenantId);
            setActivePage("tenant-detail");
          }}
        />
      )}
      {activePage === "tenants" && (
        <AdminTenants
          onViewDetail={(tenantId) => {
            setSelectedTenantId(tenantId);
            setActivePage("tenant-detail");
          }}
        />
      )}
      {activePage === "tenant-detail" && (
        <TenantDetailPage
          tenantId={selectedTenantId}
          onBack={() => setActivePage("tenants")}
          onNavigateToProperty={(propId) => {
            setSelectedPropertyId(propId);
            setActivePage("property-detail");
          }}
        />
      )}
      {activePage === "subscriptions" && <AdminSubscriptions />}
      {activePage === "system" && <AdminSystemHealth />}
      {activePage === "settings" && <AdminSettings />}
    </AdminLayout>
  );
};

export default AdminPanel;
