import { DEFAULT_CANCELLATION_RULES, DEFAULT_CHILD_POLICY } from "./policyDefaults";

/**
 * Normalizes legacy and raw cancellation rules to ensure standard structure.
 * Preserves backward compatibility with legacy fields: deductUnit, deductValue, etc.
 */
export function normalizeCancellationRules(rawRules) {
  if (!Array.isArray(rawRules) || rawRules.length === 0) {
    return [];
  }

  return rawRules.map((r, idx) => {
    let cType = r.chargeType;
    if (!cType) {
      if (r.deductUnit === "Percentage" || r.deductUnit === "PERCENTAGE") {
        cType = "PERCENTAGE";
      } else if (r.deductUnit === "Night" || r.deductUnit === "NIGHTS") {
        cType = "NIGHTS";
      } else {
        cType = "PERCENTAGE";
      }
    }

    return {
      id: r.id || `${Date.now()}-${idx}`,
      type: r.type || "BEFORE_CHECKIN",
      chargeValue: r.chargeValue ?? r.deductValue ?? 20,
      chargeType: cType,
      beforeValue: r.beforeValue ?? 1,
      beforeUnit: r.beforeUnit || "Day",
      afterTiming: r.afterTiming || "IMMEDIATELY",
      active: r.active !== undefined ? r.active : true,
    };
  });
}

/**
 * Safely parses child policy JSON with fallback to default values.
 */
export function parseChildPolicy(childAgePolicyJson) {
  if (!childAgePolicyJson) return DEFAULT_CHILD_POLICY;
  try {
    const parsed = typeof childAgePolicyJson === "string" ? JSON.parse(childAgePolicyJson) : childAgePolicyJson;
    return {
      freeChildMaxAge: parsed.freeChildMaxAge ?? DEFAULT_CHILD_POLICY.freeChildMaxAge,
      childAgeMax: parsed.childAgeMax ?? DEFAULT_CHILD_POLICY.childAgeMax,
      childExtraCharge: parsed.childExtraCharge ?? DEFAULT_CHILD_POLICY.childExtraCharge,
    };
  } catch (e) {
    return DEFAULT_CHILD_POLICY;
  }
}

/**
 * Validates child age ranges and extra charges.
 */
export function validateChildPolicy(childObj) {
  const freeAge = Number(childObj.freeChildMaxAge);
  const maxAge = Number(childObj.childAgeMax);
  const extraCharge = Number(childObj.childExtraCharge);

  if (isNaN(freeAge) || freeAge < 0) {
    return { isValid: false, errorMsg: "Free child max age must be 0 or greater." };
  }
  if (isNaN(maxAge) || maxAge > 18) {
    return { isValid: false, errorMsg: "Child age upper limit cannot exceed 18 years." };
  }
  if (freeAge >= maxAge) {
    return { isValid: false, errorMsg: "Free child max age must be strictly less than child age upper limit." };
  }
  if (isNaN(extraCharge) || extraCharge < 0) {
    return { isValid: false, errorMsg: "Child extra charge cannot be negative." };
  }

  return { isValid: true, errorMsg: "" };
}

/**
 * Generates clear, unambiguous preview sentences respecting the selected tab.
 */
export function generateCancellationPreview(rules, noCancellationPolicy, activeTab) {
  if (noCancellationPolicy) {
    return ["• No cancellation policy configured. Guests can cancel anytime with no fee."];
  }

  let targetRules = [];
  if (activeTab === "BEFORE_CHECKIN") {
    targetRules = rules.filter((r) => r.active && (r.type === "BEFORE_CHECKIN" || r.type === undefined));
  } else if (activeTab === "AFTER_RESERVATION") {
    targetRules = rules.filter((r) => r.active && r.type === "AFTER_RESERVATION");
  } else {
    // PRESETS tab -> show ALL active rules
    targetRules = rules.filter((r) => r.active);
  }

  if (targetRules.length === 0) {
    if (activeTab === "BEFORE_CHECKIN") {
      return ["• No active penalty rules configured for Before Check-ins."];
    } else if (activeTab === "AFTER_RESERVATION") {
      return ["• No active penalty rules configured for After reservation."];
    } else {
      return ["• 100% Free cancellation (No active penalty rules)."];
    }
  }

  return targetRules.map((rule) => {
    let chargeStr = "";
    if (rule.chargeType === "PERCENTAGE") {
      chargeStr = `${rule.chargeValue}% of the booking amount`;
    } else if (rule.chargeType === "NIGHTS") {
      chargeStr = `${rule.chargeValue} ${rule.chargeValue === 1 ? "night" : "nights"} tariff`;
    } else if (rule.chargeType === "FIXED_AMOUNT") {
      chargeStr = `a flat ₹${rule.chargeValue} fee`;
    }

    if (rule.type === "AFTER_RESERVATION") {
      let timingStr = "immediately after reservation confirmation";
      if (rule.afterTiming === "WITHIN_24H") timingStr = "within 24 hours of reservation";
      if (rule.afterTiming === "WITHIN_48H") timingStr = "within 48 hours of reservation";

      return `• If cancelled ${timingStr}, ${chargeStr} is charged.`;
    } else {
      const unitStr = rule.beforeValue === 1 ? rule.beforeUnit : `${rule.beforeUnit}s`;
      return `• If cancelled within ${rule.beforeValue} ${unitStr} of check-in, ${chargeStr} is charged.`;
    }
  });
}
