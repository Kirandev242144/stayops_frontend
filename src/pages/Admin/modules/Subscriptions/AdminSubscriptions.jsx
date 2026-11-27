import React, { useState, useEffect, useCallback } from "react";
import AdminTable from "../../components/common/AdminTable";
import AdminBadge from "../../components/common/AdminBadge";
import InvoiceModal from "./components/InvoiceModal";
import ManualUpgradeModal from "./components/ManualUpgradeModal";
import ConfigurePlanModal from "./components/ConfigurePlanModal";
import AdjustTenantQuotaModal from "./components/AdjustTenantQuotaModal";
import {
  fetchAdminSubscriptions,
  exportSubscriptionsToCSV,
} from "./utils/subscriptionUtils";
import { fetchAdminTenants } from "../Tenants/utils/tenantUtils";
import {
  FiFileText,
  FiDownload,
  FiRefreshCw,
  FiPlus,
  FiAlertTriangle,
  FiSliders,
  FiLayers,
  FiMaximize2,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "./AdminSubscriptions.css";

const AdminSubscriptions = () => {
  const [overview, setOverview] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("invoices"); // "invoices" | "plans"

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const [selectedPlanForConfig, setSelectedPlanForConfig] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const [selectedTenantForQuota, setSelectedTenantForQuota] = useState(null);
  const [isQuotaModalOpen, setIsQuotaModalOpen] = useState(false);

  const loadSubscriptionsData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      setFetchError(null);
      const [overviewData, tenantsData] = await Promise.all([
        fetchAdminSubscriptions(),
        fetchAdminTenants().catch(() => []),
      ]);
      setOverview(overviewData);
      setTenants(tenantsData);
    } catch (err) {
      console.error("Error loading subscriptions data:", err);
      setFetchError(err.message || "Failed to load subscriptions from database.");
      if (!isSilent) {
        toast.error("Unable to load platform subscription ledger.");
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubscriptionsData();
  }, [loadSubscriptionsData]);

  const handleOpenInvoice = (inv) => {
    setSelectedInvoice(inv);
    setIsInvoiceModalOpen(true);
  };

  const handleOpenConfigPlan = (plan) => {
    setSelectedPlanForConfig(plan);
    setIsConfigModalOpen(true);
  };

  const handleOpenAdjustQuota = (tenant) => {
    setSelectedTenantForQuota(tenant);
    setIsQuotaModalOpen(true);
  };

  const handleExport = () => {
    if (!overview?.transactions || overview.transactions.length === 0) {
      toast.warning("No transactions available to export.");
      return;
    }
    exportSubscriptionsToCSV(overview.transactions);
    toast.info("Subscription invoices CSV downloaded successfully.");
  };

  const invoiceColumns = [
    {
      key: "invoiceNumber",
      label: "Invoice Ref",
      render: (inv) => <span className="sub-invoice-code">{inv}</span>,
    },
    {
      key: "tenantName",
      label: "Tenant & Property",
      render: (tenantName, row) => (
        <div className="sub-tenant-cell">
          <span className="sub-tenant-name">{tenantName}</span>
          <span className="sub-prop-title">{row.propertyName}</span>
        </div>
      ),
    },
    {
      key: "planName",
      label: "Plan Tier",
      render: (planName, row) => (
        <div className="sub-plan-badge-cell">
          <AdminBadge status={row.planKey || "pro"} label={planName} />
          <span className="sub-cycle-tag">
            {row.billingCycle === "yearly" ? "Annual" : "Monthly"}
          </span>
        </div>
      ),
    },
    {
      key: "totalAmount",
      label: "Billed (Inc. GST)",
      render: (_, row) => (
        <div className="sub-amount-col">
          <span className="sub-amount">{row.formattedAmount || `₹${row.totalAmount}`}</span>
          <span className="sub-tax-sub">₹{row.taxAmount} GST</span>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      label: "Method",
      render: (method) => (
        <div className="sub-gateway-cell">
          <span className="sub-gateway">{method || "Razorpay Online"}</span>
        </div>
      ),
    },
    {
      key: "date",
      label: "Settled Date",
      render: (date) => <span className="sub-date">{date}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <span className="p-status">
          <span className="p-status-dot" style={{ background: "#10b981" }} />
          <span>{status === "PAID" ? "Paid" : status}</span>
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <button
          type="button"
          className="sub-btn-view-invoice"
          onClick={() => handleOpenInvoice(row)}
          aria-label="View invoice"
        >
          <FiFileText size={12} />
          <span>View Invoice</span>
        </button>
      ),
    },
  ];

  const quotaColumns = [
    {
      key: "tenantName",
      label: "Tenant Account",
      render: (name, row) => (
        <div className="sub-tenant-cell">
          <span className="sub-tenant-name">{name}</span>
          <span className="sub-prop-title">{row.tenantEmail}</span>
        </div>
      ),
    },
    {
      key: "planName",
      label: "Plan Tier",
      render: (planName, row) => (
        <div className="sub-plan-badge-cell">
          <AdminBadge status={row.planKey || "pro"} label={planName} />
          {row.hasCustomQuota && (
            <span className="sub-quota-badge-custom" title="Custom Quota Override Active">
              Custom Quota
            </span>
          )}
        </div>
      ),
    },
    {
      key: "propertiesCount",
      label: "Properties Capacity",
      render: (used, row) => {
        const limitStr =
          row.allowedProperties === -1 || row.allowedProperties === "Unlimited"
            ? "Unlimited"
            : `${row.allowedProperties} max`;
        return (
          <div>
            <span className="sub-quota-count">{used}</span>
            <span className="sub-quota-max"> / {limitStr}</span>
          </div>
        );
      },
    },
    {
      key: "roomsCount",
      label: "Room Capacity",
      render: (used, row) => {
        const limitStr =
          row.allowedRooms === -1 || row.allowedRooms === "Unlimited"
            ? "Unlimited"
            : `${row.allowedRooms} rooms`;
        return (
          <div>
            <span className="sub-quota-count">{used > 0 ? used : "—"}</span>
            <span className="sub-quota-max"> / {limitStr}</span>
          </div>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (status) => (
        <span className="p-status">
          <span
            className="p-status-dot"
            style={{ background: status === "Active" ? "#10b981" : "#f59e0b" }}
          />
          <span>{status}</span>
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <button
          type="button"
          className="sub-btn-adjust-quota"
          onClick={() => handleOpenAdjustQuota(row)}
          aria-label="Adjust quota"
        >
          <FiMaximize2 size={12} />
          <span>Adjust Quota</span>
        </button>
      ),
    },
  ];

  const plans = overview?.plans || [];
  const transactions = overview?.transactions || [];
  const tenantsQuota = overview?.tenantsQuota || [];

  return (
    <div className="admin-subscriptions">
      {/* Sleek Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Subscriptions</h1>
          <p className="admin-page-subtitle">
            Platform recurring revenue, quota management, and GST tax ledger.
          </p>
        </div>

        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => loadSubscriptionsData(false)}
            disabled={isLoading}
            title="Reload from database"
          >
            <FiRefreshCw size={13} className={isLoading ? "spin-icon" : ""} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={handleExport}
            disabled={isLoading || !transactions.length}
            title="Export billing records to CSV"
          >
            <FiDownload size={13} />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => setIsUpgradeModalOpen(true)}
          >
            <FiPlus size={14} />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* Database Error Banner */}
      {fetchError && !isLoading && (
        <div className="admin-db-error-banner">
          <div className="admin-db-error-content">
            <FiAlertTriangle size={16} className="admin-db-error-icon" />
            <div>
              <h4 className="admin-db-error-title">Database Connection Issue</h4>
              <p className="admin-db-error-desc">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => loadSubscriptionsData(false)}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 4 Minimalist KPI Metric Cards */}
      <div className="admin-sub-metrics-grid">
        <div className="admin-sub-metric-card">
          <span className="admin-sub-metric-label">Monthly Recurring Revenue</span>
          <span className="admin-sub-metric-val">{isLoading ? "—" : overview?.mrrFormatted || "₹0"}</span>
          <span className="admin-sub-metric-hint">Contracted monthly baseline</span>
        </div>

        <div className="admin-sub-metric-card">
          <span className="admin-sub-metric-label">Annual Run Rate</span>
          <span className="admin-sub-metric-val">{isLoading ? "—" : overview?.arrFormatted || "₹0"}</span>
          <span className="admin-sub-metric-hint">Annualized MRR projection</span>
        </div>

        <div className="admin-sub-metric-card">
          <span className="admin-sub-metric-label">Paid Subscriptions</span>
          <span className="admin-sub-metric-val">
            {isLoading ? "—" : `${overview?.paidAccountsCount ?? 0} Accounts`}
          </span>
          <span className="admin-sub-metric-hint">
            {overview?.trialAccountsCount ?? 0} accounts in free trial
          </span>
        </div>

        <div className="admin-sub-metric-card">
          <span className="admin-sub-metric-label">Total Invoiced Revenue</span>
          <span className="admin-sub-metric-val">{isLoading ? "—" : overview?.grossRevenueFormatted || "₹0"}</span>
          <span className="admin-sub-metric-hint">Settled via platform gateway (inc. GST)</span>
        </div>
      </div>

      {/* Minimalist Segmented Navigation Tabs */}
      <div className="admin-sub-tabs-bar">
        <div className="admin-sub-tabs-list">
          <button
            type="button"
            className={`admin-sub-tab-btn ${activeTab === "invoices" ? "admin-sub-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("invoices")}
          >
            <FiFileText size={13} />
            <span>Invoices &amp; Settlements</span>
            <span className="admin-tab-count-pill">{transactions.length}</span>
          </button>

          <button
            type="button"
            className={`admin-sub-tab-btn ${activeTab === "plans" ? "admin-sub-tab-btn--active" : ""}`}
            onClick={() => setActiveTab("plans")}
          >
            <FiLayers size={13} />
            <span>Plan Tiers &amp; Quotas</span>
            <span className="admin-tab-count-pill">{plans.length}</span>
          </button>
        </div>

        <div className="admin-sub-tabs-meta">
          {activeTab === "invoices"
            ? "SAC: 998314 (18% GST Compliance)"
            : "Platform capacity limits & add-on engine"}
        </div>
      </div>

      {/* ── TAB 1: Invoices & Settlements Ledger ── */}
      {activeTab === "invoices" && (
        <div className="admin-sub-table-section">
          <div className="admin-section-header-compact">
            <h2 className="admin-section-title-compact">Settled Transactions Ledger</h2>
            <p className="admin-section-subtitle-compact">
              Official tax invoices issued to property owners.
            </p>
          </div>

          {isLoading ? (
            <div className="admin-loading-container">
              <div className="skeleton-box" style={{ height: 40, width: "100%", marginBottom: 8 }} />
              <div className="skeleton-box" style={{ height: 40, width: "100%", marginBottom: 8 }} />
              <div className="skeleton-box" style={{ height: 40, width: "100%" }} />
            </div>
          ) : (
            <AdminTable
              columns={invoiceColumns}
              data={transactions}
              searchKeys={["invoiceNumber", "tenantName", "propertyName", "planName", "paymentMethod"]}
              searchPlaceholder="Filter by invoice ref, tenant, or property..."
              pageSize={8}
            />
          )}
        </div>
      )}

      {/* ── TAB 2: Plan Tiers & Quota Engine ── */}
      {activeTab === "plans" && (
        <div className="admin-sub-table-section">
          <div className="admin-section-header-compact">
            <div>
              <h2 className="admin-section-title-compact">Platform SaaS Tiers &amp; Quotas</h2>
              <p className="admin-section-subtitle-compact">
                Configure baseline property limits, room capacity, and add-on pricing.
              </p>
            </div>
          </div>

          {/* 3 Configurable Plan Cards */}
          <div className="admin-plans-overview-grid">
            {plans.map((p) => {
              const maxProps =
                p.maxProperties === "Unlimited" || p.maxProperties === -1
                  ? "Unlimited"
                  : `${p.maxProperties} ${p.maxProperties === 1 ? "property" : "properties"}`;
              const maxRooms =
                p.maxRooms === "Unlimited" || p.maxRooms === -1
                  ? "Unlimited"
                  : `Up to ${p.maxRooms} rooms`;

              return (
                <div key={p.key} className="admin-plan-card-refined">
                  <div>
                    <div className="admin-plan-card-top">
                      <div>
                        <span className="admin-plan-card-name">{p.name}</span>
                        <span className="admin-plan-card-target">{p.target}</span>
                      </div>
                      <AdminBadge status={p.key} label={p.key.toUpperCase()} />
                    </div>

                    <div className="admin-plan-card-pricing">
                      <span className="admin-plan-card-price-primary">
                        ₹{Number(p.monthlyPrice).toLocaleString("en-IN")}
                      </span>
                      <span className="admin-plan-card-cycle">/month</span>
                      <div className="admin-plan-card-annual">
                        ₹{Number(p.yearlyPrice).toLocaleString("en-IN")}/yr (prepaid)
                      </div>
                    </div>

                    <div className="admin-plan-quotas-list">
                      <div className="admin-plan-quota-row">
                        <span className="admin-plan-quota-label">Properties Limit</span>
                        <span className="admin-plan-quota-val">{maxProps}</span>
                      </div>
                      <div className="admin-plan-quota-row">
                        <span className="admin-plan-quota-label">Room Capacity</span>
                        <span className="admin-plan-quota-val">{maxRooms}</span>
                      </div>
                      <div className="admin-plan-quota-row">
                        <span className="admin-plan-quota-label">Extra Property Add-on</span>
                        <span className="admin-plan-quota-val">
                          +₹{Number(p.extraPropertyPrice || 999).toLocaleString("en-IN")}/mo
                        </span>
                      </div>
                      {p.extraRoomPrice > 0 && (
                        <div className="admin-plan-quota-row">
                          <span className="admin-plan-quota-label">Extra Room Add-on</span>
                          <span className="admin-plan-quota-val">
                            +₹{Number(p.extraRoomPrice).toLocaleString("en-IN")}/mo
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="admin-plan-card-bottom">
                    <span className="admin-plan-sub-count">
                      <strong>{p.activeTenantsCount ?? 0}</strong> active accounts
                    </span>
                    <button
                      type="button"
                      className="admin-btn-configure-plan"
                      onClick={() => handleOpenConfigPlan(p)}
                    >
                      <FiSliders size={12} />
                      <span>Configure Tier</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tenant Quotas & Capacity Ledger */}
          <div className="admin-section-header-compact" style={{ marginTop: 10 }}>
            <div>
              <h2 className="admin-section-title-compact">Tenant Capacity &amp; Quota Overrides</h2>
              <p className="admin-section-subtitle-compact">
                Review usage vs allowed quota. Increase room capacity or property count for any owner.
              </p>
            </div>
          </div>

          <AdminTable
            columns={quotaColumns}
            data={tenantsQuota}
            searchKeys={["tenantName", "tenantEmail", "planName"]}
            searchPlaceholder="Search tenant account by name or email..."
            pageSize={8}
          />
        </div>
      )}

      {/* GST Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
      />

      {/* Manual Upgrade / Record Payment Modal */}
      <ManualUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        tenants={tenants}
        plans={plans}
        onSuccess={() => loadSubscriptionsData(false)}
      />

      {/* Configure Plan Tier Modal */}
      <ConfigurePlanModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        plan={selectedPlanForConfig}
        onSuccess={() => loadSubscriptionsData(false)}
      />

      {/* Adjust Tenant Quota Modal */}
      <AdjustTenantQuotaModal
        isOpen={isQuotaModalOpen}
        onClose={() => setIsQuotaModalOpen(false)}
        tenant={selectedTenantForQuota}
        onSuccess={() => loadSubscriptionsData(false)}
      />
    </div>
  );
};

export default AdminSubscriptions;
