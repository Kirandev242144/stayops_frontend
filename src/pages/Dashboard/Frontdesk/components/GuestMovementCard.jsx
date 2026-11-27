import React from 'react';
import { 
  FiUser, 
  FiCalendar, 
  FiMessageSquare, 
  FiFileText, 
  FiPlusCircle, 
  FiCreditCard, 
  FiZap,
  FiLogOut,
  FiKey,
  FiHome,
  FiGrid,
  FiShield,
  FiEye,
  FiCheckCircle,
  FiAlertTriangle
} from 'react-icons/fi';
import { calculateFolio } from '../utils/folioCalculator';

/**
 * Format raw ISO dates into clean, human-readable stay dates
 * e.g. "2026-11-27", "2026-11-28" -> "27 Nov – 28 Nov • 1 Night"
 */
function formatStayDates(checkin, checkout, guestCount = 1) {
  if (!checkin || !checkout) {
    return `${checkin || ''} – ${checkout || ''} • ${guestCount} Guest${guestCount > 1 ? 's' : ''}`;
  }
  try {
    const cin = new Date(checkin);
    const cout = new Date(checkout);
    const cinStr = cin.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const coutStr = cout.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const diffMs = cout.getTime() - cin.getTime();
    const nights = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));
    return `${cinStr} – ${coutStr} • ${nights} Night${nights > 1 ? 's' : ''} • ${guestCount} Guest${guestCount > 1 ? 's' : ''}`;
  } catch {
    return `${checkin} – ${checkout} • ${guestCount} Guest${guestCount > 1 ? 's' : ''}`;
  }
}

/**
 * Modern Compact Operational Guest Movement Card for Front Desk.
 * Dual-layout:
 * - .fd-stitch-card: Ultra-modern, compact, low-profile PWA card (Stitch Layout)
 * - .gmc-desktop-view: High-density, spacious desktop operational card
 */
export default function GuestMovementCard({
  res,
  mealOrders = [],
  taxSettings = null,
  onExecuteCheckIn,
  onExecuteCheckOut,
  onOpenRecordPayment,
  onOpenRazorpayQr,
  onOpenAddMeal,
  onOpenAddService,
  onOpenVoucher,
  onViewIdDocument
}) {
  const folio = calculateFolio(res, mealOrders, taxSettings);

  const isCheckInPending = res.status === 'confirmed' || res.status === 'checkin';
  const isInHouse = res.status === 'checkedin' || res.status === 'inhouse';

  const roomUnitName = res.roomUnit || res.unit || 'Room Unit';
  const stayDatesText = formatStayDates(res.checkin, res.checkout, res.guests || 1);

  const nightsCount = (() => {
    if (!res.checkin || !res.checkout) return 1;
    try {
      const diff = (new Date(res.checkout) - new Date(res.checkin)) / (1000 * 60 * 60 * 24);
      return Math.max(1, Math.round(diff));
    } catch {
      return 1;
    }
  })();

  const isIdVerified = Boolean(
    res.idType && (res.idNumber || res.idDocumentUrl || res.status === 'checkedin')
  );

  // Status badge label and styling for Stitch mobile card
  let statusBadgeLabel = 'Arriving Today';
  let statusBadgeClass = 'arriving';
  let isAlertCard = false;

  if (isInHouse) {
    statusBadgeLabel = 'In-House';
    statusBadgeClass = 'inhouse';
  } else if (!isIdVerified && isCheckInPending) {
    statusBadgeLabel = 'ID Pending';
    statusBadgeClass = 'alert';
    isAlertCard = true;
  } else if (res.status === 'no_show') {
    statusBadgeLabel = 'No-Show';
    statusBadgeClass = 'alert';
    isAlertCard = true;
  } else if (!isCheckInPending) {
    statusBadgeLabel = res.status || 'Confirmed';
    statusBadgeClass = 'confirmed';
  }

  // Handle direct WhatsApp opening
  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const cleanPhone = (res.phone || '').replace(/[^\d]/g, '');
    if (!cleanPhone) {
      alert('No phone number recorded for this guest.');
      return;
    }
    const message = isInHouse
      ? `Hello ${res.guest}, hope you are having a wonderful stay at ${res.propertyName || 'StayOps'}!`
      : `Hello ${res.guest}, we look forward to welcoming you to ${res.propertyName || 'StayOps'}!`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const initial = (res.guest || 'G').charAt(0).toUpperCase();

  return (
    <>
      {/* ═════════════════════════════════════════════════════════
          1. NATIVE MOBILE APP PWA CARD (< 768px - Stitch Layout)
          - Streamlined Information Architecture
          - Single-line top status + booking ID + rate & payment status
          - Compact guest profile with verified check + single-line room detail
          - Quick tactile action buttons (Check In / Voucher / QR Pay)
         ═════════════════════════════════════════════════════════ */}
      <article className={`fd-stitch-card ${isAlertCard ? 'alert-border' : ''}`}>
        
        {/* Top Row: Status badge & ID on left, Financial Rate on right */}
        <div className="fd-stitch-card-top">
          <div className="fd-stitch-top-left">
            <span className={`fd-stitch-status-badge ${statusBadgeClass}`}>
              <span className="fd-stitch-status-dot"></span>
              {statusBadgeLabel}
            </span>
            <span className="fd-stitch-booking-ref">{res.bookingRef || res.id}</span>
          </div>

          <div className="fd-stitch-top-right">
            <span className="fd-stitch-amount">₹{folio.totalFolio.toLocaleString('en-IN')}</span>
            {folio.isBalancePending ? (
              <span className="fd-stitch-pay-badge due">DUE AT DESK</span>
            ) : (
              <span className="fd-stitch-pay-badge paid">PAID</span>
            )}
          </div>
        </div>

        {/* Middle Row: Guest Profile + Verified check + Room details + WhatsApp */}
        <div className="fd-stitch-card-mid">
          <div className="fd-stitch-guest-left">
            <div className="fd-stitch-avatar">
              {initial}
            </div>
            <div className="fd-stitch-guest-details">
              <div className="fd-stitch-name-line">
                <h3 className="fd-stitch-guest-name">{res.guest}</h3>
                {isIdVerified ? (
                  <span className="fd-stitch-verified-icon" title="ID Verified">
                    <FiCheckCircle size={12} />
                  </span>
                ) : (
                  <span className="fd-stitch-pending-icon" title="ID Pending">
                    <FiAlertTriangle size={11} />
                  </span>
                )}
              </div>
              <p className="fd-stitch-room-line">
                <FiHome size={12} className="fd-stitch-room-icon" />
                <span className="truncate">{roomUnitName} • {res.guests || 1} guest{res.guests > 1 ? 's' : ''} • {nightsCount} night{nightsCount > 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>

          {res.phone && (
            <button
              type="button"
              className="fd-stitch-wa-btn"
              onClick={handleWhatsApp}
              title="Contact on WhatsApp"
            >
              <FiMessageSquare size={14} />
            </button>
          )}
        </div>

        {/* Bottom Action Strip: Compact tactile buttons */}
        <div className="fd-stitch-card-bot">
          {isCheckInPending && (
            <button
              type="button"
              className="fd-stitch-btn-primary"
              onClick={() => onExecuteCheckIn(res)}
            >
              <FiKey size={14} className="fd-stitch-btn-icon-sky" />
              <span>{folio.isBalancePending ? 'Check In & Collect' : 'Check In'}</span>
            </button>
          )}

          {isInHouse && (
            <button
              type="button"
              className="fd-stitch-btn-primary checkout"
              onClick={() => onExecuteCheckOut(res)}
            >
              <FiLogOut size={14} className="fd-stitch-btn-icon-amber" />
              <span>Check Out</span>
            </button>
          )}

          <button
            type="button"
            className="fd-stitch-btn-voucher"
            onClick={() => onOpenVoucher(res)}
            title="View booking voucher"
          >
            <FiFileText size={13} className="text-slate-500" />
            <span>Voucher</span>
          </button>

          {folio.isBalancePending && (
            <button
              type="button"
              className="fd-stitch-btn-qr"
              onClick={() => onOpenRazorpayQr(res, folio.balanceDue)}
              title="Scan & Pay UPI QR"
            >
              <FiZap size={13} />
              <span>QR Pay</span>
            </button>
          )}
        </div>

      </article>

      {/* ═════════════════════════════════════════════════════════
          2. DESKTOP & LAPTOP SPACIOUS PMS CARD (>= 769px)
          Preserved untouched for desktop / laptop displays
         ═════════════════════════════════════════════════════════ */}
      <div className="gmc-card gmc-desktop-view">
        {/* CARD TOP BAR: ROOM UNIT & BOOKING REF */}
        <div className="gmc-header">
          <div className="gmc-header-left">
            <div className="gmc-room-tag">
              <FiGrid size={13} />
              <span className="gmc-room-name">{roomUnitName}</span>
            </div>

            <div className="gmc-meta-pills">
              <span className="gmc-booking-ref">{res.id}</span>
              <span className="gmc-source-pill">{res.ota || res.bookingSource || 'Walk-In'}</span>
              {res.propertyName && (
                <span className="gmc-property-pill"><FiHome size={11} /> {res.propertyName}</span>
              )}
            </div>
          </div>

          {/* Primary Action CTA (Top Right on Desktop) */}
          <div className="gmc-header-right">
            {isCheckInPending && (
              <button
                type="button"
                className="gmc-btn-primary gmc-btn-checkin"
                onClick={() => onExecuteCheckIn(res)}
              >
                <FiKey size={14} /> Execute Check-In
              </button>
            )}

            {isInHouse && (
              <button
                type="button"
                className="gmc-btn-primary gmc-btn-checkout"
                onClick={() => onExecuteCheckOut(res)}
              >
                <FiLogOut size={14} /> Execute Check-Out
              </button>
            )}
          </div>
        </div>

        {/* GUEST IDENTITY & STAY DETAILS */}
        <div className="gmc-body">
          <div className="gmc-guest-profile">
            <div className="gmc-avatar">
              {(res.guest || 'G').charAt(0).toUpperCase()}
            </div>
            <div className="gmc-guest-details">
              <div className="gmc-guest-name-row">
                <h3 className="gmc-guest-name">{res.guest}</h3>
                {res.phone && (
                  <button 
                    type="button" 
                    className="gmc-icon-btn-wa" 
                    onClick={handleWhatsApp}
                    title="Chat on WhatsApp"
                  >
                    <FiMessageSquare size={13} /> {res.phone}
                  </button>
                )}
              </div>
              
              <div className="gmc-meta-tags">
                <span className="gmc-stay-dates">
                  <FiCalendar size={12} /> {stayDatesText}
                </span>
                
                {res.idType && (res.idNumber || res.idDocumentUrl || res.status === 'checkedin') ? (
                  <span className="gmc-id-verified-wrap">
                    <span className="gmc-id-verified-text">
                      <FiShield size={12} /> ID Verified ({res.idType})
                    </span>
                    {res.idDocumentUrl && (
                      <button
                        type="button"
                        className="gmc-btn-view-id"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onViewIdDocument) {
                            onViewIdDocument(res);
                          } else {
                            window.open(res.idDocumentUrl, '_blank');
                          }
                        }}
                        title="View guest uploaded ID photo"
                      >
                        <FiEye size={11} /> View ID
                      </button>
                    )}
                  </span>
                ) : isCheckInPending ? (
                  <span className="gmc-id-pending-text">
                    <FiShield size={12} /> ID Pending
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {res.notes && (
            <div className="gmc-notes-box">
              <span className="gmc-notes-label">Note:</span>
              <span className="gmc-notes-content">{res.notes}</span>
            </div>
          )}
        </div>

        {/* FINANCIAL FOLIO SUMMARY */}
        <div className="gmc-folio-strip">
          <div className="gmc-folio-item">
            <span className="lbl">TOTAL FOLIO</span>
            <strong className="val-dark">₹{folio.totalFolio.toLocaleString('en-IN')}</strong>
          </div>
          <div className="gmc-folio-item">
            <span className="lbl">PAID</span>
            <strong className="val-green">₹{folio.paidAmount.toLocaleString('en-IN')}</strong>
          </div>
          <div className="gmc-folio-item">
            <span className="lbl">BALANCE DUE</span>
            <strong className={folio.isBalancePending ? "val-due-badge" : "val-paid-badge"}>
              {folio.isBalancePending ? `₹${folio.balanceDue.toLocaleString('en-IN')}` : '₹0 (Paid)'}
            </strong>
          </div>
        </div>

        {/* OPERATIONAL TOOLS GRID */}
        <div className="gmc-footer">
          <div className="gmc-toolbar">
            {folio.isBalancePending && (
              <button
                type="button"
                className="gmc-tool-btn gmc-btn-qr"
                onClick={() => onOpenRazorpayQr(res, folio.balanceDue)}
              >
                <FiZap size={13} /> Scan &amp; Pay QR
              </button>
            )}

            {isInHouse && (
              <>
                <button
                  type="button"
                  className="gmc-tool-btn"
                  onClick={() => onOpenAddMeal && onOpenAddMeal(res)}
                >
                  <FiPlusCircle size={13} /> Add Meal
                </button>

                <button
                  type="button"
                  className="gmc-tool-btn"
                  onClick={() => onOpenAddService && onOpenAddService(res)}
                >
                  <FiPlusCircle size={13} /> Add Service
                </button>
              </>
            )}

            {folio.isBalancePending && (
              <button
                type="button"
                className="gmc-tool-btn"
                onClick={() => onOpenRecordPayment(res, folio.balanceDue)}
              >
                <FiCreditCard size={13} /> Record Payment
              </button>
            )}

            <button
              type="button"
              className="gmc-tool-btn"
              onClick={() => onOpenVoucher(res)}
            >
              <FiFileText size={13} /> {isInHouse ? 'View Folio & Bill' : 'Booking Voucher'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
