import React, { useState } from "react";
import { FiSave, FiAlertTriangle, FiBell, FiShield, FiSliders } from "react-icons/fi";
import { toast } from "react-toastify";
import "./AdminSettings.css";

const AdminSettings = () => {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [trialDays, setTrialDays] = useState(14);
  const [supportEmail, setSupportEmail] = useState("support@stayops.in");
  const [bannerMessage, setBannerMessage] = useState("");
  const [bannerActive, setBannerActive] = useState(false);
  const [require2FA, setRequire2FA] = useState(true);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    toast.success("Platform settings successfully saved & synchronized!");
  };

  return (
    <div className="admin-settings">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <span className="admin-page-badge">GLOBAL CONFIGURATION</span>
          <h1 className="admin-page-title">Platform Settings</h1>
          <p className="admin-page-subtitle">
            Configure system-wide parameters, default trial entitlements, security policies, and maintenance toggles.
          </p>
        </div>

        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={handleSaveSettings}
        >
          <FiSave size={15} />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="admin-settings-form">
        {/* Section 1: SaaS Trial & Onboarding Defaults */}
        <div className="admin-settings-card">
          <div className="admin-settings-card__header">
            <div className="settings-icon-wrap">
              <FiSliders size={16} />
            </div>
            <div>
              <h2 className="admin-settings-card__title">SaaS Trial & Entitlements</h2>
              <p className="admin-settings-card__subtitle">Default configuration for newly registered property owners</p>
            </div>
          </div>

          <div className="admin-settings-card__body">
            <div className="settings-form-row">
              <div className="settings-form-group">
                <label htmlFor="trial-days-input" className="settings-label">
                  Default Free Trial Duration
                </label>
                <div className="settings-input-affix">
                  <input
                    id="trial-days-input"
                    type="number"
                    min="1"
                    max="90"
                    value={trialDays}
                    onChange={(e) => setTrialDays(e.target.value)}
                    className="settings-input"
                  />
                  <span className="settings-affix">Days</span>
                </div>
                <span className="settings-hint">
                  Standard trial duration granted to new signups on StayOps.
                </span>
              </div>

              <div className="settings-form-group">
                <label htmlFor="support-email-input" className="settings-label">
                  Global Support Email
                </label>
                <input
                  id="support-email-input"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="settings-input"
                />
                <span className="settings-hint">
                  Inquiries from hotel owners and error notifications route here.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Platform Broadcast Notification Banner */}
        <div className="admin-settings-card">
          <div className="admin-settings-card__header">
            <div className="settings-icon-wrap">
              <FiBell size={16} />
            </div>
            <div>
              <h2 className="admin-settings-card__title">Platform Broadcast Banner</h2>
              <p className="admin-settings-card__subtitle">
                Push global alert banners to all hotel PMS dashboards simultaneously
              </p>
            </div>
          </div>

          <div className="admin-settings-card__body">
            <div className="settings-form-group">
              <label htmlFor="banner-text-input" className="settings-label">
                Broadcast Message
              </label>
              <textarea
                id="banner-text-input"
                rows={2}
                value={bannerMessage}
                onChange={(e) => setBannerMessage(e.target.value)}
                placeholder="e.g., Scheduled server maintenance on Sunday at 2:00 AM IST. All sync pipelines remain unaffected."
                className="settings-textarea"
              />
            </div>

            <div className="settings-toggle-row">
              <div>
                <span className="toggle-title">Enable Broadcast Announcement</span>
                <span className="toggle-subtitle">
                  When active, a dismissable notification banner appears at the top of every tenant dashboard.
                </span>
              </div>
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={bannerActive}
                  onChange={(e) => setBannerActive(e.target.checked)}
                />
                <span className="admin-switch-slider" />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Maintenance Mode */}
        <div className="admin-settings-card">
          <div className="admin-settings-card__header">
            <div className="settings-icon-wrap is-warning">
              <FiShield size={16} />
            </div>
            <div>
              <h2 className="admin-settings-card__title">Platform Security & Maintenance</h2>
              <p className="admin-settings-card__subtitle">
                Emergency controls and tenant authentication enforcement
              </p>
            </div>
          </div>

          <div className="admin-settings-card__body">
            <div className="settings-toggle-row">
              <div>
                <span className="toggle-title">Enforce Two-Factor Authentication (2FA)</span>
                <span className="toggle-subtitle">
                  Require OTP verification for all property owners and financial staff accounts.
                </span>
              </div>
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={require2FA}
                  onChange={(e) => setRequire2FA(e.target.checked)}
                />
                <span className="admin-switch-slider" />
              </label>
            </div>

            <div className="settings-toggle-row is-danger-row">
              <div>
                <span className="toggle-title text-danger">
                  <FiAlertTriangle size={14} style={{ marginRight: "6px" }} />
                  Global Maintenance Mode
                </span>
                <span className="toggle-subtitle">
                  Locks tenant PMS logins and displays a maintenance message. Storefront guest bookings continue.
                </span>
              </div>
              <label className="admin-switch">
                <input
                  type="checkbox"
                  checked={maintenanceMode}
                  onChange={(e) => setMaintenanceMode(e.target.checked)}
                />
                <span className="admin-switch-slider" />
              </label>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminSettings;
