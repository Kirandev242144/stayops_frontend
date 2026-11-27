import { API_BASE_URL } from "../../../config/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    Authorization: token ? `Bearer ${token}` : "",
    "Content-Type": "application/json",
  };
}

export async function fetchTelegramStatus(propertyId) {
  const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/telegram/status`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error(`Failed to load Telegram bot status (${res.status})`);
  }
  return res.json();
}

export async function connectTelegramBot(propertyId, botToken) {
  const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/telegram/connect`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ botToken }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || data.error || `Failed to connect bot (${res.status})`);
  }
  return data;
}

export async function disconnectTelegramBot(propertyId) {
  const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/telegram/disconnect`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Failed to disconnect bot (${res.status})`);
  }
  return data;
}

export async function sendTelegramTestAlert(propertyId) {
  const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/telegram/test-alert`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Failed to dispatch test alert (${res.status})`);
  }
  return data;
}

export async function updateTelegramPreferences(propertyId, preferences) {
  const res = await fetch(`${API_BASE_URL}/properties/${propertyId}/telegram/preferences`, {
    method: "PUT",
    headers: getAuthHeaders(),
    body: JSON.stringify(preferences),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Failed to update preferences (${res.status})`);
  }
  return data;
}
