import { API_BASE_URL } from '../../../config/api';
import { fetchProperties } from '../Reservations/propertyApi';
import { fetchReservations } from '../Reservations/reservationApi';
import { extractRoomsFromProperties, resolveRoomHousekeeping } from '../Calendar/utils/calendarUtils';
import { fetchHousekeepingStatuses } from '../Frontdesk/housekeepingApi';
import { fetchTeamMembers } from '../Team/teamApi';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json'
  };
}

/**
 * Loads and correlates all data required for the Housekeeping Hub:
 * - Properties & Rooms
 * - Reservations (for occupancy & arriving/departing correlation)
 * - Housekeeping Statuses from backend
 * - Staff list for task assignment
 */
export async function loadHousekeepingHubData(selectedPropertyId = 'all') {
  try {
    const [properties, reservations, rawHousekeepingList, teamMembers] = await Promise.all([
      fetchProperties().catch(() => []),
      fetchReservations().catch(() => []),
      fetchHousekeepingStatuses(selectedPropertyId).catch(() => []),
      fetchTeamMembers().catch(() => [])
    ]);

    // Build lookup map for housekeeping records (property-scoped keys prioritized)
    const housekeepingMap = {};
    if (Array.isArray(rawHousekeepingList)) {
      rawHousekeepingList.forEach(item => {
        if (!item) return;
        const pId = item.propertyId ? String(item.propertyId) : '1';
        const rId = String(item.roomId || '').trim();
        if (rId) {
          // Property-scoped keys are authoritative
          housekeepingMap[`${pId}-${rId}`] = item;
          housekeepingMap[`${pId}-${rId.toLowerCase()}`] = item;
          // Unscoped fallback only if not already populated
          if (!housekeepingMap[rId]) {
            housekeepingMap[rId] = item;
            housekeepingMap[rId.toLowerCase()] = item;
          }
        }
      });
    }

    // Extract all room units across properties
    const rooms = extractRoomsFromProperties(properties, selectedPropertyId);

    const todayStr = new Date().toISOString().split('T')[0];

    // Correlate rooms with reservations and housekeeping
    const correlatedRooms = rooms.map(room => {
      const propId = String(room.propertyId || '1');
      const roomName = String(room.name || '').trim().toLowerCase();
      const rawRoomId = String(room.rawId || room.id || '');

      // Helper to detect checked-out statuses regardless of underscores, casing or formatting
      const isCheckedOutStatus = (status) => {
        const s = String(status || '').toLowerCase().replace(/[-_\s]/g, '');
        return s.includes('checkedout') || s.includes('checkout') || s.includes('depart') || s === 'completed' || s === 'out';
      };

      const isCancelledOrInactiveStatus = (status) => {
        const s = String(status || '').toLowerCase().replace(/[-_\s]/g, '');
        return isCheckedOutStatus(status) || s.includes('cancel') || s.includes('noshow');
      };

      // Helper to check if a reservation is allocated to this room unit
      const matchesUnit = (res) => {
        const resPropId = res.propertyId ? String(res.propertyId) : (res.property?.id ? String(res.property.id) : null);
        if (resPropId && resPropId !== propId) return false;

        if (Array.isArray(res.allocatedRooms) && res.allocatedRooms.length > 0) {
          return res.allocatedRooms.some(ar => {
            const u = (ar.roomUnit || ar.roomTypeName || ar.name || '').toLowerCase().trim();
            return u === roomName || (ar.roomId && String(ar.roomId) === rawRoomId);
          });
        }

        const unit = (res.roomUnit || res.unit || '').toLowerCase().trim();
        return unit === roomName || unit.includes(roomName);
      };

      // 1. Check for reservations that checked out today (or recently vacated)
      let isCheckedOutToday = false;
      let departedGuest = null;
      let checkedOutRes = null;

      (reservations || []).forEach(res => {
        if (!matchesUnit(res)) return;
        const checkOut = res.checkOut || res.checkout || '';
        if (isCheckedOutStatus(res.status) && (checkOut === todayStr || checkOut <= todayStr)) {
          isCheckedOutToday = true;
          departedGuest = res.guestName || res.guest || 'Guest';
          checkedOutRes = res;
        }
      });

      // 2. Find currently active / upcoming reservations for this room unit (strictly non-checked-out)
      const activeReservations = (reservations || []).filter(res => {
        if (isCancelledOrInactiveStatus(res.status)) {
          return false;
        }
        return matchesUnit(res);
      });

      // 3. Correlate Occupancy & Today's Schedule
      let occupancyStatus = 'Vacant';
      let currentGuest = null;
      let isDepartingToday = false;
      let isArrivingToday = false;
      let todayReservation = null;

      activeReservations.forEach(res => {
        const checkIn = res.checkIn || res.checkin || '';
        const checkOut = res.checkOut || res.checkout || '';
        const guestName = res.guestName || res.guest || 'Guest';

        if (checkOut === todayStr) {
          isDepartingToday = true;
          todayReservation = res;
          currentGuest = guestName;
        } else if (checkIn === todayStr) {
          isArrivingToday = true;
          todayReservation = res;
          currentGuest = guestName;
        } else if (checkIn <= todayStr && checkOut > todayStr) {
          occupancyStatus = 'Occupied (Stayover)';
          currentGuest = guestName;
          todayReservation = res;
        }
      });

      // Prioritize checked-out / vacated status
      if (isCheckedOutToday) {
        occupancyStatus = 'Vacant (Departed)';
        currentGuest = departedGuest;
        todayReservation = checkedOutRes;
      } else if (isDepartingToday) {
        occupancyStatus = 'Occupied (Due Out)';
      } else if (isArrivingToday && occupancyStatus !== 'Occupied (Stayover)') {
        occupancyStatus = 'Vacant (Arrival Expected)';
      }

      // 4. Resolve Housekeeping Status & Metadata
      const hkResolved = resolveRoomHousekeeping(room, housekeepingMap);
      const hkRecord = hkResolved.rawEntry || {};
      const photoProofUrl = hkRecord.photoProofUrl || null;
      const lastCleanedAt = hkRecord.lastCleanedAt || null;

      // Check if cleaning happened today (after any checkout)
      let cleanedToday = false;
      if (lastCleanedAt) {
        try {
          const cleanedDate = new Date(lastCleanedAt).toISOString().split('T')[0];
          cleanedToday = (cleanedDate === todayStr);
        } catch {
          cleanedToday = false;
        }
      }

      let status = 'DIRTY';
      if (hkRecord.status === 'OUT_OF_ORDER' || hkRecord.maintenanceIssue) {
        status = 'OUT_OF_ORDER';
      } else if (hkRecord.status === 'IN_PROGRESS') {
        status = 'IN_PROGRESS';
      } else if (photoProofUrl && (hkRecord.status === 'CLEAN' || hkRecord.status === 'INSPECTED') && cleanedToday) {
        // Fresh turnover completed today with verified photo proof!
        status = hkRecord.status.toUpperCase();
      } else if (isDepartingToday || isCheckedOutToday) {
        // Checked-out or departing guest: turnover needed until cleaned with photo proof
        status = 'DIRTY';
      } else if (occupancyStatus === 'Occupied (Stayover)') {
        status = (hkRecord.status === 'CLEAN') ? 'CLEAN' : 'DIRTY';
      } else {
        // Vacant room with no checkout today: default to record status or DIRTY
        status = (hkRecord.status || hkResolved.status || 'DIRTY').toUpperCase();
      }

      const assignedTo = hkRecord.assignedTo || null;
      const taskType = hkRecord.taskType || (
        (isDepartingToday || isCheckedOutToday) ? 'TURNOVER' : 
        occupancyStatus.includes('Stayover') ? 'STAYOVER' : 'DEEP_CLEAN'
      );
      
      const priority = hkRecord.priority || (
        (isArrivingToday && status !== 'CLEAN' && status !== 'INSPECTED') ? 'RUSH' :
        isDepartingToday ? 'HIGH' :
        occupancyStatus.includes('Stayover') ? 'STAYOVER' : 'NORMAL'
      );

      const cleanedBy = hkRecord.cleanedBy || null;
      const notes = hkRecord.notes || '';
      const maintenanceIssue = hkRecord.maintenanceIssue || null;
      const maintenanceSeverity = hkRecord.maintenanceSeverity || null;
      const isUrgentTurnover = isArrivingToday && status !== 'CLEAN' && status !== 'INSPECTED';
      
      // Hotel Operational Principle: If a room is DIRTY (or undergoing checkout turnover),
      // previous cleaning photos and completed checkmarks belong to the vacated stay and are invalid.
      // Checklist tasks must start unchecked (completed: false) and photo proof must be empty for the new turnover.
      const isDirtyRoom = status === 'DIRTY' || status === 'OUT_OF_ORDER' || (isCheckedOutToday && status !== 'CLEAN' && status !== 'INSPECTED');
      const activePhotoProofUrl = isDirtyRoom ? null : photoProofUrl;

      const isReadyForCheckin = (
        (occupancyStatus === 'Vacant' || occupancyStatus.includes('Vacant')) &&
        (status === 'CLEAN' || status === 'INSPECTED') &&
        Boolean(activePhotoProofUrl)
      );

      let parsedChecklist = null;
      if (hkRecord.checklistJson) {
        try {
          const rawParsed = JSON.parse(hkRecord.checklistJson);
          if (Array.isArray(rawParsed)) {
            parsedChecklist = rawParsed.map(item => ({
              ...item,
              completed: isDirtyRoom ? false : Boolean(item.completed)
            }));
          }
        } catch {
          parsedChecklist = null;
        }
      }

      return {
        ...room,
        propertyId: propId,
        propertyName: room.propertyName || 'Property',
        cleaningStatus: status,
        occupancyStatus,
        currentGuest,
        isDepartingToday,
        isCheckedOutToday,
        isArrivingToday,
        isUrgentTurnover,
        isReadyForCheckin,
        todayReservation,
        assignedTo,
        taskType,
        priority,
        photoProofUrl: activePhotoProofUrl,
        cleanedBy: isDirtyRoom ? null : cleanedBy,
        lastCleanedAt: isDirtyRoom ? null : lastCleanedAt,
        notes,
        maintenanceIssue,
        maintenanceSeverity,
        checklist: parsedChecklist,
        rawHkRecord: hkRecord
      };
    });

    return {
      properties,
      rooms: correlatedRooms,
      teamMembers: (teamMembers || []).filter(m => m.status !== 'Inactive')
    };
  } catch (err) {
    console.error('Error loading housekeeping hub data:', err);
    throw err;
  }
}

/**
 * Updates room housekeeping status with checklist, priority, and photo proof.
 */
export async function updateRoomCleaningStatus({
  propertyId,
  roomId,
  roomName,
  rawId,
  status,
  notes = '',
  assignedTo = null,
  priority = 'NORMAL',
  taskType = 'TURNOVER',
  checklist = null,
  photoUrl = null
}) {
  const primaryRoomId = String(roomName || roomId).trim();
  const payload = {
    propertyId: Number(propertyId || 1),
    roomId: primaryRoomId,
    roomName: roomName ? String(roomName).trim() : primaryRoomId,
    status: status.toUpperCase(),
    notes,
    assignedTo,
    priority,
    taskType,
    checklistJson: checklist ? JSON.stringify(checklist) : null,
    photoUrl
  };

  const response = await fetch(`${API_BASE_URL}/housekeeping/status`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update room status: HTTP ${response.status}`);
  }

  const result = await response.json();

  // If rawId or id is different from primaryRoomId, sync to alias
  const aliases = new Set();
  if (roomId && String(roomId).trim() !== primaryRoomId) aliases.add(String(roomId).trim());
  if (rawId && String(rawId).trim() !== primaryRoomId) aliases.add(String(rawId).trim());

  for (const alias of aliases) {
    try {
      await fetch(`${API_BASE_URL}/housekeeping/status`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ ...payload, roomId: alias })
      });
    } catch {}
  }

  return result;
}

/**
 * Assigns staff member to room cleaning.
 */
export async function assignHousekeepingStaff({
  propertyId,
  roomId,
  assignedTo,
  priority = 'NORMAL',
  taskType = 'TURNOVER',
  notes = ''
}) {
  const payload = {
    propertyId: Number(propertyId || 1),
    roomId: String(roomId).trim(),
    assignedTo,
    priority,
    taskType,
    notes
  };

  const response = await fetch(`${API_BASE_URL}/housekeeping/assign`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to assign staff: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Reports a maintenance issue for a room.
 */
export async function reportRoomMaintenance({
  propertyId,
  roomId,
  issue,
  severity = 'MODERATE',
  markOutOfOrder = true
}) {
  const payload = {
    propertyId: Number(propertyId || 1),
    roomId: String(roomId).trim(),
    issue,
    severity,
    markOutOfOrder
  };

  const response = await fetch(`${API_BASE_URL}/housekeeping/maintenance`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to log maintenance issue: HTTP ${response.status}`);
  }

  return await response.json();
}

/**
 * Resolves a room maintenance issue and returns room to Turnover Required.
 */
export async function resolveRoomMaintenance({
  propertyId,
  roomId,
  resolutionNotes = 'Repairs completed'
}) {
  const payload = {
    propertyId: Number(propertyId || 1),
    roomId: String(roomId).trim(),
    resolutionNotes
  };

  const response = await fetch(`${API_BASE_URL}/housekeeping/maintenance/resolve`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Failed to resolve maintenance issue: HTTP ${response.status}`);
  }

  return await response.json();
}
