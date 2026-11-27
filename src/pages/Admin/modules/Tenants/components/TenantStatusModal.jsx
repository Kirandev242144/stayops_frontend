import React, { useState } from "react";
import AdminModal from "../../../components/common/AdminModal";

const TenantStatusModal = ({ isOpen, onClose, tenant, onConfirm }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!tenant) return null;

  const isCurrentActive = tenant.status === "active" || tenant.status === "trial";
  const targetAction = isCurrentActive ? "suspend" : "reactivate";

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(tenant);
      onClose();
    } catch (err) {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={isCurrentActive ? "Suspend Tenant Account" : "Reactivate Tenant Account"}
      subtitle={
        isCurrentActive
          ? "Suspended accounts cannot log in to PMS or process reservations."
          : "Reactivated accounts restore immediate workspace and PMS access."
      }
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
            className={`admin-btn ${
              isCurrentActive ? "admin-btn--danger" : "admin-btn--primary"
            }`}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Updating..."
              : isCurrentActive
              ? "Confirm Suspension"
              : "Reactivate Account"}
          </button>
        </>
      }
    >
      <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5", color: "#475569" }}>
        Are you sure you want to {targetAction}{" "}
        <strong>{tenant.name}</strong> ({tenant.email})?
      </p>
    </AdminModal>
  );
};

export default TenantStatusModal;
