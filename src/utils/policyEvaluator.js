import { API_BASE_URL } from '../config/api';

/**
 * Generates a human-readable summary string of the active cancellation policy from policyData (from Settings -> Policies).
 */
export function getCancellationPolicySummary(policyData) {
  if (!policyData) {
    return "Cancellation policy not configured";
  }
  if (policyData.noCancellationPolicy) {
    return "No cancellation policy (100% Free cancellation)";
  }

  let rules = [];
  try {
    rules = typeof policyData.cancellationRulesJson === "string"
      ? JSON.parse(policyData.cancellationRulesJson || "[]")
      : (policyData.cancellationRulesJson || []);
  } catch (e) {
    rules = [];
  }

  const activeRules = rules.filter(r => r && r.active !== false);

  if (activeRules.length === 0) {
    return "Cancellation policy not configured";
  }

  if (activeRules.length === 1) {
    const r = activeRules[0];
    const val = Number(r.chargeValue ?? r.deductValue ?? 100);
    const unit = Number(r.beforeValue ?? 1);
    const beforeUnit = r.beforeUnit || "Day";
    const chargeType = r.chargeType || (r.deductUnit === "Night" ? "NIGHTS" : "PERCENTAGE");
    const chargeUnitStr = chargeType === "NIGHTS"
      ? `${val} Night(s) tariff`
      : chargeType === "FIXED_AMOUNT"
        ? `₹${val}`
        : `${val}%`;

    if (r.type === "AFTER_RESERVATION") {
      return `If cancelled immediately after reservation, ${chargeUnitStr} penalty applies.`;
    }

    if (val >= 100 && chargeType === "PERCENTAGE" && unit === 1) {
      return "Flexible (100% refund up to 24h before check-in)";
    }
    if (val >= 100 && chargeType === "PERCENTAGE" && unit === 7) {
      return "Moderate (100% refund up to 7 days before check-in)";
    }
    if (val >= 100 && chargeType === "PERCENTAGE" && unit === 14) {
      return "Strict (100% refund up to 14 days before check-in)";
    }

    return `If cancelled within ${unit} ${beforeUnit}(s) of check-in, ${chargeUnitStr} penalty applies.`;
  }

  return `Custom Policy (${activeRules.length} active refund tier(s) configured in Settings ➔ Policies)`;
}

/**
 * Fetches active Property Policy for a given property ID, with fallback to primary user property.
 */
export async function fetchPropertyPolicy(propertyId) {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };

  let targetId = propertyId;

  if (targetId) {
    try {
      const res = await fetch(`${API_BASE_URL}/properties/${targetId}/policies`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data && (data.noCancellationPolicy || data.cancellationRulesJson || data.termsAndConditions)) {
          return data;
        }
      }
    } catch (e) {
      console.warn("Direct property policy fetch note:", e);
    }
  }

  return null;
}

/**
 * Evaluates the cancellation penalty and net refund for a booking according to property policy.
 */
export function evaluateCancellationPolicy(booking, policyData) {
  const collected = Number(booking?.amountPaid || booking?.paidAmount || (booking?.paymentStatus === 'Paid in Full' ? booking?.totalAmount : 0) || 0);
  const totalTariff = Number(booking?.totalAmount || booking?.price || 0);

  // If no policy data or explicit noCancellationPolicy checked
  if (!policyData || policyData.noCancellationPolicy) {
    return {
      penaltyAmount: 0,
      recommendedRefund: collected,
      ruleText: "No Cancellation Policy configured (100% Full Refund applies)",
      appliedRule: null
    };
  }

  let rules = [];
  try {
    rules = typeof policyData.cancellationRulesJson === "string"
      ? JSON.parse(policyData.cancellationRulesJson || "[]")
      : (policyData.cancellationRulesJson || []);
  } catch (e) {
    rules = [];
  }

  const activeRules = rules.filter(r => r.active);
  if (activeRules.length === 0) {
    return {
      penaltyAmount: 0,
      recommendedRefund: collected,
      ruleText: "100% Free Cancellation (No active penalty rules set)",
      appliedRule: null
    };
  }

  // Calculate days before check-in date
  let daysBeforeCheckIn = 999;
  if (booking?.checkIn) {
    const checkInDate = new Date(booking.checkIn);
    const now = new Date();
    checkInDate.setHours(12, 0, 0, 0);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0, 0);
    const diffTime = checkInDate.getTime() - today.getTime();
    daysBeforeCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  // Calculate length of stay (nights)
  let stayNights = 1;
  if (booking?.checkIn && booking?.checkOut) {
    const cin = new Date(booking.checkIn);
    const cout = new Date(booking.checkOut);
    const diffNights = Math.round((cout.getTime() - cin.getTime()) / (1000 * 60 * 60 * 24));
    if (diffNights > 0) stayNights = diffNights;
  } else if (booking?.lengthDays) {
    stayNights = booking.lengthDays;
  }

  const oneNightTariff = totalTariff > 0 ? totalTariff / stayNights : 0;

  // 1. Check BEFORE_CHECKIN rules
  const beforeRules = activeRules
    .filter(r => r.type === "BEFORE_CHECKIN" || r.type === undefined)
    .sort((a, b) => (Number(a.beforeValue) || 0) - (Number(b.beforeValue) || 0));

  let matchedRule = null;
  for (const r of beforeRules) {
    const ruleThreshold = Number(r.beforeValue ?? 1);
    if (daysBeforeCheckIn <= ruleThreshold) {
      matchedRule = r;
      break;
    }
  }

  // 2. If no BEFORE_CHECKIN rule matched, check AFTER_RESERVATION rules
  if (!matchedRule) {
    const afterRules = activeRules.filter(r => r.type === "AFTER_RESERVATION");
    if (afterRules.length > 0) {
      matchedRule = afterRules[0];
    }
  }

  if (!matchedRule) {
    return {
      penaltyAmount: 0,
      recommendedRefund: collected,
      ruleText: `Cancelled ${daysBeforeCheckIn} day(s) prior to check-in (Outside penalty window → 100% Refund)`,
      appliedRule: null
    };
  }

  // Calculate penalty based on chargeType / deductUnit
  let penaltyAmount = 0;
  let chargeType = matchedRule.chargeType || (matchedRule.deductUnit === "Percentage" ? "PERCENTAGE" : matchedRule.deductUnit === "Night" ? "NIGHTS" : "PERCENTAGE");
  let chargeVal = Number(matchedRule.chargeValue ?? matchedRule.deductValue ?? 20);

  if (chargeType === "PERCENTAGE") {
    penaltyAmount = Math.round((chargeVal / 100) * totalTariff);
  } else if (chargeType === "NIGHTS") {
    penaltyAmount = Math.round(chargeVal * oneNightTariff);
  } else if (chargeType === "FIXED_AMOUNT") {
    penaltyAmount = chargeVal;
  }

  penaltyAmount = Math.min(totalTariff, Math.max(0, penaltyAmount));
  const recommendedRefund = Math.max(0, collected - penaltyAmount);

  let ruleDesc = "";
  if (matchedRule.type === "AFTER_RESERVATION") {
    ruleDesc = `Policy Rule: ${chargeVal}${chargeType === "PERCENTAGE" ? "%" : chargeType === "NIGHTS" ? " Night tariff" : "₹"} penalty immediately after reservation`;
  } else {
    ruleDesc = `Policy Rule: ${chargeVal}${chargeType === "PERCENTAGE" ? "%" : chargeType === "NIGHTS" ? " Night tariff" : "₹"} penalty if cancelled within ${matchedRule.beforeValue} ${matchedRule.beforeUnit || "Day"}(s) of check-in`;
  }

  return {
    penaltyAmount,
    recommendedRefund,
    ruleText: ruleDesc,
    appliedRule: matchedRule
  };
}
