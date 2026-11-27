import React, { useState, useEffect, useCallback } from "react";
import AdminTable from "../../components/common/AdminTable";
import PropertyDetailsModal from "./components/PropertyDetailsModal";
import PropertyStatusModal from "./components/PropertyStatusModal";
import {
  fetchAdminProperties,
  updatePropertyStatus,
  getStorefrontUrl,
  exportPropertiesToCSV,
} from "./utils/propertyUtils";
import {
  FiExternalLink,
  FiEye,
  FiSlash,
  FiCheck,
  FiMapPin,
  FiHome,
  FiDownload,
  FiRefreshCw,
  FiAlertTriangle,
} from "react-icons/fi";
import { toast } from "react-toastify";
import "./AdminProperties.css";

const AdminProperties = ({ onViewPropertyDetail, onNavigateToTenant }) => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [mutatingId, setMutatingId] = useState(null);

  // Fetch properties directly from backend database
  const loadDatabaseProperties = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setIsLoading(true);
      setFetchError(null);
      const data = await fetchAdminProperties();
      setProperties(data);
    } catch (err) {
      console.error("Error loading properties from database:", err);
      setFetchError(err.message || "Failed to load properties from backend database.");
      if (!isSilent) {
        toast.error("Unable to connect to StayOps database.");
      }
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDatabaseProperties();
  }, [loadDatabaseProperties]);

  // Handle View Details - navigates to dedicated view if handler provided, else fallback to modal
  const handleOpenDetails = (prop) => {
    if (onViewPropertyDetail) {
      onViewPropertyDetail(prop.id);
    } else {
      setSelectedProperty(prop);
      setIsDetailsModalOpen(true);
    }
  };

  // Handle Status Toggle Modal
  const handleOpenStatusConfirm = (prop) => {
    setSelectedProperty(prop);
    setIsStatusModalOpen(true);
  };

  // Handle Direct Approval (for In-Review or Setup Pending)
  const handleApproveProperty = async (prop) => {
    setMutatingId(prop.id);
    try {
      const updated = await updatePropertyStatus(prop.id, "Active");
      setProperties((prev) =>
        prev.map((p) => (p.id === prop.id ? updated : p))
      );
      toast.success(`Property "${prop.name}" approved & published to live channels!`);
    } catch (err) {
      toast.error(`Database error approving property: ${err.message}`);
    } finally {
      setMutatingId(null);
    }
  };

  // Handle Status Change Confirm (Active <-> Suspended)
  const handleConfirmStatusChange = async (prop) => {
    const nextStatus = prop.status === "active" ? "Suspended" : "Active";
    setMutatingId(prop.id);
    try {
      const updated = await updatePropertyStatus(prop.id, nextStatus);
      setProperties((prev) =>
        prev.map((p) => (p.id === prop.id ? updated : p))
      );

      if (nextStatus === "Suspended") {
        toast.warning(`Property "${prop.name}" has been suspended in the database.`);
      } else {
        toast.success(`Property "${prop.name}" has been reactivated.`);
      }
    } catch (err) {
      toast.error(`Failed to update property status: ${err.message}`);
    } finally {
      setMutatingId(null);
    }
  };


  // Handle Export CSV
  const handleExport = () => {
    if (properties.length === 0) {
      toast.warning("No properties available to export.");
      return;
    }
    exportPropertiesToCSV(properties);
    toast.info("Properties master CSV downloaded successfully.");
  };

  const filterTabs = [
    { id: "all", label: "All" },
    {
      id: "active",
      label: "Active",
      filterFn: (row) => row.status === "active",
    },
    {
      id: "review",
      label: "In Review",
      filterFn: (row) => row.status === "review",
    },
    {
      id: "suspended",
      label: "Suspended",
      filterFn: (row) => row.status === "suspended",
    },
  ];

  const statusDot = (status) => {
    const map = {
      active: { color: "#0E9F6E", label: "Active" },
      review: { color: "#F59E0B", label: "In Review" },
      suspended: { color: "#EF4444", label: "Suspended" },
    };
    const s = map[status] || { color: "#94A3B8", label: status };
    return (
      <span className="p-status">
        <span className="p-status-dot" style={{ background: s.color }} />
        {s.label}
      </span>
    );
  };

  const columns = [
    {
      key: "name",
      label: "Property",
      render: (name, row) => (
        <div className="p-identity">
          <div className="p-icon">
            <FiHome size={15} />
          </div>
          <div className="p-meta">
            <div className="p-name-row">
              <span className="p-name">{name}</span>
              <span className="p-code">{row.code}</span>
            </div>
            <span className="p-category">{row.category}</span>
          </div>
        </div>
      ),
    },
    {
      key: "city",
      label: "Location",
      render: (city, row) => (
        <div className="p-location">
          <FiMapPin size={12} className="text-muted" />
          <span>
            {city}, {row.state}
          </span>
        </div>
      ),
    },
    {
      key: "rooms",
      label: "Inventory",
      render: (rooms, row) => (
        <div className="p-inventory">
          <span className="p-rooms">{rooms} Units</span>
          <span className="p-guests">{row.maxGuests} Guests</span>
        </div>
      ),
    },
    {
      key: "ownerName",
      label: "Owner / Tenant",
      render: (ownerName, row) => (
        <div className="p-owner">
          {row.ownerId && onNavigateToTenant ? (
            <button
              type="button"
              className="p-owner-btn"
              onClick={() => onNavigateToTenant(row.ownerId)}
              title={`View account for ${ownerName}`}
            >
              <span className="p-owner-name">{ownerName}</span>
              <span className="p-owner-link-hint">View account →</span>
            </button>
          ) : (
            <span className="p-owner-name">{ownerName}</span>
          )}
          <span className="p-owner-email">{row.ownerEmail}</span>
        </div>
      ),
    },
    {
      key: "subscriptionPlan",
      label: "Subscription",
      render: (subscriptionPlan) => (
        <div className="p-plan">
          <span className="p-plan-name">{subscriptionPlan || "Multi-Property Hub"}</span>
        </div>
      ),
    },
    {
      key: "slug",
      label: "Storefront",
      render: (slug, row) => {
        if (!row.storefrontEnabled || row.status === "suspended") {
          return <span className="p-storefront-off">Unpublished</span>;
        }

        const linkUrl = getStorefrontUrl(slug);
        return (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-storefront-link"
            title="Open direct guest storefront in new tab"
          >
            <span>{slug}.stayops.in</span>
            <FiExternalLink size={11} />
          </a>
        );
      },
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

        return (
          <div className="p-actions">
            {/* Inspect Details */}
            <button
              type="button"
              className="p-btn"
              title="Inspect property specifications"
              onClick={() => handleOpenDetails(row)}
              aria-label="View specifications"
              disabled={isMutating}
            >
              <FiEye size={14} />
            </button>

            {/* Quick Approve (for In-Review/Pending) or Toggle Suspend */}
            {row.status === "review" ? (
              <button
                type="button"
                className="p-btn p-btn--success"
                title="Approve property and go live"
                onClick={() => handleApproveProperty(row)}
                aria-label="Approve property"
                disabled={isMutating}
              >
                <FiCheck size={14} />
              </button>
            ) : (
              <button
                type="button"
                className={`p-btn ${
                  row.status === "active" ? "p-btn--danger" : "p-btn--success"
                }`}
                title={
                  row.status === "active"
                    ? "Suspend property"
                    : "Reactivate property"
                }
                onClick={() => handleOpenStatusConfirm(row)}
                aria-label="Toggle status"
                disabled={isMutating}
              >
                {row.status === "active" ? (
                  <FiSlash size={14} />
                ) : (
                  <FiCheck size={14} />
                )}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="admin-properties">
      {/* Clean, Minimalist Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Properties</h1>
          <p className="admin-page-subtitle">
            {isLoading
              ? "Loading from database…"
              : `${properties.length} propert${properties.length === 1 ? "y" : "ies"} in database`}
          </p>
        </div>

        <div className="admin-page-actions">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => loadDatabaseProperties(false)}
            title="Reload latest records from database"
            disabled={isLoading}
          >
            <FiRefreshCw size={14} className={isLoading ? "spin-icon" : ""} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={handleExport}
            title="Export properties registry to CSV"
            disabled={isLoading || properties.length === 0}
          >
            <FiDownload size={14} />
            <span>Export</span>
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
            onClick={() => loadDatabaseProperties(false)}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Loading Skeleton */}
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
                <div className="skeleton-box skeleton-col-md" />
                <div className="skeleton-box skeleton-col-sm" />
                <div className="skeleton-box skeleton-col-xs" />
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Main Database Table */
        <AdminTable
          columns={columns}
          data={properties}
          searchKeys={[
            "name",
            "city",
            "state",
            "ownerName",
            "ownerEmail",
            "ownerPhone",
            "code",
            "slug",
            "category",
            "subscriptionPlan",
          ]}
          filterTabs={filterTabs}
          searchPlaceholder="Search property, city, owner, code..."
          pageSize={8}
        />
      )}

      {/* Property Details Modal (Fallback) */}
      <PropertyDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        property={selectedProperty}
        onApprove={handleApproveProperty}
        onToggleStatus={handleConfirmStatusChange}
      />


      {/* Status Confirmation Modal */}
      <PropertyStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        property={selectedProperty}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
};

export default AdminProperties;
