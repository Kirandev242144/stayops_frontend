import React, { useState } from "react";
import AdminModal from "../../../components/common/AdminModal";
import { FiClock, FiFileText } from "react-icons/fi";
import "./Modals.css";

const AddFollowUpModal = ({ isOpen, onClose, lead, onConfirm }) => {
  const [followUpDate, setFollowUpDate] = useState(() => {
    // Default 3 days from now at 11:00
    const d = new Date();
    d.setDate(d.getDate() + 3);
    d.setHours(11, 0, 0, 0);
    return d.toISOString().slice(0, 16);
  });
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!lead) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!followUpDate) return;

    setIsSubmitting(true);
    try {
      await onConfirm({
        nextFollowUpAt: followUpDate,
        note: note.trim() || null,
      });
      onClose();
    } catch (err) {
      // Handled by caller
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Follow-up"
      subtitle={`Set a reminder to follow up with ${lead.fullName}`}
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
            disabled={isSubmitting || !followUpDate}
          >
            {isSubmitting ? "Saving..." : "Save Follow-up Reminder"}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="lead-modal-form">
        <div className="lead-form-group">
          <label htmlFor="followUpDate">
            <FiClock size={13} />
            <span>Follow-up Date & Time *</span>
          </label>
          <input
            id="followUpDate"
            type="datetime-local"
            value={followUpDate}
            onChange={(e) => setFollowUpDate(e.target.value)}
            required
            className="lead-input"
          />
        </div>

        <div className="lead-form-group">
          <label htmlFor="followUpNote">
            <FiFileText size={13} />
            <span>Follow-up Objective / Context</span>
          </label>
          <textarea
            id="followUpNote"
            rows="3"
            placeholder="e.g. Call to discuss post-demo pricing and custom villa setup requirements..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="lead-input lead-textarea"
          />
        </div>
      </form>
    </AdminModal>
  );
};

export default AddFollowUpModal;
