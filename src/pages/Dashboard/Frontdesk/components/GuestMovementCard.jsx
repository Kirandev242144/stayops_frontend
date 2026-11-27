import React from 'react';
import { 
  FiUser, 
  FiCalendar, 
  FiPhone, 
  FiMessageSquare, 
  FiFileText, 
  FiPlusCircle, 
  FiCreditCard, 
  FiZap,
  FiFilePlus,
  FiLogOut,
  FiKey,
  FiHome,
  FiRefreshCw,
  FiGrid,
  FiShield,
  FiEye
} from 'react-icons/fi';
import { calculateFolio } from '../utils/folioCalculator';

/**
 * Human-designed Operational Guest Movement Card for Front Desk.
 * Groups room status, guest profile, folio financial numbers, and operational actions logically.
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
  const isNoShow = res.status === 'no_show';

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
      
      {/* ── CARD HEADER BAR ── */}
      <div className="gmc-header">
        <div className="gmc-header-left">
          <span className="gmc-booking-ref">{res.id}</span>
          <span className="gmc-source-pill">{res.ota || res.bookingSource || 'Walk-In'}</span>
          {res.propertyName && (
            <span className="gmc-property-pill"><FiHome size={11} /> {res.propertyName}</span>
          )}
          {(res.roomUnit || res.unit) && (
            <span className="gmc-unit-pill"><FiGrid size={11} /> {res.roomUnit || res.unit}</span>
          )}
        </div>

        {/* Primary Operational Action CTA */}
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

      {/* ── GUEST & STAY BODY ── */}
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
              <span><FiUser size={12} /> {res.guests} Guest{res.guests > 1 ? 's' : ''}</span>
              <span><FiCalendar size={12} /> {res.checkin} &rarr; {res.checkout}</span>
              {res.idType && (res.idNumber || res.idDocumentUrl || res.status === 'checkedin') ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#15803d', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <FiShield size={12} /> ID Verified ({res.idType})
                  </span>
                  {res.idDocumentUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewIdDocument) {
                          onViewIdDocument(res);
                        } else {
                          window.open(res.idDocumentUrl, '_blank');
                        }
                      }}
                      style={{
                        background: '#eff6ff',
                        border: '1px solid #bfdbfe',
                        color: '#1d4ed8',
                        padding: '1px 8px',
                        borderRadius: 4,
                        fontSize: 11,
                        cursor: 'pointer',
                        fontWeight: 650,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3
                      }}
                      title="View guest uploaded ID photo"
                    >
                      <FiEye size={11} /> View ID
                    </button>
                  )}
                </span>
              ) : isCheckInPending ? (
                <span style={{ color: '#b91c1c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <FiShield size={12} /> ID Pending
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Special Request or Caretaker Notes */}
        {res.notes && (
          <div className="gmc-notes-box">
            <span className="gmc-notes-label">📝 Caretaker Note:</span>
            <span className="gmc-notes-content">{res.notes}</span>
          </div>
        )}
      </div>

      {/* ── FOOTER: FINANCIAL FOLIO + TOOLBAR ACTIONS ── */}
      <div className="gmc-footer">
        
        {/* Folio Summary Numbers */}
        <div className="gmc-folio-summary">
          <div className="gmc-folio-item">
            <span className="lbl">Total Folio</span>
            <strong className="val-dark">₹{folio.totalFolio.toLocaleString('en-IN')}</strong>
          </div>
          <div className="gmc-folio-item">
            <span className="lbl">Paid</span>
            <strong className="val-green">₹{folio.paidAmount.toLocaleString('en-IN')}</strong>
          </div>
          <div className="gmc-folio-item">
            <span className="lbl">Balance Due</span>
            <strong className={folio.isBalancePending ? "val-due-badge" : "val-paid-badge"}>
              {folio.isBalancePending ? `₹${folio.balanceDue.toLocaleString('en-IN')}` : '₹0 (Paid)'}
            </strong>
          </div>
        </div>

        {/* Operational Actions Toolbar */}
        <div className="gmc-toolbar">
          
          {/* Quick UPI QR Payment */}
          {folio.isBalancePending && (
            <button
              type="button"
              className="gmc-tool-btn gmc-btn-qr"
              onClick={() => onOpenRazorpayQr(res, folio.balanceDue)}
            >
              <FiZap size={13} /> Scan & Pay QR
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
