/**
 * roomCapacity.js
 * Centralized capacity extraction and calculation utility for StayOps PMS.
 *
 * Rules:
 * 1. Derives capacity strictly from actual room fields.
 * 2. Never invents fallbacks (such as 2 adults / 1 child). If capacity is missing,
 *    it is reported as unknown/unconfigured.
 */

/**
 * Safely parses a number with a minimum threshold.
 */
function parsePositiveNumber(val) {
  if (val === undefined || val === null || val === '') return null;
  const num = Number(val);
  return !isNaN(num) && num >= 0 ? num : null;
}

/**
 * Extracts capacity for a single room unit.
 *
 * Checks:
 * - totalMaxOccupants: explicit combined occupant cap
 * - maxAdults / capacity / guests / maxGuests: adult capacity
 * - maxChildren: child capacity
 *
 * @param {Object} room Room object from property configuration
 * @returns {{ adults: number, children: number, total: number, hasKnownCapacity: boolean }}
 */
export function getRoomCapacity(room) {
  if (!room || typeof room !== 'object') {
    return {
      adults: 0,
      children: 0,
      total: 0,
      hasKnownCapacity: false
    };
  }

  const adultVal = parsePositiveNumber(
    room.maxAdults ?? room.capacity ?? room.guests ?? room.maxGuests
  );
  const childVal = parsePositiveNumber(room.maxChildren);
  const totalVal = parsePositiveNumber(room.totalMaxOccupants);

  const adults = adultVal !== null && adultVal > 0 ? adultVal : 0;
  const children = childVal !== null ? childVal : 0;

  let total = 0;
  let hasKnownCapacity = false;

  if (totalVal !== null && totalVal > 0) {
    total = totalVal;
    hasKnownCapacity = true;
  } else if (adultVal !== null && adultVal > 0) {
    total = adults + children;
    hasKnownCapacity = true;
  } else if (childVal !== null && childVal > 0) {
    total = children;
    hasKnownCapacity = true;
  }

  return {
    adults,
    children,
    total,
    hasKnownCapacity
  };
}

/**
 * Computes aggregated capacity across an array of allocated rooms.
 *
 * @param {Array<Object>} roomsList Array of room objects
 * @returns {{ totalCapacity: number, totalAdults: number, totalChildren: number, hasKnownCapacity: boolean }}
 */
export function calculateRoomsTotalCapacity(roomsList) {
  if (!Array.isArray(roomsList) || roomsList.length === 0) {
    return {
      totalCapacity: 0,
      totalAdults: 0,
      totalChildren: 0,
      hasKnownCapacity: false
    };
  }

  let totalCapacity = 0;
  let totalAdults = 0;
  let totalChildren = 0;
  let hasAnyKnown = false;

  roomsList.forEach(rm => {
    const cap = getRoomCapacity(rm);
    if (cap.hasKnownCapacity) {
      hasAnyKnown = true;
      totalCapacity += cap.total;
      totalAdults += cap.adults;
      totalChildren += cap.children;
    }
  });

  return {
    totalCapacity,
    totalAdults,
    totalChildren,
    hasKnownCapacity: hasAnyKnown
  };
}

/**
 * Formats user-facing capacity label for dropdowns and badges.
 *
 * @param {Object} room Room object
 * @returns {string} e.g. "Max 3 Guests" or "Capacity unconfigured"
 */
export function formatRoomCapacityLabel(room) {
  const cap = getRoomCapacity(room);
  if (!cap.hasKnownCapacity || cap.total <= 0) {
    return 'Capacity unconfigured';
  }
  return `Max ${cap.total} Guest${cap.total > 1 ? 's' : ''}`;
}
