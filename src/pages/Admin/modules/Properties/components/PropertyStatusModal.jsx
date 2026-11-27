import React from "react";
import AdminModal from "../../../components/common/AdminModal";
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const PropertyStatusModal = ({
  isOpen,
  onClose,
  property,
  onConfirm,
}) => {
  if (!property) return null;

  const isSuspending = property.status === "active";
  const isApproving = property.status === "review";

  const modalTitle = isSuspending
    ? "Suspend Property Access"
    : isApproving
    ? "Approve & Go Live"
    : "Reactivate Property Access";

  const confirmBtnLabel = isSuspending
    ? "Confirm Suspension"
    : isApproving
    ? "Approve Property"
    : "Reactivate Property";

  const confirmBtnClass = isSuspending
    ? "admin-btn admin-btn--danger"
    : "admin-btn admin-btn--primary";

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      subtitle={`Registry ID: ${property.code} • ${property.name}`}
      maxWidth="460px"
      footer={
        <>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className={confirmBtnClass}
            onClick={() => {
              onConfirm(property);
              onClose();
            }}
          >
            {confirmBtnLabel}
          </button>
        </>
      }
    >
      <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: isSuspending ? "#FEE2E2" : "#E8FFF5",
            color: isSuspending ? "#DC2626" : "#0E9F6E",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginTop: "2px",
          }}
        >
          {isSuspending ? <FiAlertTriangle size={18} /> : <FiCheckCircle size={18} />}
        </div>
        <div>
          <p style={{ margin: "0 0 8px 0", fontSize: "14px", fontWeight: "600", color: "#091B33" }}>
            {isSuspending
              ? `Are you sure you want to suspend "${property.name}"?`
              : isApproving
              ? `Approve and publish "${property.name}" to live booking channels?`
              : `Restore active operations for "${property.name}"?`}
          </p>
          <p style={{ margin: 0, fontSize: "12.5px", color: "#64748B", lineHeight: "1.45" }}>
            {isSuspending
              ? "The hotel owner's PMS calendar sync will be paused, and direct booking links will show a temporary suspension notice."
              : isApproving
              ? "All room inventory, tariffs, and direct storefront links will become publicly bookable by guests."
              : "Room calendar synchronization, WhatsApp guest notifications, and folio management will immediately resume."}
          </p>
        </div>
      </div>
    </AdminModal>
  );
};

export default PropertyStatusModal;
