import React from 'react';
import { FiX, FiCheckCircle, FiUser, FiClock, FiCamera } from 'react-icons/fi';
import { LuBedDouble, LuShowerHead } from 'react-icons/lu';

export default function PhotoAuditModal({
  isOpen,
  room,
  onClose
}) {
  if (!isOpen || !room) return null;

  const rawPhoto = room.photoProofUrl;
  let bedroomPhoto = null;
  let bathroomPhoto = null;

  if (rawPhoto) {
    try {
      const parsed = JSON.parse(rawPhoto);
      if (parsed && typeof parsed === 'object') {
        bedroomPhoto = parsed.bedroom || null;
        bathroomPhoto = parsed.bathroom || null;
      } else {
        bedroomPhoto = rawPhoto;
      }
    } catch {
      bedroomPhoto = rawPhoto;
    }
  }

  const cleanedBy = room.cleanedBy || room.assignedTo || 'Caretaker';
  const lastCleaned = room.lastCleanedAt
    ? new Date(room.lastCleanedAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Recent Turnover';

  const hasPhotos = Boolean(bedroomPhoto || bathroomPhoto);

  return (
    <div className="hk-modal-backdrop" onClick={onClose}>
      <div className="hk-modal-card hk-modal-audit" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <header className="hk-modal-header">
          <div className="hk-modal-header-titles">
            <h3 className="hk-modal-title">
              <FiCamera size={15} /> Verified Turnover Photo Proof
            </h3>
            <span className="hk-modal-subtitle">
              {room.name} &bull; {room.propertyName}
            </span>
          </div>
          <button type="button" className="hk-modal-close" onClick={onClose} aria-label="Close photo audit modal">
            <FiX size={17} />
          </button>
        </header>

        {/* BODY */}
        <div className="hk-modal-body">
          {/* AUDIT STATUS ROW */}
          <div className="hk-audit-banner">
            <div className="hk-audit-banner-left">
              <FiCheckCircle size={15} />
              <span>Verified Cleaning Audit</span>
            </div>
            <span className="hk-audit-banner-pill">
              SOP Approved
            </span>
          </div>

          {/* AUDIT METADATA */}
          <div className="hk-audit-meta-grid">
            <div className="hk-audit-meta-card">
              <FiUser size={13} className="hk-audit-meta-icon" />
              <span><strong>Cleaned By:</strong> {cleanedBy}</span>
            </div>
            <div className="hk-audit-meta-card">
              <FiClock size={13} className="hk-audit-meta-icon" />
              <span><strong>Timestamp:</strong> {lastCleaned}</span>
            </div>
          </div>

          {room.notes && (
            <div className="hk-audit-notes">
              <strong>Staff Note:</strong> {room.notes}
            </div>
          )}

          {/* DUAL PHOTO EVIDENCE DISPLAY */}
          <div className={`hk-audit-photos-grid ${!bathroomPhoto ? 'single-col' : ''}`}>
            {bedroomPhoto && (
              <div className="hk-audit-photo-card">
                <span className="hk-audit-photo-label">
                  <LuBedDouble size={14} className="hk-slot-icon" /> Bedroom &amp; Bed Linens
                </span>
                <div className="hk-audit-img-wrap">
                  <img
                    src={bedroomPhoto}
                    alt={`Bedroom proof for ${room.name}`}
                    className="hk-audit-img"
                  />
                </div>
              </div>
            )}

            {bathroomPhoto && (
              <div className="hk-audit-photo-card">
                <span className="hk-audit-photo-label">
                  <LuShowerHead size={14} className="hk-slot-icon" /> Sanitized Bathroom
                </span>
                <div className="hk-audit-img-wrap">
                  <img
                    src={bathroomPhoto}
                    alt={`Bathroom proof for ${room.name}`}
                    className="hk-audit-img"
                  />
                </div>
              </div>
            )}

            {!hasPhotos && (
              <div className="hk-audit-empty">
                No photo evidence attached for this room.
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="hk-modal-footer">
          <button
            type="button"
            className="hk-btn hk-btn-secondary"
            onClick={onClose}
          >
            Close Audit View
          </button>
        </footer>
      </div>
    </div>
  );
}
