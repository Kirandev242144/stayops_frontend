import { API_BASE_URL } from '../../../config/api';

/**
 * Standard helper to retrieve current JWT auth headers for API requests
 */
const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

/**
 * Parse structured error message from API response
 */
async function parseErrorMessage(res, defaultMsg) {
  try {
    const data = await res.json();
    if (data && (data.message || data.error)) {
      return data.message || data.error;
    }
  } catch (ignored) {
    // Response was not JSON
  }
  return defaultMsg || `Request failed with status ${res.status}`;
}

/**
 * Fetch team members scoped to the currently logged-in Property Owner
 * Calls GET /api/team
 */
export async function fetchTeamMembers() {
  const res = await fetch(`${API_BASE_URL}/team`, {
    method: 'GET',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const msg = await parseErrorMessage(res, 'Failed to fetch team members');
    throw new Error(msg);
  }

  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

/**
 * Create a new team member under the current owner's account
 * Calls POST /api/team
 */
export async function createTeamMember(payload) {
  const cleanPin = String(payload.pin || payload.password || '').trim();

  const body = {
    name: (payload.name || '').trim(),
    mobileNumber: (payload.mobileNumber || '').trim(),
    pin: cleanPin,
    password: cleanPin,
    role: payload.role,
    assignedProperties: payload.assignedProperties || ['all'],
    assignedPropertyNames: payload.assignedPropertyNames || ['All Properties'],
    permissions: payload.permissions || {
      photoEvidence: true,
      pettyCash: true,
      mealLogging: true,
      manageBookings: payload.role === 'Property Manager'
    },
    status: payload.status || 'Active'
  };

  const res = await fetch(`${API_BASE_URL}/team`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const msg = await parseErrorMessage(res, 'Failed to create team member');
    throw new Error(msg);
  }

  return await res.json();
}

/**
 * Update an existing team member
 * Calls PUT /api/team/:id
 */
export async function updateTeamMember(id, payload) {
  const cleanPin = payload.pin !== undefined 
    ? String(payload.pin).trim() 
    : (payload.password !== undefined ? String(payload.password).trim() : undefined);

  const body = {
    ...payload,
    ...(payload.name ? { name: payload.name.trim() } : {}),
    ...(payload.mobileNumber ? { mobileNumber: payload.mobileNumber.trim() } : {}),
    ...(cleanPin !== undefined ? { pin: cleanPin, password: cleanPin } : {})
  };

  const res = await fetch(`${API_BASE_URL}/team/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const msg = await parseErrorMessage(res, 'Failed to update team member');
    throw new Error(msg);
  }

  return await res.json();
}

/**
 * Delete a team member
 * Calls DELETE /api/team/:id
 */
export async function deleteTeamMember(id) {
  const res = await fetch(`${API_BASE_URL}/team/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });

  if (!res.ok) {
    const msg = await parseErrorMessage(res, 'Failed to remove team member');
    throw new Error(msg);
  }

  return true;
}

/**
 * Authenticate staff login (Mobile + PIN across portfolio)
 * Calls POST /api/team/login
 */
export async function authenticateStaffLogin(mobileOrEmail, passwordOrPin) {
  const cleanInput = (mobileOrEmail || '').trim();
  const cleanPass = String(passwordOrPin || '').trim();

  if (!cleanInput || !cleanPass) {
    return null;
  }

  const res = await fetch(`${API_BASE_URL}/team/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mobileNumber: cleanInput,
      email: cleanInput,
      pin: cleanPass,
      password: cleanPass
    })
  });

  if (res.status === 401) {
    // Invalid credentials for staff
    return null;
  }

  if (!res.ok) {
    const msg = await parseErrorMessage(res, 'Staff login failed');
    throw new Error(msg);
  }

  const staff = await res.json();
  if (staff && staff.status === 'Inactive') {
    throw new Error('Account is inactive. Please contact the property owner.');
  }

  return staff;
}
