import React from "react";
import { FiHome, FiMapPin, FiArrowLeft, FiArrowRight } from "react-icons/fi";

const CATEGORY_KEYS = ["Homestay", "Villa", "Farmstay", "Resort"];

const StepPropertyDetails = ({ formData, updateField, onBack, onNext, errors, t }) => {
  return (
    <div className="onboarding-step-view">
      <div className="onboarding-step-header">
        <span className="onboarding-step-kicker">{t?.kicker || "STEP 2 OF 3"}</span>
        <h1 className="onboarding-step-title">{t?.title || "Let's set up your first property"}</h1>
        <p className="onboarding-step-desc">
          {t?.desc || "Add a few basic details to get your StayOps workspace ready. You can update these details later."}
        </p>
      </div>

      <div className="onboarding-fields-container">
        {/* Property Name */}
        <div className="onboarding-input-group">
          <label htmlFor="propertyName" className="onboarding-field-label">
            {t?.propertyName || "Property name"} <span className="onboarding-req">*</span>
          </label>
          <div className="onboarding-input-wrapper">
            <FiHome className="onboarding-input-icon" size={18} />
            <input
              id="propertyName"
              type="text"
              className={`onboarding-text-input ${
                errors?.propertyName ? "onboarding-text-input--error" : ""
              }`}
              placeholder={t?.propertyNamePlaceholder || "e.g. Sri Nature Villa"}
              value={formData.propertyName}
              onChange={(e) => updateField("propertyName", e.target.value)}
              autoFocus
            />
          </div>
          {errors?.propertyName ? (
            <span className="onboarding-error-text">{errors.propertyName}</span>
          ) : (
            <span className="onboarding-field-hint">
              {t?.propertyNameHint || "This name can appear on your storefront and guest documents. You can change it before publishing."}
            </span>
          )}
        </div>

        {/* Property Category Chips */}
        <div className="onboarding-input-group">
          <label className="onboarding-field-label">{t?.propertyType || "Property type"}</label>
          <div className="onboarding-category-pills">
            {CATEGORY_KEYS.map((catKey) => {
              const isSelected = (formData.propertyType || "Homestay") === catKey;
              const label = t?.categories?.[catKey] || catKey;
              return (
                <button
                  key={catKey}
                  type="button"
                  className={`onboarding-category-pill ${
                    isSelected ? "onboarding-category-pill--active" : ""
                  }`}
                  onClick={() => updateField("propertyType", catKey)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* City and State */}
        <div className="onboarding-input-group">
          <label htmlFor="city" className="onboarding-field-label">
            {t?.city || "City and state"} <span className="onboarding-req">*</span>
          </label>
          <div className="onboarding-input-wrapper">
            <FiMapPin className="onboarding-input-icon" size={18} />
            <input
              id="city"
              type="text"
              className={`onboarding-text-input ${
                errors?.city ? "onboarding-text-input--error" : ""
              }`}
              placeholder={t?.cityPlaceholder || "e.g. Coorg, Karnataka"}
              value={formData.city}
              onChange={(e) => updateField("city", e.target.value)}
            />
          </div>
          {errors?.city ? (
            <span className="onboarding-error-text">{errors.city}</span>
          ) : (
            <span className="onboarding-field-hint">
              {t?.cityHint || "Used for your property profile and location settings. You can configure your tax details later."}
            </span>
          )}
        </div>

        {/* Room Capacity: 1-3 vs 4+ */}
        <div className="onboarding-input-group">
          <label className="onboarding-field-label">
            {t?.roomsQuestion || "How many rooms or units does this property have?"}
          </label>
          <div className="onboarding-capacity-cards">
            <button
              type="button"
              className={`onboarding-capacity-card ${
                formData.roomsCount <= 3 ? "onboarding-capacity-card--active" : ""
              }`}
              onClick={() => updateField("roomsCount", 3)}
            >
              <span className="onboarding-cap-num">{t?.rooms13 || "1 – 3"}</span>
              <span className="onboarding-cap-sub">{t?.roomsOrUnits || "Rooms or units"}</span>
            </button>
            <button
              type="button"
              className={`onboarding-capacity-card ${
                formData.roomsCount > 3 ? "onboarding-capacity-card--active" : ""
              }`}
              onClick={() => updateField("roomsCount", 6)}
            >
              <span className="onboarding-cap-num">{t?.rooms4plus || "4+"}</span>
              <span className="onboarding-cap-sub">{t?.roomsOrUnits || "Rooms or units"}</span>
            </button>
          </div>
          <span className="onboarding-field-hint">
            {t?.roomsHint || "Not sure yet? You can configure your inventory later."}
          </span>
        </div>
      </div>

      {/* Bottom Nav Bar */}
      <div className="onboarding-bottom-bar">
        <div className="onboarding-bar-left">
          <button
            type="button"
            className="onboarding-btn-secondary"
            onClick={onBack}
          >
            <FiArrowLeft size={16} />
            <span>{t?.backBtn || "Back"}</span>
          </button>
        </div>
        <div className="onboarding-bar-right">
          <button
            type="button"
            className="onboarding-btn-primary"
            onClick={onNext}
          >
            <span>{t?.continueBtn || "Continue"}</span>
            <FiArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepPropertyDetails;
