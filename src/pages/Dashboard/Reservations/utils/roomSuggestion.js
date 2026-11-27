/**
 * roomSuggestion.js
 * Smart Room Combination & Suggestion Algorithm for StayOps PMS.
 * Evaluates target guest count against available non-occupied rooms and finds
 * the optimal combination of rooms to satisfy guest capacity.
 */

import { getRoomCapacity } from './roomCapacity.js';

export function suggestOptimalRooms({
  guestCount = 1,
  availableRooms = [],
  occupiedRoomNames = new Set()
}) {
  const neededGuests = Math.max(1, Number(guestCount) || 1);
  if (!Array.isArray(availableRooms) || availableRooms.length === 0) {
    return {
      suggestedRooms: [],
      totalCapacity: 0,
      isSatisfied: false
    };
  }

  // 1. Filter out rooms that are occupied/blocked for the stay dates
  const freeRooms = availableRooms.filter(r => r && r.name && !occupiedRoomNames.has(r.name.trim()));
  if (freeRooms.length === 0) {
    return {
      suggestedRooms: [],
      totalCapacity: 0,
      isSatisfied: false
    };
  }

  // Helper to extract total max capacity of a room strictly from actual room data
  const getCap = (r) => getRoomCapacity(r).total;

  // Sort available free rooms by capacity descending
  const sortedRooms = [...freeRooms].sort((a, b) => getCap(b) - getCap(a));

  // 2. Check if a single room is sufficient
  const singleFit = sortedRooms.find(r => getCap(r) >= neededGuests);
  if (singleFit) {
    return {
      suggestedRooms: [singleFit],
      totalCapacity: getCap(singleFit),
      isSatisfied: true
    };
  }

  // 3. Multi-room greedy combination
  const selected = [];
  let currentCap = 0;

  for (const rm of sortedRooms) {
    selected.push(rm);
    currentCap += getCap(rm);
    if (currentCap >= neededGuests) {
      break;
    }
  }

  return {
    suggestedRooms: selected,
    totalCapacity: currentCap,
    isSatisfied: currentCap >= neededGuests
  };
}
