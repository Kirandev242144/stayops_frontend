import { API_BASE_URL } from "../../../../../config/api";

/**
 * Fetch paginated and filtered sales leads.
 */
export async function fetchAdminLeads(params = {}) {
  const query = new URLSearchParams();
  if (params.page != null) query.append("page", params.page);
  if (params.size != null) query.append("size", params.size);
  if (params.search) query.append("search", params.search);
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.propertyType && params.propertyType !== "ALL") query.append("propertyType", params.propertyType);
  if (params.minProperties) query.append("minProperties", params.minProperties);
  if (params.maxProperties) query.append("maxProperties", params.maxProperties);
  if (params.source && params.source !== "ALL") query.append("source", params.source);
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortDirection) query.append("sortDirection", params.sortDirection);

  const res = await fetch(`${API_BASE_URL}/admin/leads?${query.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load leads: ${res.statusText} (${res.status})`);
  }

  return res.json();
}

/**
 * Fetch live database KPI summary metrics.
 */
export async function fetchAdminLeadsSummary() {
  const res = await fetch(`${API_BASE_URL}/admin/leads/summary`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load summary: ${res.statusText} (${res.status})`);
  }

  return res.json();
}

/**
 * Fetch single lead details including notes and activity history.
 */
export async function fetchAdminLeadDetail(id) {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}`, {
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load lead #${id}: ${res.statusText} (${res.status})`);
  }

  return res.json();
}

/**
 * Update lead status.
 */
export async function updateLeadStatus(id, { status, note }) {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status, note }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Failed to update status (${res.status})`);
  }

  return res.json();
}

/**
 * Schedule demo.
 */
export async function scheduleLeadDemo(id, payload) {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}/schedule-demo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Failed to schedule demo (${res.status})`);
  }

  return res.json();
}

/**
 * Schedule follow up.
 */
export async function scheduleLeadFollowUp(id, payload) {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}/follow-ups`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Failed to schedule follow up (${res.status})`);
  }

  return res.json();
}

/**
 * Add internal note.
 */
export async function addLeadNote(id, { note }) {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}/notes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ note }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Failed to add note (${res.status})`);
  }

  return res.json();
}

/**
 * Convert lead to StayOps tenant account.
 */
export async function convertLeadToTenant(id, payload = {}) {
  const res = await fetch(`${API_BASE_URL}/admin/leads/${id}/convert`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.message || `Failed to convert lead (${res.status})`);
  }

  return res.json();
}

/**
 * Download CSV export of filtered leads.
 */
export async function downloadLeadsCsv(params = {}) {
  const query = new URLSearchParams();
  if (params.search) query.append("search", params.search);
  if (params.status && params.status !== "ALL") query.append("status", params.status);
  if (params.propertyType && params.propertyType !== "ALL") query.append("propertyType", params.propertyType);
  if (params.minProperties) query.append("minProperties", params.minProperties);
  if (params.maxProperties) query.append("maxProperties", params.maxProperties);
  if (params.source && params.source !== "ALL") query.append("source", params.source);

  const res = await fetch(`${API_BASE_URL}/admin/leads/export?${query.toString()}`, {
    headers: { Accept: "text/csv" },
  });

  if (!res.ok) {
    throw new Error(`Export failed: ${res.statusText} (${res.status})`);
  }

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `stayops_sales_leads_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
