import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { FiGlobe, FiChevronDown, FiCheck } from "react-icons/fi";
import logoImg from "../../../assets/logo/stayops-logo.png";
import { SUPPORTED_LANGUAGES } from "../translations/signupTranslations";

const OnboardingNav = ({
  step,
  totalSteps = 3,
  currentLang = "en",
  onLanguageChange,
  t,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeLangObj =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLang) ||
    SUPPORTED_LANGUAGES[0];

  const stepText = (t?.stepOf || "Step {current} of {total}")
    .replace("{current}", step)
    .replace("{total}", totalSteps);

  return (
    <header className="onboarding-top-nav">
      <div className="onboarding-nav-container">
        {/* Brand Mark */}
        <Link to="/" className="onboarding-brand-mark" title="StayOps">
          <img src={logoImg} alt="StayOps" className="onboarding-brand-logo" />
            
        </Link>

        {/* Progress Tracker */}
        {step <= totalSteps && (
          <div className="onboarding-nav-progress">
            <span className="onboarding-step-counter">{stepText}</span>
            <div className="onboarding-progress-track">
              <div
                className="onboarding-progress-fill"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Right Actions: Language Selector + Sign In */}
        <div className="onboarding-nav-actions">
          {/* Language Selector Dropdown */}
          <div className="onboarding-lang-menu" ref={dropdownRef}>
            <button
              type="button"
              className="onboarding-lang-btn"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-label="Change language"
              title="Select Language / ಭಾಷೆ / மொழி / भाषा"
            >
              <FiGlobe size={14} className="onboarding-lang-globe" />
              <span className="onboarding-lang-name">
                {activeLangObj.nativeName}
              </span>
              <FiChevronDown
                size={12}
                className={`onboarding-lang-chevron ${
                  dropdownOpen ? "onboarding-lang-chevron--open" : ""
                }`}
              />
            </button>

            {dropdownOpen && (
              <div className="onboarding-lang-dropdown">
                {SUPPORTED_LANGUAGES.map((lang) => {
                  const isSelected = lang.code === currentLang;
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      className={`onboarding-lang-option ${
                        isSelected ? "onboarding-lang-option--selected" : ""
                      }`}
                      onClick={() => {
                        onLanguageChange(lang.code);
                        setDropdownOpen(false);
                      }}
                    >
                      <div className="onboarding-lang-option-text">
                        <span className="onboarding-lang-native">
                          {lang.nativeName}
                        </span>
                        <span className="onboarding-lang-english">
                          {lang.label}
                        </span>
                      </div>
                      {isSelected && (
                        <FiCheck size={14} className="onboarding-lang-check" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="onboarding-nav-divider" />

          {/* Sign In Link */}
          <span className="onboarding-nav-signin-prompt">
            {t?.alreadyHost || "Already a host?"}
          </span>
          <Link to="/login" className="onboarding-nav-signin-link">
            {t?.signIn || "Sign in"}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default OnboardingNav;
