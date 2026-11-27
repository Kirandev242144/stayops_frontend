import React from 'react';
import { FiHome, FiCalendar, FiDollarSign, FiFileText } from 'react-icons/fi';
import { calculateFolio } from '../utils/folioCalculator';

function formatStayDates(checkin, checkout) {
  if (!checkin || !checkout) return `${checkin || ''} – ${checkout || ''}`;
  try {
    const cin = new Date(checkin);
    const cout = new Date(checkout);
    const cinStr = cin.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const coutStr = cout.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const diffMs = cout.getTime() - cin.getTime();
    const nights = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return `${cinStr} – ${coutStr} (${nights}N)`;
  } catch {
    return `${checkin} – ${checkout}`;
  }
}

export default function CompletedStayCard({
  res,
  mealOrders = [],
  taxSettings = null,
  onOpenTaxInvoice,
  onOpenVoucher
}) {
  const folio = calculateFolio(res, mealOrders, taxSettings);
  const datesText = formatStayDates(res.checkin, res.checkout);

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
            <span className="fd-status-tag-green">Checked Out</span>
          </div>

          <div className="fd-completed-sub-line">
            {res.propertyName && (
              <span><FiHome size={12} /> {res.propertyName}</span>
            )}
            <span><FiCalendar size={12} /> {datesText}</span>
            <span><FiDollarSign size={12} /> Folio: <strong>₹{folio.totalFolio.toLocaleString('en-IN')}</strong></span>
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
