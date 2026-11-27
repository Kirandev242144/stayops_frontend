import React, { useState, useEffect } from "react";
import {
  FiArrowLeft,
  FiPhone,
  FiMail,
  FiCalendar,
  FiShield,
  FiZoomIn,
  FiZoomOut,
  FiRotateCw,
  FiMaximize2,
  FiDownload,
  FiExternalLink,
  FiX,
  FiCheck,
  FiFileText,
  FiMessageSquare,
  FiCopy,
  FiEye
} from "react-icons/fi";
import { fetchGuestProfileDetail } from "../guestApi";
import "./GuestProfilePage.css";

export default function GuestProfilePage({ guest, onBack, onViewVoucher }) {
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const profileId =
    guest?.dbId ||
    (typeof guest?.id === "number"
      ? guest.id
      : guest?.id
      ? String(guest.id).replace(/\D/g, "")
      : null);

  useEffect(() => {
    let isMounted = true;
    if (profileId) {
      setLoadingDetail(true);
      fetchGuestProfileDetail(profileId)
        .then((data) => {
          if (isMounted && data) {
            setDetailData(data);
          }
        })
        .catch((err) => {
          console.warn("Could not load extended profile detail:", err);
        })
        .finally(() => {
          if (isMounted) setLoadingDetail(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [profileId]);

  // Esc key listener for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isLightboxOpen) {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen]);

  if (!guest) return null;

  const prof = detailData?.profile || guest;
  const staysCount = detailData?.totalStays ?? guest.totalStays ?? 0;
  const lifetimeSpend = Number(detailData?.totalSpend ?? guest.totalRevenue ?? 0);
  const lastStayDate = detailData?.lastStayDate || guest.lastStay || "—";
  const reservations = detailData?.reservations || [];

  // Average stay calculation
  const averageSpend = staysCount > 0 ? Math.round(lifetimeSpend / staysCount) : 0;

  // Parse ID documents
  let parsedDocs = [];
  if (prof.idDocuments) {
    try {
      parsedDocs =
        typeof prof.idDocuments === "string"
          ? JSON.parse(prof.idDocuments)
          : prof.idDocuments;
    } catch {
      parsedDocs = [];
    }
  }

  const idType =
    prof.idType ||
    parsedDocs[0]?.idType ||
    (prof.idNumber ? "Aadhaar Card" : null);
  const idNumber = prof.idNumber || parsedDocs[0]?.idNumber || null;
  const idDocumentUrl =
    prof.idDocumentUrl ||
    parsedDocs[0]?.documentUrl ||
    guest.idDocumentUrl ||
    null;
  const hasId = Boolean(
    idType || idNumber || idDocumentUrl || (Array.isArray(parsedDocs) && parsedDocs.length > 0)
  );

  const guestInitial = prof.name ? prof.name.charAt(0).toUpperCase() : "G";
  const isReturning = staysCount > 1 || guest.status === "returning";

  const cleanPhone = (prof.phone || "").replace(/[^\d+]/g, "");
  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone.replace(/^0+/, "")}`
    : null;

  const handleCopyPhone = () => {
    if (prof.phone) {
      navigator.clipboard.writeText(prof.phone);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => {
    setZoomLevel(1);
    setRotation(0);
  };
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  // Latest booking notes
  const latestNotes = reservations.find((r) => r.notes && r.notes.trim().length > 0)?.notes;

  return (
    <div className="shopify-profile-page">
      {/* Top Bar / Breadcrumb */}
      <div className="shopify-top-bar">
        <div className="shopify-top-left">
          <button
            type="button"
            className="shopify-back-btn"
            onClick={onBack}
            title="Return to guest list"
          >
            <FiArrowLeft size={14} /> Guests
          </button>

          <div className="shopify-profile-title-group">
            <h1 className="shopify-page-title">{prof.name || "Guest Profile"}</h1>
            {isReturning ? (
              <span className="polaris-badge polaris-badge-info">
                Returning customer
              </span>
            ) : (
              <span className="polaris-badge polaris-badge-neutral">
                New customer
              </span>
            )}
            {hasId ? (
              <span className="polaris-badge polaris-badge-success">
                <FiCheck size={11} /> ID verified
              </span>
            ) : (
              <span className="polaris-badge polaris-badge-attention">
                ID pending
              </span>
            )}
          </div>
        </div>

        <div className="shopify-top-actions">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="shopify-btn shopify-btn-secondary"
              title="Message on WhatsApp"
            >
              <FiMessageSquare size={13} /> WhatsApp
            </a>
          )}
          {prof.email && (
            <a
              href={`mailto:${prof.email}`}
              className="shopify-btn shopify-btn-secondary"
              title="Send email"
            >
              <FiMail size={13} /> Email
            </a>
          )}
        </div>
      </div>

      {/* Shopify 2-Column Grid (Main 68% / Sidebar 32%) */}
      <div className="shopify-layout">
        {/* Main Column */}
        <div className="shopify-main-col">
          {/* Card 1: Identity & Compliance */}
          <div className="shopify-card">
            <div className="shopify-card-header">
              <h2 className="shopify-card-title">Identity verification</h2>
              {hasId ? (
                <span className="polaris-badge polaris-badge-success">
                  {idType || "Verified"}
                </span>
              ) : (
                <span className="polaris-badge polaris-badge-attention">
                  Missing
                </span>
              )}
            </div>

            <div className="shopify-card-section">
              <div className="shopify-key-vals">
                <div className="shopify-kv-item">
                  <span className="shopify-kv-label">Document type</span>
                  <span className="shopify-kv-val">{idType || "Not recorded"}</span>
                </div>
                <div className="shopify-kv-item">
                  <span className="shopify-kv-label">ID / Registration number</span>
                  <span className="shopify-kv-val">
                    {idNumber || (idDocumentUrl ? "Verified via photo document" : "—")}
                  </span>
                </div>
              </div>

              {/* Document Attachment Row (Hidden until clicked) */}
              {idDocumentUrl ? (
                <div
                  className="shopify-doc-attachment-card"
                  onClick={() => setIsLightboxOpen(true)}
                  title="Click to view document"
                >
                  <div className="shopify-doc-attachment-left">
                    <div className="shopify-doc-file-icon">
                      <FiFileText size={18} />
                    </div>
                    <div className="shopify-doc-file-info">
                      <span className="shopify-doc-file-name">{idType || "Identity Document Proof"}</span>
                      <span className="shopify-doc-file-sub">
                        Attached Government ID Photo • Click to view
                      </span>
                    </div>
                  </div>

                  <div className="shopify-doc-attachment-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className="shopify-btn shopify-btn-secondary"
                      onClick={() => setIsLightboxOpen(true)}
                    >
                      <FiEye size={13} /> View document
                    </button>
                    <a
                      href={idDocumentUrl}
                      download={`ID_${prof.name || "Guest"}.jpg`}
                      className="shopify-icon-btn"
                      title="Download image"
                    >
                      <FiDownload size={13} />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="shopify-doc-empty">
                  <FiFileText size={20} style={{ color: "#8c9196" }} />
                  <p>No identification document uploaded for this guest.</p>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Reservation & Stay History */}
          <div className="shopify-card">
            <div className="shopify-card-header">
              <h2 className="shopify-card-title">Stay history</h2>
              <span style={{ fontSize: "12px", color: "#6d7175" }}>
                {reservations.length > 0 ? `${reservations.length} bookings` : `${staysCount} stays`}
              </span>
            </div>

            {loadingDetail ? (
              <div className="shopify-card-section" style={{ textAlign: "center", color: "#6d7175", padding: "28px" }}>
                Loading stay history...
              </div>
            ) : reservations.length === 0 ? (
              <div className="shopify-card-section shopify-doc-empty">
                <FiCalendar size={24} style={{ color: "#8c9196" }} />
                <p>No reservations found in database.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="shopify-res-table">
                  <thead>
                    <tr>
                      <th>Booking</th>
                      <th>Dates</th>
                      <th>Room</th>
                      <th>Status</th>
                      <th>Amount</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((res) => {
                      const isCheckedIn = (res.status || "").toLowerCase().includes("checkedin");
                      const isCheckedOut = (res.status || "").toLowerCase().includes("checkedout");
                      const isPaid = (res.paymentStatus || "").toLowerCase().includes("paid");

                      return (
                        <tr key={res.id || res.bookingRef}>
                          <td>
                            <span className="shopify-booking-ref">{res.bookingRef || `BK-${res.id}`}</span>
                          </td>
                          <td>
                            <span>
                              {res.checkIn || "—"} → {res.checkOut || "—"}
                            </span>
                          </td>
                          <td>
                            <span className="shopify-booking-unit">{res.roomUnit || "Standard"}</span>
                          </td>
                          <td>
                            <span
                              className={`polaris-badge ${
                                isCheckedIn
                                  ? "polaris-badge-success"
                                  : isCheckedOut
                                  ? "polaris-badge-neutral"
                                  : "polaris-badge-attention"
                              }`}
                            >
                              {res.status || "Confirmed"}
                            </span>
                          </td>
                          <td>
                            <div>
                              <strong>₹{(Number(res.totalAmount) || 0).toLocaleString("en-IN")}</strong>
                              <span
                                style={{
                                  display: "block",
                                  fontSize: "11px",
                                  color: isPaid ? "#166534" : "#92400e"
                                }}
                              >
                                {res.paymentStatus || "Pending"}
                              </span>
                            </div>
                          </td>
                          <td>
                            {onViewVoucher && (
                              <button
                                type="button"
                                className="shopify-btn shopify-btn-secondary"
                                style={{ height: "26px", padding: "0 8px", fontSize: "11.5px" }}
                                onClick={() => onViewVoucher(res)}
                              >
                                Voucher
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="shopify-sidebar-col">
          {/* Sidebar Card 1: Guest Details */}
          <div className="shopify-card">
            <div className="shopify-card-header">
              <h2 className="shopify-card-title">Customer overview</h2>
            </div>

            <div className="shopify-card-section">
              <div className="shopify-customer-card">
                <div className="shopify-customer-head">
                  <div className="shopify-avatar">{guestInitial}</div>
                  <div className="shopify-customer-title-wrap">
                    <span className="shopify-customer-name">{prof.name || "Guest"}</span>
                    <span className="shopify-customer-sub">Guest ID: {prof.id || "—"}</span>
                  </div>
                </div>

                <div className="shopify-contact-list">
                  <div className="shopify-contact-item">
                    <FiPhone size={14} />
                    <span>{prof.phone || "No phone"}</span>
                    {prof.phone && (
                      <button
                        type="button"
                        onClick={handleCopyPhone}
                        title="Copy phone number"
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: "#6d7175",
                          padding: "2px",
                          display: "inline-flex"
                        }}
                      >
                        <FiCopy size={12} />
                      </button>
                    )}
                    {copiedPhone && (
                      <span style={{ fontSize: "11px", color: "#166534", fontWeight: 500 }}>
                        Copied
                      </span>
                    )}
                  </div>

                  {prof.email && (
                    <div className="shopify-contact-item">
                      <FiMail size={14} />
                      <a href={`mailto:${prof.email}`}>{prof.email}</a>
                    </div>
                  )}

                  <div className="shopify-contact-item">
                    <FiCalendar size={14} />
                    <span style={{ color: "#6d7175", fontSize: "12px" }}>
                      Member since {prof.createdAt ? prof.createdAt.split("T")[0] : "Recent"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Card 2: Lifetime Summary */}
          <div className="shopify-card">
            <div className="shopify-card-header">
              <h2 className="shopify-card-title">Customer metrics</h2>
            </div>

            <div className="shopify-card-section">
              <div className="shopify-metrics-grid">
                <div className="shopify-metric-item">
                  <span className="shopify-metric-label">Lifetime spend</span>
                  <span className="shopify-metric-val">₹{lifetimeSpend.toLocaleString("en-IN")}</span>
                </div>

                <div className="shopify-metric-item">
                  <span className="shopify-metric-label">Total stays</span>
                  <span className="shopify-metric-val">{staysCount}</span>
                </div>

                <div className="shopify-metric-item">
                  <span className="shopify-metric-label">Average stay</span>
                  <span className="shopify-metric-val">₹{averageSpend.toLocaleString("en-IN")}</span>
                </div>

                <div className="shopify-metric-item">
                  <span className="shopify-metric-label">Last arrival</span>
                  <span className="shopify-metric-val" style={{ fontSize: "13px" }}>{lastStayDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Card 3: Tags */}
          <div className="shopify-card">
            <div className="shopify-card-header">
              <h2 className="shopify-card-title">Tags</h2>
            </div>
            <div className="shopify-card-section">
              <div className="shopify-tags-wrap">
                {isReturning && (
                  <span className="polaris-badge polaris-badge-neutral">Repeat customer</span>
                )}
                {hasId && (
                  <span className="polaris-badge polaris-badge-neutral">ID verified</span>
                )}
                <span className="polaris-badge polaris-badge-neutral">Direct booking</span>
                {prof.phone && prof.phone.startsWith("+91") && (
                  <span className="polaris-badge polaris-badge-neutral">Domestic (India)</span>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Card 4: Notes (if any) */}
          {latestNotes && (
            <div className="shopify-card">
              <div className="shopify-card-header">
                <h2 className="shopify-card-title">Recent notes</h2>
              </div>
              <div className="shopify-card-section">
                <div className="shopify-notes-text">{latestNotes}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Minimalist Fullscreen Lightbox */}
      {isLightboxOpen && idDocumentUrl && (
        <div className="shopify-lightbox-modal" onClick={() => setIsLightboxOpen(false)}>
          <div className="shopify-lightbox-bar" onClick={(e) => e.stopPropagation()}>
            <span className="shopify-lightbox-title">
              {prof.name} • {idType || "Identity Document"}
            </span>

            <div className="shopify-lightbox-tools">
              <button
                type="button"
                className="shopify-lightbox-tool-btn"
                onClick={handleZoomIn}
                title="Zoom In"
              >
                <FiZoomIn size={14} />
              </button>
              <button
                type="button"
                className="shopify-lightbox-tool-btn"
                onClick={handleZoomOut}
                title="Zoom Out"
              >
                <FiZoomOut size={14} />
              </button>
              <button
                type="button"
                className="shopify-lightbox-tool-btn"
                onClick={handleRotate}
                title="Rotate 90°"
              >
                <FiRotateCw size={14} />
              </button>
              <button
                type="button"
                className="shopify-lightbox-tool-btn"
                onClick={handleResetZoom}
                title="Reset zoom"
                style={{ fontSize: "11px", fontWeight: 600, width: "auto", padding: "0 8px" }}
              >
                100%
              </button>
              <a
                href={idDocumentUrl}
                download={`ID_${prof.name || "Guest"}.jpg`}
                className="shopify-lightbox-tool-btn"
                title="Download"
              >
                <FiDownload size={14} />
              </a>
              <button
                type="button"
                className="shopify-lightbox-tool-btn"
                onClick={() => setIsLightboxOpen(false)}
                title="Close (Esc)"
              >
                <FiX size={16} />
              </button>
            </div>
          </div>

          <div className="shopify-lightbox-stage" onClick={() => setIsLightboxOpen(false)}>
            <img
              src={idDocumentUrl}
              alt="Document Fullscreen"
              className="shopify-lightbox-img"
              style={{
                transform: `scale(${zoomLevel}) rotate(${rotation}deg)`
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
