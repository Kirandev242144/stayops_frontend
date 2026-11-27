import { API_BASE_URL } from '../../../config/api';

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
}

export async function fetchBlockedDates(propertyId) {
  const url = propertyId && propertyId !== 'all'
    ? `${API_BASE_URL}/calendar/blocked-dates?propertyId=${propertyId}`
    : `${API_BASE_URL}/calendar/blocked-dates`;

  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Fetch blocked dates failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(b => ({
    id: b.id,
    roomId: b.roomId,
    startDateStr: b.startDate,
    endDateStr: b.endDate,
    category: b.category || 'Maintenance',
    notes: b.notes || ''
  }));
}

export async function createBlockedDateApi(payload) {
  const res = await fetch(`${API_BASE_URL}/calendar/blocked-dates`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      propertyId: payload.propertyId || 1,
      roomId: payload.roomId || 'all',
      startDate: payload.startDateStr,
      endDate: payload.endDateStr,
      category: payload.category || 'Maintenance',
      notes: payload.notes || ''
    })
  });
  if (!res.ok) throw new Error(`Create blocked date failed (${res.status})`);
  return await res.json();
}

export async function deleteBlockedDateApi(id) {
  const res = await fetch(`${API_BASE_URL}/calendar/blocked-dates/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error(`Delete blocked date failed (${res.status})`);
  return await res.json();
}

export async function fetchRateOverrides(propertyId) {
  const url = propertyId && propertyId !== 'all'
    ? `${API_BASE_URL}/calendar/rate-overrides?propertyId=${propertyId}`
    : `${API_BASE_URL}/calendar/rate-overrides`;

  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Fetch rate overrides failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) return {};

  const ratesMap = {};
  data.forEach(r => {
    const key = `${r.roomId}_${r.date}`;
    ratesMap[key] = Number(r.overrideRate);
  });
  return ratesMap;
}

export async function saveSingleRateOverrideApi(payload) {
  const res = await fetch(`${API_BASE_URL}/calendar/rate-overrides`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      propertyId: payload.propertyId || 1,
      roomId: payload.roomId,
      date: payload.dateKey,
      overrideRate: payload.newRate
    })
  });
  if (!res.ok) throw new Error(`Save rate override failed (${res.status})`);
  return await res.json();
}

export async function saveBulkRateOverridesApi(payload) {
  const body = Array.isArray(payload) 
    ? JSON.stringify(payload) 
    : JSON.stringify({
        propertyId: payload.propertyId || 1,
        roomId: payload.roomId || 'all',
        startDate: payload.startDateStr,
        endDate: payload.endDateStr,
        rateValue: payload.rateValue
      });

  const res = await fetch(`${API_BASE_URL}/calendar/rate-overrides/bulk`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body
  });
  if (!res.ok) throw new Error(`Save bulk rates failed (${res.status})`);
  return await res.json();
}

export async function fetchHousekeepingStatusesApi(propertyId = 'all', allowedPropertyIds = []) {
  const allowedSet = new Set(allowedPropertyIds.map(id => String(id)));

  // Security Check: If user has 0 properties configured in StayOps, return empty object
  if (Array.isArray(allowedPropertyIds) && allowedPropertyIds.length === 0) {
    return {};
  }

  if (propertyId && propertyId !== 'all') {
    if (allowedSet.size > 0 && !allowedSet.has(String(propertyId))) {
      return {}; // Unauthorized: User does not own this property
    }
  }

  const url = propertyId && propertyId !== 'all'
    ? `${API_BASE_URL}/housekeeping?propertyId=${propertyId}`
    : `${API_BASE_URL}/housekeeping`;

  const res = await fetch(url, { headers: getAuthHeaders() });
  if (!res.ok) return {};
  const data = await res.json();
  if (!Array.isArray(data)) return {};

  const hkMap = {};
  data.forEach(item => {
    // Filter results strictly to properties owned by user
    if (propertyId && propertyId !== 'all' && String(item.propertyId) !== String(propertyId)) {
      return;
    }
    if (allowedSet.size > 0 && !allowedSet.has(String(item.propertyId))) {
      return;
    }

    const key = String(item.roomId).trim();
    hkMap[key] = {
      status: item.status || 'CLEAN',
      photoProofUrl: item.photoProofUrl || null,
      cleanedBy: item.cleanedBy || null,
      notes: item.notes || null,
      lastCleanedAt: item.lastCleanedAt || null,
      updatedAt: item.updatedAt || null
    };
  });
  return hkMap;
}

export async function updateHousekeepingStatusApi(roomId, status, notes = '', propertyId, allowedPropertyIds = []) {
  const allowedSet = new Set(allowedPropertyIds.map(id => String(id)));

  if (propertyId && allowedSet.size > 0 && !allowedSet.has(String(propertyId))) {
    throw new Error("Unauthorized: You do not have permission to update room housekeeping status for this property.");
  }

  const res = await fetch(`${API_BASE_URL}/housekeeping/status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      propertyId,
      roomId: String(roomId).trim(),
      status,
      notes
    })
  });
  if (!res.ok) throw new Error(`Update housekeeping failed (${res.status})`);
  return await res.json();
}

export async function uploadHousekeepingProofApi({ roomId, photoUrl, cleanedBy = 'Caretaker', notes = '', propertyId }, allowedPropertyIds = []) {
  const allowedSet = new Set(allowedPropertyIds.map(id => String(id)));

  if (propertyId && allowedSet.size > 0 && !allowedSet.has(String(propertyId))) {
    throw new Error("Unauthorized: You do not have permission to upload proof for this property.");
  }

  const res = await fetch(`${API_BASE_URL}/housekeeping/upload-proof`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      propertyId,
      roomId: String(roomId).trim(),
      photoUrl,
      cleanedBy,
      notes
    })
  });
  if (!res.ok) throw new Error(`Upload housekeeping proof failed (${res.status})`);
  return await res.json();
}

