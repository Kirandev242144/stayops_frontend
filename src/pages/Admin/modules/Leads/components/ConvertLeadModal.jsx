import React, { useState } from "react";
import AdminModal from "../../../components/common/AdminModal";
import { FiCheckCircle, FiUserCheck, FiAlertTriangle, FiShield } from "react-icons/fi";
import "./Modals.css";

const ConvertLeadModal = ({ isOpen, onClose, lead, onConfirm }) => {
  const [conversionType, setConversionType] = useState("new"); // "new" | "existing"
  const [existingTenantId, setExistingTenantId] = useState("");
  const [plan, setPlan] = useState(() => (lead && lead.propertyCount > 1 ? "hub" : "pro"));
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onConfirm({
        createTenant: conversionType === "new",
        existingTenantId: conversionType === "existing" ? parseInt(existingTenantId) : null,
        plan: plan,
        note: note.trim() || null,
      });
      onClose();
    } catch (err) {
      // Handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Lead to StayOps Customer"
      subtitle={`Transition ${lead.fullName} (${lead.businessName}) to an active platform tenant`}
      size="medium"
      footer={
        <>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleSubmit}
            disabled={isSubmitting || (conversionType === "existing" && !existingTenantId)}
          >
            {isSubmitting ? "Converting..." : "Confirm & Convert Lead"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="lead-modal-form">
        {/* Lead summary card */}
        <div className="lead-convert-summary">
          <div className="lead-convert-header">
            <span className="lead-convert-name">{lead.fullName}</span>
            <span className="lead-convert-biz">{lead.businessName}</span>
          </div>
          <div className="lead-convert-grid">
            <div>
              <span className="lead-convert-label">Email:</span>
              <span className="lead-convert-val">{lead.email}</span>
            </div>
            <div>
              <span className="lead-convert-label">Phone:</span>
              <span className="lead-convert-val">{lead.phone}</span>
            </div>
            <div>
              <span className="lead-convert-label">Properties:</span>
              <span className="lead-convert-val">
                {lead.propertyCount} ({lead.propertyType})
              </span>
            </div>
            <div>
              <span className="lead-convert-label">Location:</span>
              <span className="lead-convert-val">
                {lead.city}, {lead.state}
              </span>
            </div>
          </div>
        </div>

        {/* Conversion Type Selector */}
        <div className="lead-form-group">
          <label className="lead-group-label">Account Creation Mode</label>
          <div className="lead-radio-cards">
            <label
              className={`lead-radio-card ${conversionType === "new" ? "is-selected" : ""}`}
            >
              <input
                type="radio"
                name="conversionType"
                value="new"
                checked={conversionType === "new"}
                onChange={() => setConversionType("new")}
              />
              <div>
                <strong>Create New Tenant Account</strong>
                <p>Provisions an owner login for {lead.email} with standard credentials.</p>
              </div>
            </label>

            <label
              className={`lead-radio-card ${conversionType === "existing" ? "is-selected" : ""}`}
            >
              <input
                type="radio"
                name="conversionType"
                value="existing"
                checked={conversionType === "existing"}
                onChange={() => setConversionType("existing")}
              />
              <div>
                <strong>Link to Existing Tenant</strong>
                <p>Connect this lead record to an already registered tenant ID.</p>
              </div>
            </label>
          </div>
        </div>

        {conversionType === "existing" ? (
          <div className="lead-form-group">
            <label htmlFor="existingTenantId">Existing Tenant ID *</label>
            <input
              id="existingTenantId"
              type="number"
              placeholder="e.g. 10 (from Tenants directory)"
              value={existingTenantId}
              onChange={(e) => setExistingTenantId(e.target.value)}
              required
              className="lead-input"
            />
          </div>
        ) : (
          <div className="lead-form-group">
            <label htmlFor="planSelect">Initial Subscription Tier</label>
            <select
              id="planSelect"
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="lead-input"
            >
              <option value="pro">Pro Growth (1 Property)</option>
              <option value="hub">Multi-Property Hub (2+ Properties)</option>
              <option value="trial">14-Day Free Trial</option>
            </select>
          </div>
        )}

        <div className="lead-form-group">
          <label htmlFor="convertNote">Conversion Notes</label>
          <textarea
            id="convertNote"
            rows="2"
            placeholder="e.g. Completed demo on Zoom; owner signed up for 3 villas..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="lead-input lead-textarea"
          />
        </div>

        <div className="lead-notice">
          <FiShield size={14} className="lead-notice-icon" />
          <span>
            Converting this lead will update its status to <strong>CONVERTED</strong>, associate the resulting Tenant ID, and record an immutable event in the audit trail.
          </span>
        </div>
      </form>
    </AdminModal>
  );
};

export default ConvertLeadModal;
