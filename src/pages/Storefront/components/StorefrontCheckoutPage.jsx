import React, { useState } from 'react';
import { 
  FiArrowLeft, 
  FiCheck, 
  FiUser, 
  FiPhone, 
  FiMail, 
  FiMessageSquare, 
  FiLock, 
  FiCalendar, 
  FiChevronRight 
} from 'react-icons/fi';
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

export default function StorefrontCheckoutPage({
  property,
  selectedCart,
  checkIn,
  checkOut,
  nightCount,
  adults,
  childrenCount,
  onBack,
  onSubmitBooking
}) {
  // Step state: 1 = Guest Details, 2 = Payment Plan
  const [step, setStep] = useState(1);

  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Payment Plan: 'advance' (default token) | 'full' (5% discount)
  const [paymentPlan, setPaymentPlan] = useState('advance');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Calculate Base Totals
  const selectedItems = Object.values(selectedCart);
  const roomNamesStr = selectedItems.map(i => `${i.quantity}x ${i.room.name}`).join(', ');
  const rawTotal = selectedItems.reduce((sum, i) => sum + (i.room.ratePerNight * i.quantity * nightCount), 0);

  // Full Payment 5% Discount
  const discountPercent = 5;
  const discountAmount = Math.round(rawTotal * (discountPercent / 100));

  // Determine Net Room Tariff based on plan
  const netRoomTariff = paymentPlan === 'full' ? Math.max(0, rawTotal - discountAmount) : rawTotal;

  // Tax Settings Resolution
  const taxSettings = property?.taxSettings || null;
  const isGstRegistered = Boolean(taxSettings?.isGstRegistered);
  const taxesEnabled = Boolean(taxSettings?.taxesEnabled);
  const gstEnabled = isGstRegistered && taxesEnabled;
  const taxInclusive = Boolean(taxSettings?.taxInclusive);
  const taxMode = taxSettings?.taxMode || (gstEnabled ? 'SLAB_INDIA_GST' : 'EXEMPT');
  const fixedTaxRate = Math.max(0, Number(taxSettings?.fixedTaxRate) || 0);

  const serviceChargeEnabled = Boolean(taxSettings?.serviceChargeEnabled);
  const serviceChargePercent = serviceChargeEnabled ? Math.max(0, Number(taxSettings?.serviceChargePercent) || 0) : 0;

  // Active Service Charge Amount
  const serviceChargeAmount = serviceChargeEnabled && serviceChargePercent > 0 && netRoomTariff > 0
    ? Math.round((netRoomTariff * serviceChargePercent) / 100)
    : 0;

  // Active GST Rate
  const nightlyTariff = nightCount > 0 ? Math.round(netRoomTariff / nightCount) : netRoomTariff;
  let roomGstRate = 0;
  if (gstEnabled && taxMode !== 'EXEMPT') {
    if (taxMode === 'FIXED_PERCENT') {
      roomGstRate = fixedTaxRate;
    } else {
      if (nightlyTariff > 7500) {
        roomGstRate = 18;
      } else {
        roomGstRate = 5;
      }
    }
  }

  // Active GST Amount
  let roomGstAmount = 0;
  if (roomGstRate > 0) {
    if (taxInclusive) {
      const taxable = Math.round(netRoomTariff / (1 + roomGstRate / 100));
      roomGstAmount = netRoomTariff - taxable;
    } else {
      roomGstAmount = Math.round(((netRoomTariff + serviceChargeAmount) * roomGstRate) / 100);
    }
  }

  // Undiscounted total with taxes (for Advance plan reference)
  const undiscountedServiceCharge = serviceChargeEnabled && serviceChargePercent > 0 && rawTotal > 0
    ? Math.round((rawTotal * serviceChargePercent) / 100)
    : 0;
  const undiscountedNightly = nightCount > 0 ? Math.round(rawTotal / nightCount) : rawTotal;
  let undiscountedGstRate = 0;
  if (gstEnabled && taxMode !== 'EXEMPT') {
    if (taxMode === 'FIXED_PERCENT') {
      undiscountedGstRate = fixedTaxRate;
    } else {
      if (undiscountedNightly > 7500) undiscountedGstRate = 18;
      else undiscountedGstRate = 5;
    }
  }
  let undiscountedGstAmount = 0;
  if (undiscountedGstRate > 0) {
    if (taxInclusive) {
      const taxable = Math.round(rawTotal / (1 + undiscountedGstRate / 100));
      undiscountedGstAmount = rawTotal - taxable;
    } else {
      undiscountedGstAmount = Math.round(((rawTotal + undiscountedServiceCharge) * undiscountedGstRate) / 100);
    }
  }
  const undiscountedTotalWithTaxes = taxInclusive
    ? (rawTotal + undiscountedServiceCharge)
    : (rawTotal + undiscountedServiceCharge + undiscountedGstAmount);

  // Discounted total with taxes
  const discountedTotalWithTaxes = taxInclusive
    ? (netRoomTariff + serviceChargeAmount)
    : (netRoomTariff + serviceChargeAmount + roomGstAmount);

  // Final booking total for active payment plan
  const finalBookingTotal = paymentPlan === 'full' ? discountedTotalWithTaxes : undiscountedTotalWithTaxes;

  // Advance Deposit Calculation
  const configuredAdvance = property?.advanceAmount || property?.themeConfig?.advanceAmount;
  const advanceAmount = configuredAdvance
    ? Math.min(Number(configuredAdvance), finalBookingTotal)
    : finalBookingTotal <= 1500
      ? Math.round(finalBookingTotal * 0.5)
      : Math.min(1000, finalBookingTotal);

  // Active pricing based on payment plan
  const amountPayableNow = paymentPlan === 'full' ? finalBookingTotal : advanceAmount;
  const balanceDue = paymentPlan === 'full' ? 0 : Math.max(0, finalBookingTotal - advanceAmount);

  // Step 1 -> Step 2 validation
  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      setFormError('Please provide your Full Name and Mobile Phone number to proceed.');
      return;
    }
    setFormError('');
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDetails = () => {
    setFormError('');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim()) {
      setStep(1);
      setFormError('Please provide your Full Name and Mobile Phone number.');
      return;
    }

    setIsSubmitting(true);
    const cleanEmail = guestEmail.trim() || 'guest@example.com';

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
      alert("Online payment gateway is currently unconfigured for this property. Please contact the property host.");
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
            roomBaseTotal: rawTotal,
            roomSubtotal: netRoomTariff,
            roomServiceCharge: serviceChargeAmount,
            roomGstAmount: roomGstAmount,
            taxSettingsSnapshot: taxSettings ? JSON.stringify(taxSettings) : null,
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
          console.error("Booking submission error:", err);
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
      console.error("Failed to launch Razorpay modal:", err);
      alert("Could not launch payment gateway: " + err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sf-checkout-page-wrapper">
      {/* TOP NAVIGATION & STEP PROGRESS BAR */}
      <header className="sf-checkout-page-header">
        <button type="button" onClick={onBack} className="sf-checkout-back-link">
          <FiArrowLeft /> Back to Rooms
        </button>

        <div className="sf-checkout-prop-brand">
          {property.name}
        </div>

        <div className="sf-checkout-steps-tracker">
          <div className="sf-step-item done">
            <span className="sf-step-dot"><FiCheck /></span>
            <span className="sf-step-label">Dates</span>
          </div>
          <span className="sf-step-divider">›</span>
          <div className="sf-step-item done">
            <span className="sf-step-dot"><FiCheck /></span>
            <span className="sf-step-label">Rooms</span>
          </div>
          <span className="sf-step-divider">›</span>
          <div className={`sf-step-item ${step === 1 ? 'active' : 'done'}`}>
            <span className="sf-step-dot">{step > 1 ? <FiCheck /> : '3'}</span>
            <span className="sf-step-label">Details</span>
          </div>
          <span className="sf-step-divider">›</span>
          <div className={`sf-step-item ${step === 2 ? 'active' : ''}`}>
            <span className="sf-step-dot">4</span>
            <span className="sf-step-label">Payment</span>
          </div>
        </div>
      </header>

      {/* 2-COLUMN MAIN CONTENT (LEFT: FORM, RIGHT: YOUR STAY CARD) */}
      <div className="sf-checkout-page-container">
        {/* LEFT COLUMN: ACTIVE STEP FORM */}
        <div className="sf-checkout-form-column">
          {formError && (
            <div className="sf-checkout-error-banner">
              {formError}
            </div>
          )}

          {/* STEP 1: GUEST DETAILS */}
          {step === 1 && (
            <form onSubmit={handleProceedToPayment} className="sf-checkout-step-card">
              <div className="sf-step-header">
                <span className="sf-step-badge">STEP 1 OF 2</span>
                <h2 className="sf-step-title">Your Details</h2>
                <p className="sf-step-desc">Enter your contact details so the host can confirm your reservation.</p>
              </div>

              <div className="sf-field-group">
                <label className="sf-field-label">FULL NAME *</label>
                <div className="sf-input-wrap">
                  <FiUser className="sf-input-ico" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    className="sf-field-input"
                  />
                </div>
              </div>

              <div className="sf-field-row-2">
                <div className="sf-field-group">
                  <label className="sf-field-label">MOBILE PHONE *</label>
                  <div className="sf-input-wrap">
                    <FiPhone className="sf-input-ico" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={guestPhone}
                      onChange={e => setGuestPhone(e.target.value)}
                      className="sf-field-input"
                    />
                  </div>
                </div>

                <div className="sf-field-group">
                  <label className="sf-field-label">EMAIL ADDRESS</label>
                  <div className="sf-input-wrap">
                    <FiMail className="sf-input-ico" />
                    <input
                      type="email"
                      placeholder="rahul@example.com"
                      value={guestEmail}
                      onChange={e => setGuestEmail(e.target.value)}
                      className="sf-field-input"
                    />
                  </div>
                </div>
              </div>

              <div className="sf-field-group">
                <label className="sf-field-label">ANYTHING WE SHOULD KNOW? (OPTIONAL)</label>
                <div className="sf-input-wrap textarea-wrap">
                  <FiMessageSquare className="sf-input-ico textarea-ico" />
                  <textarea
                    rows={3}
                    placeholder="Arrival time, food preferences, celebrating something special..."
                    value={specialRequests}
                    onChange={e => setSpecialRequests(e.target.value)}
                    className="sf-field-textarea"
                  />
                </div>
              </div>

              <div className="sf-step-actions">
                <button type="submit" className="sf-btn-step-next">
                  <span>Next: Choose Payment</span>
                  <FiChevronRight style={{ fontSize: '1.2rem' }} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: PAYMENT METHOD ("HOW WOULD YOU LIKE TO PAY?") */}
          {step === 2 && (
            <form onSubmit={handleFinalSubmit} className="sf-checkout-step-card">
              <div className="sf-step-header">
                <div className="sf-step-header-row">
                  <button type="button" onClick={handleBackToDetails} className="sf-btn-back-step">
                    <FiArrowLeft /> Back to Guest Details
                  </button>
                  <span className="sf-step-badge">STEP 2 OF 2</span>
                </div>
                <h2 className="sf-step-title">How Would You Like to Pay?</h2>
                <p className="sf-step-desc">Choose between paying a token advance or paying in full to save 5%.</p>
              </div>

              <div className="sf-payment-options-list">
                {/* Option 1: Pay an advance now */}
                <label className={`sf-payment-option-card ${paymentPlan === 'advance' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentPlan"
                    checked={paymentPlan === 'advance'}
                    onChange={() => setPaymentPlan('advance')}
                    className="sf-payment-radio"
                  />
                  <div className="sf-payment-card-body">
                    <div className="sf-payment-title-row">
                      <span className="sf-payment-plan-title">Pay an advance now</span>
                      <span className="sf-payment-plan-price">₹{advanceAmount.toLocaleString()}</span>
                    </div>
                    <div className="sf-payment-plan-subtitle">
                      The rest (₹{Math.max(0, undiscountedTotalWithTaxes - advanceAmount).toLocaleString()}) when you check out
                    </div>
                  </div>
                </label>

                {/* Option 2: Pay in full now (5% discount) */}
                <label className={`sf-payment-option-card ${paymentPlan === 'full' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="paymentPlan"
                    checked={paymentPlan === 'full'}
                    onChange={() => setPaymentPlan('full')}
                    className="sf-payment-radio"
                  />
                  <div className="sf-payment-card-body">
                    <div className="sf-payment-title-row">
                      <span className="sf-payment-plan-title">
                        Pay in full now
                        <span className="sf-discount-tag">5% off your stay</span>
                      </span>
                      <div className="sf-payment-discounted-price-wrap">
                        <span className="sf-strikethrough-tag">₹{undiscountedTotalWithTaxes.toLocaleString()}</span>
                        <span className="sf-payment-plan-price">₹{discountedTotalWithTaxes.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="sf-payment-plan-subtitle">
                      Save ₹{Math.max(0, undiscountedTotalWithTaxes - discountedTotalWithTaxes).toLocaleString()} instantly by paying full today
                    </div>
                  </div>
                </label>
              </div>

              {/* Policy disclaimer banner */}
              <div className="sf-policy-info-box">
                Bookings are non-refundable. Your rooms are confirmed once the payment is received.
              </div>

              <div className="sf-step-actions">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="sf-btn-final-pay"
                >
                  <FiLock style={{ fontSize: '1.1rem' }} />
                  <span>
                    {isSubmitting 
                      ? 'PROCESSING PAYMENT...' 
                      : paymentPlan === 'advance'
                        ? `PAY ADVANCE ₹${amountPayableNow.toLocaleString()} ONLINE`
                        : `PAY ₹${amountPayableNow.toLocaleString()} IN FULL (SAVE 5%)`
                    }
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* RIGHT COLUMN: STICKY "YOUR STAY" SUMMARY CARD */}
        <aside className="sf-checkout-summary-column">
          <div className="sf-sticky-stay-card">
            <h3 className="sf-stay-card-title">YOUR STAY</h3>

            <div className="sf-stay-dates-row">
              <div className="sf-stay-dates-text">
                <FiCalendar style={{ marginRight: 6, color: '#06a5b5' }} />
                <span>{checkIn} → {checkOut}</span>
              </div>
              <div className="sf-stay-meta-sub">
                {nightCount} night{nightCount > 1 ? 's' : ''} • {adults + childrenCount} guest{adults + childrenCount > 1 ? 's' : ''}
              </div>
            </div>

            <div className="sf-stay-rooms-list">
              {selectedItems.map((item, idx) => (
                <div key={idx} className="sf-stay-room-item">
                  <span className="sf-stay-room-name">{item.quantity} × {item.room.name}</span>
                  <span className="sf-stay-room-price">
                    ₹{(item.room.ratePerNight * item.quantity * nightCount).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            <div className="sf-stay-pricing-breakdown">
              <div className="sf-pricing-row">
                <span>Rooms Subtotal</span>
                <span>₹{rawTotal.toLocaleString()}</span>
              </div>

              {paymentPlan === 'full' && discountAmount > 0 && (
                <div className="sf-pricing-row discount-row">
                  <span>5% Full Pay Discount</span>
                  <span>-₹{discountAmount.toLocaleString()}</span>
                </div>
              )}

              {/* Service Charge if applicable */}
              {serviceChargeAmount > 0 && (
                <div className="sf-pricing-row">
                  <span>Service Charge ({serviceChargePercent}%)</span>
                  <span>+₹{serviceChargeAmount.toLocaleString()}</span>
                </div>
              )}

              {/* GST / Taxes if applicable */}
              {roomGstAmount > 0 && (
                <div className="sf-pricing-row">
                  <span>{taxInclusive ? `GST (${roomGstRate}% Inclusive)` : `Goods & Services Tax (${roomGstRate}% GST)`}</span>
                  <span>{taxInclusive ? `Included (₹${roomGstAmount.toLocaleString()})` : `+₹${roomGstAmount.toLocaleString()}`}</span>
                </div>
              )}

              <div className="sf-pricing-row total-row">
                <span>Total Stay Value</span>
                <span>₹{finalBookingTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Advance Due Now vs Due on Arrival Card */}
            <div className="sf-stay-split-card">
              <div className="sf-split-row">
                <span className="sf-split-label">Advance Due Now</span>
                <span className="sf-split-val due-now">₹{amountPayableNow.toLocaleString()}</span>
              </div>
              <div className="sf-split-row">
                <span className="sf-split-label">Payable on Arrival</span>
                <span className="sf-split-val due-later">₹{balanceDue.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
