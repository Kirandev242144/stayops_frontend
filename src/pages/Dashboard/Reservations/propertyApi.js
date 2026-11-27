import { API_BASE_URL } from '../../../config/api';

/**
 * Fetches properties from the backend and maps them into a normalized
 * structure that the Reservations form can use directly.
 *
 * Backend sends:
 *   - baseRate: Integer (often 0, unreliable — rates live inside pricing)
 *   - roomTypes: JSON string — array of { id, name, guests, quantity, ... }
 *   - pricing: JSON string — { roomRates: { [roomId]: { baseRate: "7500", weekendRate: "" } }, minStay, maxStay }
 */
export async function fetchProperties() {
  const token = localStorage.getItem("token");
  const headers = {
    "Authorization": token ? `Bearer ${token}` : "",
    "Content-Type": "application/json"
  };

  const res = await fetch(`${API_BASE_URL}/properties`, { headers });
  if (!res.ok) {
    throw new Error(`Properties API error ${res.status}`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) return [];

  return data.map(p => {
    // --- Parse roomTypes array ---
    let roomTypesList = [];
    if (p.roomTypes) {
      try {
        const parsed = JSON.parse(p.roomTypes);
        if (Array.isArray(parsed)) {
          roomTypesList = parsed;
        }
      } catch {
        // If it's a comma-separated string fallback
        roomTypesList = p.roomTypes.split(',').map((name, i) => ({
          id: String(i),
          name: name.trim(),
          guests: 2
        }));
      }
    }

    // --- Parse pricing to extract per-room rates ---
    let roomRates = {};
    let fallbackRate = Number(p.baseRate) || 0;
    if (p.pricing) {
      try {
        const pricingObj = typeof p.pricing === 'string'
          ? JSON.parse(p.pricing)
          : p.pricing;

        if (pricingObj && typeof pricingObj === 'object') {
          // pricing.roomRates is keyed by room id with { baseRate: "7500", weekendRate: "" }
          if (pricingObj.roomRates && typeof pricingObj.roomRates === 'object') {
            roomRates = pricingObj.roomRates;
          }
          // If there's a flat baseRate at the pricing level, use it as fallback
          if (pricingObj.baseRate) {
            const flat = Number(pricingObj.baseRate);
            if (!isNaN(flat) && flat > 0 && fallbackRate === 0) {
              fallbackRate = flat;
            }
          }
        }
      } catch {
        // pricing string malformed, skip
      }
    }

    // --- Build normalized rooms array ---
    const rooms = roomTypesList.map(r => {
      const rateEntry = roomRates[r.id] || roomRates[String(r.id)] || (r.name ? roomRates[r.name] : null);
      
      // 1. Primary rate from room type object itself (e.g. r.baseRate or r.rate)
      let rate = Number(r.baseRate ?? r.rate ?? 0);

      // 2. Override from pricing JSON object (p.pricing.roomRates)
      if (rate <= 0 && rateEntry) {
        const parsed = Number(rateEntry.baseRate);
        if (!isNaN(parsed) && parsed > 0) {
          rate = parsed;
        }
      }

      // 3. Fallback to property overall baseRate
      const maxAdults = Number(r.maxAdults || r.guests || r.capacity || 2);
      const maxChildren = Number(r.maxChildren !== undefined ? r.maxChildren : 1);

      return {
        id: r.id,
        name: r.name || "Unit",
        capacity: Number(r.guests || r.maxGuests) || maxAdults,
        maxAdults,
        maxChildren,
        totalMaxOccupants: maxAdults + maxChildren,
        rate: Math.max(0, rate),
        baseRate: Math.max(0, rate)
      };
    });

    // If no room types configured yet, create a single default unit from baseRate
    const defaultCapacity = 2;
    const finalRooms = rooms.length > 0
      ? rooms
      : [{ id: "default", name: p.type || "Unit", capacity: defaultCapacity, maxAdults: 2, maxChildren: 1, totalMaxOccupants: 3, rate: fallbackRate }];

    // Overall property baseRate = average of all room rates (or fallback)
    const avgRate = finalRooms.reduce((sum, r) => sum + r.rate, 0) / finalRooms.length;

    return {
      id: p.id,
      name: p.name || "",
      baseRate: Math.round(avgRate) || fallbackRate,
      capacity: defaultCapacity,
      rooms: finalRooms
    };
  });
}
