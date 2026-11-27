export const DEFAULT_CANCELLATION_RULES = [];

export const DEFAULT_TERMS =
  "Defines the rules, responsibilities, and agreements for using our stay services and products. Standard check-in is 12:00 PM and check-out is 11:00 AM. Valid government photo ID is required for all adult guests at check-in.";

export const DEFAULT_PRIVACY =
  "Outlines how we collect, use, and protect your personal information. Your contact details are stored securely and used solely for stay reservations and guest communication.";

export const DEFAULT_REFUND =
  "Explains the conditions and process for requesting and receiving refunds. Approved refunds are processed back to the original payment method within 5-7 business days.";

export const DEFAULT_CHILD_POLICY = {
  freeChildMaxAge: 5,
  childAgeMax: 12,
  childExtraCharge: 500,
};

export const DEFAULT_POLICY_DATA = {
  noCancellationPolicy: false,
  cancellationRulesJson: JSON.stringify(DEFAULT_CANCELLATION_RULES),
  termsAndConditions: DEFAULT_TERMS,
  privacyPolicy: DEFAULT_PRIVACY,
  refundPolicy: DEFAULT_REFUND,
  childAgePolicyJson: JSON.stringify(DEFAULT_CHILD_POLICY),
};
