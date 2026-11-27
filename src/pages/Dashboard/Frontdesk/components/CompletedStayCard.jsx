import React from 'react';
import { FiHome, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi';
import { calculateFolio } from '../utils/folioCalculator';

export default function CompletedStayCard({
  res,
  mealOrders = [],
  taxSettings = null,
  onOpenTaxInvoice,
  onOpenVoucher
}) {
  const folio = calculateFolio(res, mealOrders, taxSettings);

  return (
    <div className="fd-completed-stay-card">
      <div className="fd-completed-left">
        <div className="fd-avatar-circle-sm">
          {(res.guest || 'G').charAt(0).toUpperCase()}
        </div>

        <div className="fd-completed-info-group">
          <div className="fd-completed-main-line">
            <span className="fd-completed-name">{res.guest}</span>
            <span className="fd-badge-ota">{res.id}</span>
            <span className="fd-status-tag-green">Checked Out & Completed</span>
          </div>

          <div className="fd-completed-sub-line">
            {res.propertyName && (
              <span><FiHome size={12} /> {res.propertyName}</span>
            )}
            <span><FiCalendar size={12} /> {res.checkin} &rarr; {res.checkout}</span>
            <span><FiDollarSign size={12} /> Total: <strong>₹{folio.totalFolio.toLocaleString('en-IN')} ({folio.isBalancePending ? `Balance ₹${folio.balanceDue.toLocaleString('en-IN')}` : 'Paid'})</strong></span>
          </div>
        </div>
      </div>

      <div className="fd-completed-actions">
        <button
          type="button"
          className="fd-btn-tax-invoice"
          onClick={() => onOpenTaxInvoice(res)}
        >
          <FiFileText size={13} /> Tax Invoice
        </button>

        <button
          type="button"
          className="fd-btn-details-dropdown"
          onClick={() => onOpenVoucher(res)}
        >
          Details
        </button>
      </div>
    </div>
  );
}
