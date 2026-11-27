import React, { useState, useEffect, useCallback } from "react";
import AdminTable from "../../components/common/AdminTable";
import ScheduleDemoModal from "./components/ScheduleDemoModal";
import ConvertLeadModal from "./components/ConvertLeadModal";
import {
  fetchAdminLeads,
  scheduleLeadDemo,
  convertLeadToTenant,
  downloadLeadsCsv,
} from "./services/adminLeadsApi";
import {
  FiEye,
  FiZap,
  FiCalendar,
  FiRefreshCw,
  FiDownload,
  FiAlertTriangle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "./AdminLeads.css";

const AdminLeads = ({ onViewLeadDetail }) => {
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Modals state
  const [selectedLead, setSelectedLead] = useState(null);
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const loadDatabaseLeads = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      setFetchError(null);
      const data = await fetchAdminLeads({ page: 0, size: 200, sortBy: "createdAt", sortDirection: "DESC" });
      setLeads(data.content || []);
    } catch (err) {
      setFetchError(err.message || "Failed to load leads from database.");
      if (!isSilent) toast.error("Unable to connect to StayOps database.");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseLeads();
  }, [loadDatabaseLeads]);

  const handleOpenDetails = (lead) => {
    if (onViewLeadDetail) {
      onViewLeadDetail(lead.id);
    }
  };

  const handleOpenScheduleDemo = (lead) => {
    setSelectedLead(lead);
    setIsDemoModalOpen(true);
  };

  const handleOpenConvert = (lead) => {
    setSelectedLead(lead);
    setIsConvertModalOpen(true);
  };

  const handleConfirmDemo = async (payload) => {
    try {
      await scheduleLeadDemo(selectedLead.id, payload);
      toast.success(`Demo scheduled for ${selectedLead.fullName}!`);
      loadDatabaseLeads(true);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleConfirmConvert = async (payload) => {
    try {
      const converted = await convertLeadToTenant(selectedLead.id, payload);
      toast.success(
        `Lead converted! Tenant ID: TEN-${String(converted.convertedTenantId).padStart(3, "0")}`
      );
      loadDatabaseLeads(true);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleExport = async () => {
    if (leads.length === 0) {
      toast.warning("No leads to export.");
      return;
    }
    setIsExporting(true);
    try {
      await downloadLeadsCsv();
      toast.info("Sales leads exported.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "new", label: "New", filterFn: (r) => r.status === "NEW" },
    {
      id: "demos",
      label: "Demos",
      filterFn: (r) => r.status === "DEMO_SCHEDULED" || r.status === "DEMO_COMPLETED",
    },
    {
      id: "followup",
      label: "Follow-up",
      filterFn: (r) => r.status === "FOLLOW_UP_REQUIRED" || r.followUpDue,
    },
    { id: "converted", label: "Converted", filterFn: (r) => r.status === "CONVERTED" },
  ];

  const statusDot = (status) => {
    const map = {
      NEW: { color: "#04B3C0", label: "New" },
      CONTACTED: { color: "#3B82F6", label: "Contacted" },
      DEMO_SCHEDULED: { color: "#8B5CF6", label: "Demo Scheduled" },
      DEMO_COMPLETED: { color: "#10B981", label: "Demo Done" },
      FOLLOW_UP_REQUIRED: { color: "#F59E0B", label: "Follow-up" },
      CONVERTED: { color: "#0E9F6E", label: "Converted" },
      NOT_INTERESTED: { color: "#94A3B8", label: "Not Interested" },
    };
    const s = map[status] || { color: "#94A3B8", label: status };
    return (
      <span className="l-status">
        <span className="l-status-dot" style={{ background: s.color }} />
        {s.label}
      </span>
    );
  };

  const columns = [
    {
      key: "fullName",
      label: "Lead",
      render: (name, row) => (
        <div className="l-identity">
          <div className="l-avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="l-meta">
            <span className="l-name">{name}</span>
            <span className="l-sub">
              {row.businessName}
              {row.propertyCount && ` · ${row.propertyCount} props`}
              {row.city && ` · ${row.city}`}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (email, row) => (
        <div className="l-contact">
          <span className="l-email">{email}</span>
          {row.phone && <span className="l-phone">{row.phone}</span>}
        </div>
      ),
    },
    {
      key: "source",
      label: "Source",
      render: (source) => <span className="l-source">{source || "Website"}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (status) => statusDot(status),
    },
    {
      key: "scheduled",
      label: "Activity / Schedule",
      render: (_, row) => {
        if (row.demoScheduledAtFormatted) {
          return (
            <div className="l-schedule">
              <span className="l-schedule-date">{row.demoScheduledAtFormatted}</span>
              <span className="l-schedule-tag l-schedule-tag--demo">Demo</span>
            </div>
          );
        }
        if (row.nextFollowUpAtFormatted) {
          return (
            <div className="l-schedule">
              <span
                className={`l-schedule-date ${row.followUpDue ? "l-overdue" : ""}`}
              >
                {row.nextFollowUpAtFormatted}
              </span>
              <span className="l-schedule-tag">Follow-up</span>
            </div>
          );
        }
        return <span className="l-sub">—</span>;
      },
    },
    {
      key: "createdAtFormatted",
      label: "Received",
      render: (date) => <span className="l-date">{date || "—"}</span>,
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (_, row) => (
        <div className="l-actions">
          <button
            type="button"
            className="l-btn"
            title="View complete lead details"
            onClick={() => handleOpenDetails(row)}
          >
            <FiEye size={14} />
          </button>
          {row.status !== "CONVERTED" && (
            <button
              type="button"
              className="l-btn l-btn--convert"
              title="Convert to tenant"
              onClick={() => handleOpenConvert(row)}
            >
              <FiZap size={14} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="admin-leads">
      {/* ── Page Header ── */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Sales Leads</h1>
          <p className="admin-page-subtitle">
            {isLoading
              ? "Loading from database…"
              : `${leads.length} demo request${leads.length !== 1 ? "s" : ""} in database`}
          </p>
        </div>
        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => loadDatabaseLeads(false)}
            disabled={isLoading}
            title="Reload from database"
          >
            <FiRefreshCw size={14} className={isLoading ? "spin-icon" : ""} />
            <span>Sync</span>
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={handleExport}
            disabled={isLoading || isExporting || leads.length === 0}
            title="Export CSV"
          >
            <FiDownload size={14} />
            <span>{isExporting ? "Exporting…" : "Export"}</span>
          </button>
        </div>
      </div>

      {/* ── Database Error Banner ── */}
      {fetchError && !isLoading && (
        <div className="admin-db-error-banner">
          <div className="admin-db-error-content">
            <FiAlertTriangle size={16} className="admin-db-error-icon" />
            <div>
              <h4 className="admin-db-error-title">Database Error</h4>
              <p className="admin-db-error-desc">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => loadDatabaseLeads(false)}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Minimal Table ── */}
      {isLoading ? (
        <div className="admin-loading-container">
          <div className="admin-skeleton-toolbar">
            <div className="skeleton-box skeleton-search" />
            <div className="skeleton-box skeleton-tabs" />
          </div>
          <div className="admin-skeleton-table">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="admin-skeleton-row">
                <div className="skeleton-box skeleton-col-lg" />
                <div className="skeleton-box skeleton-col-md" />
                <div className="skeleton-box skeleton-col-sm" />
                <div className="skeleton-box skeleton-col-xs" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={leads}
          searchKeys={["fullName", "businessName", "email", "phone", "city", "source"]}
          filterTabs={filterTabs}
          searchPlaceholder="Search leads…"
          pageSize={10}
        />
      )}

      {/* ── Modals ── */}
      <ScheduleDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        lead={selectedLead}
        onConfirm={handleConfirmDemo}
      />

      <ConvertLeadModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        lead={selectedLead}
        onConfirm={handleConfirmConvert}
      />
    </div>
  );
};

export default AdminLeads;
