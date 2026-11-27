import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiX, 
  FiCheckCircle, 
  FiRefreshCw, 
  FiAlertTriangle, 
  FiSettings, 
  FiZap 
} from 'react-icons/fi';
import { API_BASE_URL } from '../../../../config/api';

export default function RazorpayQrModal({
  isOpen,
  res,
  amount,
  onClose,
  onNavigateToSettings,
  onPaymentConfirmed
}) {
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState('');
  const [isPaid, setIsPaid] = useState(false);

  const numericResId = res?.dbId || String(res?.id || '').replace(/[^0-9]/g, '');

  const generateQr = useCallback(async () => {
    if (!res || !numericResId) return;
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const apiRes = await fetch(`${API_BASE_URL}/payments/razorpay/create-qr`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reservationId: numericResId,
          amount: amount || res.balanceDue || 0,
          guestName: res.guest || 'Guest'
        })
      });

      if (!apiRes.ok) {
        throw new Error(`Server returned ${apiRes.status}`);
      }

      const data = await apiRes.json();
      if (data.imageUrl || data.success) {
        setQrData(data);
      } else {
        throw new Error(data.error || 'Failed to generate QR Code');
      }
    } catch (err) {
      console.error('QR Generation Error:', err);
      setError('Could not generate Razorpay QR code. Please check key credentials in Settings.');
    } finally {
      setLoading(false);
    }
  }, [res, numericResId, amount]);

  useEffect(() => {
    if (isOpen && res) {
      setIsPaid(false);
      generateQr();
    }
  }, [isOpen, res, generateQr]);

  // Polling check to detect real-time payment status
  useEffect(() => {
    if (!isOpen || !numericResId || isPaid) return;

    const initialPaidAmt = Number(res?.amountPaid || 0);

    const interval = setInterval(async () => {
      try {
        const token = localStorage.getItem('token');
        const checkRes = await fetch(`${API_BASE_URL}/reservations`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        });
        if (checkRes.ok) {
          const list = await checkRes.json();
          const match = list.find(item => String(item.id) === String(numericResId));

          if (match) {
            const currentPaid = Number(match.amountPaid || 0);

            // Detect if a NEW payment was recorded by webhook/server (amountPaid increased from baseline)
            const isPaymentIncreased = currentPaid > initialPaidAmt;

            if (isPaymentIncreased) {
              setIsPaid(true);
              clearInterval(interval);
            }
          }
        }
      } catch (err) {
        // Silent poll
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isOpen, numericResId, isPaid, res, amount]);

  if (!isOpen || !res) return null;

  const rawBalance = res.balanceDue !== undefined ? Number(res.balanceDue) : 0;
  const payAmt = rawBalance > 0 ? Math.min(Number(amount || rawBalance), rawBalance) : Number(amount || 0);

  const handleManualConfirm = () => {
    setIsPaid(true);
    setTimeout(() => {
      onPaymentConfirmed({
        res,
        amountToRecord: payAmt,
        newTotalReceived: (res.amountPaid || 0) + payAmt,
        remainingBal: 0,
        paymentMode: 'Razorpay Dynamic UPI QR'
      });
      onClose();
    }, 1000);
  };

  return (
    <div className="fd-modal-backdrop" onClick={onClose}>
      <div className="fd-modal qr-modal-card" onClick={e => e.stopPropagation()}>

        {/* HEADER */}
        <div className="fd-modal-header">
          <div>
            <h3 className="fd-modal-title" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FiZap size={16} color="#0D9488" /> Razorpay Dynamic UPI QR
            </h3>
            <span className="fd-modal-subtext">Scan to pay for {res.guest} ({res.id})</span>
          </div>
          <button type="button" className="fd-modal-close" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="fd-modal-body qr-modal-body">

          {isPaid ? (
            <div className="qr-success-box">
              <div className="qr-success-emoji">
                <FiCheckCircle size={40} color="#10B981" />
              </div>
              <h3 className="qr-success-title">
                Payment Received!
              </h3>
              <p className="qr-success-text">
                ₹{payAmt.toLocaleString('en-IN')} credited to folio via UPI QR. Room balance is now ₹0.
              </p>
            </div>
          ) : loading ? (
            <div className="qr-loading-box">
              <FiRefreshCw className="fd-spin-icon" size={32} color="#04B3C0" />
              <p className="qr-loading-text">
                Generating Razorpay UPI QR Code...
              </p>
            </div>
          ) : error ? (
            <div className="qr-error-box">
              <div className="qr-error-emoji">
                <FiAlertTriangle size={36} color="#F59E0B" />
              </div>
              <h4 className="qr-error-title">
                Razorpay API Key Missing or Invalid
              </h4>
              <p className="qr-error-desc">
                {error}
              </p>
              <div className="qr-error-actions">
                <button
                  type="button"
                  className="fd-modal-submit-btn fd-btn-teal"
                  onClick={() => {
                    onClose();
                    if (onNavigateToSettings) onNavigateToSettings();
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <FiSettings size={14} /> Go to Settings &rarr; Payments
                </button>
                <button
                  type="button"
                  className="fd-modal-cancel-btn"
                  onClick={generateQr}
                >
                  Retry
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* AMOUNT DISPLAY */}
              <div className="qr-amount-card">
                <span className="qr-amount-label">Amount to Pay</span>
                <strong className="qr-amount-value">
                  ₹{payAmt.toLocaleString('en-IN')}
                </strong>
                <span className="qr-amount-sub">
                  Locked to Reservation #{res.id}
                </span>
              </div>

              {/* QR CODE CONTAINER */}
              <div className="qr-img-frame">
                <img
                  src={qrData?.imageUrl}
                  alt="Razorpay Dynamic UPI QR"
                  className="qr-img"
                />
              </div>

              {/* SUPPORTED APPS BADGES */}
              <div className="qr-apps-text">
                <span>Scan with any UPI App: </span>
                <strong className="qr-apps-list">GPay · PhonePe · Paytm · CRED · BHIM</strong>
              </div>

              {/* LIVE POLLING SPINNER */}
              <div className="qr-polling-pill">
                <FiRefreshCw className="fd-spin-icon" size={13} />
                <span>Waiting for guest payment notification...</span>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="fd-modal-footer qr-modal-footer">
          <button type="button" className="fd-modal-cancel-btn" onClick={onClose}>
            Close
          </button>
          {!isPaid && !loading && !error && (
            <button
              type="button"
              className="confirm-payment"
              onClick={handleManualConfirm}
            >
              <FiCheckCircle size={15} /> Confirm Payment Received
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
