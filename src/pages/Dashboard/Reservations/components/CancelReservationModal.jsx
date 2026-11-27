import React, { useState, useEffect } from 'react';
import { FiX, FiAlertTriangle, FiXCircle, FiHelpCircle, FiCheck } from 'react-icons/fi';
import { fetchPropertyPolicy, evaluateCancellationPolicy } from '../../../../utils/policyEvaluator';

const CANCELLATION_REASONS = [
  "Guest requested cancellation",
  "Date change / Scheduling conflict",
  "Emergency / Personal reasons",
  "Failed advance payment / Non-payment",
  "Property maintenance / Unexpected issue",
  "Double booking / Overbooking",
  "Other reason (please specify)"
];

export default function CancelReservationModal({
  isOpen,
  booking,
  onClose,
  onConfirmCancel
}) {
  const [reasonCategory, setReasonCategory] = useState(CANCELLATION_REASONS[0]);
  const [customReason, setCustomReason] = useState("");
  
  // Refund calculations if money was collected
  const collectedAmount = booking?.amountPaid || (booking?.paymentStatus === 'Paid in Full' ? (booking?.totalAmount || 0) : (booking?.paidAmount || 0));
  const [retentionFee, setRetentionFee] = useState(0);
  const [refundMethod, setRefundMethod] = useState(booking?.razorpayPaymentId ? "Razorpay Online Refund" : "Manual (Cash / UPI / Bank)");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Property Policy evaluation state
  const [policyEval, setPolicyEval] = useState(null);
  const [isLoadingPolicy, setIsLoadingPolicy] = useState(false);

  useEffect(() => {
    if (isOpen && booking) {
      let isMounted = true;
      setIsLoadingPolicy(true);

      const runEval = async () => {
        try {
          const propId = booking.propertyId || booking.dbPropertyId || 1;
          const policyData = await fetchPropertyPolicy(propId);
          if (isMounted) {
            const evalRes = evaluateCancellationPolicy(booking, policyData);
            setPolicyEval(evalRes);
            setRetentionFee(evalRes.penaltyAmount);
          }
        } catch (e) {
          console.error("Policy evaluation error:", e);
        } finally {
          if (isMounted) setIsLoadingPolicy(false);
        }
      };

      runEval();
      return () => { isMounted = false; };
    }
  }, [isOpen, booking]);

  if (!isOpen || !booking) return null;

  const netRefund = Math.max(0, collectedAmount - (parseFloat(retentionFee) || 0));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalReason = reasonCategory === "Other reason (please specify)"
        ? (customReason.trim() || "Other reason")
        : (customReason.trim() ? `${reasonCategory} - ${customReason.trim()}` : reasonCategory);

      if (collectedAmount > 0) {
        finalReason += ` | Cancellation Fee: ₹${(parseFloat(retentionFee) || 0).toLocaleString('en-IN')} | Refund: ₹${netRefund.toLocaleString('en-IN')} (${refundMethod})`;
      }
      
      await onConfirmCancel(booking, finalReason, {
        collectedAmount,
        retentionFee: parseFloat(retentionFee) || 0,
        refundAmount: netRefund,
        refundMethod
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="res-modal-backdrop" onClick={onClose}>
      <div className="res-cancel-modal" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="res-cancel-header">
          <div className="res-cancel-header-title">
            <div className="res-cancel-icon-bg">
              <FiXCircle size={20} color="#DC2626" />
            </div>
            <div>
              <h3>Cancel Reservation</h3>
              <span>{booking.id} &bull; {booking.guestName || "Guest"}</span>
            </div>
          </div>
          <button type="button" className="nwr-close" onClick={onClose}>
            <FiX size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="res-cancel-body">
          {/* ACTIVE PROPERTY POLICY CALLOUT */}
          {policyEval && (
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', fontSize: 12.5, color: '#1E40AF', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <FiHelpCircle size={18} style={{ flexShrink: 0, marginTop: 2, color: '#2563EB' }} />
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ color: '#1E3A8A' }}>Active Property Cancellation Policy:</strong>
                  <span style={{ fontSize: 10.5, background: '#DBEAFE', color: '#1E40AF', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>AUTO-APPLIED</span>
                </div>
                <div style={{ marginTop: 3, color: '#3B82F6', fontSize: 12 }}>{policyEval.ruleText}</div>
                <div style={{ marginTop: 4, fontWeight: 700, color: '#1E3A8A', fontSize: 12 }}>
                  Calculated Fee: ₹{policyEval.penaltyAmount.toLocaleString('en-IN')} &bull; Recommended Refund: ₹{policyEval.recommendedRefund.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          )}

          {/* SUMMARY INFO CARD */}
          <div className="res-cancel-summary-box">
            <div className="res-cancel-summary-row">
              <div>
                <span className="res-cancel-dim">PROPERTY & UNIT</span>
                <strong>{booking.propertyName || "Property"} ({booking.roomUnit || "Unit"})</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="res-cancel-dim">DATES</span>
                <strong>{booking.checkIn} &rarr; {booking.checkOut}</strong>
              </div>
            </div>
            <div className="res-cancel-summary-row" style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
              <div>
                <span className="res-cancel-dim">TOTAL TARIFF</span>
                <strong>&#8377;{(booking.totalAmount || 0).toLocaleString('en-IN')}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="res-cancel-dim">COLLECTED PAYMENTS</span>
                <strong style={{ color: collectedAmount > 0 ? '#059669' : '#64748B' }}>
                  &#8377;{collectedAmount.toLocaleString('en-IN')}
                </strong>
              </div>
            </div>
          </div>

          {/* IF MONEY WAS COLLECTED: REFUND & RETENTION BREAKDOWN */}
          {collectedAmount > 0 && (
            <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: '#0369A1', textTransform: 'uppercase' }}>
                Refund & Cancellation Fee Breakdown
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="res-cancel-label" style={{ fontSize: 12 }}>Cancellation / Retention Fee (&#8377;)</label>
                  <input
                    type="number"
                    className="nwr-input"
                    value={retentionFee}
                    onChange={(e) => setRetentionFee(e.target.value)}
                    min="0"
                    max={collectedAmount}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="res-cancel-label" style={{ fontSize: 12 }}>Net Refund to Guest</label>
                  <div style={{ height: 38, padding: '0 12px', background: '#FFFFFF', border: '1px solid #BAE6FD', borderRadius: 8, display: 'flex', alignItems: 'center', fontWeight: 700, color: '#0284C7', fontSize: 15 }}>
                    &#8377;{netRefund.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
              <div>
                <label className="res-cancel-label" style={{ fontSize: 12 }}>Refund Settlement Mode</label>
                <select
                  className="res-cancel-select"
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                >
                  <option value="Manual (Cash / UPI / Bank)">Manual Transfer (Cash / GPay / PhonePe / Bank)</option>
                  <option value="Razorpay Online Refund">Razorpay Gateway Auto-Refund</option>
                  <option value="Credit Voucher">Store Credit / Future Stay Voucher</option>
                </select>
              </div>
            </div>
          )}

          {/* WARNING BANNER */}
          <div className="res-cancel-warning">
            <FiAlertTriangle size={18} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
            <p>
              Cancelling this reservation will update status to <strong>Cancelled</strong>, void any unpaid balance due, and release inventory for new bookings.
            </p>
          </div>

          {/* CANCELLATION REASON FORM */}
          <div className="res-cancel-field">
            <label className="res-cancel-label">Cancellation Reason *</label>
            <select
              className="res-cancel-select"
              value={reasonCategory}
              onChange={(e) => setReasonCategory(e.target.value)}
            >
              {CANCELLATION_REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="res-cancel-field">
            <label className="res-cancel-label">
              Additional Details / Specific Reason <span className="res-cancel-optional">(optional)</span>
            </label>
            <textarea
              className="res-cancel-textarea"
              rows={2}
              placeholder="e.g. Guest called stating flight got cancelled due to bad weather."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="res-cancel-footer">
            <button
              type="button"
              className="res-btn res-btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Keep Booking
            </button>
            <button
              type="submit"
              className="res-btn res-btn-danger"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cancelling..." : "Confirm Cancellation"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
