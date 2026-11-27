import React, { useState, useEffect } from 'react';
import { FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import './RecordPaymentModal.css';
import { PAYMENT_MODES } from '../frontdeskConstants';
import { calculateFolio } from '../utils/folioCalculator';

export default function RecordPaymentModal({
  isOpen,
  res,
  initialAmount = '',
  mealOrders = [],
  taxSettings = null,
  onClose,
  onSavePayment
}) {
  const [recordPayAmount, setRecordPayAmount] = useState(initialAmount);
  const [paymentMode, setPaymentMode] = useState(PAYMENT_MODES[0]);
  const [paymentTxnRef, setPaymentTxnRef] = useState('');

  const folio = res ? calculateFolio(res, mealOrders, taxSettings) : { balanceDue: 0, paidAmount: 0, totalFolio: 0, roomTariff: 0, mealTotal: 0 };
  const maxAllowed = Math.max(0, folio.balanceDue);

  useEffect(() => {
    if (!isOpen || !res) return;
    const defaultAmt = initialAmount ? Math.min(Number(initialAmount), maxAllowed) : maxAllowed;
    setRecordPayAmount(defaultAmt > 0 ? String(defaultAmt) : '');
    setPaymentTxnRef('');
  }, [isOpen, initialAmount, res, maxAllowed]);

  if (!isOpen || !res) return null;

  const newPaymentInput = Number(recordPayAmount) || 0;
  const isOverpayment = newPaymentInput > maxAllowed;
  const isZeroOrNegative = newPaymentInput <= 0;
  const isInvalid = isOverpayment || isZeroOrNegative || maxAllowed === 0;

  const newTotalReceived = folio.paidAmount + newPaymentInput;
  const remainingBal = Math.max(0, folio.totalFolio - newTotalReceived);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isZeroOrNegative) {
      alert("Please enter a valid payment amount (> ₹0)");
      return;
    }
    if (isOverpayment) {
      alert(`Amount cannot exceed the remaining balance of ₹${maxAllowed.toLocaleString('en-IN')}.`);
      return;
    }
    onSavePayment({
      res,
      amountToRecord: newPaymentInput,
      newTotalReceived,
      remainingBal,
      paymentMode,
      paymentTxnRef
    });
  };

  return (
    <div className="rpm-backdrop" onClick={onClose}>
      <div className="rpm-modal" onClick={e => e.stopPropagation()}>

        {/* MODAL HEADER */}
        <div className="rpm-header">
          <div className="rpm-title-wrap">
            <h3 className="rpm-title">Record Payment</h3>
            <div className="rpm-guest-pill">
              <span className="rpm-guest-name">{res.guest}</span>
              <span className="rpm-bullet">•</span>
              <span className="rpm-booking-id">{res.id}</span>
            </div>
          </div>
          <button type="button" className="rpm-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={16} />
          </button>
        </div>

        {/* MODAL FORM */}
        <form onSubmit={handleSubmit}>
          <div className="rpm-body">

            {maxAllowed === 0 && (
              <div className="rpm-paid-alert">
                <FiCheckCircle size={15} />
                <span>This booking is already paid in full (₹0 balance due).</span>
              </div>
            )}

            {/* HERO AMOUNT INPUT */}
            <div className="rpm-hero-field">
              <div className="rpm-label-row">
                <label className="rpm-micro-label">Amount Received *</label>
                {maxAllowed > 0 && (
                  <button
                    type="button"
                    className="rpm-chip-btn"
                    onClick={() => setRecordPayAmount(String(maxAllowed))}
                  >
                    Full Balance: ₹{maxAllowed.toLocaleString('en-IN')}
                  </button>
                )}
              </div>
              <div className={`rpm-amount-input-wrap ${isOverpayment ? 'error' : ''}`}>
                <span className="rpm-currency-symbol">₹</span>
                <input
                  type="number"
                  className="rpm-amount-input"
                  placeholder="0"
                  value={recordPayAmount}
                  onChange={e => setRecordPayAmount(e.target.value)}
                  max={maxAllowed}
                  disabled={maxAllowed === 0}
                  autoFocus
                />
              </div>
              {isOverpayment && (
                <div className="rpm-error-msg">
                  <FiAlertCircle size={13} />
                  <span>Amount cannot exceed remaining balance of ₹{maxAllowed.toLocaleString('en-IN')}.</span>
                </div>
              )}
            </div>

            {/* 2-COLUMN PAYMENT METHOD & REFERENCE */}
            <div className="rpm-row-2col">
              <div className="rpm-field">
                <label className="rpm-micro-label">Payment Method *</label>
                <select
                  className="rpm-select"
                  value={paymentMode}
                  onChange={e => setPaymentMode(e.target.value)}
                  disabled={maxAllowed === 0}
                >
                  {PAYMENT_MODES.map(mode => (
                    <option key={mode} value={mode}>{mode}</option>
                  ))}
                </select>
              </div>

              <div className="rpm-field">
                <label className="rpm-micro-label">Reference / Notes</label>
                <input
                  type="text"
                  className="rpm-input"
                  placeholder="e.g. UPI Ref / Cash"
                  value={paymentTxnRef}
                  onChange={e => setPaymentTxnRef(e.target.value)}
                  disabled={maxAllowed === 0}
                />
              </div>
            </div>

            {/* MINIMALIST FOLIO AUDIT SUMMARY */}
            <div className="rpm-summary-card">
              <div className="rpm-summary-header">
                <span>Folio Summary</span>
                <span>Live Audit</span>
              </div>

              <div className="rpm-summary-row">
                <span>Room Tariff</span>
                <span>₹{folio.roomTariff.toLocaleString('en-IN')}</span>
              </div>

              {folio.mealTotal > 0 && (
                <div className="rpm-summary-row">
                  <span>Meal Add-ons</span>
                  <span>+ ₹{folio.mealTotal.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="rpm-summary-row">
                <span>Total Folio Bill</span>
                <span>₹{folio.totalFolio.toLocaleString('en-IN')}</span>
              </div>

              <div className="rpm-summary-row paid-row">
                <span>Previously Paid</span>
                <span>- ₹{folio.paidAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="rpm-summary-row now-row">
                <span>Recording Now</span>
                <span>+ ₹{newPaymentInput.toLocaleString('en-IN')}</span>
              </div>

              <div className="rpm-summary-divider" />

              <div className="rpm-balance-row">
                <span className="rpm-balance-label">Remaining Balance</span>
                {remainingBal === 0 ? (
                  <span className="rpm-badge-settled">
                    <FiCheckCircle size={12} /> Settled (₹0)
                  </span>
                ) : (
                  <span className="rpm-badge-due">
                    ₹{remainingBal.toLocaleString('en-IN')} Due
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* MODAL FOOTER */}
          <div className="rpm-footer">
            <button
              type="button"
              className="rpm-btn-cancel"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rpm-btn-submit"
              disabled={isInvalid}
            >
              {newPaymentInput > 0
                ? `Record ₹${newPaymentInput.toLocaleString('en-IN')}`
                : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

