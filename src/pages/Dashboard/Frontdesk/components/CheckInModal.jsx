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
  FiEye
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
  const unitDisplay = res.unit || res.roomUnit || '';

  return (
    <div className="cim-backdrop" onClick={onClose}>
      <div className="cim-modal" onClick={(e) => e.stopPropagation()}>
        {/* HEADER */}
        <div className="cim-header">
          <div className="cim-title-wrap">
            <h3 className="cim-title">Guest Check-In</h3>
            <div className="cim-guest-pill">
              <span className="cim-guest-name">{guestDisplay}</span>
              <span className="cim-bullet">•</span>
              <span className="cim-booking-id">{res.id}</span>
              {unitDisplay && (
                <>
                  <span className="cim-bullet">•</span>
                  <span className="cim-unit-tag">{unitDisplay}</span>
                </>
              )}
            </div>
          </div>
          <button
            type="button"
            className="cim-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={15} />
          </button>
        </div>

        {/* BODY */}
        <div className="cim-body">
          {/* QUICK STAY & FOLIO STRIP */}
          <div className="cim-stay-strip">
            <div className="cim-stay-dates">
              <FiCalendar size={13} />
              <span>{res.checkin || res.checkIn} → {res.checkout || res.checkOut} ({nights}N)</span>
            </div>
            {isBalancePending ? (
              <span className="cim-badge-pending">
                <FiAlertCircle size={12} /> Balance Due: ₹{balanceDue.toLocaleString('en-IN')}
              </span>
            ) : (
              <span className="cim-badge-paid">
                <FiCheckCircle size={12} /> Paid in Full (₹{Number(res.amountPaid || res.totalAmount || 0).toLocaleString('en-IN')})
              </span>
            )}
          </div>

          {/* ID VERIFICATION SECTION */}
          {hasExistingId && !isEditingId ? (
            <div className="cim-verified-strip">
              <div className="cim-verified-details">
                <span className="cim-verified-tag">
                  <FiShield size={12} /> ID Verified on File
                </span>
                <span className="cim-verified-num">
                  {res.idType || idType}
                  {res.idNumber ? ` • ${res.idNumber}` : ''}
                  {(res.idDocumentUrl || idDocumentUrl) ? ' • Photo on file' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {(res.idDocumentUrl || idDocumentUrl) && (
                  <button
                    type="button"
                    style={{
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      color: '#1d4ed8',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 650,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    onClick={() => setLightboxUrl(res.idDocumentUrl || idDocumentUrl)}
                    title="View uploaded ID document photo"
                  >
                    <FiEye size={12} /> View ID
                  </button>
                )}
                <button
                  type="button"
                  className="cim-edit-link"
                  onClick={() => setIsEditingId(true)}
                >
                  Change ID
                </button>
              </div>
            </div>
          ) : (
            <div className="cim-section">
              <div className="cim-section-label-row">
                <span className="cim-section-label">Identity Proof</span>
                <span className="cim-status-pill required">Upload Photo</span>
              </div>

              {/* ID TYPE (CLEAN DROPDOWN) */}
              <div className="cim-field">
                <label className="cim-micro-label">
                  ID Type <span className="req">*</span>
                </label>
                <select
                  className="cim-select"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                >
                  {ID_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* UPLOAD ID PHOTO / SCAN */}
              <div className="cim-field">
                <label className="cim-micro-label">
                  Guest ID Photo / Scan <span className="req">*</span>
                </label>
                <div className="cim-attach-row">
                  {isUploadingDoc ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563eb', fontSize: 12 }}>
                      <FiLoader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Uploading document...</span>
                    </span>
                  ) : idDocumentUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 8, padding: '8px 12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          {idDocumentUrl.match(/\.(jpeg|jpg|png|webp|gif)$/i) || idDocumentUrl.startsWith('data:image') || idDocumentUrl.includes('/uploads/') ? (
                            <img
                              src={idDocumentUrl}
                              alt="ID Thumbnail"
                              style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid #94a3b8', cursor: 'pointer' }}
                              onClick={() => setLightboxUrl(idDocumentUrl)}
                              title="Click to view full photo"
                            />
                          ) : (
                            <FiFileText size={22} color="#2563eb" />
                          )}
                          <div>
                            <div style={{ fontSize: 12.5, fontWeight: 650, color: '#1e293b' }}>
                              {docFileName || 'Guest ID Document'}
                            </div>
                            <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <FiCheckCircle size={11} /> Attached &amp; Ready
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            style={{
                              background: '#eff6ff',
                              border: '1px solid #bfdbfe',
                              color: '#1d4ed8',
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 12,
                              fontWeight: 650,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}
                            onClick={() => setLightboxUrl(idDocumentUrl)}
                            title="View full size ID image"
                          >
                            <FiEye size={12} /> View Photo
                          </button>
                          <button
                            type="button"
                            className="cim-doc-del"
                            onClick={handleRemoveDoc}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: 8, width: '100%' }}>
                      <label className="cim-attach-btn" style={{ flex: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <FiPaperclip size={13} />
                        <span>Upload ID (JPG, PNG, PDF)</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          style={{ display: 'none' }}
                          onChange={handleFileUpload}
                        />
                      </label>
                      <button
                        type="button"
                        className="cim-attach-btn"
                        style={{ width: 'auto', padding: '0 12px', background: '#f0fdf4', borderColor: '#bbf7d0', color: '#166534', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 600 }}
                        onClick={() => setIsMobileModalOpen(true)}
                        title="Send upload link to guest's phone via WhatsApp or QR"
                      >
                        <FiSmartphone size={13} color="#16a34a" />
                        <span>Request via Phone</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 2-COLUMN: GUEST CITY & STATE (OPTIONAL COMPLIANCE) */}
              <div className="cim-row-2col">
                <div className="cim-field">
                  <label className="cim-micro-label">City (Optional)</label>
                  <input
                    type="text"
                    className="cim-input"
                    placeholder="e.g. Mumbai"
                    value={guestCity}
                    onChange={(e) => setGuestCity(e.target.value)}
                  />
                </div>

                <div className="cim-field">
                  <label className="cim-micro-label">State (Optional)</label>
                  <input
                    type="text"
                    className="cim-input"
                    placeholder="e.g. Maharashtra"
                    value={guestState}
                    onChange={(e) => setGuestState(e.target.value)}
                  />
                </div>
              </div>

              {hasExistingId && isEditingId && (
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="cim-edit-link"
                    onClick={() => setIsEditingId(false)}
                  >
                    Cancel Edit
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* FOOTER */}
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
              title="Check in now; capture ID before departure"
            >
              Skip & Check-In
            </button>
          )}

          <button
            type="button"
            className="cim-btn-submit"
            onClick={handleConfirmWithId}
            disabled={isSubmitting}
          >
            <FiKey size={14} />
            {isSubmitting ? 'Checking In...' : 'Confirm Check-In'}
          </button>
        </div>

        <MobileIdRequestModal
          isOpen={isMobileModalOpen}
          onClose={() => setIsMobileModalOpen(false)}
          guestName={res?.guest || res?.guestName || 'Guest'}
          guestPhone={res?.phone || res?.guestPhone || ''}
          propertyName={res?.propertyName || 'StayOps Property'}
          propertyId={res?.propertyId || ''}
          onIdReceived={handleMobileIdReceived}
        />

        {/* Lightbox Modal for inspecting full size ID photo */}
        {lightboxUrl && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 100000,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20
            }}
            onClick={() => setLightboxUrl(null)}
          >
            <div
              style={{
                position: 'relative',
                maxWidth: '92vw',
                maxHeight: '92vh',
                background: '#ffffff',
                borderRadius: 12,
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <span style={{ fontWeight: 650, fontSize: 13.5, color: '#1e293b' }}>
                  🪪 Guest ID Proof — {res?.guest || res?.guestName || 'Guest'}
                </span>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <a
                    href={lightboxUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                  >
                    Open in New Tab ↗
                  </a>
                  <button
                    type="button"
                    onClick={() => setLightboxUrl(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#475569' }}
                  >
                    <FiX size={18} />
                  </button>
                </div>
              </div>
              <div style={{ padding: 14, overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#090d16' }}>
                <img
                  src={lightboxUrl}
                  alt="Guest ID Document"
                  style={{ maxWidth: '100%', maxHeight: '76vh', objectFit: 'contain', borderRadius: 6 }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
