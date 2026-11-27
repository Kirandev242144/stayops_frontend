import { API_BASE_URL } from "../../../../../config/api";

/**
 * Fetches platform subscriptions overview, metrics, gateway status, and billing ledger.
 */
export async function fetchAdminSubscriptions() {
  const res = await fetch(`${API_BASE_URL}/admin/subscriptions`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load subscriptions data: ${res.statusText} (${res.status})`);
  }

  return res.json();
}

/**
 * Manually upgrade or renew a tenant's subscription from the admin console,
 * with optional custom property or room quota overrides.
 */
export async function adminManualUpgrade(
  tenantId,
  planKey,
  billingCycle = "monthly",
  customMaxProperties = null,
  customMaxRooms = null
) {
  const payload = { tenantId, planKey, billingCycle };
  if (customMaxProperties !== null && customMaxProperties !== undefined && customMaxProperties !== "") {
    payload.customMaxProperties = Number(customMaxProperties);
  }
  if (customMaxRooms !== null && customMaxRooms !== undefined && customMaxRooms !== "") {
    payload.customMaxRooms = Number(customMaxRooms);
  }

  const res = await fetch(`${API_BASE_URL}/admin/subscriptions/manual-upgrade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update tenant subscription (${res.status})`);
  }

  return res.json();
}

/**
 * Admin updates a plan tier's pricing and quota specifications live in engine.
 */
export async function updateAdminPlanSpec(planPayload) {
  const res = await fetch(`${API_BASE_URL}/admin/subscriptions/update-plan-spec`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(planPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Failed to update plan specifications (${res.status})`);
  }

  return res.json();
}

/**
 * Admin directly adjusts or increases a tenant's properties or rooms quota.
 */
export async function adjustAdminTenantQuota(tenantId, customMaxProperties, customMaxRooms) {
  const res = await fetch(`${API_BASE_URL}/admin/subscriptions/adjust-tenant-quota`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      tenantId,
      customMaxProperties,
      customMaxRooms,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || err.error || `Failed to adjust tenant quota (${res.status})`);
  }

  return res.json();
}

/**
 * Fetches full GST Tax Invoice breakdown.
 */
export async function fetchInvoiceDetail(invoiceRef) {
  const res = await fetch(`${API_BASE_URL}/platform/subscriptions/invoices/${invoiceRef}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load invoice details (${res.status})`);
  }

  return res.json();
}

/**
 * Fetches tenant's current subscription & past billing invoices.
 */
export async function fetchTenantSubscriptionHistory(tenantId) {
  const url = tenantId
    ? `${API_BASE_URL}/platform/subscriptions/my-subscription?tenantId=${tenantId}`
    : `${API_BASE_URL}/platform/subscriptions/my-subscription`;
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load subscription history (${res.status})`);
  }

  return res.json();
}

/**
 * Export subscription billing ledger to CSV.
 */
export function exportSubscriptionsToCSV(transactions) {
  if (!Array.isArray(transactions) || transactions.length === 0) return;

  const headers = [
    "Invoice Number",
    "Tenant Name",
    "Tenant Email",
    "Property Name",
    "Plan Tier",
    "Billing Cycle",
    "Subtotal (INR)",
    "GST 18% (INR)",
    "Total Billed (INR)",
    "Gateway",
    "Payment Method",
    "Razorpay Order ID",
    "Razorpay Payment ID",
    "Settlement Date",
    "Status",
  ];

  const rows = transactions.map((t) => [
    `"${t.invoiceNumber || ""}"`,
    `"${t.tenantName || ""}"`,
    `"${t.tenantEmail || ""}"`,
    `"${t.propertyName || ""}"`,
    `"${t.planName || ""}"`,
    `"${t.billingCycle || ""}"`,
    t.subtotalAmount || 0,
    t.taxAmount || 0,
    t.totalAmount || 0,
    `"${t.paymentGateway || "RAZORPAY"}"`,
    `"${t.paymentMethod || ""}"`,
    `"${t.razorpayOrderId || ""}"`,
    `"${t.razorpayPaymentId || ""}"`,
    `"${t.date || ""}"`,
    `"${t.status || "PAID"}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `stayops_platform_subscriptions_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
