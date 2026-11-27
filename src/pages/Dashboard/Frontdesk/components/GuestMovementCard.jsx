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
 * Designed for high-density desktop and native mobile PWA touch execution.
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
    <div className="gmc-card">
      
      {/* ── 1. CARD TOP BAR: ROOM UNIT & BOOKING REF ── */}
      <div className="gmc-header">
        <div className="gmc-header-left">
          {/* Prominent Room Badge */}
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

        {/* Primary Operational Action CTA (Desktop Only, Top Right) */}
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

      {/* ── 2. GUEST IDENTITY & STAY DETAILS ── */}
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

        {/* Special Request or Caretaker Notes */}
        {res.notes && (
          <div className="gmc-notes-box">
            <span className="gmc-notes-label">Note:</span>
            <span className="gmc-notes-content">{res.notes}</span>
          </div>
        )}
      </div>

      {/* ── 3. FINANCIAL FOLIO SUMMARY ── */}
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

      {/* ── 4. MOBILE-ONLY FULL-WIDTH PRIMARY ACTION (At Bottom of Card) ── */}
      <div className="gmc-mobile-primary-action">
        {isCheckInPending && (
          <button
            type="button"
            className="gmc-btn-primary gmc-btn-checkin"
            onClick={() => onExecuteCheckIn(res)}
          >
            <FiKey size={15} /> Execute Check-In
          </button>
        )}

        {isInHouse && (
          <button
            type="button"
            className="gmc-btn-primary gmc-btn-checkout"
            onClick={() => onExecuteCheckOut(res)}
          >
            <FiLogOut size={15} /> Execute Check-Out
          </button>
        )}
      </div>

      {/* ── 5. OPERATIONAL TOOLS GRID (QR, PAYMENT, MEAL, BILL) ── */}
      <div className="gmc-footer">
        <div className="gmc-toolbar">
          {/* Quick UPI QR Payment */}
          {folio.isBalancePending && (
            <button
              type="button"
              className="gmc-tool-btn gmc-btn-qr"
              onClick={() => onOpenRazorpayQr(res, folio.balanceDue)}
            >
              <FiZap size={13} /> Scan &amp; Pay QR
            </button>
          )}

          {/* In-House Operations: Food and Other In-Stay Services */}
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

          {/* Record Manual Payment */}
          {folio.isBalancePending && (
            <button
              type="button"
              className="gmc-tool-btn"
              onClick={() => onOpenRecordPayment(res, folio.balanceDue)}
            >
              <FiCreditCard size={13} /> Record Payment
            </button>
          )}

          {/* View Folio & Tax Invoice Voucher */}
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
  );
}
