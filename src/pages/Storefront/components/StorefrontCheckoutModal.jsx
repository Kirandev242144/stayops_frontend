import React, { useState } from 'react';
import { FiX, FiShield, FiCreditCard, FiCheckCircle, FiLock, FiCalendar, FiUser, FiPhone, FiMail, FiMessageSquare } from 'react-icons/fi';
import { API_BASE_URL } from '../../../config/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function StorefrontCheckoutModal({
  property,
  selectedCart,
  checkIn,
  checkOut,
  nightCount,
  adults,
  childrenCount,
  onClose,
  onSubmitBooking
}) {
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // Payment Plan: 'advance' (Pay advance now) | 'full' (Pay in full now - 5% off)
  const [paymentPlan, setPaymentPlan] = useState('advance');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate Base Totals
  const selectedItems = Object.values(selectedCart);
  const roomNamesStr = selectedItems.map(i => `${i.quantity}x ${i.room.name}`).join(', ');
  const rawTotal = selectedItems.reduce((sum, i) => sum + (i.room.ratePerNight * i.quantity * nightCount), 0);

  // Advance Deposit Calculation:
  // Default to min(1000, rawTotal), or custom configured advance
  const configuredAdvance = property?.advanceAmount || property?.themeConfig?.advanceAmount;
  const advanceAmount = configuredAdvance
    ? Math.min(Number(configuredAdvance), rawTotal)
    : rawTotal <= 1500
      ? Math.round(rawTotal * 0.5)
      : Math.min(1000, rawTotal);

  // Full Payment 5% Discount
  const discountPercent = 5;
  const discountAmount = Math.round(rawTotal * (discountPercent / 100));
  const fullDiscountedTotal = Math.max(0, rawTotal - discountAmount);

  // Active pricing values based on chosen payment plan
  const amountPayableNow = paymentPlan === 'full' ? fullDiscountedTotal : advanceAmount;
  const balanceDue = paymentPlan === 'full' ? 0 : Math.max(0, rawTotal - advanceAmount);
  const finalBookingTotal = paymentPlan === 'full' ? fullDiscountedTotal : rawTotal;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guestName || !guestPhone) {
      alert("Please fill in your Full Name and Contact Phone number.");
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = guestEmail || 'guest@example.com';
    const isOnline = paymentPlan === 'advance' || paymentPlan === 'full';

    if (isOnline) {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert("Razorpay Checkout SDK failed to load. Please check your internet connection.");
        setIsSubmitting(false);
        return;
      }

      let orderData = null;
      try {
        const res = await fetch(`${API_BASE_URL}/payments/razorpay/create-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: amountPayableNow,
            propertyId: property.id
          })
        });
        if (res.ok) {
          orderData = await res.json();
        }
      } catch (err) {
        console.warn("Razorpay order creation note:", err);
      }

      const cleanPhone = guestPhone.replace(/[^0-9]/g, '');
      const keyId = orderData?.keyId || property.razorpayKeyId;

      if (!keyId) {
        alert("Online payment is currently unconfigured for this property. Please select 'Pay at Check-In' or contact the property owner.");
        setIsSubmitting(false);
        return;
      }

      const descriptionText = paymentPlan === 'advance'
        ? `Advance Deposit (₹${amountPayableNow}) — Balance ₹${balanceDue} due at check-in`
        : `Full Payment (5% Discount Applied) — ${roomNamesStr}`;

      const options = {
        key: keyId,
        amount: orderData?.amount || Math.round(amountPayableNow * 100),
        currency: orderData?.currency || "INR",
        name: property.name || "",
        description: descriptionText,
        order_id: (orderData?.orderId && orderData.orderId.startsWith('order_')) ? orderData.orderId : undefined,
        prefill: {
          name: guestName,
          email: cleanEmail,
          contact: cleanPhone
        },
        notes: {
          property_id: String(property.id),
          guest_name: guestName,
          payment_plan: paymentPlan
        },
        theme: {
          color: property.themeConfig?.primaryColor || '#111827'
        },
        handler: async function (response) {
          const realPaymentId = response.razorpay_payment_id || `pay_rzp_${Date.now().toString(36)}`;
          try {
            await onSubmitBooking({
              propertyId: property.id,
              guestName,
              guestEmail: cleanEmail,
              guestPhone,
              roomName: roomNamesStr,
              checkIn,
              checkOut,
              adults,
              children: childrenCount,
              totalAmount: finalBookingTotal,
              amountPaid: amountPayableNow,
              balanceDue: balanceDue,
              paymentStatus: paymentPlan === 'advance'
                ? `Advance Paid (₹${amountPayableNow.toLocaleString()})`
                : 'Paid in Full Online (5% Discount)',
              paymentMethod: paymentPlan === 'advance' ? 'Razorpay (Advance Deposit)' : 'Razorpay (Full Online)',
              razorpayPaymentId: realPaymentId,
              notes: specialRequests
                ? `Direct Storefront Booking | Razorpay Txn: ${realPaymentId} | ${paymentPlan === 'advance' ? `Advance: ₹${amountPayableNow}, Balance: ₹${balanceDue}` : 'Paid in Full'} | Notes: ${specialRequests}`
                : `Direct Storefront Booking | Razorpay Txn: ${realPaymentId} | ${paymentPlan === 'advance' ? `Advance: ₹${amountPayableNow}, Balance: ₹${balanceDue}` : 'Paid in Full'}`
            });
          } catch (err) {
            console.error("Booking error after Razorpay payment:", err);
          } finally {
            setIsSubmitting(false);
          }
        },
        modal: {
          ondismiss: function () {
            setIsSubmitting(false);
          }
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (resp) {
          alert("Payment Failed or Cancelled: " + (resp.error?.description || "Transaction incomplete"));
          setIsSubmitting(false);
        });
        rzp.open();
      } catch (err) {
        console.error("Failed to open Razorpay modal:", err);
        alert("Could not launch Razorpay modal: " + err.message);
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="sf-modal-backdrop" onClick={onClose}>
      <div className="sf-modal-box shopify-checkout-theme" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="shopify-modal-header">
          <div>
            <div className="shopify-header-badge">DIRECT BOOKING CHECKOUT</div>
            <h2 className="shopify-modal-title">Complete Your Reservation</h2>
          </div>
          <button onClick={onClose} className="sf-modal-close-btn" aria-label="Close">
            <FiX />
          </button>
        </div>

        {/* Order Summary Drawer Card */}
        <div className="shopify-summary-card">
          <div className="shopify-summary-top">
            <div>
              <div className="shopify-summary-prop-title">{property.name}</div>
              <div className="shopify-summary-room-badge">{roomNamesStr}</div>
            </div>
            <div className="shopify-summary-price">
              {paymentPlan === 'full' ? (
                <div className="shopify-summary-price-discounted">
                  <span className="shopify-strikethrough-price">₹{rawTotal.toLocaleString()}</span>
                  <span className="shopify-highlight-price">₹{fullDiscountedTotal.toLocaleString()}</span>
                </div>
              ) : (
                <span>₹{rawTotal.toLocaleString()}</span>
              )}
            </div>
          </div>
          <div className="shopify-summary-meta">
            <span className="shopify-meta-pill">
              <FiCalendar style={{ marginRight: 4 }} />
              {checkIn} → {checkOut} ({nightCount} night{nightCount > 1 ? 's' : ''})
            </span>
            <span className="shopify-meta-pill">
              <FiUser style={{ marginRight: 4 }} />
              {adults} Adult{adults > 1 ? 's' : ''}{childrenCount > 0 ? `, ${childrenCount} Child` : ''}
            </span>
          </div>

          {/* Dual Payment Breakdown Row */}
          <div className="shopify-summary-breakdown-row">
            <div className="shopify-breakdown-item">
              <span className="shopify-breakdown-label">Advance Due Now</span>
              <span className="shopify-breakdown-val due-now">
                ₹{amountPayableNow.toLocaleString()}
              </span>
            </div>
            <div className="shopify-breakdown-item">
              <span className="shopify-breakdown-label">Payable at Check-In</span>
              <span className="shopify-breakdown-val due-later">
                ₹{balanceDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="shopify-checkout-form">
          <div className="shopify-form-section">
            <div className="shopify-section-label">1. GUEST INFORMATION</div>
            
            <div className="shopify-field-group">
              <label className="shopify-field-label">FULL NAME *</label>
              <div className="shopify-input-wrapper">
                <FiUser className="shopify-input-icon" />
                <input 
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={guestName}
                  onChange={e => setGuestName(e.target.value)}
                  className="shopify-field-input"
                />
              </div>
            </div>

            <div className="shopify-field-row-2">
              <div className="shopify-field-group">
                <label className="shopify-field-label">MOBILE PHONE *</label>
                <div className="shopify-input-wrapper">
                  <FiPhone className="shopify-input-icon" />
                  <input 
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={guestPhone}
                    onChange={e => setGuestPhone(e.target.value)}
                    className="shopify-field-input"
                  />
                </div>
              </div>

              <div className="shopify-field-group">
                <label className="shopify-field-label">EMAIL ADDRESS</label>
                <div className="shopify-input-wrapper">
                  <FiMail className="shopify-input-icon" />
                  <input 
                    type="email"
                    placeholder="rahul@example.com"
                    value={guestEmail}
                    onChange={e => setGuestEmail(e.target.value)}
                    className="shopify-field-input"
                  />
                </div>
              </div>
            </div>

            <div className="shopify-field-group">
              <label className="shopify-field-label">SPECIAL REQUESTS / ARRIVAL TIME</label>
              <div className="shopify-input-wrapper textarea-wrap">
                <FiMessageSquare className="shopify-input-icon textarea-icon" />
                <textarea 
                  rows={2}
                  placeholder="Early check-in request, dietary preferences, or expected arrival time..."
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  className="shopify-field-textarea"
                />
              </div>
            </div>
          </div>

          {/* Section 2: HOW WOULD YOU LIKE TO PAY? */}
          <div className="shopify-form-section">
            <div className="shopify-section-label">2. HOW WOULD YOU LIKE TO PAY?</div>
            
            <div className="shopify-payment-selector">
              {/* Option 1: Pay an advance now */}
              <label className={`shopify-payment-card ${paymentPlan === 'advance' ? 'selected' : ''}`}>
                <input 
                  type="radio"
                  name="paymentPlan"
                  checked={paymentPlan === 'advance'}
                  onChange={() => setPaymentPlan('advance')}
                  className="shopify-radio-input"
                />
                <div className="shopify-payment-info">
                  <div className="shopify-payment-title-row">
                    <span className="shopify-pay-title">Pay an advance now</span>
                    <span className="shopify-payment-price-tag">₹{advanceAmount.toLocaleString()}</span>
                  </div>
                  <div className="shopify-pay-desc">
                    The rest (₹{Math.max(0, rawTotal - advanceAmount).toLocaleString()}) when you check out
                  </div>
                </div>
              </label>

              {/* Option 2: Pay in full now (5% discount) */}
              <label className={`shopify-payment-card ${paymentPlan === 'full' ? 'selected' : ''}`}>
                <input 
                  type="radio"
                  name="paymentPlan"
                  checked={paymentPlan === 'full'}
                  onChange={() => setPaymentPlan('full')}
                  className="shopify-radio-input"
                />
                <div className="shopify-payment-info">
                  <div className="shopify-payment-title-row">
                    <span className="shopify-pay-title">
                      Pay in full now
                      <span className="shopify-discount-pill">5% off your stay</span>
                    </span>
                    <div className="shopify-price-discount-wrap">
                      <span className="shopify-strikethrough-price">₹{rawTotal.toLocaleString()}</span>
                      <span className="shopify-payment-price-tag">₹{fullDiscountedTotal.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="shopify-pay-desc">
                    Save ₹{discountAmount.toLocaleString()} instantly by paying full today
                  </div>
                </div>
              </label>
            </div>

            {/* Policy disclaimer card */}
            <div className="shopify-policy-badge">
              Bookings are non-refundable. Your rooms are confirmed once the payment is received.
            </div>

            {/* WhatsApp & Email confirmation assurance */}
            <div className="shopify-whatsapp-note-card">
              <span className="shopify-whatsapp-icon">💬</span>
              <div className="shopify-whatsapp-text">
                <strong>We'll send booking voucher on WhatsApp & Email</strong>
                <p>Instant confirmation receipt and directions are delivered right to your phone upon booking.</p>
              </div>
            </div>

            <div className="shopify-security-banner">
              <FiShield className="shopify-sec-icon" />
              <div>
                <strong>Encrypted & Bank-Grade Security:</strong> Supports Google Pay, PhonePe, Paytm UPI, Cards & NetBanking via Razorpay.
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="shopify-submit-checkout-btn"
          >
            <FiLock style={{ fontSize: '1.1rem' }} />
            <span>
              {isSubmitting 
                ? 'PROCESSING RESERVATION...' 
                : paymentPlan === 'advance'
                  ? `PAY ADVANCE ₹${amountPayableNow.toLocaleString()} ONLINE`
                  : `PAY ₹${amountPayableNow.toLocaleString()} IN FULL (SAVE 5%)`
              }
            </span>
          </button>
        </form>
      </div>
    </div>
  );
}
