import React, { useState, useEffect, useCallback } from "react";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiChevronDown,
  FiSlash,
  FiCheck,
  FiAlertTriangle,
  FiClock,
  FiHome,
  FiUser,
  FiActivity,
  FiCreditCard,
  FiUsers,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  fetchTenantDetail,
  updateTenantStatus,
  extendTenantTrial,
} from "../utils/tenantUtils";
import ExtendTrialModal from "./ExtendTrialModal";
import TenantStatusModal from "./TenantStatusModal";
import InvoiceModal from "../../Subscriptions/components/InvoiceModal";
import ManualUpgradeModal from "../../Subscriptions/components/ManualUpgradeModal";
import { fetchTenantSubscriptionHistory } from "../../Subscriptions/utils/subscriptionUtils";
import "./TenantDetailPage.css";

const TABS = [
  { id: "overview", label: "Overview", icon: FiUser },
  { id: "properties", label: "Properties", icon: FiHome },
  { id: "staff", label: "Users & Staff", icon: FiUsers },
  { id: "subscription", label: "Subscription", icon: FiCreditCard },
  { id: "audit", label: "Audit Log", icon: FiActivity },
];

const TenantDetailPage = ({ tenantId, onBack, onNavigateToProperty }) => {
  const [tenant, setTenant] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [subData, setSubData] = useState(null);
  const [subLoading, setSubLoading] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const loadDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await fetchTenantDetail(tenantId);
      setTenant(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  const loadSubHistory = useCallback(async () => {
    if (!tenantId) return;
    try {
      setSubLoading(true);
      const data = await fetchTenantSubscriptionHistory(tenantId);
      setSubData(data);
    } catch (err) {
      console.warn("Could not load tenant subscription history", err);
    } finally {
      setSubLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    loadDetail();
    loadSubHistory();
  }, [loadDetail, loadSubHistory]);

  // Close actions dropdown on outside click
  useEffect(() => {
    if (!actionsOpen) return;
    const close = () => setActionsOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [actionsOpen]);

  const handleConfirmToggleStatus = async (t) => {
    const isActive = t.status === "active" || t.status === "trial";
    const nextStatus = isActive ? "suspended" : "active";
    setIsMutating(true);
    try {
      await updateTenantStatus(t.id, nextStatus);
      await loadDetail();
      toast[nextStatus === "suspended" ? "warning" : "success"](
        `${t.name} ${nextStatus === "suspended" ? "suspended" : "reactivated"}.`
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsMutating(false);
    }
  };

  const handleConfirmExtendTrial = async (t, days) => {
    setIsMutating(true);
    try {
      await extendTenantTrial(t.id, days);
      await loadDetail();
      toast.success(`+${days} days trial added for ${t.name}.`);
    } catch (err) {
      toast.error(err.message);
      throw err;
    } finally {
      setIsMutating(false);
    }
  };

  if (isLoading) return <DetailSkeleton onBack={onBack} />;

  if (fetchError) {
    return (
      <div className="tdp-root">
        <div className="tdp-topbar">
          <button className="tdp-back-btn" onClick={onBack}>
            <FiArrowLeft size={15} /> Back to Tenants
          </button>
        </div>
        <div className="tdp-error-banner">
          <FiAlertTriangle size={16} />
          <div>
            <strong>Failed to load tenant</strong>
            <p>{fetchError}</p>
          </div>
          <button className="admin-btn admin-btn--primary" onClick={loadDetail}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!tenant) return null;

  const isActive = tenant.status === "active" || tenant.status === "trial";
  const statusMeta = {
    active: { label: "Active", color: "#0E9F6E", bg: "#ECFDF5" },
    trial: { label: "Trial", color: "#D97706", bg: "#FFFBEB" },
    suspended: { label: "Suspended", color: "#DC2626", bg: "#FEF2F2" },
  }[tenant.status] || { label: tenant.status, color: "#94A3B8", bg: "#F8FAFC" };

  return (
    <div className="tdp-root">
      {/* ── Top bar ── */}
      <div className="tdp-topbar">
        <button className="tdp-back-btn" onClick={onBack}>
          <FiArrowLeft size={15} /> Back to Tenants
        </button>
        <div className="tdp-topbar-actions">
          <button
            className="admin-btn admin-btn--secondary"
            onClick={loadDetail}
            disabled={isLoading}
            title="Reload from database"
          >
            <FiRefreshCw size={13} className={isLoading ? "spin-icon" : ""} />
            <span>Sync</span>
          </button>
          {/* Actions dropdown */}
          <div className="tdp-actions-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              className="admin-btn admin-btn--primary"
              onClick={() => setActionsOpen((o) => !o)}
              disabled={isMutating}
            >
              <span>Actions</span>
              <FiChevronDown size={13} />
            </button>
            {actionsOpen && (
              <div className="tdp-dropdown">
                <button
                  className="tdp-dropdown-item"
                  onClick={() => { setActionsOpen(false); setIsUpgradeModalOpen(true); }}
                >
                  <FiCreditCard size={13} /> Change / Upgrade Plan
                </button>
                {tenant.status === "trial" && (
                  <button
                    className="tdp-dropdown-item"
                    onClick={() => { setActionsOpen(false); setIsTrialModalOpen(true); }}
                  >
                    <FiClock size={13} /> Extend Trial
                  </button>
                )}
                <button
                  className={`tdp-dropdown-item ${isActive ? "tdp-dropdown-item--danger" : "tdp-dropdown-item--success"}`}
                  onClick={() => { setActionsOpen(false); setIsStatusModalOpen(true); }}
                >
                  {isActive
                    ? <><FiSlash size={13} /> Suspend Account</>
                    : <><FiCheck size={13} /> Reactivate Account</>
                  }
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero strip ── */}
      <div className="tdp-hero">
        <div className="tdp-hero-left">
          <div className="tdp-hero-avatar">{tenant.name.charAt(0).toUpperCase()}</div>
          <div className="tdp-hero-info">
            <div className="tdp-hero-name-row">
              <h1 className="tdp-hero-name">{tenant.name}</h1>
              <span
                className="tdp-hero-status-badge"
                style={{ color: statusMeta.color, background: statusMeta.bg }}
              >
                {statusMeta.label}
              </span>
            </div>
            <p className="tdp-hero-meta">
              {tenant.email}
              {tenant.phone && tenant.phone !== "—" && <> &middot; {tenant.phone}</>}
            </p>
            <p className="tdp-hero-sub">
              TEN-{String(tenant.id).padStart(3, "0")} &middot; Joined {tenant.joinedDate} &middot; {tenant.planName}
            </p>
          </div>
        </div>
        {/* Stat cards */}
        <div className="tdp-stat-cards">
          <div className="tdp-stat-card">
            <span className="tdp-stat-value">{tenant.propertiesCount}</span>
            <span className="tdp-stat-label">Properties</span>
          </div>
          <div className="tdp-stat-card">
            <span className="tdp-stat-value">1</span>
            <span className="tdp-stat-label">Users</span>
          </div>
          <div className="tdp-stat-card">
            <span className="tdp-stat-value" style={{ color: statusMeta.color }}>
              {statusMeta.label}
            </span>
            <span className="tdp-stat-label">Account</span>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="tdp-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`tdp-tab ${activeTab === tab.id ? "tdp-tab--active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={13} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div className="tdp-content">
        {activeTab === "overview" && <OverviewTab tenant={tenant} statusMeta={statusMeta} />}
        {activeTab === "properties" && (
          <PropertiesTab
            properties={tenant.properties || []}
            onNavigateToProperty={onNavigateToProperty}
          />
        )}
        {activeTab === "staff" && <StaffTab tenant={tenant} />}
        {activeTab === "subscription" && (
          <SubscriptionTab
            tenant={tenant}
            subData={subData}
            subLoading={subLoading}
            onOpenUpgrade={() => setIsUpgradeModalOpen(true)}
            onOpenInvoice={(inv) => {
              setSelectedInvoice(inv);
              setIsInvoiceModalOpen(true);
            }}
          />
        )}
        {activeTab === "audit" && <AuditTab logs={tenant.auditLog || []} />}
      </div>

      {/* Modals */}
      <ExtendTrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        tenant={tenant}
        onConfirm={handleConfirmExtendTrial}
      />
      <TenantStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        tenant={tenant}
        onConfirm={handleConfirmToggleStatus}
      />
      <ManualUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        tenants={tenant ? [tenant] : []}
        initialTenantId={tenant?.id}
        onSuccess={() => {
          loadDetail();
          loadSubHistory();
        }}
      />
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </div>
  );
};

// ── Overview Tab ─────────────────────────────────────────────────────────────
const OverviewTab = ({ tenant, statusMeta }) => {
  const rows = [
    { label: "Full Name", value: tenant.name },
    { label: "Email Address", value: tenant.email },
    { label: "Phone", value: tenant.phone !== "—" ? tenant.phone : "Not provided" },
    { label: "Account Status", value: <span style={{ color: statusMeta.color, fontWeight: 600 }}>{statusMeta.label}</span> },
    { label: "Subscription Plan", value: tenant.planName },
    { label: "Member Since", value: tenant.joinedDate },
    { label: "Last Active", value: tenant.lastActive },
    { label: "Properties", value: `${tenant.propertiesCount} registered` },
    { label: "Tenant ID", value: `TEN-${String(tenant.id).padStart(3, "0")}` },
    { label: "Role", value: tenant.role || "Owner" },
    ...(tenant.status === "trial"
      ? [{ label: "Trial Days Remaining", value: `${tenant.trialDaysLeft} days` }]
      : []),
  ];

  return (
    <div className="tdp-tab-panel">
      <h2 className="tdp-section-title">Account Overview</h2>
      <div className="tdp-kv-grid">
        {rows.map(({ label, value }) => (
          <div key={label} className="tdp-kv-row">
            <span className="tdp-kv-label">{label}</span>
            <span className="tdp-kv-value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Properties Tab ────────────────────────────────────────────────────────────
const PropertiesTab = ({ properties, onNavigateToProperty }) => {
  if (properties.length === 0) {
    return (
      <div className="tdp-tab-panel">
        <h2 className="tdp-section-title">Properties</h2>
        <div className="tdp-empty-state">No properties registered for this account.</div>
      </div>
    );
  }

  return (
    <div className="tdp-tab-panel">
      <h2 className="tdp-section-title">Properties <span className="tdp-count">({properties.length})</span></h2>
      <table className="tdp-table">
        <thead>
          <tr>
            <th>Property</th>
            <th>Type</th>
            <th>Location</th>
            <th>Rooms</th>
            <th>Status</th>
            <th>Added</th>
          </tr>
        </thead>
        <tbody>
          {properties.map((p) => (
            <tr key={p.id}>
              <td className="tdp-td-primary">
                {onNavigateToProperty ? (
                  <button
                    type="button"
                    onClick={() => onNavigateToProperty(p.id)}
                    style={{
                      cursor: "pointer",
                      color: "#04B3C0",
                      background: "none",
                      border: "none",
                      padding: 0,
                      fontWeight: 600,
                      textAlign: "left",
                    }}
                    title={`Open details for ${p.name}`}
                  >
                    {p.name} →
                  </button>
                ) : (
                  p.name
                )}
              </td>
              <td>{p.type || "—"}</td>
              <td>{[p.city, p.state].filter(Boolean).join(", ") || "—"}</td>
              <td>{p.rooms ?? "—"}</td>
              <td>
                <span className={`tdp-prop-status tdp-prop-status--${(p.status || "active").toLowerCase()}`}>
                  {p.status || "Active"}
                </span>
              </td>
              <td className="tdp-td-muted">{p.addedDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Staff Tab ─────────────────────────────────────────────────────────────────
const StaffTab = ({ tenant }) => (
  <div className="tdp-tab-panel">
    <h2 className="tdp-section-title">Users & Staff</h2>
    <p className="tdp-section-desc">Accounts associated with this tenant. Managers and caretakers will appear here once a multi-user setup is supported.</p>
    <table className="tdp-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Email</th>
          <th>Role</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="tdp-td-primary">{tenant.name}</td>
          <td>{tenant.email}</td>
          <td>{tenant.role || "Owner"}</td>
          <td><span className="tdp-prop-status tdp-prop-status--active">Active</span></td>
        </tr>
      </tbody>
    </table>
  </div>
);

// ── Subscription Tab ──────────────────────────────────────────────────────────
const SubscriptionTab = ({ tenant, subData, subLoading, onOpenUpgrade, onOpenInvoice }) => {
  const invoices = subData?.invoices || [];

  return (
    <div className="tdp-tab-panel">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 className="tdp-section-title" style={{ margin: 0 }}>Subscription & Billing</h2>
          <p className="tdp-section-desc" style={{ margin: "4px 0 0 0" }}>
            SaaS subscription plan, recurring status, and platform tax invoices.
          </p>
        </div>
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={onOpenUpgrade}
        >
          <FiCreditCard size={14} />
          <span>Change / Upgrade Plan</span>
        </button>
      </div>

      <div className="tdp-kv-grid" style={{ marginBottom: 28 }}>
        <div className="tdp-kv-row">
          <span className="tdp-kv-label">Current Plan</span>
          <span className="tdp-kv-value" style={{ fontWeight: 600 }}>{subData?.planName || tenant.planName}</span>
        </div>
        <div className="tdp-kv-row">
          <span className="tdp-kv-label">Account Status</span>
          <span className="tdp-kv-value">
            {tenant.status === "active" ? "Active (Paid)" : tenant.status === "trial" ? "Free Trial" : "Suspended"}
          </span>
        </div>
        <div className="tdp-kv-row">
          <span className="tdp-kv-label">Member Since</span>
          <span className="tdp-kv-value">{tenant.joinedDate}</span>
        </div>
        {tenant.status === "trial" && (
          <div className="tdp-kv-row">
            <span className="tdp-kv-label">Trial Status</span>
            <span className="tdp-kv-value" style={{ color: "#D97706", fontWeight: 600 }}>
              {tenant.trialDaysLeft} days remaining
            </span>
          </div>
        )}
      </div>

      <div className="tdp-sub-billing-section">
        <h3 className="tdp-sub-section-label" style={{ fontSize: 14, fontWeight: 600, color: "#0F172A", marginBottom: 12 }}>
          Payment History & Tax Invoices {invoices.length > 0 && `(${invoices.length})`}
        </h3>

        {subLoading ? (
          <div style={{ padding: "30px 0", textAlign: "center", color: "#64748B", fontSize: 13 }}>
            Loading billing records...
          </div>
        ) : invoices.length === 0 ? (
          <div className="tdp-empty-state">
            No billing records on file for this tenant. Use the &ldquo;Change / Upgrade Plan&rdquo; button to assign a paid tier or record an offline settlement.
          </div>
        ) : (
          <table className="tdp-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Plan Tier</th>
                <th>Cycle</th>
                <th>Amount (incl. 18% GST)</th>
                <th>Method</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: "right" }}>Invoice</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id || inv.invoiceNumber}>
                  <td className="tdp-td-primary" style={{ fontFamily: "monospace", fontSize: 12.5 }}>
                    {inv.invoiceNumber}
                  </td>
                  <td><strong>{inv.planName}</strong></td>
                  <td style={{ textTransform: "capitalize" }}>{inv.billingCycle}</td>
                  <td>₹{Number(inv.totalAmount).toLocaleString("en-IN")}</td>
                  <td>{inv.paymentMethod}</td>
                  <td className="tdp-td-muted">{inv.date}</td>
                  <td>
                    <span className="tdp-prop-status tdp-prop-status--active">
                      {inv.status || "PAID"}
                    </span>
                  </td>
                  <td style={{ textAlign: "right" }}>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      style={{ padding: "4px 10px", fontSize: 12 }}
                      onClick={() => onOpenInvoice(inv)}
                    >
                      View Invoice
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

// ── Audit Log Tab ─────────────────────────────────────────────────────────────
const AuditTab = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="tdp-tab-panel">
        <h2 className="tdp-section-title">Audit Log</h2>
        <div className="tdp-empty-state">No admin actions recorded for this account yet. Actions like suspend, reactivate, and trial extensions will appear here.</div>
      </div>
    );
  }

  return (
    <div className="tdp-tab-panel">
      <h2 className="tdp-section-title">Audit Log <span className="tdp-count">({logs.length})</span></h2>
      <div className="tdp-audit-list">
        {logs.map((log) => (
          <div key={log.id} className="tdp-audit-entry">
            <div className="tdp-audit-dot" />
            <div className="tdp-audit-body">
              <div className="tdp-audit-action">{log.action}</div>
              {log.detail && <div className="tdp-audit-detail">{log.detail}</div>}
              <div className="tdp-audit-meta">
                {log.actorEmail} &middot; {log.timestamp}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Loading Skeleton ──────────────────────────────────────────────────────────
const DetailSkeleton = ({ onBack }) => (
  <div className="tdp-root">
    <div className="tdp-topbar">
      <button className="tdp-back-btn" onClick={onBack}>
        <FiArrowLeft size={15} /> Back to Tenants
      </button>
    </div>
    <div className="tdp-hero tdp-hero--skeleton">
      <div className="tdp-hero-left">
        <div className="skeleton-box" style={{ width: 60, height: 60, borderRadius: "50%" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton-box" style={{ width: 160, height: 22 }} />
          <div className="skeleton-box" style={{ width: 220, height: 14 }} />
          <div className="skeleton-box" style={{ width: 180, height: 14 }} />
        </div>
      </div>
    </div>
    <div className="tdp-tabs">
      {TABS.map((t) => (
        <div key={t.id} className="skeleton-box" style={{ width: 90, height: 34, borderRadius: 8 }} />
      ))}
    </div>
    <div className="tdp-content">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-box" style={{ width: "100%", height: 40, marginBottom: 12 }} />
      ))}
    </div>
  </div>
);

export default TenantDetailPage;
