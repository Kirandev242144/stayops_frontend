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
  FiEye
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
 * Human-designed Operational Guest Movement Card for Front Desk.
 * Dual-layout:
 * - .gmc-mob-card: Clean, flat, native PWA layout with zero nested-box clutter
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

  // Compute short date & night count for mobile
  const checkinDateShort = res.checkin
    ? new Date(res.checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

  const nightsCount = (() => {
    if (!res.checkin || !res.checkout) return 1;
    try {
      const diff = (new Date(res.checkout) - new Date(res.checkin)) / (1000 * 60 * 60 * 24);
      return Math.max(1, Math.round(diff));
    } catch {
      return 1;
    }
  })();

  // Mobile status badge label & style
  let mobStatusLabel = 'Arriving today';
  let mobStatusClass = 'arriving';
  if (isInHouse) {
    mobStatusLabel = 'In-House';
    mobStatusClass = 'inhouse';
  } else if (res.status === 'no_show') {
    mobStatusLabel = 'No-Show';
    mobStatusClass = 'noshow';
  } else if (!isCheckInPending) {
    mobStatusLabel = res.status || 'Confirmed';
    mobStatusClass = 'confirmed';
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

  return (
    <>
      {/* ═════════════════════════════════════════════════════════
          1. NATIVE MOBILE APP PWA CARD (< 768px)
          Designed to feel like an authentic iOS / Material 3 card:
          - Status + Booking ID at top
          - Guest Avatar + Name + WhatsApp
          - Clean Key-Value details (Flat, NO box-in-box)
          - Full-width 50px Primary CTA at bottom
          - Clean 44px Secondary Voucher CTA
         ═════════════════════════════════════════════════════════ */}
      <div className="gmc-mob-card">
        {/* Top Status & Booking Ref */}
        <div className="gmc-mob-topbar">
          <span className={`gmc-mob-badge ${mobStatusClass}`}>
            {mobStatusLabel}
          </span>
          <span className="gmc-mob-ref">{res.id}</span>
        </div>

        {/* Guest Profile Row */}
        <div className="gmc-mob-guest-row">
          <div className="gmc-mob-avatar">
            {(res.guest || 'G').charAt(0).toUpperCase()}
          </div>
          <div className="gmc-mob-guest-info">
            <h3 className="gmc-mob-guest-name">{res.guest}</h3>
            <span className="gmc-mob-guest-sub">
              {res.guests || 1} Guest · {nightsCount} Night{nightsCount > 1 ? 's' : ''}
            </span>
          </div>
          {res.phone && (
            <button
              type="button"
              className="gmc-mob-wa-btn"
              onClick={handleWhatsApp}
              title="Chat on WhatsApp"
            >
              <FiMessageSquare size={13} />
              <span>WhatsApp</span>
            </button>
          )}
        </div>

        {/* Key-Value Information Rows (Clean, Flat, No nested box) */}
        <div className="gmc-mob-kv-section">
          <div className="gmc-mob-kv-row">
            <span className="gmc-mob-k">Room</span>
            <span className="gmc-mob-v gmc-mob-room-val">{roomUnitName} · {res.id}</span>
          </div>

          <div className="gmc-mob-kv-row">
            <span className="gmc-mob-k">Check-in</span>
            <span className="gmc-mob-v">{checkinDateShort}</span>
          </div>

          <div className="gmc-mob-kv-row">
            <span className="gmc-mob-k">ID verification</span>
            <span className="gmc-mob-v gmc-mob-id-val">
              {res.idType && (res.idNumber || res.idDocumentUrl || res.status === 'checkedin') ? (
                <span className="gmc-mob-id-verified-wrap">
                  <span className="gmc-mob-verified-badge">
                    <FiShield size={12} /> Verified
                  </span>
                  {res.idDocumentUrl && (
                    <button
                      type="button"
                      className="gmc-mob-btn-view-id"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewIdDocument) onViewIdDocument(res);
                        else window.open(res.idDocumentUrl, '_blank');
                      }}
                    >
                      <FiEye size={11} /> View ID
                    </button>
                  )}
                </span>
              ) : (
                <span className="gmc-mob-pending-badge">
                  <FiShield size={12} /> Pending
                </span>
              )}
            </span>
          </div>

          <div className="gmc-mob-kv-row">
            <span className="gmc-mob-k">Total amount</span>
            <span className="gmc-mob-v gmc-mob-v-bold">₹{folio.totalFolio.toLocaleString('en-IN')}</span>
          </div>

          <div className="gmc-mob-kv-row">
            <span className="gmc-mob-k">Paid</span>
            <span className="gmc-mob-v gmc-mob-v-green">₹{folio.paidAmount.toLocaleString('en-IN')}</span>
          </div>

          {folio.isBalancePending && (
            <div className="gmc-mob-kv-row highlight-due">
              <span className="gmc-mob-k gmc-mob-k-due">Balance due</span>
              <span className="gmc-mob-v gmc-mob-v-due">₹{folio.balanceDue.toLocaleString('en-IN')}</span>
            </div>
          )}
        </div>

        {/* Primary Action Button (Full-width 50px thumb target) */}
        {isCheckInPending && (
          <button
            type="button"
            className="gmc-mob-primary-btn checkin"
            onClick={() => onExecuteCheckIn(res)}
          >
            <FiKey size={16} /> Execute Check-in
          </button>
        )}

        {isInHouse && (
          <button
            type="button"
            className="gmc-mob-primary-btn checkout"
            onClick={() => onExecuteCheckOut(res)}
          >
            <FiLogOut size={16} /> Execute Check-out
          </button>
        )}

        {/* Secondary Action: View booking voucher */}
        <div className="gmc-mob-secondary-actions">
          <button
            type="button"
            className="gmc-mob-secondary-btn"
            onClick={() => onOpenVoucher(res)}
          >
            <FiFileText size={14} /> View booking voucher
          </button>

          {/* Quick Operations: QR Pay, Record Payment, Meal */}
          {(folio.isBalancePending || isInHouse) && (
            <div className="gmc-mob-quick-chips">
              {folio.isBalancePending && (
                <button
                  type="button"
                  className="gmc-mob-chip-btn"
                  onClick={() => onOpenRazorpayQr(res, folio.balanceDue)}
                >
                  <FiZap size={12} /> QR Pay
                </button>
              )}
              {folio.isBalancePending && (
                <button
                  type="button"
                  className="gmc-mob-chip-btn"
                  onClick={() => onOpenRecordPayment(res, folio.balanceDue)}
                >
                  <FiCreditCard size={12} /> Payment
                </button>
              )}
              {isInHouse && (
                <button
                  type="button"
                  className="gmc-mob-chip-btn"
                  onClick={() => onOpenAddMeal && onOpenAddMeal(res)}
                >
                  <FiPlusCircle size={12} /> Add Meal
                </button>
              )}
            </div>
          )}
        </div>
      </div>

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
