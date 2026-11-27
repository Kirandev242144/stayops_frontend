/**
 * reservationOccupancy.js
 * Multi-room occupancy and availability detection utility for StayOps PMS.
 */

// Normalized inactive/cancelled/checked-out reservation statuses that free up rooms
const INACTIVE_STATUS_TOKENS = new Set([
  'cancelled',
  'canceled',
  'checkedout',
  'noshow',
  'void'
]);

/**
 * Normalizes a status string into a clean alphanumeric token for exact comparison.
 * e.g. "Checked-Out" -> "checkedout", "No Show" -> "noshow", "Cancelled" -> "cancelled"
 */
function normalizeStatusToken(status) {
  if (!status) return '';
  return String(status).toLowerCase().replace(/[\s_-]/g, '').trim();
}

/**
 * Determines whether a reservation actively occupies room inventory.
 *
 * @param {Object} reservation
 * @returns {boolean} True if active/occupying, false if cancelled, checked out, or no-show.
 */
export function isReservationActive(reservation) {
  if (!reservation) return false;
  const token = normalizeStatusToken(reservation.status);
  if (!token) return true; // Default to active if status is absent or unknown
  return !INACTIVE_STATUS_TOKENS.has(token);
}

/**
 * Extracts all individual room unit names from a reservation.
 * Handles:
 * 1. allocatedRooms array of objects [{ roomUnit: 'Room 1' }, ...]
 * 2. Comma-separated roomUnit strings: "Room 101, Room 102"
 *
 * @param {Object} reservation
 * @returns {Array<string>} Array of distinct trimmed room unit names
 */
export function extractReservationRoomUnits(reservation) {
  if (!reservation) return [];
  const units = new Set();

  // 1. Itemized allocated rooms
  if (Array.isArray(reservation.allocatedRooms) && reservation.allocatedRooms.length > 0) {
    reservation.allocatedRooms.forEach(ar => {
      const name = ar?.roomUnit || ar?.name;
      if (name && typeof name === 'string') {
        const trimmed = name.trim();
        if (trimmed) units.add(trimmed);
      }
    });
  }

  // 2. Comma-separated or single roomUnit string
  const rawUnit = reservation.roomUnit || reservation.unit;
  if (rawUnit && typeof rawUnit === 'string') {
    rawUnit.split(',').forEach(part => {
      const trimmed = part.trim();
      if (trimmed) units.add(trimmed);
    });
  }

  return Array.from(units);
}

/**
 * Compares two date ranges using strict date-only (YYYY-MM-DD) string comparison.
 * Prevents UTC/local timezone shifts from offsetting overnight stays.
 *
 * Overlap condition: reqCheckIn < existingCheckOut && reqCheckOut > existingCheckIn
 *
 * @param {string|Date} inA
 * @param {string|Date} outA
 * @param {string|Date} inB
 * @param {string|Date} outB
 * @returns {boolean} True if the stays overlap
 */
export function areDateRangesOverlapping(inA, outA, inB, outB) {
  const toDateStr = (val) => {
    if (!val) return '';
    if (typeof val === 'string') return val.split('T')[0].trim();
    if (val instanceof Date && !isNaN(val)) return val.toISOString().split('T')[0];
    return '';
  };

  const startA = toDateStr(inA);
  const endA = toDateStr(outA);
  const startB = toDateStr(inB);
  const endB = toDateStr(outB);

  if (!startA || !endA || !startB || !endB) return false;
  return startA < endB && endA > startB;
}

/**
 * Calculates the set of occupied room unit names for a given property and stay dates.
 *
 * @param {Array<Object>} reservationsList
 * @param {Object} query
 * @param {string} query.checkIn
 * @param {string} query.checkOut
 * @param {string|number} [query.propertyId]
 * @param {string|number} [query.excludeReservationId] Exclude reservation currently being edited
 * @returns {Set<string>} Set of occupied room unit names
 */
export function getOccupiedRoomNames(reservationsList = [], {
  checkIn,
  checkOut,
  propertyId = null,
  excludeReservationId = null
} = {}) {
  const occupied = new Set();
  if (!checkIn || !checkOut || !Array.isArray(reservationsList) || reservationsList.length === 0) {
    return occupied;
  }

  const targetPropId = propertyId !== null && propertyId !== undefined ? String(propertyId).trim() : '';

  reservationsList.forEach(r => {
    if (!r) return;

    // Skip inactive reservations (cancelled, checked-out, no-show)
    if (!isReservationActive(r)) return;

    // Skip current reservation if editing
    if (excludeReservationId && (r.id === excludeReservationId || r.dbId === excludeReservationId)) {
      return;
    }

    // Filter by property if propertyId is provided
    if (targetPropId) {
      const rPropId = String(r.propertyId || r.property?.id || '').trim();
      if (rPropId && rPropId !== targetPropId) {
        return;
      }
    }

    const rCheckIn = r.checkIn || r.checkin;
    const rCheckOut = r.checkOut || r.checkout;

    if (areDateRangesOverlapping(checkIn, checkOut, rCheckIn, rCheckOut)) {
      const units = extractReservationRoomUnits(r);
      units.forEach(u => occupied.add(u));
    }
  });

  return occupied;
}
