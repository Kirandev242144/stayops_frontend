import React, { useState, useEffect } from "react";
import { FiX, FiCheckCircle } from "react-icons/fi";
import { adminManualUpgrade } from "../utils/subscriptionUtils";
import { API_BASE_URL } from "../../../../../config/api";
import { toast } from "react-toastify";

const ManualUpgradeModal = ({ isOpen, onClose, tenants = [], plans = [], initialTenantId = "", onSuccess }) => {
  const [selectedTenantId, setSelectedTenantId] = useState(initialTenantId ? String(initialTenantId) : "");
  const [selectedPlan, setSelectedPlan] = useState("pro");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [customMaxProperties, setCustomMaxProperties] = useState("");
  const [customMaxRooms, setCustomMaxRooms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availablePlans, setAvailablePlans] = useState(plans);

  useEffect(() => {
    if (plans && plans.length > 0) {
      setAvailablePlans(plans);
    } else {
      fetch(`${API_BASE_URL}/platform/subscriptions/plans`)
        .then((r) => r.json())
        .then((d) => {
          if (Array.isArray(d) && d.length > 0) setAvailablePlans(d);
        })
        .catch(() => {});
    }
  }, [plans, isOpen]);

  useEffect(() => {
    if (initialTenantId) {
      setSelectedTenantId(String(initialTenantId));
    }
  }, [initialTenantId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTenantId) {
      toast.warning("Please select a tenant account.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await adminManualUpgrade(
        selectedTenantId,
        selectedPlan,
        billingCycle,
        customMaxProperties,
        customMaxRooms
      );
      toast.success(res.message || "Tenant subscription updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update subscription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inv-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="inv-modal-card" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-controls">
          <div className="inv-controls-left">
            <span>Record Offline Payment / Plan Upgrade</span>
          </div>
          <button type="button" className="inv-close-btn" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Select Tenant / Owner Account
            </label>
            <select
              value={selectedTenantId}
              onChange={(e) => setSelectedTenantId(e.target.value)}
              required
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13.5 }}
            >
              <option value="">-- Choose Tenant --</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.email}) — Currently {t.planName || t.plan}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Subscription Tier
            </label>
            <select
              value={selectedPlan}
              onChange={(e) => setSelectedPlan(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #CBD5E1", fontSize: 13.5 }}
            >
              {plans && plans.length > 0 ? (
                plans.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.name} (₹{Number(p.monthlyPrice).toLocaleString("en-IN")} / mo)
                  </option>
                ))
              ) : (
                <>
                  <option value="lite">Lite Starter (₹1,499 / mo)</option>
                  <option value="pro">Pro Growth (₹2,999 / mo)</option>
                  <option value="hub">Multi-Property Hub (₹5,999 / mo)</option>
                </>
              )}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6 }}>
              Billing Cycle
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="billingCycle"
                  value="monthly"
                  checked={billingCycle === "monthly"}
                  onChange={() => setBillingCycle("monthly")}
                />
                Monthly Recurring
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#334155", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="billingCycle"
                  value="yearly"
                  checked={billingCycle === "yearly"}
                  onChange={() => setBillingCycle("yearly")}
                />
                Annual (Prepaid)
              </label>
            </div>
          </div>

          {/* Quota adjustments */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 12, marginBottom: 18 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 8 }}>
              Custom Capacity Overrides (Optional)
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, color: "#475569", marginBottom: 4 }}>
                  Allowed Properties
                </label>
                <input
                  type="number"
                  placeholder="Plan default"
                  value={customMaxProperties}
                  onChange={(e) => setCustomMaxProperties(e.target.value)}
                  min="1"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, color: "#475569", marginBottom: 4 }}>
                  Allowed Rooms
                </label>
                <input
                  type="number"
                  placeholder="Plan default"
                  value={customMaxRooms}
                  onChange={(e) => setCustomMaxRooms(e.target.value)}
                  min="-1"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12 }}
                />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button type="button" className="admin-btn admin-btn--secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn--primary" disabled={isSubmitting}>
              <FiCheckCircle size={14} />
              <span>{isSubmitting ? "Activating..." : "Confirm Plan Upgrade"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualUpgradeModal;
