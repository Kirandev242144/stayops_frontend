import { API_BASE_URL } from '../../../config/api';

export function mapReservationFromApi(b) {
  const total = Number(b.totalAmount) || 0;
  const paid = Number(b.amountPaid) || 0;
  return {
    id: b.bookingRef || (b.id ? `BK-${b.id}` : ""),
    dbId: b.id,
    guestName: b.guestName || "",
    guestPhone: b.guestPhone || "",
    guestEmail: b.guestEmail || "",
    propertyId: b.propertyId || b.property_id || b.property?.id || null,
    propertyName: b.propertyName || b.property_name || b.property?.name || "",
    roomUnit: b.roomUnit || "",
    guestCount: Number(b.guestCount) || 1,
    checkIn: b.checkIn || "",
    checkInTime: b.checkInTime || b.check_in_time || "",
    checkOut: b.checkOut || "",
    checkOutTime: b.checkOutTime || b.check_out_time || "",
    isLateArrival: Boolean(b.isLateArrival || b.is_late_arrival),
    roomBaseTotal: b.roomBaseTotal !== undefined && b.roomBaseTotal !== null ? Number(b.roomBaseTotal) : undefined,
    roomSubtotal: b.roomSubtotal !== undefined && b.roomSubtotal !== null ? Number(b.roomSubtotal) : undefined,
    roomServiceCharge: b.roomServiceCharge !== undefined && b.roomServiceCharge !== null ? Number(b.roomServiceCharge) : undefined,
    roomGstAmount: b.roomGstAmount !== undefined && b.roomGstAmount !== null ? Number(b.roomGstAmount) : undefined,
    taxSettingsSnapshot: b.taxSettingsSnapshot || null,
    allocatedRooms: Array.isArray(b.allocatedRooms) ? b.allocatedRooms : [],
    totalAmount: total,
    amountPaid: paid,
    balanceDue: Math.max(0, total - paid),
    paymentStatus: b.paymentStatus || "",
    notes: b.notes || "",
    bookingSource: b.bookingSource || "Walk-In",
    razorpayPaymentId: b.razorpayPaymentId || null,
    status: (b.status || "").toLowerCase(),
    createdAt: b.createdAt || b.created_at || null
  };
}

export async function fetchReservations() {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
  const res = await fetch(`${API_BASE_URL}/reservations`, { headers });
  if (!res.ok) {
    throw new Error(`Reservations API error ${res.status}`);
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map(mapReservationFromApi);
}

export async function createReservation(payload) {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
  const res = await fetch(`${API_BASE_URL}/reservations`, {
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

export async function updateReservationPayment(id, payload) {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/payment`, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Server error ${res.status}`);
  }
  return await res.json();
}

export async function updateReservationStatus(id, status, reason = "") {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };
  const res = await fetch(`${API_BASE_URL}/reservations/${id}/status`, {
    method: "PUT",
    headers,
    body: JSON.stringify({ status, reason })
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Server error ${res.status}`);
  }
  return await res.json();
}
