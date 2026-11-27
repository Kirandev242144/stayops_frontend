import React, { useState } from 'react';
import { FiX, FiTool, FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

export default function MaintenanceModal({
  isOpen,
  room,
  onClose,
  onSubmitReport,
  onSubmitResolve
}) {
  const [issue, setIssue] = useState('');
  const [severity, setSeverity] = useState('MODERATE');
  const [markOutOfOrder, setMarkOutOfOrder] = useState(true);
  const [resolutionNotes, setResolutionNotes] = useState('Repairs completed & verified');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !room) return null;

  const hasActiveMaintenance = Boolean(room.maintenanceIssue) || room.cleaningStatus === 'OUT_OF_ORDER';

  const handleReport = async (e) => {
    e.preventDefault();
    if (!issue.trim()) {
      setError('Please describe the maintenance issue or defect.');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSubmitReport({
        propertyId: room.propertyId,
        roomId: room.rawId || room.id,
        issue: issue.trim(),
        severity,
        markOutOfOrder
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to log maintenance issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await onSubmitResolve({
        propertyId: room.propertyId,
        roomId: room.rawId || room.id,
        resolutionNotes
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to resolve maintenance issue.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hk-modal-backdrop" onClick={onClose}>
      <div className="hk-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <header className="hk-modal-header">
          <div className="hk-modal-header-titles">
            <h3 className="hk-modal-title">
              <FiTool size={15} /> Room Maintenance &amp; Defects
            </h3>
            <span className="hk-modal-subtitle">
              {room.name} &bull; {room.propertyName}
            </span>
          </div>
          <button type="button" className="hk-modal-close" onClick={onClose} aria-label="Close maintenance modal">
            <FiX size={17} />
          </button>
        </header>

        {/* BODY */}
        <div className="hk-modal-body">
          {error && (
            <div className="hk-modal-alert">
              <span>{error}</span>
            </div>
          )}

          {/* ACTIVE ISSUE DISPLAY (IF ALREADY IN MAINTENANCE) */}
          {hasActiveMaintenance ? (
            <div className="hk-maintenance-active-block">
              <div className="hk-defect-ticket">
                <div className="hk-defect-ticket-title">
                  <FiAlertTriangle size={13} className="hk-icon-inline" /> Active Maintenance Ticket:
                </div>
                <div className="hk-defect-ticket-text">
                  {room.maintenanceIssue || 'Room is currently marked Out of Order for maintenance.'}
                </div>
                <div className="hk-defect-ticket-meta">
                  Severity: <strong>{room.maintenanceSeverity || 'MODERATE'}</strong> &bull; Status: <strong>OUT OF ORDER</strong>
                </div>
              </div>

              <div className="hk-form-group">
                <label className="hk-form-label">Resolution / Repair Notes</label>
                <input
                  type="text"
                  className="hk-input"
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. AC compressor filter replaced, tested cold"
                />
                <span className="hk-help-text">
                  Resolving this issue will automatically return the room to <strong>Turnover Needed (Dirty)</strong> so housekeeping can clean before guest check-in.
                </span>
              </div>

              <div className="hk-modal-footer hk-modal-footer-plain">
                <button
                  type="button"
                  className="hk-btn hk-btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="hk-btn hk-btn-success"
                  onClick={handleResolve}
                  disabled={isSubmitting}
                >
                  <FiCheckCircle size={14} /> {isSubmitting ? 'Resolving...' : 'Mark Repairs Completed'}
                </button>
              </div>
            </div>
          ) : (
            /* NEW MAINTENANCE TICKET FORM */
            <form onSubmit={handleReport} className="hk-defect-form">
              <div className="hk-form-group">
                <label className="hk-form-label">Issue / Defect Description *</label>
                <textarea
                  className="hk-textarea"
                  required
                  placeholder="e.g. AC leaking water on floor, tap loose in master bathroom, TV remote missing..."
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                />
              </div>

              <div className="hk-form-grid-2">
                <div className="hk-form-group">
                  <label className="hk-form-label">Severity Level</label>
                  <select
                    className="hk-select"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                  >
                    <option value="COSMETIC">Cosmetic / Minor</option>
                    <option value="MODERATE">Moderate (Needs fix soon)</option>
                    <option value="CRITICAL">Critical (Blocks Room)</option>
                  </select>
                </div>

                <div className="hk-form-group hk-form-group-center">
                  <label className="hk-checkbox-label-danger">
                    <input
                      type="checkbox"
                      className="hk-checkbox-input-danger"
                      checked={markOutOfOrder}
                      onChange={(e) => setMarkOutOfOrder(e.target.checked)}
                    />
                    <span>Mark Out of Order (OOO)</span>
                  </label>
                </div>
              </div>

              <div className="hk-modal-footer hk-modal-footer-plain">
                <button
                  type="button"
                  className="hk-btn hk-btn-secondary"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hk-btn hk-btn-danger"
                  disabled={isSubmitting}
                >
                  <FiTool size={13} /> {isSubmitting ? 'Logging...' : 'Report Maintenance Issue'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
