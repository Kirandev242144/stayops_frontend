import React, { useState, useEffect, useRef } from 'react';
import { 
  FiX, 
  FiSmartphone, 
  FiSend, 
  FiCheckCircle, 
  FiCopy, 
  FiCheck,
  FiExternalLink,
  FiEye,
  FiShield
} from 'react-icons/fi';
import { API_BASE_URL } from '../../../../config/api';
import { useWebSocketContext } from '../../../../context/WebSocketContext';
import './MobileIdRequestModal.css';

// Active live public Cloudflare tunnel for external smartphone access
const CLOUDFLARE_TUNNEL_URL = 'https://ceo-medicine-belts-real.trycloudflare.com';

function resolveBaseUrl() {
  if (typeof window !== 'undefined') {
    if (window.location.hostname.includes('trycloudflare.com') ||
        (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')) {
      return window.location.origin;
    }
  }
  return CLOUDFLARE_TUNNEL_URL || (typeof window !== 'undefined' ? window.location.origin : '');
}

export default function MobileIdRequestModal({
  isOpen,
  onClose,
  guestName = 'Guest',
  guestPhone = '',
  propertyName = 'StayOps Property',
  propertyId = '',
  onIdReceived
}) {
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isReceived, setIsReceived] = useState(false);
  const [receivedData, setReceivedData] = useState(null);

  const { subscribe } = useWebSocketContext();
  const pollTimerRef = useRef(null);

  // Automatically determine base public URL (tunnel for mobile phone access)
  const baseUrl = resolveBaseUrl();
  const uploadUrl = token ? `${baseUrl}/verify/${token}` : '';

  // 1. Generate Token on Open
  useEffect(() => {
    if (!isOpen) {
      setToken(null);
      setIsReceived(false);
      setReceivedData(null);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    setIsLoading(true);

    fetch(`${API_BASE_URL}/guest-verification/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        guestName: guestName.trim() || 'Guest',
        guestPhone: guestPhone.trim(),
        propertyName: propertyName || 'StayOps Property',
        propertyId: String(propertyId || '')
      })
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setToken(data.token);
      })
      .catch((err) => {
        console.error('Failed to create guest verification session:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, guestName, guestPhone, propertyName, propertyId]);

  // 2. Real-Time Listeners: WebSocket + Fallback Polling
  useEffect(() => {
    if (!token || isReceived) return;

    // A. WebSocket Subscriptions
    const unsubVerification = subscribe('GUEST_VERIFICATION', (msg) => {
      const payload = msg?.data || msg;
      if (payload?.token === token) {
        handleComplete(payload);
      }
    });

    const unsubFrontdesk = subscribe('FRONTDESK', (msg) => {
      if (msg?.event === 'GUEST_ID_UPLOADED') {
        const payload = msg?.data || msg;
        if (payload?.token === token) {
          handleComplete(payload);
        }
      }
    });

    // B. Fallback Polling every 2.5 seconds
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/guest-verification/session/${token}`);
        if (res.ok) {
          const session = await res.json();
          if (session.isCompleted) {
            handleComplete(session);
          }
        }
      } catch (err) {
        // silent polling catch
      }
    }, 2500);

    return () => {
      if (unsubVerification) unsubVerification();
      if (unsubFrontdesk) unsubFrontdesk();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [token, isReceived, subscribe]);

  const handleComplete = (incoming) => {
    if (isReceived) return;
    const payload = incoming?.data || incoming;
    setIsReceived(true);
    setReceivedData(payload);
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    if (onIdReceived) {
      onIdReceived(payload);
    }
  };

  const handleCopy = () => {
    if (!uploadUrl) return;
    navigator.clipboard.writeText(uploadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const cleanPhone = (guestPhone || '').replace(/[^\d]/g, '');
    const cleanGuestName = guestName && guestName !== 'Guest' ? guestName : '';
    const greeting = cleanGuestName ? `Hello ${cleanGuestName}` : 'Hello';
    const message = `${greeting}, please upload your Government ID for check-in at ${propertyName || 'StayOps'}:\n${uploadUrl}`;
    
    const waUrl = cleanPhone
      ? `https://wa.me/91${cleanPhone.replace(/^91/, '')}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;

    window.open(waUrl, '_blank');
  };

  if (!isOpen) return null;

  const qrImageUrl = uploadUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(uploadUrl)}`
    : '';

  const displayGuestInfo = guestName && guestName !== 'Guest'
    ? `${guestName}${guestPhone ? ` (+91 ${guestPhone})` : ''}`
    : guestPhone ? `+91 ${guestPhone}` : 'Guest';

  return (
    <div className="mirm-backdrop" onClick={onClose}>
      <div className="mirm-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="mirm-header">
          <div className="mirm-header-info">
            <div className="mirm-title-row">
              <FiSmartphone size={16} className="mirm-title-icon" />
              <h3 className="mirm-title">Guest ID Upload</h3>
            </div>
            <span className="mirm-subtitle">
              {isReceived ? 'Verification document received' : `Request from ${displayGuestInfo}`}
            </span>
          </div>
          <button
            type="button"
            className="mirm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={17} />
          </button>
        </div>

        {/* Body */}
        <div className="mirm-body">
          {isLoading ? (
            <div className="mirm-loading-state">
              <div className="mirm-spinner" />
              <span>Generating secure upload link...</span>
            </div>
          ) : isReceived ? (
            /* SUCCESS STATE WITH PREVIEW */
            <div className="mirm-success-wrap">
              <div className="mirm-success-banner">
                <FiCheckCircle size={22} className="mirm-success-icon" />
                <div className="mirm-success-text">
                  <div className="mirm-success-title">ID Received Successfully</div>
                  <div className="mirm-success-sub">
                    Document attached to reservation
                  </div>
                </div>
              </div>

              {/* ID Metadata */}
              {(receivedData?.idType || receivedData?.idNumber) && (
                <div className="mirm-id-pill-row">
                  <span className="mirm-id-badge">
                    <FiShield size={12} /> {receivedData?.idType || 'Govt ID'}
                  </span>
                  {receivedData?.idNumber && (
                    <span className="mirm-id-num">
                      Number: <strong>{receivedData.idNumber}</strong>
                    </span>
                  )}
                </div>
              )}

              {/* Document Image Thumbnails */}
              <div className="mirm-thumbs-container">
                {(receivedData?.documentUrl || receivedData?.frontUrl || (Array.isArray(receivedData?.documents) && receivedData?.documents[0]?.documentUrl)) && (
                  <div className="mirm-thumb-card">
                    <span className="mirm-thumb-label">Front Side</span>
                    <div 
                      className="mirm-thumb-img-wrap" 
                      onClick={() => window.open(receivedData.documentUrl || receivedData.frontUrl || receivedData.documents[0].documentUrl, '_blank')}
                      title="Click to view full photo"
                    >
                      <img 
                        src={receivedData.documentUrl || receivedData.frontUrl || receivedData.documents[0].documentUrl} 
                        alt="ID Front Preview" 
                        className="mirm-thumb-img" 
                      />
                      <div className="mirm-thumb-overlay">
                        <FiEye size={14} /> View
                      </div>
                    </div>
                  </div>
                )}

                {(receivedData?.backDocumentUrl || (Array.isArray(receivedData?.documents) && receivedData?.documents[1]?.documentUrl)) && (
                  <div className="mirm-thumb-card">
                    <span className="mirm-thumb-label">Back Side</span>
                    <div 
                      className="mirm-thumb-img-wrap" 
                      onClick={() => window.open(receivedData.backDocumentUrl || receivedData.documents[1].documentUrl, '_blank')}
                      title="Click to view full photo"
                    >
                      <img 
                        src={receivedData.backDocumentUrl || receivedData.documents[1].documentUrl} 
                        alt="ID Back Preview" 
                        className="mirm-thumb-img" 
                      />
                      <div className="mirm-thumb-overlay">
                        <FiEye size={14} /> View
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mirm-scan-wrap">
              {/* Clean QR Presentation */}
              <div className="mirm-qr-card">
                {qrImageUrl && (
                  <img
                    src={qrImageUrl}
                    alt="Scan QR for Mobile ID Upload"
                    className="mirm-qr-img"
                  />
                )}
                <span className="mirm-qr-caption">
                  Point phone camera at QR code to scan
                </span>
              </div>

              {/* Compact Quick Actions */}
              <div className="mirm-action-row">
                <button
                  type="button"
                  className="mirm-btn mirm-btn-whatsapp"
                  onClick={handleWhatsApp}
                  title="Send upload link via WhatsApp"
                >
                  <FiSend size={13} />
                  <span>Send on WhatsApp</span>
                </button>

                <button
                  type="button"
                  className={`mirm-btn mirm-btn-copy ${copied ? 'copied' : ''}`}
                  onClick={handleCopy}
                  title="Copy verification link"
                >
                  {copied ? <FiCheck size={13} /> : <FiCopy size={13} />}
                  <span>{copied ? 'Copied Link' : 'Copy Link'}</span>
                </button>
              </div>

              {/* Subtle Open in new tab link */}
              <div className="mirm-sub-link-wrap">
                <button
                  type="button"
                  className="mirm-link-btn"
                  onClick={() => window.open(uploadUrl, '_blank')}
                >
                  Open upload link in new tab <FiExternalLink size={11} />
                </button>
              </div>

              {/* Live Sync Status Indicator */}
              <div className="mirm-live-status">
                <div className="mirm-pulse-dot" />
                <span className="mirm-live-text">
                  Waiting for guest upload...
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mirm-footer">
          <button
            type="button"
            className="mirm-btn-footer"
            onClick={onClose}
          >
            {isReceived ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
}
