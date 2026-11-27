import React, { useState } from "react";
import AdminModal from "../../../components/common/AdminModal";
import { FiCalendar, FiClock, FiLink, FiFileText } from "react-icons/fi";
import "./Modals.css";

const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
];

const ScheduleDemoModal = ({ isOpen, onClose, lead, onConfirm }) => {
  const [demoDate, setDemoDate] = useState(() => {
    // Default tomorrow at 15:00
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(15, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [timeZone, setTimeZone] = useState("Asia/Kolkata");
  const [meetingUrl, setMeetingUrl] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!demoDate) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        demoScheduledAt: demoDate,
        demoTimeZone: timeZone,
        demoMeetingUrl: meetingUrl.trim() || null,
        note: note.trim() || null,
      });
      onClose();
    } catch (err) {
      // Error handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Product Demo"
      subtitle={`Set up a live demonstration for ${lead.fullName} (${lead.businessName})`}
      size="medium"
      footer={
        <>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleSubmit}
            disabled={isSubmitting || !demoDate}
          >
            {isSubmitting ? "Scheduling..." : "Confirm & Schedule Demo"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="lead-modal-form">
        <div className="lead-form-group">
          <label htmlFor="demoDate">
            <FiCalendar size={13} />
            <span>Date & Time *</span>
          </label>
          <input
            id="demoDate"
            type="datetime-local"
            value={demoDate}
            onChange={(e) => setDemoDate(e.target.value)}
            required
            className="lead-input"
          />
        </div>

        <div className="lead-form-group">
          <label htmlFor="timeZone">
            <FiClock size={13} />
            <span>Time Zone</span>
          </label>
          <select
            id="timeZone"
            value={timeZone}
            onChange={(e) => setTimeZone(e.target.value)}
            className="lead-input"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="lead-form-group">
          <label htmlFor="meetingUrl">
            <FiLink size={13} />
            <span>Meeting Link / Platform (e.g. Google Meet, Zoom)</span>
          </label>
          <input
            id="meetingUrl"
            type="url"
            placeholder="https://meet.google.com/abc-defg-hij"
            value={meetingUrl}
            onChange={(e) => setMeetingUrl(e.target.value)}
            className="lead-input"
          />
        </div>

        <div className="lead-form-group">
          <label htmlFor="note">
            <FiFileText size={13} />
            <span>Notes / Demonstration Focus</span>
          </label>
          <textarea
            id="note"
            rows="3"
            placeholder="Key features to highlight: OTA channel manager, automated WhatsApp guest templates, etc."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="lead-input lead-textarea"
          />
        </div>
      </form>
    </AdminModal>
  );
};

export default ScheduleDemoModal;
