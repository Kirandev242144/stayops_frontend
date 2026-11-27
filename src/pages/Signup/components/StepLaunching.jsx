import React from "react";

const StepLaunching = ({ propertyName, t }) => {
  const settingUpText = (t?.settingUp || "Setting up {propertyName}...").replace(
    "{propertyName}",
    propertyName || "your property"
  );

  return (
    <div className="onboarding-launch-screen">
      <div className="onboarding-launch-spinner-wrap">
        <div className="onboarding-launch-spinner" />
      </div>
      <h2 className="onboarding-launch-title">{settingUpText}</h2>
      <p className="onboarding-launch-desc">
        {t?.desc ||
          "Initializing PMS calendar, configuring room inventory, and creating your WhatsApp booking storefront."}
      </p>
    </div>
  );
};

export default StepLaunching;
