import React from 'react';
import { 
  FiX, 
  FiSend, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiHome, 
  FiCalendar, 
  FiCreditCard, 
  FiFileText, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiPlus,
  FiShield
} from 'react-icons/fi';
import { calculateFolio } from '../utils/folioCalculator';
import './BookingVoucherModal.css';

export default function BookingVoucherModal({
  isOpen,
  res,
  mealOrders = [],
  taxSettings = null,
  onClose,
  onOpenRecordPayment,
  onOpenTaxInvoice,
}) {
  if (!isOpen || !res) {
    return null;
  }

  const folio = calculateFolio(
    res,
    mealOrders,
    taxSettings
  );

  const formattedAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const getNights = () => {
    if (!res.checkin || !res.checkout) return null;
    try {
      const d1 = new Date(res.checkin);
      const d2 = new Date(res.checkout);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? `${diff} night${diff > 1 ? 's' : ''}` : null;
    } catch {
      return null;
    }
  };

  const nightsText = getNights();

  const handleWhatsAppVoucher = () => {
    const phoneNumber = (res.phone || '').replace(
      /[^\d]/g,
      ''
    );

    if (!phoneNumber) {
      alert('No valid phone number available.');
      return;
    }

    const voucherMessage = [
      'STAYOPS BOOKING VOUCHER',
      '─────────────────────────',
      `Guest: ${res.guest}`,
      `Res ID: ${res.id}`,
      res.propertyName ? `Property: ${res.propertyName}${res.unit ? ` (${res.unit})` : ''}` : null,
      `Dates: ${res.checkin} → ${res.checkout}${nightsText ? ` (${nightsText})` : ''}`,
      '─────────────────────────',
      `Total Folio: ${formattedAmount(folio.totalFolio)}`,
      `Paid: ${formattedAmount(folio.rawPaidAmount || folio.paidAmount)}`,
      folio.refundAmount > 0 ? `Refund: -${formattedAmount(folio.refundAmount)}` : null,
      `Balance Due: ${formattedAmount(folio.balanceDue)}`,
      '─────────────────────────',
      'Thank you for staying with us!'
    ].filter(Boolean).join('\n');

    const whatsappUrl =
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(voucherMessage)}`;

    window.open(
      whatsappUrl,
      '_blank'
    );
  };

  const handleRecordPayment = () => {
    onClose();
    onOpenRecordPayment(
      res,
      folio.balanceDue
    );
  };

  const handleViewTaxInvoice = () => {
    onClose();
    onOpenTaxInvoice(res);
  };

  return (
    <div
      className="fd-modal-backdrop"
      onClick={onClose}
    >
      <div
        className="fd-modal booking-voucher-modal"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        {/* HEADER */}
        <div className="fd-modal-header bv-header">
          <div className="bv-header-left">
            <div className="bv-header-title-row">
              <h3 className="bv-title">Booking Voucher</h3>
              <span className="bv-res-id">{res.id}</span>
              <span className="bv-channel-tag">{res.ota || 'Walk-In'}</span>
            </div>
            <span className="bv-subtitle">
              Reservation summary & folio breakdown
            </span>
          </div>

          <button
            type="button"
            className="fd-modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* BODY - WIDE 2-COLUMN GRID */}
        <div className="fd-modal-body bv-body">
          {/* LEFT COLUMN: GUEST & STAY DETAILS */}
          <div className="bv-col bv-left-col">
            {/* GUEST CARD */}
            <div className="bv-card">
              <div className="bv-card-header">
                <span className="bv-card-title">Guest Details</span>
              </div>
              <div className="bv-guest-info">
                <div className="bv-guest-main">
                  <div className="bv-avatar">
                    <FiUser size={15} />
                  </div>
                  <div className="bv-guest-details">
                    <div className="bv-guest-name">{res.guest}</div>
                    <div className="bv-guest-meta">
                      {res.phone && (
                        <span className="bv-meta-item">
                          <FiPhone size={11} /> {res.phone}
                        </span>
                      )}
                      {res.email && (
                        <span className="bv-meta-item">
                          <FiMail size={11} /> {res.email}
                        </span>
                      )}
                      {res.idType && (
                        <span className="bv-meta-item" style={{ color: '#15803d', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <FiShield size={11} /> ID: {res.idType}{res.idNumber ? ` (${res.idNumber})` : ''}
                          {res.idDocumentUrl && (
                            <a
                              href={res.idDocumentUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                marginLeft: 4,
                                color: '#1d4ed8',
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                padding: '1px 6px',
                                borderRadius: 4,
                                fontSize: 10.5,
                                textDecoration: 'none',
                                fontWeight: 700
                              }}
                            >
                              👁️ View Photo ↗
                            </a>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STAY & PROPERTY CARD */}
            <div className="bv-card">
              <div className="bv-card-header">
                <span className="bv-card-title">Stay & Accommodation</span>
              </div>
              <div className="bv-stay-info">
                {res.propertyName && (
                  <div className="bv-stay-row">
                    <span className="bv-stay-label">
                      <FiHome size={12} /> Property
                    </span>
                    <span className="bv-stay-value">
                      {res.propertyName} {res.unit ? `(${res.unit})` : ''}
                    </span>
                  </div>
                )}

                <div className="bv-stay-row">
                  <span className="bv-stay-label">
                    <FiCalendar size={12} /> Duration
                  </span>
                  <div className="bv-stay-dates">
                    <span>{res.checkin} → {res.checkout}</span>
                    {nightsText && <span className="bv-nights-badge">{nightsText}</span>}
                  </div>
                </div>

                {Array.isArray(res.allocatedRooms) && res.allocatedRooms.length > 0 && (
                  <div className="bv-allocated-section">
                    <div className="bv-allocated-label">
                      Allocated Rooms ({res.allocatedRooms.length})
                    </div>
                    <div className="bv-room-chips">
                      {res.allocatedRooms.map((r, idx) => (
                        <span key={idx} className="bv-room-chip">
                          {r.roomUnit || r.roomTypeName || `Room ${idx + 1}`}
                          {r.nightlyRate ? (
                            <span className="bv-chip-rate">₹{r.nightlyRate}/nt</span>
                          ) : null}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* PAYMENT STATUS NOTICE */}
            {folio.isBalancePending ? (
              <div className="bv-notice bv-notice-pending">
                <FiAlertCircle size={14} className="bv-notice-icon" />
                <div className="bv-notice-content">
                  <span className="bv-notice-title">Balance Due: {formattedAmount(folio.balanceDue)}</span>
                  <span className="bv-notice-sub">Outstanding balance to be collected before checkout</span>
                </div>
              </div>
            ) : folio.isRefunded ? (
              <div className="bv-notice bv-notice-neutral">
                <FiAlertCircle size={14} className="bv-notice-icon" />
                <div className="bv-notice-content">
                  <span className="bv-notice-title">Folio Refunded</span>
                  <span className="bv-notice-sub">All received payments have been refunded</span>
                </div>
              </div>
            ) : (
              <div className="bv-notice bv-notice-settled">
                <FiCheckCircle size={14} className="bv-notice-icon" />
                <div className="bv-notice-content">
                  <span className="bv-notice-title">Folio Fully Settled</span>
                  <span className="bv-notice-sub">100% of charges have been collected</span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: FOLIO BREAKDOWN */}
          <div className="bv-col bv-right-col">
            <div className="bv-card bv-folio-card">
              <div className="bv-card-header bv-folio-header">
                <div className="bv-card-title-row">
                  <FiCreditCard size={13} />
                  <span className="bv-card-title">Folio & Charges</span>
                </div>

                {folio.isRefunded ? (
                  <span className="bv-pill bv-pill-red">Refunded</span>
                ) : folio.isPartialRefund ? (
                  <span className="bv-pill bv-pill-amber">Partial Refund</span>
                ) : folio.isBalancePending ? (
                  <span className="bv-pill bv-pill-amber">Partial / Pending</span>
                ) : (
                  <span className="bv-pill bv-pill-green">100% Paid</span>
                )}
              </div>

              <div className="bv-folio-table">
                <div className="bv-folio-row">
                  <span className="bv-row-desc">Base Room Tariff</span>
                  <span className="bv-row-val">{formattedAmount(folio.roomTariff)}</span>
                </div>

                {folio.mealTotal > 0 && (
                  <div className="bv-folio-services-group">
                    <div className="bv-folio-row">
                      <span className="bv-row-desc">In-Stay Services & Add-ons</span>
                      <span className="bv-row-val">+ {formattedAmount(folio.mealTotal)}</span>
                    </div>
                    {folio.resMeals && folio.resMeals.length > 0 && (
                      <div className="bv-folio-services-sublist">
                        {folio.resMeals.map((m, idx) => (
                          <div key={m.id || idx} className="bv-service-subitem">
                            <span className="bv-subitem-name">
                              • {m.item ? m.item.replace(/^(Meal|Service):\s*/i, '') : (m.itemName || 'Service / Meal')}
                            </span>
                            <span className="bv-subitem-amt">₹{Number(m.amount || 0).toLocaleString('en-IN')}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {folio.serviceChargeAmount > 0 && (
                  <div className="bv-folio-row">
                    <span className="bv-row-desc">Service Charge</span>
                    <span className="bv-row-val">+ {formattedAmount(folio.serviceChargeAmount)}</span>
                  </div>
                )}

                {folio.totalGstAmount > 0 && !folio.taxInclusive && (
                  <div className="bv-folio-row">
                    <span className="bv-row-desc">GST Tax</span>
                    <span className="bv-row-val">+ {formattedAmount(folio.totalGstAmount)}</span>
                  </div>
                )}

                <div className="bv-folio-divider" />

                <div className="bv-folio-row bv-row-total">
                  <span className="bv-row-desc">Total Folio Amount</span>
                  <span className="bv-row-val">{formattedAmount(folio.totalFolio)}</span>
                </div>

                <div className="bv-folio-row bv-row-paid">
                  <span className="bv-row-desc">Amount Received</span>
                  <span className="bv-row-val">{formattedAmount(folio.rawPaidAmount || folio.paidAmount)}</span>
                </div>

                {folio.refundAmount > 0 && (
                  <div className="bv-folio-row bv-row-refund">
                    <span className="bv-row-desc">Refund Issued</span>
                    <span className="bv-row-val">- {formattedAmount(folio.refundAmount)}</span>
                  </div>
                )}

                <div className={`bv-balance-box ${folio.isBalancePending ? 'is-due' : 'is-settled'}`}>
                  <span className="bv-balance-label">
                    {folio.isBalancePending ? 'Balance Due' : 'Balance'}
                  </span>
                  <span className="bv-balance-val">
                    {formattedAmount(folio.balanceDue)}
                  </span>
                </div>
              </div>

              {/* QUICK ACTIONS */}
              <div className="bv-quick-actions">
                <button
                  type="button"
                  className="bv-btn-primary"
                  onClick={handleRecordPayment}
                >
                  <FiPlus size={13} /> Record Payment
                </button>

                <button
                  type="button"
                  className="bv-btn-secondary-action"
                  onClick={handleViewTaxInvoice}
                >
                  <FiFileText size={13} /> View GST Invoice
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="fd-modal-footer bv-footer">
          <button
            type="button"
            className="bv-footer-close"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="bv-footer-whatsapp"
            onClick={handleWhatsAppVoucher}
          >
            <FiSend size={13} /> Send WhatsApp Voucher
          </button>
        </div>
      </div>
    </div>
  );
}