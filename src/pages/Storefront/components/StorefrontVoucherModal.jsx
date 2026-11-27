import React, { useState } from 'react';
import { FiCheckCircle, FiPrinter, FiX, FiCopy, FiMapPin, FiCalendar, FiUser, FiPhone, FiCreditCard } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { formatTime12Hr } from '../../../utils/timeFormat';

export default function StorefrontVoucherModal({
  booking,
  property,
  onClose
}) {
  const [copied, setCopied] = useState(false);

  if (!booking) return null;

  const resIdCode = booking.id ? `#RES-${String(booking.id).padStart(4, '0')}` : `#RES-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(resIdCode);
    setCopied(true);
    toast.success("Confirmation code copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="sf-modal-backdrop" onClick={onClose}>
      <div className="sf-modal-box sf-voucher-modal-box shopify-voucher-theme" onClick={e => e.stopPropagation()}>
        {/* Top Header */}
        <div className="shopify-voucher-header">
          <div className="shopify-voucher-success-tag">
            <div className="shopify-success-icon-wrap">
              <FiCheckCircle className="shopify-success-icon" />
            </div>
            <div>
              <div className="shopify-voucher-title">Reservation Confirmed</div>
              <div className="shopify-voucher-subtitle">Thank you for booking with {property?.name || 'us'}.</div>
            </div>
          </div>
          <button onClick={onClose} className="sf-modal-close-btn" aria-label="Close">
            <FiX />
          </button>
        </div>

        {/* Voucher Main Card Container */}
        <div className="shopify-voucher-card">
          {/* Top Info Bar: Property & Confirmation Code */}
          <div className="shopify-voucher-top-bar">
            <div className="shopify-voucher-prop-meta">
              <div className="shopify-prop-name">{property?.name || 'Property'}</div>
              {property?.address && (
                <div className="shopify-prop-address">
                  <FiMapPin style={{ marginRight: 4, flexShrink: 0 }} />
                  <span>{property.address}</span>
                </div>
              )}
            </div>

            <div className="shopify-voucher-code-wrapper">
              <div className="shopify-code-label">CONFIRMATION NO.</div>
              <div className="shopify-code-value-row">
                <span className="shopify-code-badge">{resIdCode}</span>
                <button 
                  onClick={handleCopyCode} 
                  className="shopify-copy-btn"
                  title="Copy confirmation code"
                >
                  <FiCopy />
                  {copied ? <span style={{ fontSize: '0.75rem' }}>Copied</span> : null}
                </button>
              </div>
            </div>
          </div>

          {/* Details 2x2 Grid */}
          <div className="shopify-voucher-details-grid">
            <div className="shopify-voucher-grid-item">
              <div className="shopify-item-label">
                <FiUser className="shopify-item-icon" />
                <span>GUEST DETAILS</span>
              </div>
              <div className="shopify-item-val">{booking.guestName}</div>
              {booking.guestPhone && (
                <div className="shopify-item-subval">
                  <FiPhone style={{ marginRight: 4 }} />
                  {booking.guestPhone}
                </div>
              )}
            </div>

            <div className="shopify-voucher-grid-item">
              <div className="shopify-item-label">
                <FiCalendar className="shopify-item-icon" />
                <span>STAY DATES</span>
              </div>
              <div className="shopify-item-val">{booking.checkIn} → {booking.checkOut}</div>
              <div className="shopify-item-subval">Check-in from {formatTime12Hr(property?.checkInTime || '14:00')}</div>
            </div>

            <div className="shopify-voucher-grid-item">
              <div className="shopify-item-label">
                <FiCreditCard className="shopify-item-icon" />
                <span>ROOM ACCOMMODATION</span>
              </div>
              <div className="shopify-item-val">{booking.roomUnit || 'Standard Room'}</div>
              <div className="shopify-item-subval">Guests: {booking.adults || 1} Adult{(booking.adults || 1) > 1 ? 's' : ''}</div>
            </div>

            <div className="shopify-voucher-grid-item">
              <div className="shopify-item-label">
                <FiCheckCircle className="shopify-item-icon" />
                <span>PAYMENT STATUS</span>
              </div>
              <div className="shopify-item-val">
                <span className={`shopify-pay-pill ${Number(booking.amountPaid || 0) > 0 ? 'paid' : 'pending'}`}>
                  {booking.paymentStatus || (Number(booking.amountPaid || 0) > 0 ? 'Paid Online' : 'Pay at Check-in')}
                </span>
              </div>
              {booking.razorpayPaymentId && (
                <div className="shopify-item-subval">Txn: <code>{booking.razorpayPaymentId}</code></div>
              )}
            </div>
          </div>

          {/* Tri-Bar Billing Summary: Total, Paid Today, Balance Due */}
          <div className="shopify-voucher-billing-bar-tri">
            <div className="shopify-tri-bar-col">
              <span className="shopify-tri-label">TOTAL BOOKING</span>
              <span className="shopify-tri-val">₹{Number(booking.totalAmount || 0).toLocaleString()}</span>
            </div>
            <div className="shopify-tri-bar-col">
              <span className="shopify-tri-label">PAID TODAY</span>
              <span className="shopify-tri-val highlight-green">₹{Number(booking.amountPaid || 0).toLocaleString()}</span>
            </div>
            <div className="shopify-tri-bar-col">
              <span className="shopify-tri-label">DUE ON ARRIVAL</span>
              <span className="shopify-tri-val highlight-amber">
                ₹{Number(booking.balanceDue !== undefined ? booking.balanceDue : Math.max(0, (booking.totalAmount || 0) - (booking.amountPaid || 0))).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Check-in Notice Box */}
        <div className="shopify-voucher-notice">
          <strong>Important Instructions:</strong> Please present a valid Government Photo ID (Aadhaar / Passport / Driving License) upon arrival. For assistance, contact the host at <strong>{property?.contactPhone || 'Host Desk'}</strong>.
        </div>

        {/* Action Controls */}
        <div className="shopify-voucher-actions">
          <button onClick={handlePrint} className="shopify-btn-secondary">
            <FiPrinter /> Print Receipt
          </button>
          <button onClick={onClose} className="shopify-btn-primary">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
