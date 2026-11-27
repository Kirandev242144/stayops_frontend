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
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiPrinter,
  FiClock
} from 'react-icons/fi';
import { formatTime12Hr } from '../../../../utils/timeFormat';
import { calculateFolio } from '../../Frontdesk/utils/folioCalculator';
import './BookingVoucherModal.css';

export default function BookingVoucherModal({
  booking,
  mealOrders = [],
  taxSettings = null,
  onClose
}) {
  if (!booking) {
    return null;
  }

  const folio = calculateFolio(booking, mealOrders, taxSettings);

  const formatAmount = (amount) =>
    `₹${Number(amount || 0).toLocaleString('en-IN')}`;

  const guestName = booking.guestName || booking.guest || 'Guest';
  const guestPhone = booking.guestPhone || booking.phone || '';
  const guestEmail = booking.guestEmail || booking.email || '';
  const propertyName = booking.propertyName || 'Property';
  const roomUnit = booking.roomUnit || booking.unit || '';
  const bookingSource = booking.bookingSource || booking.ota || booking.source || 'Walk-In';
  const bookingStatus = (booking.status || 'confirmed').toLowerCase();

  const checkInDate = booking.checkIn || booking.checkin || '';
  const checkOutDate = booking.checkOut || booking.checkout || '';

  const getNights = () => {
    if (!checkInDate || !checkOutDate) return null;
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diff = Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
      return diff > 0 ? `${diff} night${diff > 1 ? 's' : ''}` : null;
    } catch {
      return null;
    }
  };

  const nightsText = getNights();

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppVoucher = () => {
    const rawDigits = guestPhone.replace(/[^\d]/g, '');
    if (!rawDigits) {
      alert('No valid guest phone number available to send WhatsApp voucher.');
      return;
    }

    const voucherLines = [
      'STAYOPS BOOKING VOUCHER',
      '─────────────────────────',
      `Booking ID: ${booking.id}`,
      `Guest Name: ${guestName}`,
      `Property: ${propertyName}${roomUnit ? ` (${roomUnit})` : ''}`,
      `Check-In: ${checkInDate}${booking.checkInTime ? ` (${formatTime12Hr(booking.checkInTime)})` : ''}`,
      `Check-Out: ${checkOutDate}${booking.checkOutTime ? ` (${formatTime12Hr(booking.checkOutTime)})` : ''}`,
      nightsText ? `Duration: ${nightsText}` : null,
      '─────────────────────────',
      `Total Folio: ${formatAmount(folio.totalFolio)}`,
      `Amount Paid: ${formatAmount(folio.paidAmount)}`,
      folio.balanceDue > 0
        ? `Balance Due: ${formatAmount(folio.balanceDue)}`
        : 'Status: Fully Paid',
      '─────────────────────────',
      'Thank you for staying with us!'
    ].filter(Boolean).join('\n');

    const whatsappUrl = `https://wa.me/${rawDigits}?text=${encodeURIComponent(voucherLines)}`;
    window.open(whatsappUrl, '_blank');
  };

  const guestInitial = guestName ? guestName.charAt(0).toUpperCase() : 'G';

  return (
    <div className="res-voucher-backdrop" onClick={onClose}>
      <div
        className="res-voucher-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="res-voucher-header">
          <div className="res-voucher-header-info">
            <div className="res-voucher-title-row">
              <h3 className="res-voucher-title">Booking Voucher</h3>
              <span className="res-voucher-ref-badge">{booking.id}</span>
              <span className="res-voucher-source-tag">{bookingSource}</span>
              <span className={`res-voucher-status-badge ${bookingStatus}`}>
                {bookingStatus}
              </span>
            </div>
            <span className="res-voucher-subtitle">
              Official guest confirmation & folio invoice breakdown
            </span>
          </div>

          <button
            type="button"
            className="res-voucher-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* BODY - 2 COLUMN GRID */}
        <div className="res-voucher-body">
          {/* LEFT COLUMN: GUEST & STAY */}
          <div className="res-voucher-col">
            {/* GUEST CARD */}
            <div className="res-vcard">
              <div className="res-vcard-header">
                <div className="res-vcard-title-row">
                  <FiUser size={13} />
                  <span className="res-vcard-title">Guest Details</span>
                </div>
              </div>

              <div className="res-voucher-guest-row">
                <div className="res-voucher-avatar">
                  {guestInitial}
                </div>

                <div className="res-voucher-guest-info">
                  <span className="res-voucher-guest-name">{guestName}</span>
                  <div className="res-voucher-guest-contacts">
                    {guestPhone && (
                      <a
                        href={`tel:${guestPhone}`}
                        className="res-voucher-contact-link"
                      >
                        <FiPhone size={11} /> {guestPhone}
                      </a>
                    )}
                    {guestEmail && (
                      <a
                        href={`mailto:${guestEmail}`}
                        className="res-voucher-contact-link"
                      >
                        <FiMail size={11} /> {guestEmail}
                      </a>
                    )}
                  </div>

                  {(booking.idType || booking.aadhaarNumber || booking.idNumber) && (
                    <div className="res-voucher-id-badge">
                      <FiShield size={12} color="#166534" />
                      <span>
                        {booking.idType || 'ID'}: {booking.aadhaarNumber || booking.idNumber}
                      </span>
                      {booking.idDocumentUrl && (
                        <a
                          href={booking.idDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="res-voucher-id-view-link"
                        >
                          View Photo ↗
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* STAY CARD */}
            <div className="res-vcard">
              <div className="res-vcard-header">
                <div className="res-vcard-title-row">
                  <FiHome size={13} />
                  <span className="res-vcard-title">Stay & Accommodation</span>
                </div>
              </div>

              <div className="res-voucher-stay-rows">
                <div className="res-voucher-stay-row">
                  <span className="res-voucher-label">
                    <FiHome size={12} /> Property
                  </span>
                  <span className="res-voucher-val">
                    {propertyName} {roomUnit ? `(${roomUnit})` : ''}
                  </span>
                </div>

                <div className="res-voucher-stay-row">
                  <span className="res-voucher-label">
                    <FiCalendar size={12} /> Check-In
                  </span>
                  <span className="res-voucher-val">
                    {checkInDate} {booking.checkInTime ? `(${formatTime12Hr(booking.checkInTime)})` : ''}
                  </span>
                </div>

                <div className="res-voucher-stay-row">
                  <span className="res-voucher-label">
                    <FiClock size={12} /> Check-Out
                  </span>
                  <div className="res-voucher-dates-badge">
                    <span className="res-voucher-val">
                      {checkOutDate} {booking.checkOutTime ? `(${formatTime12Hr(booking.checkOutTime)})` : ''}
                    </span>
                    {nightsText && (
                      <span className="res-voucher-nights-pill">{nightsText}</span>
                    )}
                  </div>
                </div>

                <div className="res-voucher-stay-row">
                  <span className="res-voucher-label">
                    <FiUser size={12} /> Occupancy
                  </span>
                  <span className="res-voucher-val">
                    {booking.adultsCount
                      ? `${booking.adultsCount} Adult${booking.adultsCount > 1 ? 's' : ''}${booking.childrenCount > 0 ? `, ${booking.childrenCount} Child${booking.childrenCount > 1 ? 'ren' : ''}` : ''}`
                      : `${booking.guestCount || 1} Guest${(booking.guestCount || 1) > 1 ? 's' : ''}`}
                  </span>
                </div>

                {Array.isArray(booking.allocatedRooms) && booking.allocatedRooms.length > 0 && (
                  <div className="res-voucher-allocated-wrap">
                    <div className="res-voucher-allocated-title">
                      Allocated Rooms ({booking.allocatedRooms.length}):
                    </div>
                    <div className="res-voucher-chips">
                      {booking.allocatedRooms.map((r, idx) => (
                        <span key={idx} className="res-voucher-chip">
                          {r.roomUnit || r.roomTypeName || `Room ${idx + 1}`}
                          {r.nightlyRate ? (
                            <span className="res-voucher-chip-rate">
                              (₹{Number(r.nightlyRate).toLocaleString('en-IN')}/nt)
                            </span>
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
              <div className="res-voucher-notice pending">
                <FiAlertCircle size={15} className="res-voucher-notice-icon" />
                <div className="res-voucher-notice-content">
                  <span className="res-voucher-notice-title">
                    Balance Due: {formatAmount(folio.balanceDue)}
                  </span>
                  <span className="res-voucher-notice-sub">
                    Outstanding balance to be collected prior to departure.
                  </span>
                </div>
              </div>
            ) : folio.isRefunded ? (
              <div className="res-voucher-notice neutral">
                <FiAlertCircle size={15} className="res-voucher-notice-icon" />
                <div className="res-voucher-notice-content">
                  <span className="res-voucher-notice-title">Folio Refunded</span>
                  <span className="res-voucher-notice-sub">
                    All collected payments have been processed as refunded.
                  </span>
                </div>
              </div>
            ) : (
              <div className="res-voucher-notice settled">
                <FiCheckCircle size={15} className="res-voucher-notice-icon" />
                <div className="res-voucher-notice-content">
                  <span className="res-voucher-notice-title">Folio Fully Settled</span>
                  <span className="res-voucher-notice-sub">
                    100% of charges have been collected and verified.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: FOLIO BREAKDOWN */}
          <div className="res-voucher-col">
            <div className="res-vcard">
              <div className="res-vcard-header">
                <div className="res-vcard-title-row">
                  <FiCreditCard size={13} />
                  <span className="res-vcard-title">Folio & Financials</span>
                </div>

                {folio.isRefunded ? (
                  <span className="res-voucher-pill red">Refunded</span>
                ) : folio.isPartialRefund ? (
                  <span className="res-voucher-pill amber">Partial Refund</span>
                ) : folio.isBalancePending ? (
                  <span className="res-voucher-pill amber">Partial / Pending</span>
                ) : (
                  <span className="res-voucher-pill green">100% Paid</span>
                )}
              </div>

              <div className="res-voucher-folio-table">
                <div className="res-voucher-folio-row">
                  <span className="res-voucher-row-label">Base Room Tariff</span>
                  <span className="res-voucher-row-amount">
                    {formatAmount(folio.roomTariff)}
                  </span>
                </div>

                {folio.mealTotal > 0 && (
                  <>
                    <div className="res-voucher-folio-row">
                      <span className="res-voucher-row-label">In-Stay Services & Add-ons</span>
                      <span className="res-voucher-row-amount">
                        + {formatAmount(folio.mealTotal)}
                      </span>
                    </div>

                    {folio.resMeals && folio.resMeals.length > 0 && (
                      <div className="res-voucher-services-list">
                        {folio.resMeals.map((m, idx) => (
                          <div key={m.id || idx} className="res-voucher-service-item">
                            <span className="res-voucher-service-name">
                              • {m.item ? m.item.replace(/^(Meal|Service):\s*/i, '') : (m.itemName || 'Service / Meal')}
                            </span>
                            <span className="res-voucher-service-amt">
                              ₹{Number(m.amount || 0).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {folio.serviceChargeAmount > 0 && (
                  <div className="res-voucher-folio-row">
                    <span className="res-voucher-row-label">Service Charge</span>
                    <span className="res-voucher-row-amount">
                      + {formatAmount(folio.serviceChargeAmount)}
                    </span>
                  </div>
                )}

                {folio.totalGstAmount > 0 && !folio.taxInclusive && (
                  <div className="res-voucher-folio-row">
                    <span className="res-voucher-row-label">GST Tax</span>
                    <span className="res-voucher-row-amount">
                      + {formatAmount(folio.totalGstAmount)}
                    </span>
                  </div>
                )}

                <div className="res-voucher-divider" />

                <div className="res-voucher-folio-row total">
                  <span className="res-voucher-row-label">Total Folio Amount</span>
                  <span className="res-voucher-row-amount">
                    {formatAmount(folio.totalFolio)}
                  </span>
                </div>

                <div className="res-voucher-folio-row paid">
                  <span className="res-voucher-row-label">Amount Paid</span>
                  <span className="res-voucher-row-amount">
                    {formatAmount(folio.paidAmount)}
                  </span>
                </div>

                {folio.refundAmount > 0 && (
                  <div className="res-voucher-folio-row refund">
                    <span className="res-voucher-row-label">Refund Issued</span>
                    <span className="res-voucher-row-amount">
                      - {formatAmount(folio.refundAmount)}
                    </span>
                  </div>
                )}

                <div className={`res-voucher-balance-box ${folio.isBalancePending ? 'due' : 'settled'}`}>
                  <span className="res-voucher-box-label">
                    {folio.isBalancePending ? 'Balance Due' : 'Folio Balance'}
                  </span>
                  <span className="res-voucher-box-val">
                    {formatAmount(folio.balanceDue)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="res-voucher-footer">
          <button
            type="button"
            className="res-voucher-btn res-voucher-btn-close"
            onClick={onClose}
          >
            Close
          </button>

          <button
            type="button"
            className="res-voucher-btn res-voucher-btn-print"
            onClick={handlePrint}
          >
            <FiPrinter size={13} /> Print Voucher
          </button>

          <button
            type="button"
            className="res-voucher-btn res-voucher-btn-whatsapp"
            onClick={handleWhatsAppVoucher}
          >
            <FiSend size={13} /> Send WhatsApp Voucher
          </button>
        </div>
      </div>
    </div>
  );
}