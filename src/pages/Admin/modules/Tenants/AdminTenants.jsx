import React, { useState, useEffect, useCallback } from "react";
import AdminTable from "../../components/common/AdminTable";
import ExtendTrialModal from "./components/ExtendTrialModal";
import TenantStatusModal from "./components/TenantStatusModal";
import {
  fetchAdminTenants,
  updateTenantStatus,
  extendTenantTrial,
  exportTenantsToCSV,
} from "./utils/tenantUtils";
import {
  FiSlash,
  FiCheck,
  FiEye,
  FiRefreshCw,
  FiDownload,
  FiAlertTriangle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "./AdminTenants.css";

const AdminTenants = ({ onViewDetail }) => {
  const [tenants, setTenants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedTenant, setSelectedTenant] = useState(null);
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [mutatingId, setMutatingId] = useState(null);

  const loadDatabaseTenants = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      setFetchError(null);
      const data = await fetchAdminTenants();
      setTenants(data);
    } catch (err) {
      setFetchError(err.message || "Failed to load tenants from database.");
      if (!isSilent) toast.error("Unable to connect to StayOps database.");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseTenants();
  }, [loadDatabaseTenants]);

  const handleOpenDetails = (tenant) => {
    if (onViewDetail) {
      onViewDetail(tenant.id);
    }
  };

  const handleOpenExtendTrial = (tenant) => {
    setSelectedTenant(tenant);
    setIsTrialModalOpen(true);
  };

  const handleOpenStatusConfirm = (tenant) => {
    setSelectedTenant(tenant);
    setIsStatusModalOpen(true);
  };

  const handleConfirmExtendTrial = async (tenant, days) => {
    setMutatingId(tenant.id);
    try {
      const updated = await extendTenantTrial(tenant.id, days);
      setTenants((prev) => prev.map((t) => (t.id === tenant.id ? updated : t)));
      toast.success(`+${days} days added for ${tenant.name}.`);
    } catch (err) {
      toast.error(`Failed to extend trial: ${err.message}`);
      throw err;
    } finally {
      setMutatingId(null);
    }
  };

  const handleConfirmToggleStatus = async (tenant) => {
    const isActive = tenant.status === "active" || tenant.status === "trial";
    const nextStatus = isActive ? "suspended" : "active";
    setMutatingId(tenant.id);
    try {
      const updated = await updateTenantStatus(tenant.id, nextStatus);
      setTenants((prev) => prev.map((t) => (t.id === tenant.id ? updated : t)));
      toast[nextStatus === "suspended" ? "warning" : "success"](
        `${tenant.name} ${nextStatus === "suspended" ? "suspended" : "reactivated"}.`
      );
    } catch (err) {
      toast.error(`Failed to update status: ${err.message}`);
      throw err;
    } finally {
      setMutatingId(null);
    }
  };

  const handleExport = () => {
    if (tenants.length === 0) {
      toast.warning("No tenants to export.");
      return;
    }
    exportTenantsToCSV(tenants);
    toast.info("CSV exported.");
  };

  const filterTabs = [
    { id: "all", label: "All" },
    { id: "active", label: "Active", filterFn: (r) => r.status === "active" },
    { id: "trial", label: "Trial", filterFn: (r) => r.status === "trial" },
    { id: "suspended", label: "Suspended", filterFn: (r) => r.status === "suspended" },
  ];

  const statusDot = (status) => {
    const map = {
      active: { color: "#0E9F6E", label: "Active" },
      trial: { color: "#F59E0B", label: "Trial" },
      suspended: { color: "#EF4444", label: "Suspended" },
    };
    const s = map[status] || { color: "#94A3B8", label: status };
    return (
      <span className="t-status">
        <span className="t-status-dot" style={{ background: s.color }} />
        {s.label}
      </span>
    );
  };

  const columns = [
    {
      key: "name",
      label: "Tenant",
      render: (name, row) => (
        <div className="t-identity">
          <div className="t-avatar">{name.charAt(0).toUpperCase()}</div>
          <div className="t-meta">
            <span className="t-name">{name}</span>
            <span className="t-sub">
              {row.propertyName || "No properties"}
              {row.propertiesCount > 1 && ` · ${row.propertiesCount} props`}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: "email",
      label: "Contact",
      render: (email, row) => (
        <div className="t-contact">
          <span className="t-email">{email}</span>
          {row.phone && <span className="t-phone">{row.phone}</span>}
        </div>
      ),
    },
    {
      key: "planName",
      label: "Plan",
      render: (planName, row) => (
        <div className="t-plan">
          <span className="t-plan-label">{planName || "—"}</span>
          {row.status === "trial" && row.trialDaysLeft != null && (
            <span className="t-trial-days">{row.trialDaysLeft}d left</span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (status) => statusDot(status),
    },
    {
      key: "actions",
      label: "",
      align: "right",
      render: (_, row) => {
        const isMutating = mutatingId === row.id;
        const isActive = row.status === "active" || row.status === "trial";
        return (
          <div className="t-actions">
            <button
              className="t-btn"
              title="View profile"
              onClick={() => handleOpenDetails(row)}
              disabled={isMutating}
            >
              <FiEye size={14} />
            </button>
            <button
              className={`t-btn ${isActive ? "t-btn--danger" : "t-btn--success"}`}
              title={isActive ? "Suspend account" : "Reactivate account"}
              onClick={() => handleOpenStatusConfirm(row)}
              disabled={isMutating}
            >
              {isActive ? <FiSlash size={14} /> : <FiCheck size={14} />}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="admin-tenants">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Tenants &amp; Users</h1>
          <p className="admin-page-subtitle">
            {isLoading
              ? "Loading from database…"
              : `${tenants.length} account${tenants.length !== 1 ? "s" : ""} in database`}
          </p>
        </div>
        <div className="admin-page-actions">
          <button
            className="admin-btn admin-btn--secondary"
            onClick={() => loadDatabaseTenants(false)}
            disabled={isLoading}
            title="Reload from database"
          >
            <FiRefreshCw size={14} className={isLoading ? "spin-icon" : ""} />
            <span>Sync</span>
          </button>
          <button
            className="admin-btn admin-btn--secondary"
            onClick={handleExport}
            disabled={isLoading || tenants.length === 0}
            title="Export CSV"
          >
            <FiDownload size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

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
            className="admin-btn admin-btn--primary"
            onClick={() => loadDatabaseTenants(false)}
          >
            Retry
          </button>
        </div>
      )}

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
          data={tenants}
          searchKeys={["name", "email", "phone", "propertyName"]}
          filterTabs={filterTabs}
          searchPlaceholder="Search tenants…"
          pageSize={10}
        />
      )}

      <ExtendTrialModal
        isOpen={isTrialModalOpen}
        onClose={() => setIsTrialModalOpen(false)}
        tenant={selectedTenant}
        onConfirm={handleConfirmExtendTrial}
      />
      <TenantStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        tenant={selectedTenant}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
};

export default AdminTenants;
