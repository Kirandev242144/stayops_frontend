import { API_BASE_URL } from '../../../config/api';

export async function fetchGuests() {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
  const res = await fetch(`${API_BASE_URL}/crm/guests`, { headers });
  if (!res.ok) {
    throw new Error(`CRM API error ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((item, idx) => {
    const prof = item.profile || item;
    const stays = Number(item.totalStays) || 0;
    let parsedDocs = [];
    if (prof.idDocuments) {
      try {
        parsedDocs = typeof prof.idDocuments === 'string' ? JSON.parse(prof.idDocuments) : prof.idDocuments;
      } catch {
        parsedDocs = [];
      }
    }
    return {
      id: prof.id ? `G-${prof.id}` : `G-${idx + 1}`,
      dbId: prof.id || item.id,
      name: prof.name || item.name || "",
      phone: prof.phone || item.phone || "",
      email: prof.email || item.email || "",
      totalStays: stays,
      totalRevenue: Number(item.totalSpend) || 0,
      lastStay: item.lastStayDate || "",
      idType: prof.idType || (parsedDocs[0]?.idType) || (prof.idNumber ? "Aadhaar Card" : null),
      idNumber: prof.idNumber || (parsedDocs[0]?.idNumber) || null,
      idDocumentUrl: prof.idDocumentUrl || (parsedDocs[0]?.documentUrl) || null,
      idDocuments: Array.isArray(parsedDocs) ? parsedDocs : [],
      aadhaarNo: prof.idNumber || null,
      status: stays > 1 ? "returning" : "new"
    };
  });
}

export async function uploadGuestDocument(file) {
  const token = localStorage.getItem("token");
  const headers = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/upload/document`, {
    method: "POST",
    headers,
    body: formData
  });

  if (!res.ok) {
    throw new Error(`Document upload failed (${res.status})`);
  }
  return await res.json();
}

export async function createGuest(payload) {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
  const res = await fetch(`${API_BASE_URL}/crm/guests`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Server error ${res.status}`);
  }
  return await res.json();
}

export async function fetchGuestProfileDetail(profileId) {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
  const res = await fetch(`${API_BASE_URL}/crm/guests/${profileId}`, { headers });
  if (!res.ok) {
    throw new Error(`Failed to load guest profile details (${res.status})`);
  }
  return await res.json();
}

