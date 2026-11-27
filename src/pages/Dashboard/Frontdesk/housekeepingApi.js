import { API_BASE_URL } from '../../../config/api';

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
}

/**
 * Fetches housekeeping statuses for properties owned by the authenticated user.
 */
export const fetchHousekeepingStatuses = async (propertyId = 'all', allowedPropertyIds = null) => {
  const allowedSet = allowedPropertyIds ? new Set(allowedPropertyIds.map(id => String(id))) : new Set();

  // Security Check: If user explicitly passed an empty array of properties, return empty list
  if (allowedPropertyIds !== null && Array.isArray(allowedPropertyIds) && allowedPropertyIds.length === 0) {
    return [];
  }

  if (propertyId && propertyId !== 'all') {
    if (allowedSet.size > 0 && !allowedSet.has(String(propertyId))) {
      return []; // Unauthorized: User does not own this property
    }
  }

  try {
    const url = propertyId && propertyId !== 'all'
      ? `${API_BASE_URL}/housekeeping?propertyId=${propertyId}`
      : `${API_BASE_URL}/housekeeping`;

    const response = await fetch(url, { headers: getAuthHeaders() });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data)) return [];

    // Filter results strictly to properties owned by user
    return data.filter(item => {
      if (propertyId && propertyId !== 'all' && String(item.propertyId) !== String(propertyId)) {
        return false;
      }
      if (allowedSet.size > 0) {
        return allowedSet.has(String(item.propertyId));
      }
      return true;
    });
  } catch (error) {
    console.warn('Error fetching housekeeping status:', error);
    return [];
  }
};

/**
 * Updates room housekeeping status with multi-tenancy property permission verification.
 */
export const updateHousekeepingStatus = async (roomId, status, notes = '', propertyId, allowedPropertyIds = []) => {
  const allowedSet = new Set(allowedPropertyIds.map(id => String(id)));

  if (propertyId && allowedSet.size > 0 && !allowedSet.has(String(propertyId))) {
    throw new Error("Unauthorized: You do not have permission to update room housekeeping status for this property.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/housekeeping/status`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        propertyId,
        roomId: String(roomId).trim(),
        status,
        notes
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating housekeeping status:', error);
    throw error;
  }
};

/**
 * Uploads housekeeping photo proof with multi-tenancy property permission verification.
 */
export const uploadHousekeepingProof = async ({ roomId, photoUrl, cleanedBy = 'Caretaker', notes = '', propertyId }, allowedPropertyIds = []) => {
  const allowedSet = new Set(allowedPropertyIds.map(id => String(id)));

  if (propertyId && allowedSet.size > 0 && !allowedSet.has(String(propertyId))) {
    throw new Error("Unauthorized: You do not have permission to upload proof for this property.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/housekeeping/upload-proof`, {
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

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error uploading housekeeping proof:', error);
    throw error;
  }
};
