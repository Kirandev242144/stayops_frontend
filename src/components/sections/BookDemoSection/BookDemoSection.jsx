import React, { useState } from "react";
import {
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiSend,
  FiMessageSquare,
  FiShield,
  FiClock,
} from "react-icons/fi";
import Container from "../../common/Container/Container";
import { API_BASE_URL } from "../../../config/api";
import "./BookDemoSection.css";

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

const BookDemoSection = () => {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

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

    // Validations
    if (!formData.fullName.trim()) return setErrorMsg("Full name is required.");
    if (!formData.businessName.trim()) return setErrorMsg("Business or property name is required.");
    if (!formData.email.trim() || !formData.email.includes("@"))
      return setErrorMsg("Please provide a valid email address.");
    if (!formData.phone.trim() || formData.phone.trim().length < 7)
      return setErrorMsg("Please provide a valid phone number.");
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

  const handleReset = () => {
    setIsSuccess(false);
    setErrorMsg(null);
    setFormData(INITIAL_FORM);
  };

  return (
    <section id="book-demo" className="demo-section">
      <Container>
        <div className="demo-section-wrapper">
          {/* Left Column: Info & Value Props */}
          <div className="demo-info-col">
            <div className="demo-badge">
              <FiCalendar size={13} />
              <span>EXPERIENCE STAYOPS</span>
            </div>

            <h2 className="demo-main-title">
              Schedule a Live <br />
              <span className="demo-title-gradient">Product Demo</span>
            </h2>

            <p className="demo-main-subtitle">
              See firsthand how StayOps eliminates OTA commission leakage, automates caretaker operations, and empowers your property with instant WhatsApp direct bookings.
            </p>

            <div className="demo-perks-list">
              <div className="demo-perk-item">
                <div className="demo-perk-icon-box">
                  <FiClock size={18} />
                </div>
                <div className="demo-perk-content">
                  <h4>20-Minute Tailored Walkthrough</h4>
                  <p>Focused strictly on your property type, room count, and current channel challenges.</p>
                </div>
              </div>

              <div className="demo-perk-item">
                <div className="demo-perk-icon-box">
                  <FiMessageSquare size={18} />
                </div>
                <div className="demo-perk-content">
                  <h4>Live WhatsApp Storefront Test</h4>
                  <p>Experience how your future guests will book directly and pay via UPI AutoPay in under 60 seconds.</p>
                </div>
              </div>

              <div className="demo-perk-item">
                <div className="demo-perk-icon-box">
                  <FiShield size={18} />
                </div>
                <div className="demo-perk-content">
                  <h4>Zero Pressure &amp; 14-Day Free Access</h4>
                  <p>No credit card required. Receive immediate trial credentials to test with your actual ground staff.</p>
                </div>
              </div>
            </div>

            <div className="demo-trust-indicator">
              <div className="demo-trust-avatars">
                <img src="https://i.pravatar.cc/40?img=11" alt="Host" />
                <img src="https://i.pravatar.cc/40?img=12" alt="Host" />
                <img src="https://i.pravatar.cc/40?img=13" alt="Host" />
                <img src="https://i.pravatar.cc/40?img=14" alt="Host" />
              </div>
              <span className="demo-trust-text">
                Trusted by <strong>250+ homestays &amp; luxury villas</strong> across Coorg, Goa, Ooty, and Udaipur.
              </span>
            </div>
          </div>

          {/* Right Column: Demo Form Card */}
          <div className="demo-form-col">
            <div className="demo-form-card">
              {isSuccess ? (
                <div className="demo-success-view">
                  <div className="demo-success-icon">
                    <FiCheckCircle size={46} />
                  </div>
                  <h3 className="demo-success-title">Demo Request Received!</h3>
                  <p className="demo-success-msg">
                    Thank you for your interest in StayOps, <strong>{formData.fullName}</strong>! Our product specialist will reach out to you via <strong>{formData.preferredContactMethod}</strong> shortly to schedule your demo session.
                  </p>
                  <button
                    type="button"
                    className="demo-btn-reset"
                    onClick={handleReset}
                  >
                    Submit Another Request
                  </button>
                </div>
              ) : (
                <form className="demo-form" onSubmit={handleSubmit} noValidate>
                  <div className="demo-form-header">
                    <h3 className="demo-card-heading">Tell us about your property</h3>
                    <p className="demo-card-sub">
                      Fill out the form below and our team will get in touch to set up your customized demo.
                    </p>
                  </div>

                  {errorMsg && (
                    <div className="demo-error-banner" role="alert">
                      <FiAlertCircle size={16} className="demo-error-icon" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="demo-fields-grid">
                    {/* Full Name */}
                    <div className="demo-field">
                      <label htmlFor="demo-fullName">Full Name *</label>
                      <input
                        id="demo-fullName"
                        name="fullName"
                        type="text"
                        placeholder="e.g. Vikram Patil"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Business / Property Name */}
                    <div className="demo-field">
                      <label htmlFor="demo-businessName">Property / Business Name *</label>
                      <input
                        id="demo-businessName"
                        name="businessName"
                        type="text"
                        placeholder="e.g. Serene Peak Homestays"
                        value={formData.businessName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Email */}
                    <div className="demo-field">
                      <label htmlFor="demo-email">Email Address *</label>
                      <input
                        id="demo-email"
                        name="email"
                        type="email"
                        placeholder="vikram@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="demo-field">
                      <label htmlFor="demo-phone">Phone Number *</label>
                      <input
                        id="demo-phone"
                        name="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Number of Properties */}
                    <div className="demo-field">
                      <label htmlFor="demo-propertyCount">Number of Properties *</label>
                      <input
                        id="demo-propertyCount"
                        name="propertyCount"
                        type="number"
                        min="1"
                        max="50"
                        value={formData.propertyCount}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* Property Type */}
                    <div className="demo-field">
                      <label htmlFor="demo-propertyType">Primary Property Type *</label>
                      <select
                        id="demo-propertyType"
                        name="propertyType"
                        value={formData.propertyType}
                        onChange={handleChange}
                      >
                        {PROPERTY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* City / District */}
                    <div className="demo-field">
                      <label htmlFor="demo-city">City / District *</label>
                      <input
                        id="demo-city"
                        name="city"
                        type="text"
                        placeholder="e.g. Chikmagaluru"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    {/* State */}
                    <div className="demo-field">
                      <label htmlFor="demo-state">State *</label>
                      <input
                        id="demo-state"
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
                  <div className="demo-field demo-field--full">
                    <label>Preferred Contact Method</label>
                    <div className="demo-radio-group">
                      {CONTACT_METHODS.map((method) => {
                        const isChecked = formData.preferredContactMethod === method.id;
                        return (
                          <label
                            key={method.id}
                            className={`demo-radio-label ${
                              isChecked ? "demo-radio-label--active" : ""
                            }`}
                          >
                            <input
                              type="radio"
                              name="preferredContactMethod"
                              value={method.id}
                              checked={isChecked}
                              onChange={handleChange}
                            />
                            <span>{method.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="demo-field demo-field--full">
                    <label htmlFor="demo-message">Message / Specific Requirements (Optional)</label>
                    <textarea
                      id="demo-message"
                      name="message"
                      rows="3"
                      placeholder="Tell us about your property, current booking channels, or questions..."
                      value={formData.message}
                      onChange={handleChange}
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="demo-btn-submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="demo-btn-loading">
                        <span className="demo-spinner" />
                        <span>Submitting Request...</span>
                      </span>
                    ) : (
                      <>
                        <FiSend size={15} />
                        <span>Request Product Demo</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

export default BookDemoSection;
