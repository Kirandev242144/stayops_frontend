import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../config/api";
import OnboardingNav from "./components/OnboardingNav";
import StepAccountCredentials from "./components/StepAccountCredentials";
import StepPropertyDetails from "./components/StepPropertyDetails";
import StepPlanSelection from "./components/StepPlanSelection";
import StepLaunching from "./components/StepLaunching";
import { translations, SUPPORTED_LANGUAGES } from "./translations/signupTranslations";
import "./Signup.css";

const TOTAL_STEPS = 3;

const Signup = () => {
  const navigate = useNavigate();

  // Language state (persisted in localStorage)
  const [currentLang, setCurrentLang] = useState(() => {
    return localStorage.getItem("stayops_lang") || "en";
  });

  const handleLanguageChange = (langCode) => {
    setCurrentLang(langCode);
    localStorage.setItem("stayops_lang", langCode);
  };

  const t = translations[currentLang] || translations.en;

  // Step 1: Account | Step 2: First Property | Step 3: Plan | Step 4: Launching
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    propertyName: "",
    propertyType: "Homestay",
    city: "",
    roomsCount: 3, // Default to 1-3 rooms
    plan: "pro",
    billingCycle: "monthly",
  });

  const [errors, setErrors] = useState({});

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleNextFromAccount = () => {
    const errs = {};
    if (!formData.name?.trim()) {
      errs.name = t.step1?.errName || "Enter your full name";
    }
    if (!formData.email?.trim()) {
      errs.email = t.step1?.errEmail || "Enter your email address";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = t.step1?.errEmailInvalid || "Enter a valid email address";
    }
    if (!formData.password) {
      errs.password = t.step1?.errPassword || "Create a password";
    } else if (formData.password.length < 8) {
      errs.password = t.step1?.errPasswordShort || "Password must be at least 8 characters";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNextFromProperty = () => {
    const errs = {};
    if (!formData.propertyName?.trim()) {
      errs.propertyName = t.step2?.errPropertyName || "Please enter your property name.";
    }
    if (!formData.city?.trim()) {
      errs.city = t.step2?.errCity || "Please enter the city and state.";
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setErrors({});
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFinalSubmit = async (e) => {
    if (e) e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        phone: formData.phone?.trim() || null,
        propertyName: formData.propertyName.trim(),
        propertyType: formData.propertyType || "Homestay",
        roomsCount: Number(formData.roomsCount) || 3,
        city: formData.city.trim() || "India",
        plan: formData.plan || (formData.roomsCount > 3 ? "pro" : "lite"),
      };

      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Accept-Language": currentLang,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create your StayOps account.");
      }

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      const activeUser = {
        id: data.id,
        name: data.name || formData.name,
        email: data.email || formData.email,
        phone: formData.phone || null,
        role: "Owner",
        plan: data.plan || formData.plan || "pro",
        trialDaysLeft: data.trialDaysLeft || 14,
        status: "Active",
        primaryPropertyId: data.propertyId,
        primaryPropertyName: data.propertyName || formData.propertyName,
        preferredLanguage: currentLang,
      };

      localStorage.setItem("user", JSON.stringify(activeUser));

      setStep(4); // Show Launching screen
      setTimeout(() => {
        toast.success(`Welcome to StayOps, ${activeUser.name}!`);
        navigate("/dashboard");
      }, 1600);
    } catch (err) {
      toast.error(err.message || "An unexpected error occurred during signup.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="onboarding-shell">
      {/* Top Navigation with Language Selector */}
      <OnboardingNav
        step={step}
        totalSteps={TOTAL_STEPS}
        currentLang={currentLang}
        onLanguageChange={handleLanguageChange}
        t={t.nav}
      />

      {/* Main Workspace Canvas */}
      <main className="onboarding-main-canvas">
        <div className={`onboarding-content-box ${step === 3 ? "onboarding-content-box--wide" : ""}`}>
          {step === 1 && (
            <StepAccountCredentials
              formData={formData}
              updateField={updateField}
              onNext={handleNextFromAccount}
              errors={errors}
              t={t.step1}
            />
          )}

          {step === 2 && (
            <StepPropertyDetails
              formData={formData}
              updateField={updateField}
              onBack={handleBack}
              onNext={handleNextFromProperty}
              errors={errors}
              t={t.step2}
            />
          )}

          {step === 3 && (
            <StepPlanSelection
              formData={formData}
              updateField={updateField}
              onBack={handleBack}
              onSubmit={handleFinalSubmit}
              isSubmitting={isSubmitting}
              t={t.step3}
            />
          )}

          {step === 4 && (
            <StepLaunching
              propertyName={formData.propertyName}
              t={t.step4}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default Signup;