import React, { useState } from 'react';
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
  FiAlertTriangle,
  FiCoffee,
  FiMoreHorizontal,
  FiX,
  FiChevronRight
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
  const [showMobileActionSheet, setShowMobileActionSheet] = useState(false);
  const [showQuickAddSheet, setShowQuickAddSheet] = useState(false);
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

        {/* Bottom Action Strip: Ultra-Clean Native Bar (2 Main Buttons + More Button) */}
        <div className="fd-stitch-card-bot">
          {isCheckInPending && (
            <>
              <button
                type="button"
                className="fd-stitch-btn-primary"
                onClick={() => onExecuteCheckIn(res)}
              >
                <FiKey size={14} className="fd-stitch-btn-icon-sky" />
                <span>{folio.isBalancePending ? 'Check In & Collect' : 'Check In'}</span>
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
            </>
          )}

          {isInHouse && (
            <>
              <button
                type="button"
                className="fd-stitch-btn-primary checkout"
                onClick={() => onExecuteCheckOut(res)}
              >
                <FiLogOut size={14} className="fd-stitch-btn-icon-amber" />
                <span>Check Out</span>
              </button>

              <button
                type="button"
                className="fd-stitch-btn-secondary add-order"
                onClick={() => setShowQuickAddSheet(true)}
                title="Add food, meal, service or extra charge"
              >
                <FiPlusCircle size={13} className="text-emerald-600" />
                <span>Add Order</span>
              </button>
            </>
          )}

          {/* 3-Dots Quick Action Sheet Trigger */}
          <button
            type="button"
            className="fd-stitch-btn-more"
            onClick={() => setShowMobileActionSheet(true)}
            title="All operational actions"
            aria-label="More operational actions"
          >
            <FiMoreHorizontal size={16} />
          </button>
        </div>

      </article>

      {/* ═════════════════════════════════════════════════════════
          NATIVE QUICK ADD BOTTOM SHEET (Meals & Services)
          Clean 1-tap sheet for high-frequency in-stay requests
         ═════════════════════════════════════════════════════════ */}
      {showQuickAddSheet && (
        <div
          className="fd-stitch-sheet-backdrop"
          onClick={() => setShowQuickAddSheet(false)}
        >
          <div
            className="fd-stitch-sheet"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Add Order or Service"
          >
            <div className="fd-stitch-sheet-drag"></div>

            <div className="fd-stitch-sheet-header">
              <div className="fd-stitch-sheet-guest">
                <div className="fd-stitch-avatar">{initial}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="fd-stitch-sheet-name truncate">Add Order · {roomUnitName}</h3>
                  <p className="fd-stitch-sheet-sub truncate">
                    Guest: {res.guest} • {res.bookingRef || res.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="fd-stitch-sheet-close"
                onClick={() => setShowQuickAddSheet(false)}
                aria-label="Close"
              >
                <FiX size={15} />
              </button>
            </div>

            <div className="fd-stitch-sheet-actions">
              <button
                type="button"
                className="fd-stitch-sheet-item"
                onClick={() => {
                  setShowQuickAddSheet(false);
                  onOpenAddMeal && onOpenAddMeal(res);
                }}
              >
                <div className="fd-stitch-sheet-icon amber">
                  <FiCoffee size={18} />
                </div>
                <div className="fd-stitch-sheet-item-text">
                  <strong>Food &amp; Meal Order</strong>
                  <span>Breakfast, lunch, dinner, tea/coffee or snacks</span>
                </div>
                <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
              </button>

              <button
                type="button"
                className="fd-stitch-sheet-item"
                onClick={() => {
                  setShowQuickAddSheet(false);
                  onOpenAddService && onOpenAddService(res);
                }}
              >
                <div className="fd-stitch-sheet-icon purple">
                  <FiPlusCircle size={18} />
                </div>
                <div className="fd-stitch-sheet-item-text">
                  <strong>Room Service &amp; Extras</strong>
                  <span>Laundry, extra bed, cab, luggage, amenities</span>
                </div>
                <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
              </button>

              {folio.isBalancePending && (
                <button
                  type="button"
                  className="fd-stitch-sheet-item"
                  onClick={() => {
                    setShowQuickAddSheet(false);
                    onOpenRecordPayment && onOpenRecordPayment(res, folio.balanceDue);
                  }}
                >
                  <div className="fd-stitch-sheet-icon green">
                    <FiCreditCard size={18} />
                  </div>
                  <div className="fd-stitch-sheet-item-text">
                    <strong>Collect / Record Payment</strong>
                    <span>Record cash, card or UPI (₹{folio.balanceDue.toLocaleString('en-IN')} pending)</span>
                  </div>
                  <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
                </button>
              )}
            </div>

            <div className="fd-stitch-sheet-footer">
              <button
                type="button"
                className="fd-stitch-sheet-dismiss"
                onClick={() => setShowQuickAddSheet(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════
          NATIVE MOBILE ACTION BOTTOM SHEET (iOS / Material 3)
          Gives 1-tap mobile access to 100% front desk operations:
          - Add Meal / Dining Order
          - Add In-Stay Service & Extras
          - Record Payment
          - UPI QR Code
          - View Folio & Voucher
          - View ID Document
          - Direct WhatsApp
         ═════════════════════════════════════════════════════════ */}
      {showMobileActionSheet && (
        <div 
          className="fd-stitch-sheet-backdrop" 
          onClick={() => setShowMobileActionSheet(false)}
        >
          <div 
            className="fd-stitch-sheet" 
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Guest Operational Actions"
          >
            {/* Native Top Drag Handle */}
            <div className="fd-stitch-sheet-drag"></div>

            {/* Guest Summary Card Header */}
            <div className="fd-stitch-sheet-header">
              <div className="fd-stitch-sheet-guest">
                <div className="fd-stitch-avatar">{initial}</div>
                <div className="min-w-0 flex-1">
                  <h3 className="fd-stitch-sheet-name truncate">{res.guest}</h3>
                  <p className="fd-stitch-sheet-sub truncate">
                    {roomUnitName} • {res.bookingRef || res.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="fd-stitch-sheet-close"
                onClick={() => setShowMobileActionSheet(false)}
                aria-label="Close action sheet"
              >
                <FiX size={15} />
              </button>
            </div>

            {/* Folio Mini Snapshot */}
            <div className="fd-stitch-sheet-folio">
              <span className="fd-stitch-sheet-folio-total">Total: ₹{folio.totalFolio.toLocaleString('en-IN')}</span>
              <span className={`fd-stitch-sheet-folio-due ${folio.isBalancePending ? 'due' : 'paid'}`}>
                {folio.isBalancePending ? `Due: ₹${folio.balanceDue.toLocaleString('en-IN')}` : 'Paid in Full'}
              </span>
            </div>

            {/* List of Native Action Tiles */}
            <div className="fd-stitch-sheet-actions">
              <button
                type="button"
                className="fd-stitch-sheet-item"
                onClick={() => {
                  setShowMobileActionSheet(false);
                  onOpenAddMeal && onOpenAddMeal(res);
                }}
              >
                <div className="fd-stitch-sheet-icon amber">
                  <FiCoffee size={16} />
                </div>
                <div className="fd-stitch-sheet-item-text">
                  <strong>Add Food &amp; Meal Order</strong>
                  <span>Post dining, breakfast, coffee or room service</span>
                </div>
                <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
              </button>

              <button
                type="button"
                className="fd-stitch-sheet-item"
                onClick={() => {
                  setShowMobileActionSheet(false);
                  onOpenAddService && onOpenAddService(res);
                }}
              >
                <div className="fd-stitch-sheet-icon purple">
                  <FiPlusCircle size={16} />
                </div>
                <div className="fd-stitch-sheet-item-text">
                  <strong>Add In-Stay Service &amp; Extras</strong>
                  <span>Post laundry, extra bed, cab, luggage or amenities</span>
                </div>
                <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
              </button>

              {folio.isBalancePending && (
                <button
                  type="button"
                  className="fd-stitch-sheet-item"
                  onClick={() => {
                    setShowMobileActionSheet(false);
                    onOpenRecordPayment && onOpenRecordPayment(res, folio.balanceDue);
                  }}
                >
                  <div className="fd-stitch-sheet-icon green">
                    <FiCreditCard size={16} />
                  </div>
                  <div className="fd-stitch-sheet-item-text">
                    <strong>Record Offline Payment</strong>
                    <span>Collect cash, card or manual UPI transfer</span>
                  </div>
                  <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
                </button>
              )}

              {folio.isBalancePending && (
                <button
                  type="button"
                  className="fd-stitch-sheet-item"
                  onClick={() => {
                    setShowMobileActionSheet(false);
                    onOpenRazorpayQr && onOpenRazorpayQr(res, folio.balanceDue);
                  }}
                >
                  <div className="fd-stitch-sheet-icon blue">
                    <FiZap size={16} />
                  </div>
                  <div className="fd-stitch-sheet-item-text">
                    <strong>Scan &amp; Pay UPI QR</strong>
                    <span>Generate Razorpay QR for guest phone scan</span>
                  </div>
                  <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
                </button>
              )}

              <button
                type="button"
                className="fd-stitch-sheet-item"
                onClick={() => {
                  setShowMobileActionSheet(false);
                  onOpenVoucher && onOpenVoucher(res);
                }}
              >
                <div className="fd-stitch-sheet-icon slate">
                  <FiFileText size={16} />
                </div>
                <div className="fd-stitch-sheet-item-text">
                  <strong>{isInHouse ? 'View Folio & Bill Voucher' : 'View Booking Voucher'}</strong>
                  <span>Review itemized invoice and billing breakdown</span>
                </div>
                <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
              </button>

              <button
                type="button"
                className="fd-stitch-sheet-item"
                onClick={() => {
                  setShowMobileActionSheet(false);
                  onViewIdDocument && onViewIdDocument(res);
                }}
              >
                <div className={`fd-stitch-sheet-icon ${isIdVerified ? 'emerald' : 'amber'}`}>
                  <FiShield size={16} />
                </div>
                <div className="fd-stitch-sheet-item-text">
                  <strong>{isIdVerified ? 'View ID Document' : 'Verify Guest ID'}</strong>
                  <span>{isIdVerified ? `${res.idType || 'ID Document'} verified on file` : 'Government ID pending verification'}</span>
                </div>
                <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
              </button>

              {res.phone && (
                <button
                  type="button"
                  className="fd-stitch-sheet-item"
                  onClick={(e) => {
                    setShowMobileActionSheet(false);
                    handleWhatsApp(e);
                  }}
                >
                  <div className="fd-stitch-sheet-icon whatsapp">
                    <FiMessageSquare size={16} />
                  </div>
                  <div className="fd-stitch-sheet-item-text">
                    <strong>Chat on WhatsApp</strong>
                    <span>Direct message {res.phone}</span>
                  </div>
                  <FiChevronRight size={16} className="fd-stitch-sheet-arrow" />
                </button>
              )}
            </div>

            {/* Bottom Dismiss Button */}
            <div className="fd-stitch-sheet-footer">
              <button
                type="button"
                className="fd-stitch-sheet-dismiss"
                onClick={() => setShowMobileActionSheet(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

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
