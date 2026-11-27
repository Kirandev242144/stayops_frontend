import React, { useState } from "react";
import "./Settings.css";

import GeneralSettings from "./sections/GeneralSettings";
import PaymentSettings from "./sections/PaymentSettings";
import NotificationSettings from "./sections/NotificationSettings";
import PoliciesSettings from "./sections/PoliciesSettings";
import TaxSettings from "./sections/TaxSettings";
import PaymentLogsSettings from "./sections/PaymentLogsSettings";
import SubscriptionBillingSettings from "./sections/SubscriptionBillingSettings";
import TelegramSettings from "./sections/TelegramSettings";

const SETTINGS_SECTIONS = [
  {
    id: "general",
    label: "General",
    description: "Business and account details",
  },
  {
    id: "subscription",
    label: "Subscription & Plan",
    description: "SaaS plan, upgrade & invoices",
  },
  {
    id: "payments",
    label: "Guest Payments",
    description: "Frontdesk & storefront gateway",
  },
  {
    id: "taxes",
    label: "Taxes & GST",
    description: "GSTIN, tax slabs & service charges",
  },
  {
    id: "policies",
    label: "Policies",
    description: "Cancellation, refund & stay rules",
  },
  {
    id: "logs",
    label: "Payment Logs",
    description: "Transaction audit trail & gateway logs",
  },
  {
    id: "notifications",
    label: "Notifications",
    description: "Email, WhatsApp and alerts",
  },
  {
    id: "telegram",
    label: "Telegram Bot",
    description: "Custom branded bot, direct booking & alerts",
  },
];

const Settings = () => {
  const [activeSection, setActiveSection] = useState("general");

  const renderActiveSection = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;

      case "subscription":
        return <SubscriptionBillingSettings />;

      case "payments":
        return <PaymentSettings />;

      case "taxes":
        return <TaxSettings />;

      case "policies":
        return <PoliciesSettings />;

      case "logs":
        return <PaymentLogsSettings />;

      case "notifications":
        return <NotificationSettings />;

      case "telegram":
        return <TelegramSettings />;

      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="settings-page">
      <header className="settings-page-header">
        <h1>Settings</h1>
        <p>
          Manage your StayOps property account, payment gateway, cancellation policies,
          and integrations.
        </p>
      </header>

      <div className="settings-layout">
        {/* SETTINGS MENU */}
        <aside className="settings-sidebar">
          <div className="settings-sidebar-title">
            SETTINGS
          </div>

          <nav>
            {SETTINGS_SECTIONS.map((section) => (
              <button
                key={section.id}
                type="button"
                className={
                  activeSection === section.id
                    ? "settings-nav-item active"
                    : "settings-nav-item"
                }
                onClick={() => setActiveSection(section.id)}
              >
                <span className="settings-nav-label">
                  {section.label}
                </span>

                <span className="settings-nav-description">
                  {section.description}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        {/* ACTIVE SETTINGS CONTENT */}
        <main className="settings-content">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  );
};

export default Settings;