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
  const roomUnitName = res.roomUnit || res.unit || 'Room Unit';
  const initial = (res.guest || 'G').charAt(0).toUpperCase();

  return (
    <>
      {/* ── 1. NATIVE MOBILE APP PWA CARD (< 768px - Stitch Layout) ── */}
      <article className="fd-stitch-card completed-card">
        {/* Top Row: Status badge & ID on left, Financial Rate on right */}
        <div className="fd-stitch-card-top">
          <div className="fd-stitch-top-left">
            <span className="fd-stitch-status-badge completed">
              <span className="fd-stitch-status-dot green"></span>
              Checked Out
            </span>
            <span className="fd-stitch-booking-ref">{res.bookingRef || res.id}</span>
          </div>

          <div className="fd-stitch-top-right">
            <span className="fd-stitch-amount">₹{folio.totalFolio.toLocaleString('en-IN')}</span>
            <span className="fd-stitch-pay-badge paid">PAID</span>
          </div>
        </div>

        {/* Middle Row: Guest Profile + Room details */}
        <div className="fd-stitch-card-mid">
          <div className="fd-stitch-guest-left">
            <div className="fd-stitch-avatar">
              {initial}
            </div>
            <div className="fd-stitch-guest-details">
              <div className="fd-stitch-name-line">
                <h3 className="fd-stitch-guest-name">{res.guest}</h3>
              </div>
              <p className="fd-stitch-room-line">
                <FiHome size={12} className="fd-stitch-room-icon" />
                <span className="truncate">{roomUnitName} • {datesText}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Action Strip: Tax Invoice + Voucher */}
        <div className="fd-stitch-card-bot">
          <button
            type="button"
            className="fd-stitch-btn-primary"
            onClick={() => onOpenTaxInvoice(res)}
          >
            <FiFileText size={14} className="fd-stitch-btn-icon-sky" />
            <span>Tax Invoice</span>
          </button>

          <button
            type="button"
            className="fd-stitch-btn-secondary"
            onClick={() => onOpenVoucher(res)}
            title="View booking voucher"
          >
            <FiFileText size={13} />
            <span>Voucher</span>
          </button>
        </div>
      </article>

      {/* ── 2. DESKTOP & LAPTOP CARD (>= 769px) ── */}
      <div className="fd-completed-stay-card fd-desktop-only">
        <div className="fd-completed-left">
          <div className="fd-avatar-circle-sm">
            {initial}
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
    </>
  );
}
