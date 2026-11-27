import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiUser, FiMaximize2 } from "react-icons/fi";
import { adjustAdminTenantQuota } from "../utils/subscriptionUtils";
import { toast } from "react-toastify";

const AdjustTenantQuotaModal = ({ isOpen, onClose, tenant, onSuccess }) => {
  const [maxProperties, setMaxProperties] = useState("");
  const [maxRooms, setMaxRooms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (tenant) {
      setMaxProperties(
        tenant.customMaxProperties !== null && tenant.customMaxProperties !== undefined
          ? String(tenant.customMaxProperties)
          : ""
      );
      setMaxRooms(
        tenant.customMaxRooms !== null && tenant.customMaxRooms !== undefined
          ? String(tenant.customMaxRooms)
          : ""
      );
    }
  }, [tenant, isOpen]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const pVal = maxProperties.trim() === "" ? "default" : maxProperties.trim();
      const rVal = maxRooms.trim() === "" ? "default" : maxRooms.trim();
      await adjustAdminTenantQuota(tenant.tenantId, pVal, rVal);
      toast.success(`Capacity quotas for ${tenant.tenantName} updated successfully.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to adjust tenant quota.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentPlanLimits = `${tenant.planName} default: ${
    tenant.planKey === "hub"
      ? "5 properties, unlimited rooms"
      : tenant.planKey === "pro"
      ? "1 property, unlimited rooms"
      : "1 property, 3 rooms"
  }`;

  return (
    <div className="inv-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="inv-modal-card" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-controls">
          <div className="inv-controls-left" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiMaximize2 size={15} style={{ color: "#10B981" }} />
            <span>Adjust Tenant Quotas</span>
          </div>
          <button type="button" className="inv-close-btn" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          {/* Tenant summary card */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12, marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 13.5, fontWeight: 700, color: "#0F172A" }}>{tenant.tenantName}</span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: "#2563EB", background: "#EFF6FF", padding: "1px 8px", borderRadius: 12 }}>
                {tenant.planName}
              </span>
            </div>
            <span style={{ display: "block", fontSize: 12, color: "#64748B", marginBottom: 6 }}>{tenant.tenantEmail}</span>
            <div style={{ fontSize: 11.5, color: "#475569" }}>
              Currently using: <strong>{tenant.propertiesCount} properties</strong> · <strong>{tenant.roomsCount} rooms</strong>
            </div>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
              {currentPlanLimits}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
              Allowed Properties Quota
            </label>
            <input
              type="number"
              placeholder="Leave blank for plan default"
              value={maxProperties}
              onChange={(e) => setMaxProperties(e.target.value)}
              min="1"
              step="1"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
            />
            <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
              Set a higher property count if this owner purchased extra property add-ons (more than 5 properties). Leave blank to use plan baseline.
            </span>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
              Allowed Room Capacity Quota
            </label>
            <input
              type="number"
              placeholder="Leave blank for plan default (-1 for Unlimited)"
              value={maxRooms}
              onChange={(e) => setMaxRooms(e.target.value)}
              min="-1"
              step="1"
              style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
            />
            <span style={{ display: "block", fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
              Set a higher room capacity if the owner expanded rooms beyond the default limit (e.g. Lite plan 3+ rooms).
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-btn admin-btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Save Quota"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdjustTenantQuotaModal;
