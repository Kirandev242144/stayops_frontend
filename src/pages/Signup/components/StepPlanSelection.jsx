import React, { useState, useEffect } from "react";
import { FiCheck, FiArrowLeft, FiArrowRight, FiAlertCircle, FiRefreshCw } from "react-icons/fi";
import { API_BASE_URL } from "../../../config/api";

const StepPlanSelection = ({
  formData,
  updateField,
  onBack,
  onSubmit,
  isSubmitting,
  t,
}) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [billingCycle, setBillingCycle] = useState(formData.billingCycle || "monthly");

  const recommendedPlanKey = formData.roomsCount > 3 ? "pro" : formData.plan || "pro";
  const selectedPlanKey = (formData.plan || recommendedPlanKey).toLowerCase();

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/platform/subscriptions/plans`);
      if (!res.ok) {
        throw new Error(`Failed to load plans from server (HTTP ${res.status})`);
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setPlans(data);
      } else {
        throw new Error("No subscription plans found in the database.");
      }
    } catch (err) {
      console.error("Error fetching plans from DB:", err);
      setError(err.message || "Could not connect to plans service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
    if (formData.roomsCount > 3 && formData.plan === "lite") {
      updateField("plan", "pro");
    }
  }, []);

  const handleSelectPlan = (planKey) => {
    updateField("plan", planKey);
    updateField("billingCycle", billingCycle);
  };

  const handleBillingToggle = (cycle) => {
    setBillingCycle(cycle);
    updateField("billingCycle", cycle);
  };

  return (
    <div className="onboarding-step-view">
      <div className="onboarding-step-header">
        <span className="onboarding-step-kicker">{t?.kicker || "STEP 3 OF 3"}</span>
        <h1 className="onboarding-step-title">{t?.title || "Choose your subscription plan"}</h1>
        <p className="onboarding-step-desc">
          {t?.desc || "All plans include a full 14-day free trial. You won't be charged today and can change plans anytime."}
        </p>

        {/* Monthly / Annual Toggle */}
        <div className="onboarding-cycle-switch-wrap">
          <div className="onboarding-cycle-switch">
            <button
              type="button"
              className={`onboarding-cycle-btn ${
                billingCycle === "monthly" ? "onboarding-cycle-btn--active" : ""
              }`}
              onClick={() => handleBillingToggle("monthly")}
            >
              {t?.monthlyBilling || "Monthly Billing"}
            </button>
            <button
              type="button"
              className={`onboarding-cycle-btn ${
                billingCycle === "yearly" ? "onboarding-cycle-btn--active" : ""
              }`}
              onClick={() => handleBillingToggle("yearly")}
            >
              {t?.annualBilling || "Annual Billing"}
              <span className="onboarding-discount-tag">{t?.save17 || "Save 17%"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="onboarding-plans-loading">
          <div className="onboarding-spinner onboarding-spinner--dark" />
          <span>{t?.loadingPlans || "Fetching live plan parameters from database..."}</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="onboarding-plans-error">
          <FiAlertCircle size={20} className="onboarding-error-icon" />
          <div className="onboarding-error-msg">
            <h4>{t?.errorTitle || "Unable to fetch plans"}</h4>
            <p>{error}</p>
          </div>
          <button
            type="button"
            className="onboarding-retry-btn"
            onClick={fetchPlans}
          >
            <FiRefreshCw size={14} />
            <span>{t?.retry || "Retry"}</span>
          </button>
        </div>
      )}

      {/* Database Plans Grid */}
      {!loading && !error && plans.length > 0 && (
        <div className="onboarding-plans-grid">
          {plans.map((p) => {
            const isSelected = selectedPlanKey === p.key.toLowerCase();
            const price =
              billingCycle === "yearly"
                ? Math.round(p.yearlyPrice / 12)
                : Math.round(p.monthlyPrice);

            const isRecommended =
              formData.roomsCount > 3 ? p.key === "pro" : p.key === "pro";

            const badgeText =
              formData.roomsCount > 3
                ? (t?.recommended4Plus || "RECOMMENDED (4+ ROOMS)")
                : (t?.mostPopular || "MOST POPULAR");

            const propertyQuota =
              p.maxProperties === 1
                ? (t?.oneProperty || "1 Property")
                : (t?.upToProperties || "Up to {count} Properties").replace(
                    "{count}",
                    p.maxProperties
                  );

            const roomQuota =
              p.maxRooms === -1
                ? (t?.unlimitedRooms || "Unlimited Rooms")
                : (t?.upToRooms || "Up to {count} Rooms").replace(
                    "{count}",
                    p.maxRooms
                  );

            const billedYearlyText = (t?.billedYearly || "Billed ₹{amount}/year").replace(
              "{amount}",
              Number(p.yearlyPrice).toLocaleString("en-IN")
            );

            return (
              <div
                key={p.key}
                role="button"
                tabIndex={0}
                className={`onboarding-plan-card ${
                  isSelected ? "onboarding-plan-card--selected" : ""
                } ${p.key === "pro" ? "onboarding-plan-card--highlight" : ""}`}
                onClick={() => handleSelectPlan(p.key)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    handleSelectPlan(p.key);
                  }
                }}
              >
                {isRecommended && (
                  <div className="onboarding-plan-badge">{badgeText}</div>
                )}

                <div className="onboarding-plan-head">
                  <h3 className="onboarding-plan-name">{p.name}</h3>
                  <p className="onboarding-plan-target">{p.target}</p>
                </div>

                <div className="onboarding-plan-pricing">
                  <div className="onboarding-plan-price-row">
                    <span className="onboarding-price-currency">₹</span>
                    <span className="onboarding-price-num">
                      {price.toLocaleString("en-IN")}
                    </span>
                    <span className="onboarding-price-period">
                      {t?.perMonth || "/ month"}
                    </span>
                  </div>
                  {billingCycle === "yearly" && (
                    <span className="onboarding-yearly-sub">
                      {billedYearlyText}
                    </span>
                  )}
                </div>

                {/* Quota Specs */}
                <div className="onboarding-plan-capacity">
                  <span className="onboarding-capacity-tag">{propertyQuota}</span>
                  <span className="onboarding-capacity-dot">·</span>
                  <span className="onboarding-capacity-tag">{roomQuota}</span>
                </div>

                {/* Highlights List from Database */}
                <ul className="onboarding-plan-features">
                  {p.highlights?.map((highlight, idx) => (
                    <li key={idx} className="onboarding-feature-item">
                      <FiCheck size={14} className="onboarding-feature-check" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>

                <div className="onboarding-plan-select-indicator">
                  <div className="onboarding-radio-circle">
                    {isSelected && <FiCheck className="onboarding-check-mark" size={13} />}
                  </div>
                  <span className="onboarding-select-label">
                    {isSelected
                      ? (t?.selectedPlan || "Selected Plan")
                      : (t?.choosePlan || "Choose this plan")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Bottom Nav Bar */}
      <div className="onboarding-bottom-bar">
        <div className="onboarding-bar-left">
          <button
            type="button"
            className="onboarding-btn-secondary"
            onClick={onBack}
            disabled={isSubmitting}
          >
            <FiArrowLeft size={16} />
            <span>{t?.backBtn || "Back"}</span>
          </button>
        </div>
        <div className="onboarding-bar-right">
          <button
            type="button"
            className="onboarding-btn-primary"
            onClick={onSubmit}
            disabled={loading || isSubmitting}
          >
            {isSubmitting ? (
              <span className="onboarding-loading-inline">
                <span className="onboarding-spinner" />
                <span>{t?.submittingBtn || "Launching workspace..."}</span>
              </span>
            ) : (
              <>
                <span>{t?.submitBtn || "Complete setup & launch"}</span>
                <FiArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepPlanSelection;
