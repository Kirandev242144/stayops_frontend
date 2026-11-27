import React, { useState, useEffect } from "react";
import { FiX, FiCheck, FiSettings, FiSliders } from "react-icons/fi";
import { updateAdminPlanSpec } from "../utils/subscriptionUtils";
import { toast } from "react-toastify";

const ConfigurePlanModal = ({ isOpen, onClose, plan, onSuccess }) => {
  const [key, setKey] = useState("lite");
  const [monthlyPrice, setMonthlyPrice] = useState(1499);
  const [yearlyPrice, setYearlyPrice] = useState(14990);
  const [maxProperties, setMaxProperties] = useState(1);
  const [maxRooms, setMaxRooms] = useState(3);
  const [extraPropertyPrice, setExtraPropertyPrice] = useState(999);
  const [extraRoomPrice, setExtraRoomPrice] = useState(199);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (plan) {
      setKey(plan.key || "lite");
      setMonthlyPrice(Number(plan.monthlyPrice) || 1499);
      setYearlyPrice(Number(plan.yearlyPrice) || 14990);
      setMaxProperties(plan.maxProperties === "Unlimited" ? -1 : Number(plan.maxProperties) || 1);
      setMaxRooms(plan.maxRooms === "Unlimited" ? -1 : Number(plan.maxRooms) || 3);
      setExtraPropertyPrice(Number(plan.extraPropertyPrice) || 999);
      setExtraRoomPrice(Number(plan.extraRoomPrice) || (plan.key === "lite" ? 199 : 0));
    }
  }, [plan, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await updateAdminPlanSpec({
        key,
        monthlyPrice,
        yearlyPrice,
        maxProperties: Number(maxProperties),
        maxRooms: Number(maxRooms),
        extraPropertyPrice: Number(extraPropertyPrice),
        extraRoomPrice: Number(extraRoomPrice),
      });
      toast.success(`Plan ${plan?.name || key} specifications updated successfully.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update plan specifications.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="inv-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="inv-modal-card" style={{ maxWidth: 540 }} onClick={(e) => e.stopPropagation()}>
        <div className="inv-modal-controls">
          <div className="inv-controls-left" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FiSliders size={15} style={{ color: "#3B82F6" }} />
            <span>Configure Plan: {plan?.name || key.toUpperCase()}</span>
          </div>
          <button type="button" className="inv-close-btn" onClick={onClose} aria-label="Close">
            <FiX size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: 13, color: "#64748B", marginBottom: 16 }}>
            Adjust baseline quotas, monthly/annual rates, and add-on fees. Changes apply live to all new orders and quota checks.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Monthly Rate (₹ ex. GST)
              </label>
              <input
                type="number"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                min="0"
                step="1"
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Annual Rate (₹ ex. GST)
              </label>
              <input
                type="number"
                value={yearlyPrice}
                onChange={(e) => setYearlyPrice(e.target.value)}
                min="0"
                step="1"
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Included Properties (-1 for Unlimited)
              </label>
              <input
                type="number"
                value={maxProperties}
                onChange={(e) => setMaxProperties(e.target.value)}
                min="-1"
                step="1"
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: "#94A3B8" }}>
                {Number(maxProperties) === -1 ? "Unlimited properties" : `${maxProperties} properties included`}
              </span>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#334155", marginBottom: 4 }}>
                Included Room Capacity (-1 for Unlimited)
              </label>
              <input
                type="number"
                value={maxRooms}
                onChange={(e) => setMaxRooms(e.target.value)}
                min="-1"
                step="1"
                required
                style={{ width: "100%", padding: "8px 12px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: "#94A3B8" }}>
                {Number(maxRooms) === -1 ? "Unlimited rooms" : `Up to ${maxRooms} rooms included`}
              </span>
            </div>
          </div>

          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: 8, padding: 14, marginBottom: 18 }}>
            <span style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#0F172A", marginBottom: 10 }}>
              Add-On Quota Expansion Rates
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, color: "#475569", marginBottom: 4 }}>
                  Extra Property Fee (₹/mo)
                </label>
                <input
                  type="number"
                  value={extraPropertyPrice}
                  onChange={(e) => setExtraPropertyPrice(e.target.value)}
                  min="0"
                  step="1"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12.5 }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11.5, color: "#475569", marginBottom: 4 }}>
                  Extra Room Fee (₹/mo)
                </label>
                <input
                  type="number"
                  value={extraRoomPrice}
                  onChange={(e) => setExtraRoomPrice(e.target.value)}
                  min="0"
                  step="1"
                  style={{ width: "100%", padding: "6px 10px", borderRadius: 6, border: "1px solid #CBD5E1", fontSize: 12.5 }}
                />
              </div>
            </div>
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
              {isSubmitting ? "Saving..." : "Save Plan Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurePlanModal;
