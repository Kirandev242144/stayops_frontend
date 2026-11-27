import React, { useState } from "react";
import { FiEye, FiEyeOff, FiArrowRight } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";

const StepAccountCredentials = ({
  formData,
  updateField,
  onNext,
  errors,
  t,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleQuickFill = () => {
    updateField("name", "Arjun Roy");
    updateField("email", "arjun.roy@stayops.test");
    if (!formData.password) updateField("password", "StayOpsSecure2026!");
    if (!formData.phone) updateField("phone", "+91 98765 43210");
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="onboarding-step-view">
      <div className="onboarding-step-header">
        <span className="onboarding-step-kicker">{t?.kicker || "STEP 1 OF 3"}</span>
        <h1 className="onboarding-step-title">{t?.title || "Create your StayOps account"}</h1>
        <p className="onboarding-step-desc">
          {t?.desc || "Start your 14-day free trial. Full access to property management, calendar sync, and WhatsApp booking."}
        </p>
      </div>

      {/* Google SSO Quick Option */}
      <button
        type="button"
        className="onboarding-google-btn"
        onClick={handleGoogleQuickFill}
      >
        <FcGoogle size={20} />
        <span>{t?.googleBtn || "Continue with Google"}</span>
      </button>

      <div className="onboarding-divider">
        <span>{t?.orEmail || "or register with email"}</span>
      </div>

      <form onSubmit={handleFormSubmit} noValidate className="onboarding-fields-container">
        {/* Full Name */}
        <div className="onboarding-input-group">
          <label htmlFor="name" className="onboarding-field-label">
            {t?.fullName || "Full name"} <span className="onboarding-req">*</span>
          </label>
          <input
            id="name"
            type="text"
            className={`onboarding-text-input ${
              errors?.name ? "onboarding-text-input--error" : ""
            }`}
            placeholder={t?.fullNamePlaceholder || "e.g. Vikramaditya Roy"}
            value={formData.name}
            onChange={(e) => updateField("name", e.target.value)}
            autoComplete="name"
            autoFocus
          />
          {errors?.name && (
            <span className="onboarding-error-text">{errors.name}</span>
          )}
        </div>

        {/* Work Email */}
        <div className="onboarding-input-group">
          <label htmlFor="email" className="onboarding-field-label">
            {t?.email || "Work or personal email"} <span className="onboarding-req">*</span>
          </label>
          <input
            id="email"
            type="email"
            className={`onboarding-text-input ${
              errors?.email ? "onboarding-text-input--error" : ""
            }`}
            placeholder={t?.emailPlaceholder || "vikram@heritagehaveli.com"}
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
            autoComplete="email"
          />
          {errors?.email && (
            <span className="onboarding-error-text">{errors.email}</span>
          )}
        </div>

        {/* Password */}
        <div className="onboarding-input-group">
          <label htmlFor="password" className="onboarding-field-label">
            {t?.password || "Create password"} <span className="onboarding-req">*</span>
          </label>
          <div className="onboarding-input-wrapper">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              className={`onboarding-text-input ${
                errors?.password ? "onboarding-text-input--error" : ""
              }`}
              placeholder={t?.passwordPlaceholder || "At least 8 characters"}
              value={formData.password}
              onChange={(e) => updateField("password", e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="onboarding-toggle-pw"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password view"
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
          {errors?.password && (
            <span className="onboarding-error-text">{errors.password}</span>
          )}
        </div>

        {/* WhatsApp Mobile Number (Optional) */}
        <div className="onboarding-input-group">
          <label htmlFor="phone" className="onboarding-field-label">
            {t?.phone || "WhatsApp mobile number"}{" "}
            <span className="onboarding-optional">{t?.optional || "(optional)"}</span>
          </label>
          <input
            id="phone"
            type="tel"
            className="onboarding-text-input"
            placeholder={t?.phonePlaceholder || "+91 98765 43210"}
            value={formData.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            autoComplete="tel"
          />
          <span className="onboarding-field-hint">
            {t?.phoneHint || "Used for WhatsApp direct booking bot alerts and caretaker check-in notifications."}
          </span>
        </div>

        {/* Bottom Nav Bar */}
        <div className="onboarding-bottom-bar">
          <div className="onboarding-bar-left">
            <span className="onboarding-trial-guarantee">
              {t?.trialGuarantee || "14-day free trial · No credit card required"}
            </span>
          </div>
          <div className="onboarding-bar-right">
            <button
              type="submit"
              className="onboarding-btn-primary"
            >
              <span>{t?.continueBtn || "Continue"}</span>
              <FiArrowRight size={16} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StepAccountCredentials;
