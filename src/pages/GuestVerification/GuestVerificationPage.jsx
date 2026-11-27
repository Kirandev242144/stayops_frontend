import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { 
  FiShield, 
  FiCamera, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiFileText, 
  FiUploadCloud,
  FiX
} from 'react-icons/fi';
import { API_BASE_URL } from '../../config/api';
import './GuestVerificationPage.css';

const ID_OPTIONS = [
  'Aadhaar Card',
  'Passport',
  'Driving License',
  'Voter ID',
  'PAN Card'
];

/**
 * Compresses an image file using an HTML5 Canvas to keep uploads ultra fast on mobile networks.
 */
function compressImage(file, maxWidth = 1600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return resolve(file); // PDF or non-image, return as-is
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export default function GuestVerificationPage() {
  const { token } = useParams();

  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState('');

  // Form State
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');

  // Front Side File
  const [frontFile, setFrontFile] = useState(null);
  const [frontPreview, setFrontPreview] = useState(null);

  // Back Side File
  const [backFile, setBackFile] = useState(null);
  const [backPreview, setBackPreview] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);

  // Load Session
  useEffect(() => {
    if (!token) {
      setSessionError('Invalid verification link.');
      setIsLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/guest-verification/session/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || 'This link has expired or is invalid.');
        }
        return res.json();
      })
      .then((data) => {
        setSession(data);
        if (data.isCompleted) {
          setIsSuccess(true);
        }
      })
      .catch((err) => {
        setSessionError(err.message);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [token]);

  // Handle Front File Selection
  const handleFrontSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setFrontFile(compressed);
      setFrontPreview(URL.createObjectURL(compressed));
    } catch {
      setFrontFile(file);
      setFrontPreview(URL.createObjectURL(file));
    }
  };

  // Handle Back File Selection
  const handleBackSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setBackFile(compressed);
      setBackPreview(URL.createObjectURL(compressed));
    } catch {
      setBackFile(file);
      setBackPreview(URL.createObjectURL(file));
    }
  };

  // Upload a single file to server
  const uploadFile = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/upload/document`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Upload failed (${res.status})`);
    }

    const data = await res.json();
    return data.url;
  };

  // Submit Verification
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!frontFile) {
      alert('Please take or upload a photo of the front side of your ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload front side
      const frontUrl = await uploadFile(frontFile);

      // 2. Upload back side if provided
      let backUrl = null;
      if (backFile) {
        backUrl = await uploadFile(backFile);
      }

      // 3. Assemble document payload
      const documentsList = [
        {
          id: Date.now(),
          idType: idType,
          idNumber: idNumber.trim(),
          documentName: `${idType} (Front)`,
          documentUrl: frontUrl,
          uploadedAt: new Date().toISOString()
        }
      ];

      if (backUrl) {
        documentsList.push({
          id: Date.now() + 1,
          idType: idType,
          idNumber: idNumber.trim(),
          documentName: `${idType} (Back)`,
          documentUrl: backUrl,
          uploadedAt: new Date().toISOString()
        });
      }

      // 4. Submit to session endpoint
      const submitRes = await fetch(`${API_BASE_URL}/guest-verification/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          idType: idType,
          idNumber: idNumber.trim(),
          documentUrl: frontUrl,
          backDocumentUrl: backUrl,
          documents: documentsList
        })
      });

      if (!submitRes.ok) {
        const errData = await submitRes.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit verification.');
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Submission error:', err);
      alert(`Could not complete upload: ${err.message}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="gvp-container">
        <div className="gvp-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <div style={{ color: '#0284c7', fontSize: '15px', fontWeight: '600' }}>
            Loading verification session...
          </div>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="gvp-container">
        <div className="gvp-card">
          <div className="gvp-banner" style={{ background: '#7f1d1d' }}>
            <h2 className="gvp-prop-name">Link Expired or Invalid</h2>
          </div>
          <div style={{ padding: '32px 20px', textAlign: 'center' }}>
            <FiAlertCircle size={48} color="#ef4444" style={{ marginBottom: '12px' }} />
            <p style={{ fontSize: '14px', color: '#64748b', lineHeight: '1.5' }}>
              {sessionError}
            </p>
            <div style={{ marginTop: '16px', fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>
              Please ask the front desk to generate a fresh link for you.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gvp-container">
      <div className="gvp-card">
        {/* Banner */}
        <div className="gvp-banner">
          <div className="gvp-badge-security">
            <FiShield size={12} />
            <span>Secure Fast Check-In</span>
          </div>
          <h1 className="gvp-prop-name">{session?.propertyName || 'StayOps Hospitality'}</h1>
          <p className="gvp-prop-sub">Official Guest Identity Verification</p>
        </div>

        {isSuccess ? (
          /* SUCCESS STATE */
          <div className="gvp-success-card">
            <div className="gvp-success-icon-wrap">
              <FiCheckCircle size={36} />
            </div>
            <h2 className="gvp-success-title">ID Verified & Received!</h2>
            <p className="gvp-success-desc">
              Thank you, <strong>{session?.guestName}</strong>! Your ID has been securely sent directly to the front desk.
            </p>
            <div className="gvp-success-badge">
              🎉 You are all set! Please proceed to the counter.
            </div>
          </div>
        ) : (
          /* UPLOAD FORM */
          <>
            <div className="gvp-greeting">
              <div className="gvp-guest-info">
                <span className="gvp-guest-label">Guest Name</span>
                <strong className="gvp-guest-name">{session?.guestName || 'Valued Guest'}</strong>
              </div>
              <span className="gvp-pill-pending">Ready to Upload</span>
            </div>

            <form onSubmit={handleSubmit} className="gvp-body">
              {/* ID Type */}
              <div className="gvp-field">
                <label className="gvp-label">Document Type</label>
                <select
                  className="gvp-select"
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                >
                  {ID_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Document Number */}
              <div className="gvp-field">
                <label className="gvp-label">
                  Document Number <span className="gvp-label-opt">(optional)</span>
                </label>
                <input
                  type="text"
                  className="gvp-input"
                  placeholder="e.g. 12-digit Aadhaar / Passport No"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />
              </div>

              {/* Photo Upload Cards Grid */}
              <div className="gvp-upload-grid">
                {/* Front Side */}
                <div
                  className={`gvp-upload-card ${frontPreview ? 'has-file' : ''}`}
                  onClick={() => !frontPreview && frontInputRef.current?.click()}
                >
                  {frontPreview ? (
                    <>
                      <img src={frontPreview} alt="Front ID" className="gvp-preview-img" />
                      <div className="gvp-preview-overlay">
                        <span>✓ Front Added</span>
                        <button
                          type="button"
                          className="gvp-btn-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFrontFile(null);
                            setFrontPreview(null);
                          }}
                        >
                          Change
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="gvp-card-icon">
                        <FiCamera size={20} />
                      </div>
                      <div className="gvp-upload-title">Front Side *</div>
                      <div className="gvp-upload-desc">Snap photo or pick file</div>
                    </>
                  )}
                  <input
                    type="file"
                    ref={frontInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf"
                    capture="environment"
                    onChange={handleFrontSelect}
                  />
                </div>

                {/* Back Side (Optional) */}
                <div
                  className={`gvp-upload-card ${backPreview ? 'has-file' : ''}`}
                  onClick={() => !backPreview && backInputRef.current?.click()}
                >
                  {backPreview ? (
                    <>
                      <img src={backPreview} alt="Back ID" className="gvp-preview-img" />
                      <div className="gvp-preview-overlay">
                        <span>✓ Back Added</span>
                        <button
                          type="button"
                          className="gvp-btn-remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            setBackFile(null);
                            setBackPreview(null);
                          }}
                        >
                          Change
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="gvp-card-icon">
                        <FiUploadCloud size={20} />
                      </div>
                      <div className="gvp-upload-title">Back Side</div>
                      <div className="gvp-upload-desc">Optional (for Aadhaar)</div>
                    </>
                  )}
                  <input
                    type="file"
                    ref={backInputRef}
                    style={{ display: 'none' }}
                    accept="image/*,application/pdf"
                    capture="environment"
                    onChange={handleBackSelect}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="gvp-btn-submit"
                disabled={isSubmitting || !frontFile}
              >
                {isSubmitting ? (
                  <span>Uploading & Verifying...</span>
                ) : (
                  <>
                    <FiCheckCircle size={18} />
                    <span>Submit & Verify ID</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>

      <div className="gvp-footer">
        Powered by StayOps PMS · 256-Bit SSL Encrypted Verification
      </div>
    </div>
  );
}
