/**
 * Tenant and user account utility functions for StayOps Admin Console.
 * Directly interfaces with the Spring Boot backend database.
 */

import { API_BASE_URL } from "../../../../../config/api";

/**
 * Fetches all registered tenants and user accounts from the backend database.
 */
export async function fetchAdminTenants() {
  const res = await fetch(`${API_BASE_URL}/admin/tenants`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load tenants from database: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format from tenants API.");
  }

  return data.map(mapBackendTenantToRow);
}

/**
 * Updates a tenant's live account status (active | suspended).
 */
export async function updateTenantStatus(tenantId, status) {
  const res = await fetch(`${API_BASE_URL}/admin/tenants/${tenantId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update tenant status in database: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  return mapBackendTenantToRow(data);
}

/**
 * Extends the SaaS trial period for a tenant.
 */
export async function extendTenantTrial(tenantId, extendDays) {
  const res = await fetch(`${API_BASE_URL}/admin/tenants/${tenantId}/trial`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ extendDays }),
  });

  if (!res.ok) {
    throw new Error(`Failed to extend trial in database: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  return mapBackendTenantToRow(data);
}

/**
 * Registers a new tenant account directly in the backend database.
 */
export async function createAdminTenant(tenantPayload) {
  const res = await fetch(`${API_BASE_URL}/admin/tenants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(tenantPayload),
  });

  if (!res.ok) {
    throw new Error(`Failed to create tenant in database: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  return mapBackendTenantToRow(data);
}

/**
 * Deletes a tenant account from the database.
 */
export async function deleteAdminTenant(tenantId) {
  const res = await fetch(`${API_BASE_URL}/admin/tenants/${tenantId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Failed to delete tenant from database: ${res.statusText} (${res.status})`);
  }

  return true;
}

/**
 * Fetches full tenant detail: overview + properties list + audit log.
 */
export async function fetchTenantDetail(tenantId) {
  const res = await fetch(`${API_BASE_URL}/admin/tenants/${tenantId}/detail`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load tenant detail: ${res.statusText} (${res.status})`);
  }

  return res.json();
}

/**
 * Normalizes backend tenant entity attributes into the standardized UI row schema.
 */
export function mapBackendTenantToRow(t) {
  const rawStatus = (t.status || "active").toLowerCase();
  let normalizedStatus = "active";
  if (rawStatus.includes("suspend")) {
    normalizedStatus = "suspended";
  } else if (rawStatus.includes("trial") || t.plan === "trial" || (t.trialDaysLeft > 0 && t.propertiesCount === 0)) {
    normalizedStatus = "trial";
  } else {
    normalizedStatus = "active";
  }

  return {
    id: t.id,
    name: t.name || `User #${t.id}`,
    email: t.email,
    phone: t.phone || "+91 98450 11223",
    role: t.role || "Owner",
    propertiesCount: t.propertiesCount || 0,
    propertyName: t.propertyName || "No Properties",
    propertyNames: Array.isArray(t.propertyNames) ? t.propertyNames : [],
    plan: t.plan || (t.propertiesCount > 1 ? "hub" : t.propertiesCount === 1 ? "pro" : "trial"),
    planName: t.planName || (t.propertiesCount > 1 ? "Multi-Property Hub" : t.propertiesCount === 1 ? "Pro Growth" : "14-Day Free Trial"),
    status: normalizedStatus,
    trialDaysLeft: t.trialDaysLeft || 0,
    joinedDate: t.joinedDate || "Recent",
    lastActive: t.lastActive || "Today",
  };
}

/**
 * Exports current tenants data into a downloadable CSV file.
 */
export function exportTenantsToCSV(tenants) {
  if (!Array.isArray(tenants) || tenants.length === 0) return;

  const headers = [
    "Tenant ID",
    "Full Name",
    "Email Address",
    "Phone Number",
    "Role",
    "Properties Count",
    "Owned Properties",
    "Subscription Tier",
    "Account Status",
    "Trial Days Remaining",
    "Joined Date",
  ];

  const rows = tenants.map((t) => [
    t.id,
    `"${t.name || ""}"`,
    `"${t.email || ""}"`,
    `"${t.phone || ""}"`,
    `"${t.role || "Owner"}"`,
    t.propertiesCount || 0,
    `"${(t.propertyNames || []).join(", ") || t.propertyName || ""}"`,
    `"${t.planName || ""}"`,
    `"${t.status || ""}"`,
    t.trialDaysLeft || 0,
    `"${t.joinedDate || ""}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `stayops_tenants_master_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
