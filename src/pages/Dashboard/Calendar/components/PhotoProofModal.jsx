import React from 'react';
import { 
  FiX, 
  FiCheckCircle, 
  FiUser, 
  FiClock, 
  FiCamera, 
  FiFileText 
} from 'react-icons/fi';
import './PhotoProofModal.css';

export default function PhotoProofModal({ isOpen, onClose, targetRoom, hkDetails }) {
  if (!isOpen || !targetRoom) return null;

  const isObj = hkDetails && typeof hkDetails === 'object';
  const status = isObj ? (hkDetails.status || 'CLEAN') : (hkDetails || 'CLEAN');
  const photoUrl = isObj ? hkDetails.photoProofUrl : null;
  const cleanedBy = (isObj && hkDetails.cleanedBy) ? hkDetails.cleanedBy : 'Caretaker App';
  const notes = (isObj && hkDetails.notes) ? hkDetails.notes : 'Cleaned with verified photo proof';
  const lastCleaned = (isObj && hkDetails.lastCleanedAt) 
    ? new Date(hkDetails.lastCleanedAt).toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Just Now';

  return (
    <div className="ppm-backdrop" onClick={onClose}>
      <div className="ppm-card" onClick={e => e.stopPropagation()}>
        
        {/* Minimalist Light Header */}
        <div className="ppm-header">
          <div className="ppm-header-content">
            <div className="ppm-header-icon-box">
              <FiCamera size={20} />
            </div>
            <div>
              <h3 className="ppm-title">Caretaker Photo Proof</h3>
              <span className="ppm-subtitle">
                Housekeeping turnover verification for {targetRoom.name}
              </span>
            </div>
          </div>
          <button type="button" className="ppm-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="ppm-body">
          
          {/* Status Verification Banner */}
          <div className="ppm-status-banner">
            <div className="ppm-status-left">
              <FiCheckCircle size={17} style={{ color: '#059669' }} />
              <span>Status: Verified Clean ({status})</span>
            </div>
            <span className="ppm-audit-chip">Audit Verified</span>
          </div>

          {/* Audit Metadata Grid */}
          <div className="ppm-audit-grid">
            <div className="ppm-audit-item">
              <FiUser size={15} className="ppm-audit-icon" />
              <span><strong>Cleaned By:</strong> {cleanedBy}</span>
            </div>
            <div className="ppm-audit-item">
              <FiClock size={15} className="ppm-audit-icon" />
              <span><strong>Time:</strong> {lastCleaned}</span>
            </div>
          </div>

          {/* Notes Card */}
          {notes && (
            <div className="ppm-notes-card">
              <FiFileText size={16} className="ppm-notes-icon" />
              <span><strong>Caretaker Note:</strong> {notes}</span>
            </div>
          )}

          {/* Photo Display */}
          <div className="ppm-photo-container">
            <label className="ppm-photo-label">
              <FiCamera size={14} /> Submitted Inspection Photo
            </label>
            {photoUrl ? (
              <div className="ppm-photo-frame">
                <img
                  src={photoUrl}
                  alt={`Turnover cleaning proof for ${targetRoom.name}`}
                  className="ppm-photo-img"
                />
              </div>
            ) : (
              <div className="ppm-no-photo">
                No photo uploaded yet. Room was marked clean directly from frontdesk.
              </div>
            )}
          </div>

        </div>

        {/* Minimalist Footer */}
        <div className="ppm-footer">
          <button type="button" className="ppm-btn" onClick={onClose}>
            Close Verification
          </button>
        </div>

      </div>
    </div>
  );
}
