/**
 * calendarUtils.js
 * Comprehensive utilities for PMS Tape Chart Calendar calculations, 
 * date formatting, housekeeping resolution, and grid positioning.
 */

/**
 * Formats a Date object or date string to YYYY-MM-DD string
 */
export function formatDateKey(dateObj) {
  if (!dateObj) return '';
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return '';
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns an array of Date objects for N days starting from startDate
 */
export function getDaysArray(startDate, numDays = 14) {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  const days = [];
  for (let i = 0; i < numDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    days.push(current);
  }
  return days;
}

/**
 * Checks if a given Date object is Today
 */
export function isToday(dateObj) {
  const today = new Date();
  return (
    dateObj.getDate() === today.getDate() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a given Date object is a Weekend (Sat / Sun)
 */
export function isWeekend(dateObj) {
  const day = dateObj.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Calculates start index, column span, and turnover margin offsets for PMS same-day check-in/check-out
 */
export function calculateBookingPosition(checkInStr, checkOutStr, daysArray) {
  if (!checkInStr || !checkOutStr || daysArray.length === 0) {
    return { isVisible: false, startIndex: -1, span: 0 };
  }

  const gridStart = new Date(daysArray[0]);
  gridStart.setHours(0, 0, 0, 0);
  const gridEnd = new Date(daysArray[daysArray.length - 1]);
  gridEnd.setHours(23, 59, 59, 999);

  const checkIn = new Date(checkInStr);
  checkIn.setHours(0, 0, 0, 0);
  const checkOut = new Date(checkOutStr);
  checkOut.setHours(0, 0, 0, 0);

  // If check-out is before or at grid start OR check-in is after grid end, not visible
  if (checkOut <= gridStart || checkIn > gridEnd) {
    return { isVisible: false, startIndex: -1, span: 0 };
  }

  // Calculate day difference from grid start
  const diffTimeStart = checkIn - gridStart;
  const startIndexRaw = Math.floor(diffTimeStart / (1000 * 60 * 60 * 24));
  const startIndex = Math.max(0, startIndexRaw);

  // Calculate stay duration in nights
  const stayNights = Math.max(1, Math.round((checkOut - checkIn) / (1000 * 60 * 60 * 24)));
  
  // Grid column alignment: check-in day column through check-out day column (stayNights + 1 columns)
  const gridColStart = startIndex + 1; // 1-indexed for CSS Grid
  const totalCols = stayNights + 1;
  const gridColEnd = gridColStart + totalCols;

  // Turnover margin offsets: start at ~42% of check-in cell, end at ~54% of check-out cell
  const marginLeftPercent = (0.42 / totalCols) * 100;
  const marginRightPercent = (0.46 / totalCols) * 100;

  return {
    isVisible: true,
    startIndex,
    span: stayNights,
    gridColStart,
    gridColEnd,
    stayNights,
    marginLeftPercent,
    marginRightPercent,
    isOverflowLeft: startIndexRaw < 0,
    isOverflowRight: (startIndexRaw + stayNights) >= daysArray.length
  };
}

/**
 * Extracts and groups room units strictly from database property list
 */
export function extractRoomsFromProperties(propertiesList, selectedPropertyId = 'all') {
  let filteredProps = propertiesList || [];
  if (selectedPropertyId && selectedPropertyId !== 'all') {
    filteredProps = filteredProps.filter(p => String(p.id) === String(selectedPropertyId));
  }

  const roomList = [];
  filteredProps.forEach(prop => {
    const propName = prop.name || 'Property';
    const propId = prop.id;

    if (Array.isArray(prop.rooms) && prop.rooms.length > 0) {
      prop.rooms.forEach((r, idx) => {
        const rName = r.name || `Unit ${r.id || idx + 1}`;
        const category = r.category || r.roomType || propName || 'Standard Room';

        const hkStatus = r.housekeepingStatus || r.housekeeping || 'Clean';

        roomList.push({
          id: `${propId}-${r.id || idx}`,
          rawId: r.id,
          name: rName,
          category,
          capacity: r.capacity || r.maxAdults || 2,
          pricePerNight: r.rate || r.baseRate || prop.baseRate || 0,
          housekeeping: hkStatus,
          propertyId: propId,
          propertyName: propName
        });
      });
    }
  });

  return roomList;
}

/**
 * Resolves the housekeeping status and photo proof details for a given room.
 */
export function resolveRoomHousekeeping(room, housekeepingMap = {}) {
  const roomKey = String(room.name || room.id).trim();
  const cleanNameKey = roomKey.split('—')[0].split('-')[0].trim();
  const propIdKey = room.propertyId ? String(room.propertyId).trim() : '1';

  const rawIdKey = room.rawId !== undefined && room.rawId !== null ? String(room.rawId).trim() : '';

  // Prioritize property-scoped keys first to avoid cross-property collision,
  // and check exact room unit matches before broad aliases.
  const candidateKeys = [
    `${propIdKey}-${roomKey}`,
    `${propIdKey}-${cleanNameKey}`,
    ...(rawIdKey ? [`${propIdKey}-${rawIdKey}`] : []),
    `${propIdKey}-${room.id}`,
    roomKey,
    cleanNameKey,
    String(room.id),
    ...(rawIdKey ? [rawIdKey] : [])
  ];

  let rawEntry = null;
  // Match candidate key in order of specificity (respecting current DB status, whether DIRTY or CLEAN)
  for (const k of candidateKeys) {
    const entry = housekeepingMap[k] || housekeepingMap[k.toLowerCase()];
    if (entry && typeof entry === 'object') {
      rawEntry = entry;
      break;
    }
  }

  const rawStatus = (rawEntry && typeof rawEntry === 'object') 
    ? (rawEntry.status || room.housekeeping || 'CLEAN') 
    : (rawEntry || room.housekeeping || 'CLEAN');

  const hkUpper = String(rawStatus).toUpperCase();
  const photoProofUrl = (rawEntry && typeof rawEntry === 'object') ? rawEntry.photoProofUrl : null;

  return {
    status: hkUpper,
    isClean: hkUpper === 'CLEAN',
    isDirty: hkUpper === 'DIRTY',
    isInProgress: hkUpper === 'IN_PROGRESS',
    photoProofUrl,
    rawEntry,
    roomKey
  };
}

/**
 * Filters active reservations for a specific room unit, excluding completed/cancelled/checked-out guests.
 * Enforces strict property scoping and exact room unit token matching.
 */
export function filterActiveRoomReservations(reservationsList = [], room) {
  if (!room || !Array.isArray(reservationsList)) return [];

  return reservationsList.filter(b => {
    const status = (b.status || '').toLowerCase().trim();
    const isInactive = 
      status.includes('cancel') || 
      status.includes('checkout') || 
      status.includes('check_out') || 
      status.includes('checked out') || 
      status.includes('checkedout') ||
      status.includes('depart') ||
      status.includes('noshow') ||
      status.includes('no_show') ||
      status.includes('no-show') ||
      status === 'out' ||
      status === 'completed';

    if (isInactive) return false;

    // 1. Strict Property Scoping
    const roomPropId = room.propertyId !== undefined && room.propertyId !== null 
      ? String(room.propertyId).trim() 
      : null;
    const bPropId = b.propertyId !== undefined && b.propertyId !== null 
      ? String(b.propertyId).trim() 
      : (b.property_id !== undefined && b.property_id !== null 
          ? String(b.property_id).trim() 
          : (b.property?.id !== undefined && b.property?.id !== null 
              ? String(b.property.id).trim() 
              : null));

    if (roomPropId && bPropId && roomPropId !== bPropId) {
      return false;
    }

    // Property Name fallback if ID is missing on booking
    if (!bPropId && room.propertyName && (b.propertyName || b.property_name)) {
      const bPropName = (b.propertyName || b.property_name || '').toLowerCase().trim();
      if (room.propertyName.toLowerCase().trim() !== bPropName) {
        return false;
      }
    }

    const roomName = room.name ? room.name.toLowerCase().trim() : '';

    // 2. Check allocatedRooms structured array
    if (Array.isArray(b.allocatedRooms) && b.allocatedRooms.length > 0) {
      const isAllocated = b.allocatedRooms.some(r => {
        if (room.rawId && (r.roomTypeId || r.roomId)) {
          if (String(r.roomTypeId || r.roomId) === String(room.rawId)) return true;
        }
        const u = (r.roomUnit || r.roomTypeName || r.name || '').toLowerCase().trim();
        if (!u) return false;
        const parts = u.split(',').map(s => s.trim());
        return parts.includes(roomName) || u === roomName;
      });
      if (isAllocated) return true;
    }

    // 3. Fallback to roomUnit scalar string with token matching
    const resUnit = (b.roomUnit || b.unit || '').toLowerCase().trim();
    if (resUnit) {
      const parts = resUnit.split(',').map(s => s.trim());
      return parts.includes(roomName) || resUnit === roomName;
    }

    return false;
  });
}

