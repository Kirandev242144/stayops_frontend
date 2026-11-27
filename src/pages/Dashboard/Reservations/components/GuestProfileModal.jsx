import React, { useState } from "react";
import { FiX } from "react-icons/fi";
import "./GuestProfileModal.css";

export default function GuestProfileModal({ guest, onClose }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!guest) {
    return null;
  }

  const hasId = Boolean(
    guest.idType ||
    guest.idNumber ||
    guest.idDocumentUrl ||
    (Array.isArray(guest.idDocuments) && guest.idDocuments.length > 0) ||
    guest.aadhaarNo
  );

  const guestInitial = guest.name
    ? guest.name.charAt(0).toUpperCase()
    : "G";

  const totalRevenue = Number(guest.totalRevenue) || 0;

  const formatRevenue = (amount) => {
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="guest-profile-backdrop" onClick={onClose}>
      <div
        className="guest-profile-modal"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Header */}
        <div className="guest-profile-header">
          <div>
            <h2>Guest CRM Profile</h2>
            <span>{guest.id}</span>
          </div>

          <button
            type="button"
            className="guest-profile-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Guest summary */}
        <div className="guest-profile-summary">
          <div className="guest-profile-avatar">
            {guestInitial}
          </div>

          <div className="guest-profile-summary-info">
            <h3>{guest.name || "Guest"}</h3>

            <span className="guest-profile-status">
              {guest.status || "Unknown"}
            </span>
          </div>
        </div>

        {/* Guest details */}
        <div className="guest-profile-details">
          <div className="guest-profile-detail">
            <span>Phone</span>
            <strong>{guest.phone || "N/A"}</strong>
          </div>

          <div className="guest-profile-detail">
            <span>Email</span>
            <strong>{guest.email || "N/A"}</strong>
          </div>

          <div className="guest-profile-detail">
            <span>Total Stays</span>
            <strong>{guest.totalStays || 0} Stays</strong>
          </div>

          <div className="guest-profile-detail">
            <span>Total Spend</span>
            <strong>{formatRevenue(totalRevenue)}</strong>
          </div>

          <div className="guest-profile-detail">
            <span>Last Stay</span>
            <strong>{guest.lastStay || "N/A"}</strong>
          </div>

          <div className="guest-profile-detail">
            <span>Identity Document</span>
            {hasId ? (
              <div className="guest-id-display">
                <span className="guest-id-type-badge">{guest.idType || "Govt ID"}</span>
                {guest.idNumber && (
                  <strong className="guest-id-number">{guest.idNumber}</strong>
                )}
              </div>
            ) : (
              <span className="guest-no-id-badge">no id given</span>
            )}
          </div>
        </div>

        {/* Uploaded ID Document Preview Section */}
        {hasId && (guest.idDocumentUrl || (Array.isArray(guest.idDocuments) && guest.idDocuments.length > 0)) && (
          <div className="guest-docs-preview-section">
            <span className="guest-docs-heading">Attached ID Proof:</span>
            <div className="guest-docs-grid">
              {(Array.isArray(guest.idDocuments) && guest.idDocuments.length > 0 ? guest.idDocuments : [{ documentUrl: guest.idDocumentUrl, idType: guest.idType, idNumber: guest.idNumber }]).map((doc, idx) => (
                <div key={idx} className="guest-doc-card">
                  {doc.documentUrl?.startsWith("data:image") || doc.documentUrl?.match(/\.(jpeg|jpg|png|gif|webp)$/i) || doc.documentUrl?.includes("/uploads/") ? (
                    <img
                      src={doc.documentUrl}
                      alt={doc.idType || "ID Document"}
                      className="guest-doc-thumbnail"
                      onClick={() => setPreviewUrl(doc.documentUrl)}
                    />
                  ) : (
                    <a
                      href={doc.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="guest-doc-link-btn"
                    >
                      📄 Open Document
                    </a>
                  )}
                  <span className="guest-doc-label">{doc.idType || "ID Document"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox Preview Modal */}
        {previewUrl && (
          <div className="guest-lightbox-backdrop" onClick={() => setPreviewUrl(null)}>
            <div className="guest-lightbox-modal" onClick={e => e.stopPropagation()}>
              <div className="guest-lightbox-header">
                <span>Identity Document Preview</span>
                <button type="button" onClick={() => setPreviewUrl(null)} className="guest-profile-close">
                  <FiX size={16} />
                </button>
              </div>
              <div className="guest-lightbox-body">
                <img src={previewUrl} alt="Identity Document" className="guest-lightbox-img" />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="guest-profile-footer">
          <button
            type="button"
            className="guest-profile-close-button"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}