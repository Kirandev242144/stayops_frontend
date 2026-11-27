import React, { useState } from "react";
import AdminModal from "../../../components/common/AdminModal";
import { FiClock } from "react-icons/fi";
import { toast } from "react-toastify";

const ExtendTrialModal = ({ isOpen, onClose, tenant, onConfirm }) => {
  const [extendDays, setExtendDays] = useState(7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!tenant) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(tenant, Number(extendDays));
      onClose();
    } catch (err) {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Extend Trial Period"
      subtitle={`Grant extra trial days for ${tenant.name} (${tenant.propertyName})`}
      maxWidth="460px"
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
            disabled={isSubmitting}
          >
            {isSubmitting ? "Applying..." : "Apply Extension"}
          </button>
        </>
      }
    >
      <div className="extend-trial-modal">
        <label htmlFor="extend-days" className="extend-label">
          Select Extension Duration:
        </label>
        <select
          id="extend-days"
          value={extendDays}
          onChange={(e) => setExtendDays(e.target.value)}
          className="extend-select"
        >
          <option value="7">+7 Days Extension</option>
          <option value="14">+14 Days (Full Standard Cycle)</option>
          <option value="30">+30 Days (VIP / Enterprise Partner)</option>
        </select>
        <p className="extend-note">
          The tenant will immediately receive {extendDays} additional days of full access to their StayOps workspace and PMS features.
        </p>
      </div>
    </AdminModal>
  );
};

export default ExtendTrialModal;
