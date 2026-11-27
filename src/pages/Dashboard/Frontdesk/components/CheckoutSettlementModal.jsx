import React, { useEffect, useState } from 'react';
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiX,
  FiCreditCard,
  FiDollarSign,
} from 'react-icons/fi';
import './CheckoutSettlementModal.css';
import { PAYMENT_MODES } from '../frontdeskConstants';
import { calculateFolio } from '../utils/folioCalculator';

export default function CheckoutSettlementModal({
  isOpen,
  res,
  mealOrders = [],
  taxSettings = null,
  onClose,
  onConfirmCheckout,
}) {
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES[0]);
  const [checkoutMode, setCheckoutMode] = useState('standard');
  const [earlyPolicy, setEarlyPolicy] = useState('prorata');

  const today = new Date().toISOString().split('T')[0];

  const checkinDate = res?.checkin || res?.checkIn;
  const checkoutDate = res?.checkout || res?.checkOut;

  const getNights = (startDate, endDate) => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = (end - start) / (1000 * 60 * 60 * 24);
    const nights = Math.ceil(diff);
    return nights > 0 ? nights : 1;
  };

  const scheduledNights = getNights(checkinDate, checkoutDate);
  const nightsStayed = Math.min(scheduledNights, getNights(checkinDate, today));
  const isEarlyDeparture = nightsStayed < scheduledNights;

  const hasRazorpayPayment = Boolean(
    res?.paymentGateway === 'Razorpay' ||
    res?.razorpayPaymentId ||
    res?.razorpayOrderId ||
    String(res?.paymentMethod || '').toLowerCase().includes('razorpay') ||
    String(res?.bookingSource || '').toLowerCase().includes('razorpay')
  );

  const folio = calculateFolio(res, mealOrders, taxSettings);
  const scheduledRoomTariff = Number(folio.roomTariff) || 0;
  const nightlyTariff = scheduledNights > 0 ? Math.round(scheduledRoomTariff / scheduledNights) : scheduledRoomTariff;
  const shouldApplyProrata = checkoutMode === 'early' && earlyPolicy === 'prorata';

  const proratedRoomTariff = Math.round(nightlyTariff * nightsStayed);
  const finalRoomTariff = shouldApplyProrata ? proratedRoomTariff : scheduledRoomTariff;

  const getCalculatedFolio = (mode, policy) => {
    const isProrata = mode === 'early' && policy === 'prorata';
    if (!isProrata) {
      return folio;
    }
    const proratedTariff = Math.round(nightlyTariff * nightsStayed);
    return calculateFolio(
      {
        ...res,
        checkin: checkinDate,
        checkout: today,
        checkIn: checkinDate,
        checkOut: today,
        nights: nightsStayed,
        lengthDays: nightsStayed,
        roomSubtotal: proratedTariff,
        roomBaseTotal: proratedTariff,
        roomBaseTariff: proratedTariff,
        totalAmount: proratedTariff,
        amount: proratedTariff,
      },
      mealOrders,
      taxSettings
    );
  };

  const activeFolio = getCalculatedFolio(checkoutMode, earlyPolicy);
  const mealTotal = Number(activeFolio.mealTotal) || 0;
  const serviceChargeAmount = Number(activeFolio.serviceChargeAmount) || 0;
  const totalGstAmount = Number(activeFolio.totalGstAmount) || 0;
  const finalFolioTotal = Number(activeFolio.totalFolio) || 0;
  const paidAmount = Number(activeFolio.paidAmount) || 0;

  const balance = finalFolioTotal - paidAmount;
  const refundDue = balance < 0 ? Math.abs(balance) : 0;
  const balanceDue = balance > 0 ? balance : 0;
  const isRefundDue = refundDue > 0;

  useEffect(() => {
    if (!isOpen) return;

    const initialMode = isEarlyDeparture ? 'early' : 'standard';
    setCheckoutMode(initialMode);
    setEarlyPolicy('prorata');

    const initFolio = getCalculatedFolio(initialMode, 'prorata');
    const initBal = (Number(initFolio.totalFolio) || 0) - (Number(initFolio.paidAmount) || 0);

    if (initBal < 0) {
      setPaymentMode('Manual (Cash / UPI / Bank)');
    } else {
      setPaymentMode(PAYMENT_MODES[0]);
    }
  }, [isOpen, res?.id]);

  const handleModeChange = (mode) => {
    setCheckoutMode(mode);
    const newFolio = getCalculatedFolio(mode, earlyPolicy);
    const newBal = (Number(newFolio.totalFolio) || 0) - (Number(newFolio.paidAmount) || 0);
    if (newBal >= 0 && !PAYMENT_MODES.includes(paymentMode)) {
      setPaymentMode(PAYMENT_MODES[0]);
    }
  };

  const handlePolicyChange = (policy) => {
    setEarlyPolicy(policy);
    const newFolio = getCalculatedFolio(checkoutMode, policy);
    const newBal = (Number(newFolio.totalFolio) || 0) - (Number(newFolio.paidAmount) || 0);
    if (newBal >= 0 && !PAYMENT_MODES.includes(paymentMode)) {
      setPaymentMode(PAYMENT_MODES[0]);
    }
  };

  if (!isOpen || !res) return null;

  const handleCheckout = (settleFull) => {
    const finalFolio = {
      ...activeFolio,
      roomTariff: finalRoomTariff,
      totalFolio: finalFolioTotal,
      balanceDue,
      refundDue,
      isEarlyDeparture: checkoutMode === 'early',
      actualNights: checkoutMode === 'early' ? nightsStayed : scheduledNights,
      earlyCheckoutDate: checkoutMode === 'early' ? today : checkoutDate,
    };

    onConfirmCheckout({
      res,
      settleFull,
      paymentMode,
      folio: finalFolio,
    });
  };

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString('en-IN');
  };

  return (
    <div className="csm-backdrop" onClick={onClose}>
      <div className="csm-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* COMPACT HEADER */}
        <div className="csm-header">
          <div className="csm-header-left">
            <h3 className="csm-title">{res.guest || 'Guest'}</h3>
            <span className="csm-res-badge">{res.id} • {res.unit || 'Room'}</span>
          </div>
          <button type="button" className="csm-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={15} />
          </button>
        </div>

        {/* COMPACT BODY */}
        <div className="csm-body">

          {/* EARLY DEPARTURE COMPACT NOTICE & TOGGLE */}
          {isEarlyDeparture && (
            <div className="csm-early-box">
              <div 
                className="csm-early-header" 
                style={{ cursor: 'pointer' }}
                onClick={() => handleModeChange(checkoutMode === 'early' ? 'standard' : 'early')}
                title="Click to toggle Early Departure pricing"
              >
                <FiAlertTriangle size={13} className="csm-early-icon" />
                <span>Early Departure: <strong>{nightsStayed}/{scheduledNights} Nights</strong> (Departs Today)</span>
              </div>
              
              <div className="csm-policy-grid">
                <button
                  type="button"
                  className={`csm-policy-btn ${checkoutMode === 'early' ? 'active' : ''}`}
                  onClick={() => handleModeChange('early')}
                >
                  ⚡ Pro-Rata ({nightsStayed} Night{nightsStayed > 1 ? 's' : ''})
                </button>
                <button
                  type="button"
                  className={`csm-policy-btn ${checkoutMode === 'standard' ? 'active' : ''}`}
                  onClick={() => handleModeChange('standard')}
                >
                  🗓️ Full Tariff ({scheduledNights} Nights)
                </button>
              </div>

              {checkoutMode === 'early' && (
                <div className="csm-rules-inline">
                  <label className="csm-radio-lbl">
                    <input
                      type="radio"
                      name="earlyPolicy"
                      value="prorata"
                      checked={earlyPolicy === 'prorata'}
                      onChange={() => handlePolicyChange('prorata')}
                    />
                    <span>Pro-Rata @ ₹{formatAmount(nightlyTariff)}/night</span>
                  </label>
                  <label className="csm-radio-lbl">
                    <input
                      type="radio"
                      name="earlyPolicy"
                      value="retain"
                      checked={earlyPolicy === 'retain'}
                      onChange={() => handlePolicyChange('retain')}
                    />
                    <span>Retain Full ({scheduledNights} Nights)</span>
                  </label>
                </div>
              )}
            </div>
          )}
          <div className="csm-folio-card">
            <div className="csm-folio-header">
              <span>FOLIO AUDIT {checkoutMode === 'early' ? '(REVISED)' : ''}</span>
              <span className="csm-folio-tag">
                {checkoutMode === 'early' ? `${nightsStayed} Nights` : `${scheduledNights} Nights`}
              </span>
            </div>

            <div className="csm-folio-rows">
              <div className="csm-row">
                <span>Room Tariff</span>
                <span>₹{formatAmount(finalRoomTariff)}</span>
              </div>

              {mealTotal > 0 && (
                <div className="csm-row">
                  <span>Meals &amp; Add-ons</span>
                  <span className="accent">+ ₹{formatAmount(mealTotal)}</span>
                </div>
              )}

              {serviceChargeAmount > 0 && (
                <div className="csm-row">
                  <span>Service Charge</span>
                  <span className="accent">+ ₹{formatAmount(serviceChargeAmount)}</span>
                </div>
              )}

              {totalGstAmount > 0 && (
                <div className="csm-row">
                  <span>Taxes &amp; GST {activeFolio.taxInclusive ? '(Inclusive)' : ''}</span>
                  <span className={activeFolio.taxInclusive ? "" : "accent"}>
                    {activeFolio.taxInclusive ? `₹${formatAmount(totalGstAmount)}` : `+ ₹${formatAmount(totalGstAmount)}`}
                  </span>
                </div>
              )}

              <div className="csm-row csm-row-total">
                <span>Total Folio Bill</span>
                <span className="strong">₹{formatAmount(finalFolioTotal)}</span>
              </div>

              <div className="csm-row">
                <span>Advance / Amount Paid</span>
                <span className="green">- ₹{formatAmount(paidAmount)}</span>
              </div>

              {isRefundDue ? (
                <div className="csm-pill refund">
                  <span>Refund Due to Guest</span>
                  <strong>₹{formatAmount(refundDue)}</strong>
                </div>
              ) : (
                <div className={`csm-pill ${balanceDue > 0 ? 'due' : 'settled'}`}>
                  <span>{balanceDue > 0 ? 'Outstanding Balance Due' : 'Folio Status'}</span>
                  <strong>{balanceDue > 0 ? `₹${formatAmount(balanceDue)}` : 'Fully Settled (₹0 Due)'}</strong>
                </div>
              )}
            </div>
          </div>

          {/* PAYMENT METHOD SELECTOR */}
          {isRefundDue ? (
            <div className="csm-field">
              <label className="csm-field-lbl">Refund Settlement Method (₹{formatAmount(refundDue)}) *</label>
              <select
                className="csm-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                <option value="Manual (Cash / UPI / Bank)">Manual Transfer (Cash / UPI / Bank)</option>
                {hasRazorpayPayment && (
                  <option value="Razorpay Online Refund">Razorpay Gateway Auto-Refund</option>
                )}
                <option value="Credit Voucher">Store Credit / Future Stay Voucher</option>
              </select>
            </div>
          ) : balanceDue > 0 ? (
            <div className="csm-field">
              <label className="csm-field-lbl">Settlement Payment Method (₹{formatAmount(balanceDue)} Due) *</label>
              <select
                className="csm-select"
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
              >
                {PAYMENT_MODES.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          ) : (
            <div className="csm-settled-notice">
              <FiCheckCircle size={14} />
              <span>Pre-paid in Full — No pending charges.</span>
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="csm-footer">
          {isRefundDue ? (
            <button
              type="button"
              className="csm-btn csm-btn-primary"
              onClick={() => handleCheckout(true)}
            >
              <FiDollarSign size={15} />
              <span>Issue ₹{formatAmount(refundDue)} Refund &amp; Check-Out</span>
            </button>
          ) : balanceDue > 0 ? (
            <div className="csm-footer-actions">
              <button
                type="button"
                className="csm-btn csm-btn-primary"
                onClick={() => handleCheckout(true)}
              >
                <FiCreditCard size={15} />
                <span>Settle ₹{formatAmount(balanceDue)} &amp; Check-Out</span>
              </button>
              <button
                type="button"
                className="csm-btn csm-btn-secondary"
                onClick={() => handleCheckout(false)}
              >
                <span>Check-Out with Balance Due</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="csm-btn csm-btn-primary"
              onClick={() => handleCheckout(true)}
            >
              <FiCheckCircle size={15} />
              <span>Complete Check-Out &amp; Invoice</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}