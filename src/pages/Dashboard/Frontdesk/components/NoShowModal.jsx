import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { calculateFolio } from '../utils/folioCalculator';

export default function NoShowModal({
  isOpen,
  res,
  mealOrders = [],
  onClose,
  onConfirmNoShow
}) {
  const [noShowReason, setNoShowReason] = useState('guest_unreachable');
  const [noShowRefundPolicy, setNoShowRefundPolicy] = useState('retain_one_night');

  if (!isOpen || !res) return null;

  const folio = calculateFolio(res, mealOrders);

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirmNoShow({
      res,
      noShowReason,
      noShowRefundPolicy,
      folio
    });
  };

  return (
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
        <div className="fd-modal-header">
          <div>
            <h3 className="fd-modal-title">⚠️ Mark Reservation as No-Show</h3>
            <span className="fd-modal-subtext">Guest missed arrival for {res.guest} ({res.id})</span>
          </div>
          <button type="button" className="fd-modal-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="fd-modal-body">
            <div className="fd-form-group">
              <label className="fd-label">No-Show Reason *</label>
              <select
                className="fd-input"
                value={noShowReason}
                onChange={e => setNoShowReason(e.target.value)}
              >
                <option value="guest_unreachable">Guest Unreachable / Did Not Arrive</option>
                <option value="cancelled_last_minute">Last-Minute Cancellation</option>
                <option value="flight_delayed">Travel Delay / Flight Cancelled</option>
                <option value="other">Other / Operational Reason</option>
              </select>
            </div>

            <div className="fd-form-group">
              <label className="fd-label">Retention & Refund Policy *</label>
              <select
                className="fd-input"
                value={noShowRefundPolicy}
                onChange={e => setNoShowRefundPolicy(e.target.value)}
              >
                <option value="retain_one_night">Retain 1 Night Charge & Refund Balance</option>
                <option value="retain_full">Retain 100% Deposit (Strict No Refund)</option>
                <option value="full_refund">Full Refund to Guest</option>
              </select>
            </div>
          </div>

          <div className="fd-modal-footer">
            <button type="button" className="fd-modal-cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="fd-modal-submit-btn fd-btn-dark">Confirm No-Show ⚠️</button>
          </div>
        </form>
      </div>
    </div>
  );
}
