import React from 'react';
import { FiX, FiUnlock, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import './UnblockDateModal.css';

export default function UnblockDateModal({
  isOpen,
  onClose,
  blockData,
  onConfirmUnblock
}) {
  if (!isOpen || !blockData) return null;

  const handleConfirm = () => {
    onConfirmUnblock(blockData);
    onClose();
  };

  return (
    <div className="udm-backdrop" onClick={onClose}>
      <div className="udm-card" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="udm-header">
          <div className="udm-header-content">
            <div className="udm-header-icon-box">
              <FiUnlock size={20} />
            </div>
            <div>
              <h3 className="udm-title">Unblock Room Unit</h3>
              <span className="udm-subtitle">
                Remove block restriction and make dates available for bookings
              </span>
            </div>
          </div>
          <button type="button" className="udm-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="udm-body">
          <div className="udm-info-box">
            <div className="udm-info-row">
              <span className="udm-info-label">Category:</span>
              <span className="udm-info-val" style={{ color: '#D97706' }}>
                {blockData.category || 'Maintenance'}
              </span>
            </div>
            <div className="udm-info-row">
              <span className="udm-info-label">Date Range:</span>
              <span className="udm-info-val">
                {blockData.startDateStr} &rarr; {blockData.endDateStr}
              </span>
            </div>
            <div className="udm-info-row">
              <span className="udm-info-label">Reason / Notes:</span>
              <span className="udm-info-val">
                {blockData.notes || 'No notes provided'}
              </span>
            </div>
          </div>

          <p style={{ margin: 0, fontSize: '0.8125rem', color: '#64748B', lineHeight: 1.5 }}>
            Are you sure you want to remove this block? Once unblocked, guests and staff will be able to book this room unit across these dates again.
          </p>
        </div>

        {/* Footer */}
        <div className="udm-footer">
          <button type="button" className="udm-btn udm-btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="udm-btn udm-btn-primary" onClick={handleConfirm}>
            <FiUnlock size={16} /> Confirm Unblock
          </button>
        </div>

      </div>
    </div>
  );
}
