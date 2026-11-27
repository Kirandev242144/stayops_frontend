import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";
import "./AdminModal.css";

/**
 * Reusable modal dialog for administrative actions.
 * Handles ESC key close and body scroll lock.
 *
 * @param {boolean} isOpen - Whether the modal is open
 * @param {Function} onClose - Handler to close modal
 * @param {string} title - Header title
 * @param {string} subtitle - Optional explanatory subtitle
 * @param {React.ReactNode} children - Modal body content
 * @param {React.ReactNode} footer - Action buttons container
 * @param {string} maxWidth - Max width of modal container (e.g. '520px')
 */
const AdminModal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = "520px",
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="admin-modal-backdrop" onClick={onClose}>
      <div
        className="admin-modal"
        style={{ maxWidth }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-modal-title"
      >
        {/* Header */}
        <div className="admin-modal__header">
          <div>
            <h3 id="admin-modal-title" className="admin-modal__title">
              {title}
            </h3>
            {subtitle && (
              <p className="admin-modal__subtitle">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            className="admin-modal__close"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="admin-modal__body">{children}</div>

        {/* Footer */}
        {footer && <div className="admin-modal__footer">{footer}</div>}
      </div>
    </div>
  );
};

export default AdminModal;
