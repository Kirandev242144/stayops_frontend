import React, { useState, useEffect, useCallback } from "react";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiChevronDown,
  FiCalendar,
  FiClock,
  FiZap,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiHome,
  FiMessageSquare,
  FiAlertTriangle,
  FiSend,
  FiCheck,
  FiSlash,
  FiCheckCircle,
} from "react-icons/fi";
import AdminBadge from "../../components/common/AdminBadge";
import ScheduleDemoModal from "./components/ScheduleDemoModal";
import AddFollowUpModal from "./components/AddFollowUpModal";
import ConvertLeadModal from "./components/ConvertLeadModal";
import {
  fetchAdminLeadDetail,
  updateLeadStatus,
  scheduleLeadDemo,
  scheduleLeadFollowUp,
  addLeadNote,
  convertLeadToTenant,
} from "./services/adminLeadsApi";
import { toast } from "react-toastify";
import "./LeadDetails.css";

const LeadDetails = ({ leadId, onBack, onNavigateToTenant }) => {
  const [lead, setLead] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  // New Note state
  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Modals state
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);

  const loadDetail = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoading(true);
      setFetchError(null);
      const data = await fetchAdminLeadDetail(leadId);
      setLead(data);
    } catch (err) {
      setFetchError(err.message || "Failed to load lead details.");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Close actions dropdown on outside click
  useEffect(() => {
    if (!actionsOpen) return;
    const close = () => setActionsOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [actionsOpen]);

  // Actions
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setIsAddingNote(true);
    try {
      await addLeadNote(lead.id, { note: newNote.trim() });
      setNewNote("");
      toast.success("Internal note added.");
      loadDetail(true);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsAddingNote(false);
    }
  };

  const handleStatusChange = async (nextStatus) => {
    try {
      await updateLeadStatus(lead.id, { status: nextStatus });
      toast.success(`Status updated to ${nextStatus}.`);
      loadDetail(true);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleConfirmDemo = async (payload) => {
    try {
      await scheduleLeadDemo(lead.id, payload);
      toast.success("Demo scheduled successfully!");
      loadDetail(true);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleConfirmFollowUp = async (payload) => {
    try {
      await scheduleLeadFollowUp(lead.id, payload);
      toast.success("Follow-up reminder set.");
      loadDetail(true);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const handleConfirmConvert = async (payload) => {
    try {
      const converted = await convertLeadToTenant(lead.id, payload);
      toast.success(
        `Lead converted! Tenant account TEN-${String(converted.convertedTenantId).padStart(3, "0")} is active.`
      );
      loadDetail(true);
    } catch (err) {
      toast.error(err.message);
      throw err;
    }
  };

  const renderStatusBadge = (status) => {
    const map = {
      NEW: { status: "trial", label: "New", dot: true },
      CONTACTED: { status: "info", label: "Contacted", dot: false },
      DEMO_SCHEDULED: { status: "pro", label: "Demo Scheduled", dot: true },
      DEMO_COMPLETED: { status: "verified", label: "Demo Completed", dot: false },
      FOLLOW_UP_REQUIRED: { status: "warning", label: "Follow-up Due", dot: true },
      CONVERTED: { status: "active", label: "Converted", dot: true },
      NOT_INTERESTED: { status: "suspended", label: "Not Interested", dot: false },
    };
    const s = map[status] || { status: "lite", label: status, dot: false };
    return <AdminBadge status={s.status} label={s.label} dot={s.dot} />;
  };

  if (isLoading) {
    return (
      <div className="lead-detail-root">
        <div className="lead-detail-topbar">
          <button className="tdp-back-btn" onClick={onBack}>
            <FiArrowLeft size={15} /> Back to Leads
          </button>
        </div>
        <div className="lead-detail-loading">
          <span className="leads-spinner" />
          <p>Loading lead details from database...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !lead) {
    return (
      <div className="lead-detail-root">
        <div className="lead-detail-topbar">
          <button className="tdp-back-btn" onClick={onBack}>
            <FiArrowLeft size={15} /> Back to Leads
          </button>
        </div>
        <div className="admin-db-error-banner">
          <div className="admin-db-error-content">
            <FiAlertTriangle size={16} className="admin-db-error-icon" />
            <div>
              <h4 className="admin-db-error-title">Database Error</h4>
              <p className="admin-db-error-desc">{fetchError}</p>
            </div>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={() => loadDetail(false)}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="lead-detail-root">
      {/* ── Top Bar ── */}
      <div className="lead-detail-topbar">
        <button className="tdp-back-btn" onClick={onBack}>
          <FiArrowLeft size={15} /> Back to Leads
        </button>

        <div className="lead-detail-topbar-actions">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => loadDetail(false)}
            title="Reload from database"
          >
            <FiRefreshCw size={13} />
            <span>Sync</span>
          </button>

          {/* Actions Dropdown */}
          <div className="tdp-actions-wrap" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="admin-btn admin-btn--primary"
              onClick={() => setActionsOpen((o) => !o)}
            >
              <span>Actions</span>
              <FiChevronDown size={13} />
            </button>

            {actionsOpen && (
              <div className="tdp-dropdown">
                <button
                  className="tdp-dropdown-item"
                  onClick={() => {
                    setActionsOpen(false);
                    setIsDemoModalOpen(true);
                  }}
                >
                  <FiCalendar size={13} /> Schedule Demo
                </button>

                <button
                  className="tdp-dropdown-item"
                  onClick={() => {
                    setActionsOpen(false);
                    setIsFollowUpModalOpen(true);
                  }}
                >
                  <FiClock size={13} /> Add Follow-up
                </button>

                {lead.status !== "CONVERTED" && (
                  <button
                    className="tdp-dropdown-item tdp-dropdown-item--convert"
                    onClick={() => {
                      setActionsOpen(false);
                      setIsConvertModalOpen(true);
                    }}
                  >
                    <FiZap size={13} /> Convert to Tenant
                  </button>
                )}

                <div className="tdp-dropdown-divider" />

                {lead.status !== "CONTACTED" && (
                  <button
                    className="tdp-dropdown-item"
                    onClick={() => {
                      setActionsOpen(false);
                      handleStatusChange("CONTACTED");
                    }}
                  >
                    <FiCheck size={13} /> Mark as Contacted
                  </button>
                )}

                {lead.status === "DEMO_SCHEDULED" && (
                  <button
                    className="tdp-dropdown-item"
                    onClick={() => {
                      setActionsOpen(false);
                      handleStatusChange("DEMO_COMPLETED");
                    }}
                  >
                    <FiCheckCircle size={13} /> Mark Demo Completed
                  </button>
                )}

                {lead.status !== "NOT_INTERESTED" && lead.status !== "CONVERTED" && (
                  <button
                    className="tdp-dropdown-item tdp-dropdown-item--danger"
                    onClick={() => {
                      setActionsOpen(false);
                      handleStatusChange("NOT_INTERESTED");
                    }}
                  >
                    <FiSlash size={13} /> Mark Not Interested
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero Strip ── */}
      <div className="lead-hero">
        <div className="lead-hero-left">
          <div className="lead-hero-avatar">
            {lead.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="lead-hero-info">
            <div className="lead-hero-name-row">
              <h1 className="lead-hero-name">{lead.fullName}</h1>
              {renderStatusBadge(lead.status)}
            </div>
            <p className="lead-hero-meta">
              <strong>{lead.businessName}</strong> &middot; {lead.city}, {lead.state}
            </p>
            <p className="lead-hero-sub">
              Lead #{lead.id} &middot; Received {lead.createdAtFormatted} &middot; Via {lead.source}
            </p>
          </div>
        </div>

        {/* Quick Stat Cards */}
        <div className="tdp-stat-cards">
          <div className="tdp-stat-card">
            <span className="tdp-stat-value">{lead.propertyCount}</span>
            <span className="tdp-stat-label">Properties</span>
          </div>
          <div className="tdp-stat-card">
            <span className="tdp-stat-value" style={{ fontSize: "14px" }}>
              {lead.preferredContactMethod || "WhatsApp"}
            </span>
            <span className="tdp-stat-label">Preferred Contact</span>
          </div>
          {lead.convertedTenantId && (
            <div
              className="tdp-stat-card is-converted-card"
              onClick={() => onNavigateToTenant && onNavigateToTenant(lead.convertedTenantId)}
              style={{ cursor: "pointer" }}
              title="Click to view tenant account"
            >
              <span className="tdp-stat-value" style={{ color: "#0E9F6E" }}>
                TEN-{String(lead.convertedTenantId).padStart(3, "0")}
              </span>
              <span className="tdp-stat-label">Tenant Account &rarr;</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Main Layout: 2 Columns ── */}
      <div className="lead-content-grid">
        {/* Left Column: Profile & Demo */}
        <div className="lead-col-main">
          {/* Section A: Profile */}
          <div className="lead-card">
            <h2 className="lead-card-title">
              <FiUser size={15} />
              <span>Lead Profile &amp; Contact Details</span>
            </h2>

            <div className="lead-kv-grid">
              <div className="lead-kv-row">
                <span className="lead-kv-label">Full Name</span>
                <span className="lead-kv-value">{lead.fullName}</span>
              </div>
              <div className="lead-kv-row">
                <span className="lead-kv-label">Business / Property</span>
                <span className="lead-kv-value">{lead.businessName}</span>
              </div>
              <div className="lead-kv-row">
                <span className="lead-kv-label">Email Address</span>
                <span className="lead-kv-value">
                  <a href={`mailto:${lead.email}`} className="lead-link">
                    <FiMail size={12} /> {lead.email}
                  </a>
                </span>
              </div>
              <div className="lead-kv-row">
                <span className="lead-kv-label">Phone Number</span>
                <span className="lead-kv-value">
                  <a href={`tel:${lead.phone}`} className="lead-link">
                    <FiPhone size={12} /> {lead.phone}
                  </a>
                </span>
              </div>
              <div className="lead-kv-row">
                <span className="lead-kv-label">Location</span>
                <span className="lead-kv-value">
                  <FiMapPin size={12} /> {lead.city}, {lead.state}
                </span>
              </div>
              <div className="lead-kv-row">
                <span className="lead-kv-label">Property Type</span>
                <span className="lead-kv-value">
                  <FiHome size={12} /> {lead.propertyType} ({lead.propertyCount} total)
                </span>
              </div>
              <div className="lead-kv-row">
                <span className="lead-kv-label">Preferred Contact</span>
                <span className="lead-kv-value">{lead.preferredContactMethod}</span>
              </div>
              <div className="lead-kv-row">
                <span className="lead-kv-label">Lead Source</span>
                <span className="lead-kv-value">{lead.source}</span>
              </div>
              <div className="lead-kv-row">
                <span className="lead-kv-label">Assigned Admin</span>
                <span className="lead-kv-value">{lead.assignedAdminEmail || "Unassigned"}</span>
              </div>
            </div>

            {/* Enquiry message */}
            {lead.message && (
              <div className="lead-message-box">
                <div className="lead-message-label">
                  <FiMessageSquare size={13} />
                  <span>Visitor Requirements / Enquiry Message</span>
                </div>
                <p className="lead-message-text">{lead.message}</p>
              </div>
            )}
          </div>

          {/* Section B: Demo Management */}
          <div className="lead-card">
            <div className="lead-card-header-row">
              <h2 className="lead-card-title">
                <FiCalendar size={15} />
                <span>Product Demo Management</span>
              </h2>
              <button
                type="button"
                className="admin-btn admin-btn--secondary lead-sm-btn"
                onClick={() => setIsDemoModalOpen(true)}
              >
                {lead.demoScheduledAt ? "Reschedule Demo" : "Schedule Demo"}
              </button>
            </div>

            {lead.demoScheduledAt ? (
              <div className="lead-demo-card">
                <div className="lead-demo-main">
                  <div className="lead-demo-datetime">
                    <FiCalendar size={16} className="lead-demo-icon" />
                    <div>
                      <strong>{lead.demoScheduledAtFormatted}</strong>
                      <span>({lead.demoTimeZone})</span>
                    </div>
                  </div>
                  {lead.demoMeetingUrl && (
                    <div className="lead-demo-link">
                      <a
                        href={lead.demoMeetingUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="lead-link"
                      >
                        Launch Meeting Room &rarr;
                      </a>
                    </div>
                  )}
                </div>

                <div className="lead-demo-actions">
                  {lead.status === "DEMO_SCHEDULED" && (
                    <button
                      type="button"
                      className="admin-btn admin-btn--primary lead-sm-btn"
                      onClick={() => handleStatusChange("DEMO_COMPLETED")}
                    >
                      <FiCheckCircle size={13} />
                      <span>Mark Demo as Completed</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="lead-empty-box">
                <p>No demo is currently scheduled for this lead.</p>
                <button
                  type="button"
                  className="admin-btn admin-btn--primary lead-sm-btn"
                  onClick={() => setIsDemoModalOpen(true)}
                >
                  <FiCalendar size={13} /> Schedule a Demo
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Internal Notes & Activity Timeline */}
        <div className="lead-col-side">
          {/* Section C: Internal Notes */}
          <div className="lead-card">
            <h2 className="lead-card-title">
              <FiMessageSquare size={15} />
              <span>Internal Admin Notes</span>
            </h2>

            {/* Add note input */}
            <form onSubmit={handleAddNote} className="lead-add-note-form">
              <textarea
                rows="2"
                placeholder="Add private note for the sales team..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                className="lead-input lead-textarea"
                required
              />
              <button
                type="submit"
                className="admin-btn admin-btn--primary lead-sm-btn"
                disabled={isAddingNote || !newNote.trim()}
              >
                <FiSend size={12} />
                <span>{isAddingNote ? "Adding..." : "Post Note"}</span>
              </button>
            </form>

            {/* Notes list */}
            <div className="lead-notes-list">
              {!lead.notes || lead.notes.length === 0 ? (
                <p className="lead-td-muted" style={{ padding: "12px 0", margin: 0 }}>
                  No internal notes yet. Use the form above to add notes visible only to admins.
                </p>
              ) : (
                lead.notes.map((note) => (
                  <div key={note.id} className="lead-note-bubble">
                    <p className="lead-note-content">{note.note}</p>
                    <div className="lead-note-meta">
                      <span>{note.authorAdminEmail}</span> &middot;{" "}
                      <span>{note.createdAtFormatted}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section D: Activity Timeline */}
          <div className="lead-card">
            <h2 className="lead-card-title">
              <FiClock size={15} />
              <span>Activity History &amp; Audit Trail</span>
            </h2>

            <div className="lead-timeline">
              {!lead.activity || lead.activity.length === 0 ? (
                <p className="lead-td-muted">No activity events recorded yet.</p>
              ) : (
                lead.activity.map((act) => (
                  <div key={act.id} className="lead-timeline-entry">
                    <div className="lead-timeline-dot" />
                    <div className="lead-timeline-body">
                      <div className="lead-timeline-action">
                        {act.eventType.replace(/_/g, " ")}
                      </div>
                      {act.metadata && (
                        <div className="lead-timeline-detail">{act.metadata}</div>
                      )}
                      <div className="lead-timeline-meta">
                        {act.actorAdminEmail} &middot; {act.createdAtFormatted}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modals ── */}
      <ScheduleDemoModal
        isOpen={isDemoModalOpen}
        onClose={() => setIsDemoModalOpen(false)}
        lead={lead}
        onConfirm={handleConfirmDemo}
      />

      <AddFollowUpModal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        lead={lead}
        onConfirm={handleConfirmFollowUp}
      />

      <ConvertLeadModal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        lead={lead}
        onConfirm={handleConfirmConvert}
      />
    </div>
  );
};

export default LeadDetails;
