import React, { useState } from "react";
import { FiX, FiCheckCircle, FiAlertCircle, FiCalendar, FiSend } from "react-icons/fi";
import { API_BASE_URL } from "../../../config/api";
import "./BookDemoModal.css";

const PROPERTY_TYPES = [
  "Homestay",
  "Villa",
  "Hotel",
  "Vacation Rental",
  "Resort",
  "Other",
];

const CONTACT_METHODS = [
  { id: "WhatsApp", label: "WhatsApp" },
  { id: "Phone", label: "Phone Call" },
  { id: "Email", label: "Email" },
];

const INITIAL_FORM = {
  fullName: "",
  businessName: "",
  email: "",
  phone: "",
  propertyCount: 1,
  propertyType: "Homestay",
  city: "",
  state: "",
  preferredContactMethod: "WhatsApp",
  message: "",
};

const BookDemoModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "propertyCount" ? Math.max(1, parseInt(value) || 1) : value,
    }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client-side validations
    if (!formData.fullName.trim()) return setErrorMsg("Full name is required.");
    if (!formData.businessName.trim()) return setErrorMsg("Business or property name is required.");
    if (!formData.email.trim() || !formData.email.includes("@")) return setErrorMsg("Please provide a valid email address.");
    if (!formData.phone.trim() || formData.phone.trim().length < 7) return setErrorMsg("Please provide a valid phone number.");
    if (!formData.city.trim()) return setErrorMsg("City is required.");
    if (!formData.state.trim()) return setErrorMsg("State is required.");

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/public/demo-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || `Failed to submit request (${response.status})`);
      }

      setIsSuccess(true);
    } catch (err) {
      setErrorMsg(err.message || "Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setErrorMsg(null);
    setFormData(INITIAL_FORM);
    onClose();
  };

  return (
    <div className="bdm-overlay" onClick={handleResetAndClose}>
      <div
        className="bdm-container"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bdm-title"
      >
        <button
          type="button"
          className="bdm-close-btn"
          onClick={handleResetAndClose}
          aria-label="Close modal"
        >
          <FiX size={18} />
        </button>

        {isSuccess ? (
          <div className="bdm-success-view">
            <div className="bdm-success-icon">
              <FiCheckCircle size={44} />
            </div>
            <h2 className="bdm-success-title">Demo Request Received!</h2>
            <p className="bdm-success-msg">
              Thank you for your interest in StayOps! Your demo request has been received. Our team will contact you soon.
            </p>
            <button
              type="button"
              className="bdm-btn-done"
              onClick={handleResetAndClose}
            >
              Done
            </button>
          </div>
        ) : (
          <form className="bdm-form" onSubmit={handleSubmit}>
            <div className="bdm-header">
              <div className="bdm-badge">
                <FiCalendar size={13} />
                <span>EXPERIENCE STAYOPS</span>
              </div>
              <h2 id="bdm-title" className="bdm-title">
                Schedule a Product Demo
              </h2>
              <p className="bdm-subtitle">
                See how StayOps streamlines multi-calendar sync, direct reservations, guest messaging, and operations for your properties.
              </p>
            </div>

            {errorMsg && (
              <div className="bdm-error-banner" role="alert">
                <FiAlertCircle size={16} className="bdm-error-icon" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="bdm-fields-grid">
              {/* Full Name */}
              <div className="bdm-field">
                <label htmlFor="fullName">Full Name *</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  placeholder="e.g. Vikram Patil"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Business Name */}
              <div className="bdm-field">
                <label htmlFor="businessName">Property / Business Name *</label>
                <input
                  id="businessName"
                  name="businessName"
                  type="text"
                  placeholder="e.g. Serene Peak Homestays"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email */}
              <div className="bdm-field">
                <label htmlFor="email">Email Address *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="vikram@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Phone */}
              <div className="bdm-field">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Property Count */}
              <div className="bdm-field">
                <label htmlFor="propertyCount">Number of Properties *</label>
                <input
                  id="propertyCount"
                  name="propertyCount"
                  type="number"
                  min="1"
                  max="500"
                  value={formData.propertyCount}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Property Type */}
              <div className="bdm-field">
                <label htmlFor="propertyType">Primary Property Type *</label>
                <select
                  id="propertyType"
                  name="propertyType"
                  value={formData.propertyType}
                  onChange={handleChange}
                  required
                >
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div className="bdm-field">
                <label htmlFor="city">City / District *</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  placeholder="e.g. Chikmagaluru"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* State */}
              <div className="bdm-field">
                <label htmlFor="state">State *</label>
                <input
                  id="state"
                  name="state"
                  type="text"
                  placeholder="e.g. Karnataka"
                  value={formData.state}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Preferred Contact Method */}
            <div className="bdm-field bdm-field--full">
              <label>Preferred Contact Method</label>
              <div className="bdm-radio-group">
                {CONTACT_METHODS.map((m) => (
                  <label key={m.id} className="bdm-radio-pill">
                    <input
                      type="radio"
                      name="preferredContactMethod"
                      value={m.id}
                      checked={formData.preferredContactMethod === m.id}
                      onChange={handleChange}
                    />
                    <span>{m.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="bdm-field bdm-field--full">
              <label htmlFor="message">Message / Specific Requirements (Optional)</label>
              <textarea
                id="message"
                name="message"
                rows="3"
                placeholder="Tell us about your property, current booking channels, or questions..."
                value={formData.message}
                onChange={handleChange}
              />
            </div>

            {/* Privacy notice */}
            <p className="bdm-privacy-note">
              By submitting this form, you agree that your contact information will be used to respond to your inquiry and arrange a product demonstration. We respect your privacy and never sell your data.
            </p>

            {/* Action buttons */}
            <div className="bdm-actions">
              <button
                type="button"
                className="bdm-btn-cancel"
                onClick={handleResetAndClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bdm-btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="bdm-spinner" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <FiSend size={14} />
                    <span>Book Your Demo</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BookDemoModal;
