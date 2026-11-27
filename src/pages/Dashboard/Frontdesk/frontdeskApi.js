import { API_BASE_URL } from '../../../config/api';

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
}

export async function fetchFrontdeskReservations() {
  const res = await fetch(`${API_BASE_URL}/reservations`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Fetch reservations failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(b => ({
    id: b.bookingRef || `BK-${b.id}`,
    dbId: b.id,
    guest: b.guestName || "",
    guestName: b.guestName || "",
    phone: b.guestPhone || "",
    guestPhone: b.guestPhone || "",
    email: b.guestEmail || "",
    propertyId: b.propertyId || b.property?.id || null,
    propertyName: b.propertyName || b.property?.name || "",
    unit: b.roomUnit || "",
    roomUnit: b.roomUnit || "",
    guests: b.guestCount || 1,
    guestCount: b.guestCount || 1,
    checkin: b.checkIn || "",
    checkIn: b.checkIn || "",
    checkout: b.checkOut || "",
    checkOut: b.checkOut || "",
    roomBaseTotal: b.roomBaseTotal !== undefined && b.roomBaseTotal !== null ? Number(b.roomBaseTotal) : undefined,
    roomSubtotal: b.roomSubtotal !== undefined && b.roomSubtotal !== null ? Number(b.roomSubtotal) : undefined,
    roomServiceCharge: b.roomServiceCharge !== undefined && b.roomServiceCharge !== null ? Number(b.roomServiceCharge) : undefined,
    roomGstAmount: b.roomGstAmount !== undefined && b.roomGstAmount !== null ? Number(b.roomGstAmount) : undefined,
    taxSettingsSnapshot: b.taxSettingsSnapshot || null,
    allocatedRooms: Array.isArray(b.allocatedRooms) ? b.allocatedRooms : [],
    amount: Number(b.totalAmount || 0),
    totalAmount: Number(b.totalAmount || 0),
    amountPaid: Number(b.amountPaid || 0),
    balanceDue: Math.max(0, Number(b.totalAmount || 0) - Number(b.amountPaid || 0)),
    paymentStatus: b.paymentStatus || "Pending",
    status: (b.status || "confirmed").toLowerCase(),
    ota: b.bookingSource || "Walk-In",
    bookingSource: b.bookingSource || "Walk-In",
    notes: b.notes || "",
    idType: b.idType || null,
    idNumber: b.idNumber || null,
    idDocumentUrl: b.idDocumentUrl || null,
    idDocuments: b.idDocuments || null,
    guestCity: b.guestCity || "",
    guestState: b.guestState || ""
  }));
}

export async function fetchMealOrders() {
  const res = await fetch(`${API_BASE_URL}/meal-orders`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error(`Fetch meal orders failed (${res.status})`);
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(m => ({
    id: `MEAL-${m.id}`,
    dbId: m.id,
    resId: m.reservationId ? String(m.reservationId) : '',
    guest: m.guestName || '',
    item: `${m.mealType || 'Meal'}: ${m.itemName || ''}`,
    items: `${m.mealType || 'Meal'}: ${m.itemName || ''}`,
    amount: Number(m.amount) || 0,
    staff: 'Caretaker',
    timestamp: m.createdAt || new Date().toISOString()
  }));
}

export async function updateReservationStatus(numericId, status, extraFields = {}) {
  const res = await fetch(`${API_BASE_URL}/reservations/${numericId}/status`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, ...extraFields })
  });
  if (!res.ok) throw new Error(`Update status failed (${res.status})`);
  return await res.json().catch(() => ({ status, ...extraFields }));
}

export async function updateReservationPayment(numericId, payload) {
  const res = await fetch(`${API_BASE_URL}/reservations/${numericId}/payment`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Update payment failed (${res.status})`);
  return await res.json().catch(() => payload);
}

export async function createMealOrder(payload) {
  const res = await fetch(`${API_BASE_URL}/meal-orders`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`Create meal order failed (${res.status})`);
  return await res.json();
}
