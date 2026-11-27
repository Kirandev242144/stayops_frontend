import React, { useState, useEffect } from 'react';
import {
  FiX,
  FiKey,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiPaperclip,
  FiCalendar,
  FiFileText,
  FiLoader,
  FiSmartphone,
  FiEye,
  FiCamera,
  FiHome,
  FiUser
} from 'react-icons/fi';
import { API_BASE_URL } from '../../../../config/api';
import MobileIdRequestModal from '../../Reservations/components/MobileIdRequestModal';
import './CheckInModal.css';

const ID_TYPES = [
  'Aadhaar Card',
  'Passport',
  'Driving License',
  'Voter ID',
  'Other Govt ID'
];

function formatStayDatesClean(cin, cout) {
  if (!cin || !cout) return `${cin || ''} → ${cout || ''}`;
  try {
    const d1 = new Date(cin).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    const d2 = new Date(cout).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
    return `${d1} – ${d2}`;
  } catch {
    return `${cin} – ${cout}`;
  }
}

export default function CheckInModal({
  isOpen,
  res,
  onClose,
  onConfirmCheckIn
}) {
  const hasExistingId = Boolean(res?.idDocumentUrl || res?.idNumber || (res?.idType && res?.status === 'checkedin'));

  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [guestState, setGuestState] = useState('');
  const [idDocumentUrl, setIdDocumentUrl] = useState('');
  const [docFileName, setDocFileName] = useState('');
  const [isEditingId, setIsEditingId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState(null);

  const handleMobileIdReceived = (data) => {
    const docUrl = data.documentUrl || data.frontUrl || (Array.isArray(data.documents) && data.documents[0]?.documentUrl);
    if (docUrl) {
      setIdDocumentUrl(docUrl);
      setDocFileName(data.documentName || `${data.idType || 'ID'}-PhonePhoto`);
    }
    if (data.idType) setIdType(data.idType);
    if (data.idNumber) setIdNumber(data.idNumber);
  };

  useEffect(() => {
    if (!isOpen || !res) return;

    setIdType(res.idType || 'Aadhaar Card');
    setIdNumber(res.idNumber || '');
    setGuestCity(res.guestCity || '');
    setGuestState(res.guestState || '');
    setIdDocumentUrl(res.idDocumentUrl || '');
    setDocFileName(res.idDocumentUrl ? 'ID-Document-on-file' : '');
    setIsEditingId(!hasExistingId);
    setIsSubmitting(false);
    setIsUploadingDoc(false);
  }, [isOpen, res, hasExistingId]);

  if (!isOpen || !res) return null;

  // Nights calculation
  const getNights = () => {
    const start = res.checkin || res.checkIn;
    const end = res.checkout || res.checkOut;
    if (!start || !end) return 1;
    const diff = (new Date(end) - new Date(start)) / (1000 * 60 * 60 * 24);
    const n = Math.ceil(diff);
    return n > 0 ? n : 1;
  };
  const nights = getNights();

  // Handle document file upload (upload to server / fallback to data URL)
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert("File size exceeds 10MB limit. Please upload a smaller image or PDF.");
      return;
    }

    setDocFileName(file.name);
    setIsUploadingDoc(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const token = localStorage.getItem("token");
      const uploadRes = await fetch(`${API_BASE_URL}/upload/document`, {
        method: "POST",
        headers: {
          Authorization: token ? `Bearer ${token}` : ""
        },
        body: formData
      });

      if (uploadRes.ok) {
        const data = await uploadRes.json();
        if (data.url) {
          setIdDocumentUrl(data.url);
          setIsUploadingDoc(false);
          return;
        }
      }

      // Fallback to base64 if server upload endpoint fails
      const reader = new FileReader();
      reader.onload = (event) => {
        setIdDocumentUrl(event.target.result);
        setIsUploadingDoc(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.warn("Upload endpoint failed, falling back to data URL:", err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setIdDocumentUrl(event.target.result);
        setIsUploadingDoc(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveDoc = () => {
    setIdDocumentUrl('');
    setDocFileName('');
  };

  // 1. Confirm check-in WITH ID verification
  const handleConfirmWithId = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onConfirmCheckIn({
        res,
        idType: isEditingId ? idType : (res.idType || idType),
        idNumber: isEditingId ? (idNumber ? idNumber.trim() : (res.idNumber || '')) : (res.idNumber || ''),
        idDocumentUrl: isEditingId ? idDocumentUrl : (res.idDocumentUrl || idDocumentUrl),
        guestCity: guestCity.trim(),
        guestState: guestState.trim()
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Bypass ID verification (Rush-hour Check-In)
  const handleSkipAndCheckIn = async () => {
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      await onConfirmCheckIn({
        res,
        skipId: true
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const balanceDue = Number(res.balanceDue ?? (Number(res.totalAmount || res.amount || 0) - Number(res.amountPaid || 0)));
  const isBalancePending = balanceDue > 0;
  const guestDisplay = res.guestName || res.guest || 'Guest';
  const unitDisplay = res.unit || res.roomUnit || 'Room Unit';
  const guestInitial = guestDisplay.charAt(0).toUpperCase();
  const stayDatesFormatted = formatStayDatesClean(res.checkin || res.checkIn, res.checkout || res.checkOut);

  return (
    <div className="cim-backdrop" onClick={onClose}>
      <div className="cim-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Mobile Drag Indicator Handle */}
        <div className="cim-drag-indicator"></div>

        {/* HEADER */}
        <div className="cim-header">
          <div className="cim-title-wrap">
            <h3 className="cim-title">Confirm Check-In</h3>
            <span className="cim-subtitle">Room key handoff &amp; guest arrival verification</span>
          </div>
          <button
            type="button"
            className="cim-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <FiX size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="cim-body">
          
          {/* ── 1. GUEST & STAY COMPACT OVERVIEW CARD ── */}
          <div className="cim-overview-card">
            <div className="cim-overview-top">
              <div className="cim-overview-avatar">
                {guestInitial}
              </div>
              <div className="cim-overview-info">
                <div className="cim-overview-name-row">
                  <h4 className="cim-overview-name">{guestDisplay}</h4>
                  <span className="cim-overview-ref">#{res.bookingRef || res.id}</span>
                </div>
                <div className="cim-overview-meta">
                  <span className="cim-overview-room">
                    <FiHome size={11} /> {unitDisplay}
                  </span>
                  <span className="cim-overview-dot">•</span>
                  <span className="cim-overview-dates">
                    <FiCalendar size={11} /> {stayDatesFormatted} ({nights}N)
                  </span>
                </div>
              </div>
            </div>

            <div className="cim-overview-finance-row">
              <div className="cim-finance-item">
                <span className="cim-finance-lbl">Total Folio</span>
                <span className="cim-finance-val">₹{Number(res.totalAmount || res.amount || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="cim-finance-item">
                <span className="cim-finance-lbl">Paid</span>
                <span className="cim-finance-val paid">₹{Number(res.amountPaid || 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="cim-finance-item">
                <span className="cim-finance-lbl">Payment Status</span>
                {isBalancePending ? (
                  <span className="cim-status-tag due">
                    ₹{balanceDue.toLocaleString('en-IN')} Due
                  </span>
                ) : (
                  <span className="cim-status-tag paid">
                    <FiCheckCircle size={10} /> Paid in Full
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ── 2. IDENTITY VERIFICATION CARD ── */}
          {hasExistingId && !isEditingId ? (
            <div className="cim-id-verified-card">
              <div className="cim-verified-header">
                <div className="cim-verified-shield-icon">
                  <FiShield size={16} />
                </div>
                <div className="cim-verified-text">
                  <span className="cim-verified-status">Government ID Verified</span>
                  <span className="cim-verified-desc">
                    {res.idType || idType} {res.idNumber ? `• ${res.idNumber}` : ''}
                  </span>
                </div>
              </div>

              <div className="cim-verified-actions">
                {(res.idDocumentUrl || idDocumentUrl) && (
                  <button
                    type="button"
                    className="cim-btn-view-photo"
                    onClick={() => setLightboxUrl(res.idDocumentUrl || idDocumentUrl)}
                  >
                    <FiEye size={13} />
                    <span>View Photo</span>
                  </button>
                )}
                <button
                  type="button"
                  className="cim-btn-change-id"
                  onClick={() => setIsEditingId(true)}
                >
                  Change ID
                </button>
              </div>
            </div>
          ) : (
            <div className="cim-id-capture-box">
              <div className="cim-id-box-header">
                <div className="cim-id-header-title">
                  <FiShield className="cim-id-shield" size={14} />
                  <span>Identity Proof (Govt ID)</span>
                </div>
                <span className="cim-optional-pill">Required</span>
              </div>

              {/* Segmented Pill Selector for ID Type */}
              <div className="cim-id-type-pills" role="tablist">
                {ID_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`cim-id-pill ${idType === type ? 'active' : ''}`}
                    onClick={() => setIdType(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {/* ID Number Input */}
              <div className="cim-input-field">
                <label className="cim-field-label">Document Number</label>
                <input
                  type="text"
                  className="cim-text-input"
                  placeholder={`Enter ${idType} number...`}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>

              {/* Photo Upload & Remote Capture Action */}
              <div className="cim-upload-section">
                <label className="cim-field-label">ID Photo or Scan</label>

                {isUploadingDoc ? (
                  <div className="cim-uploading-indicator">
                    <FiLoader size={16} className="cim-spin-icon" />
                    <span>Uploading ID Document...</span>
                  </div>
                ) : idDocumentUrl ? (
                  <div className="cim-doc-preview-card">
                    <div className="cim-doc-preview-left">
                      {idDocumentUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i) || idDocumentUrl.startsWith('data:image') || idDocumentUrl.includes('/uploads/') ? (
                        <img
                          src={idDocumentUrl}
                          alt="ID Thumbnail"
                          className="cim-doc-thumb"
                          onClick={() => setLightboxUrl(idDocumentUrl)}
                          title="Click to view full photo"
                        />
                      ) : (
                        <div className="cim-doc-file-icon">
                          <FiFileText size={20} />
                        </div>
                      )}
                      <div className="cim-doc-preview-meta">
                        <span className="cim-doc-name">{docFileName || `${idType} Photo`}</span>
                        <span className="cim-doc-ready">
                          <FiCheckCircle size={11} /> Attached &amp; Verified
                        </span>
                      </div>
                    </div>

                    <div className="cim-doc-preview-right">
                      <button
                        type="button"
                        className="cim-btn-view-preview"
                        onClick={() => setLightboxUrl(idDocumentUrl)}
                      >
                        <FiEye size={12} /> View
                      </button>
                      <button
                        type="button"
                        className="cim-btn-remove-preview"
                        onClick={handleRemoveDoc}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="cim-capture-action-grid">
                    {/* Native File / Camera Trigger */}
                    <label className="cim-action-tile upload">
                      <FiCamera size={18} className="cim-tile-icon" />
                      <div className="cim-tile-text">
                        <span className="cim-tile-title">Capture / Upload</span>
                        <span className="cim-tile-sub">Camera or Photo Library</span>
                      </div>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
                      />
                    </label>

                    {/* WhatsApp / QR Remote Trigger */}
                    <button
                      type="button"
                      className="cim-action-tile remote"
                      onClick={() => setIsMobileModalOpen(true)}
                    >
                      <FiSmartphone size={18} className="cim-tile-icon green" />
                      <div className="cim-tile-text">
                        <span className="cim-tile-title">Request on Phone</span>
                        <span className="cim-tile-sub">Send WhatsApp link</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Optional City and State */}
              <div className="cim-geo-row">
                <div className="cim-geo-field">
                  <label className="cim-geo-label">Guest City (Optional)</label>
                  <input
                    type="text"
                    className="cim-geo-input"
                    placeholder="e.g. Bengaluru"
                    value={guestCity}
                    onChange={(e) => setGuestCity(e.target.value)}
                  />
                </div>
                <div className="cim-geo-field">
                  <label className="cim-geo-label">State (Optional)</label>
                  <input
                    type="text"
                    className="cim-geo-input"
                    placeholder="e.g. Karnataka"
                    value={guestState}
                    onChange={(e) => setGuestState(e.target.value)}
                  />
                </div>
              </div>

              {hasExistingId && isEditingId && (
                <div className="cim-cancel-edit-wrap">
                  <button
                    type="button"
                    className="cim-cancel-edit-btn"
                    onClick={() => setIsEditingId(false)}
                  >
                    Cancel Editing ID
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 3. STICKY MOBILE ACTION BAR ── */}
        <div className="cim-footer">
          <button
            type="button"
            className="cim-btn-cancel"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          {(!hasExistingId || isEditingId) && (
            <button
              type="button"
              className="cim-btn-skip"
              onClick={handleSkipAndCheckIn}
              disabled={isSubmitting}
              title="Proceed check-in now; verify ID later"
            >
              Skip ID
            </button>
          )}

          <button
            type="button"
            className="cim-btn-submit"
            onClick={handleConfirmWithId}
            disabled={isSubmitting}
          >
            <FiKey size={16} />
            <span>{isSubmitting ? 'Checking In...' : 'Confirm Check-In'}</span>
          </button>
        </div>

        <MobileIdRequestModal
          isOpen={isMobileModalOpen}
          onClose={() => setIsMobileModalOpen(false)}
          guestName={guestDisplay}
          guestPhone={res?.phone || res?.guestPhone || ''}
          propertyName={res?.propertyName || 'StayOps Property'}
          propertyId={res?.propertyId || ''}
          onIdReceived={handleMobileIdReceived}
        />

        {/* Lightbox Modal for inspecting full size ID photo */}
        {lightboxUrl && (
          <div
            className="cim-lightbox-backdrop"
            onClick={() => setLightboxUrl(null)}
          >
            <div
              className="cim-lightbox-card"
              onClick={e => e.stopPropagation()}
            >
              <div className="cim-lightbox-header">
                <span className="cim-lightbox-title">
                  🪪 ID Proof — {guestDisplay}
                </span>
                <div className="cim-lightbox-actions">
                  <a
                    href={lightboxUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cim-lightbox-external"
                  >
                    Open Full ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(null)}
                    className="cim-lightbox-close"
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>
              <div className="cim-lightbox-img-wrap">
                <img
                  src={lightboxUrl}
                  alt="Guest ID Document"
                  className="cim-lightbox-img"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
