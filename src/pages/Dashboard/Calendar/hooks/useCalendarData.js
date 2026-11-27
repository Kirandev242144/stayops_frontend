import { useState, useEffect, useCallback } from 'react';
import { fetchProperties } from '../../Reservations/propertyApi';
import { fetchReservations } from '../../Reservations/reservationApi';
import { fetchGuests } from '../../Reservations/guestApi';
import { fetchMealOrders } from '../../Frontdesk/frontdeskApi';
import { 
  fetchBlockedDates, 
  createBlockedDateApi, 
  deleteBlockedDateApi,
  fetchRateOverrides, 
  saveSingleRateOverrideApi, 
  saveBulkRateOverridesApi,
  fetchHousekeepingStatusesApi,
  updateHousekeepingStatusApi
} from '../calendarApi';
import { API_BASE_URL } from '../../../../config/api';
import { useWebSocketContext } from '../../../../context/WebSocketContext';
import { getDaysArray, extractRoomsFromProperties, formatDateKey } from '../utils/calendarUtils';

export function useCalendarData() {
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [numDays, setNumDays] = useState(14); // 7, 14, or 30 days
  const [viewMode, setViewMode] = useState('rates_and_stays'); // 'rates_and_stays' or 'stays'
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [propertiesList, setPropertiesList] = useState([]);
  const [reservationsList, setReservationsList] = useState([]);
  const [guestsList, setGuestsList] = useState([]);
  const [mealOrders, setMealOrders] = useState([]);
  const [taxSettings, setTaxSettings] = useState(null);
  const [taxSettingsMap, setTaxSettingsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Rate overrides, Blocked dates, and Housekeeping state
  const [customRates, setCustomRates] = useState({});
  const [blockedDates, setBlockedDates] = useState([]);
  const [housekeepingMap, setHousekeepingMap] = useState({});

  const { subscribe } = useWebSocketContext();

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: token ? `Bearer ${token}` : '' };

      const allowedPropIds = (selectedPropertyId && selectedPropertyId !== 'all') ? [selectedPropertyId] : [];

      const [props, resList, gList, mList, bList, rMap, hkMap] = await Promise.all([
        fetchProperties(),
        fetchReservations(),
        fetchGuests(),
        fetchMealOrders().catch(() => []),
        fetchBlockedDates().catch(() => []),
        fetchRateOverrides().catch(() => ({})),
        fetchHousekeepingStatusesApi(selectedPropertyId, allowedPropIds).catch(() => ({}))
      ]);

      setPropertiesList(props || []);
      setReservationsList(resList || []);
      setGuestsList(gList || []);
      setMealOrders(mList || []);
      setBlockedDates(bList || []);
      setCustomRates(rMap || {});
      setHousekeepingMap(hkMap || {});

      if (props && props.length > 0) {
        const tMap = {};
        await Promise.all(props.map(async (p) => {
          try {
            const taxRes = await fetch(`${API_BASE_URL}/properties/${p.id}/taxes`, { headers });
            if (taxRes.ok) {
              const taxData = await taxRes.json();
              tMap[p.id] = taxData;
              tMap[String(p.id)] = taxData;
            }
          } catch (tErr) {
            console.error(`Calendar tax settings error for prop ${p.id}:`, tErr);
          }
        }));
        setTaxSettingsMap(tMap);
        setTaxSettings(tMap[props[0].id] || null);
      }
    } catch (err) {
      console.error("Calendar data load error:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Handle real-time WebSocket delta events in-memory without extra HTTP requests
  const handleWebSocketMessage = useCallback((msg) => {
    if (!msg || !msg.event) return;
    const { event, data } = msg;

    if (event === "RESERVATION_CREATED" && data && data.id) {
      setReservationsList(prev => {
        const exists = prev.some(r => String(r.id) === String(data.id));
        if (exists) return prev.map(r => String(r.id) === String(data.id) ? { ...r, ...data } : r);
        return [data, ...prev];
      });
    } else if ((event === "RESERVATION_UPDATED" || event === "PAYMENT_UPDATED") && data && data.id) {
      setReservationsList(prev => prev.map(r => String(r.id) === String(data.id) ? { ...r, ...data } : r));
    } else if (event === "RESERVATION_DELETED" && data && data.id) {
      setReservationsList(prev => prev.filter(r => String(r.id) !== String(data.id)));
    } else if ((event === "STATUS_UPDATED" || event === "PROOF_UPLOADED") && data && data.roomId) {
      const roomKey = String(data.roomId).trim();
      setHousekeepingMap(prev => ({
        ...prev,
        [roomKey]: {
          status: data.status || 'CLEAN',
          photoProofUrl: data.photoProofUrl || null,
          cleanedBy: data.cleanedBy || null,
          notes: data.notes || null,
          lastCleanedAt: data.lastCleanedAt || null,
          updatedAt: data.updatedAt || null
        }
      }));
    } else {
      loadData(true);
    }
  }, [loadData]);

  // Real-time WebSocket channel subscriptions & silent auto-refresh for direct DB edits (e.g. DBeaver)
  useEffect(() => {
    const unsub1 = subscribe("BOOKING_UPDATED", handleWebSocketMessage);
    const unsub2 = subscribe("FRONTDESK", handleWebSocketMessage);
    const unsub3 = subscribe("RESERVATIONS", handleWebSocketMessage);
    const unsub4 = subscribe("MEALS", handleWebSocketMessage);

    const handleFocus = () => loadData(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadData(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic heartbeat poll (every 30 seconds) as a backup safety net
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') loadData(true);
    }, 30000);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [subscribe, loadData, handleWebSocketMessage]);

  // Date Navigation Actions
  const handlePrevDays = () => {
    setStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - numDays);
      return d;
    });
  };

  const handleNextDays = () => {
    setStartDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + numDays);
      return d;
    });
  };

  const handleResetToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setStartDate(today);
  };

  // Bulk Price Update Action (Persisted to Database)
  const applyBulkPrice = async ({ roomId, startDateStr, endDateStr, adjustmentType, rateValue, selectedDays }) => {
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const targetRooms = roomId === 'all' 
      ? extractRoomsFromProperties(propertiesList, selectedPropertyId)
      : [{ id: roomId, pricePerNight: extractRoomsFromProperties(propertiesList, selectedPropertyId).find(r => String(r.id) === String(roomId))?.pricePerNight }];

    const updatedRates = { ...customRates };
    const itemsToSave = [];

    targetRooms.forEach(rm => {
      const baseRate = rm.pricePerNight || rm.baseRate || 3500;
      const curr = new Date(start);

      while (curr <= end) {
        const dayIdx = curr.getDay(); // 0 = Sun, 1 = Mon, ...
        if (selectedDays[dayIdx]) {
          const dateKey = formatDateKey(curr);
          const key = `${rm.id}_${dateKey}`;
          
          // Current reference value: existing override rate if present, else base rate
          const currentVal = updatedRates[key] ?? baseRate;
          let computedRate = currentVal;

          if (adjustmentType === 'fixed') {
            computedRate = Math.max(0, rateValue);
          } else if (adjustmentType === 'percent') {
            // e.g. rateValue = 10 -> +10% on current rate
            // e.g. rateValue = -10 -> -10% on current rate
            computedRate = Math.max(0, Math.round(currentVal * (1 + rateValue / 100)));
          } else if (adjustmentType === 'flat') {
            // e.g. rateValue = 500 -> +500 flat on current rate
            // e.g. rateValue = -500 -> -500 flat on current rate
            computedRate = Math.max(0, currentVal + rateValue);
          }

          updatedRates[key] = computedRate;

          itemsToSave.push({
            propertyId: 1,
            roomId: String(rm.id),
            date: dateKey,
            overrideRate: computedRate
          });
        }
        curr.setDate(curr.getDate() + 1);
      }
    });

    // 1. Optimistic Local State Update
    setCustomRates(updatedRates);

    // 2. Persist exact computed rates to Spring Boot Database API
    try {
      if (itemsToSave.length > 0) {
        await saveBulkRateOverridesApi(itemsToSave);
      }
    } catch (err) {
      console.error("Save bulk rate overrides error:", err);
    }
  };

  // Block Dates Action (Persisted to Database)
  const addBlockedDates = async ({ roomId, startDateStr, endDateStr, category, notes }) => {
    // 1. Optimistic Local State Update
    const newBlock = {
      id: `BLK-${Date.now()}`,
      roomId,
      startDateStr,
      endDateStr,
      category,
      notes
    };
    setBlockedDates(prev => [newBlock, ...prev]);

    // 2. Persist to Spring Boot Database API
    try {
      const saved = await createBlockedDateApi({
        propertyId: 1,
        roomId,
        startDateStr,
        endDateStr,
        category,
        notes
      });
      if (saved && saved.id) {
        setBlockedDates(prev => prev.map(b => b.id === newBlock.id ? { ...b, id: saved.id } : b));
      }
    } catch (err) {
      console.error("Save blocked date error:", err);
    }
  };

  // Single Day Rate Update Action (Persisted to Database)
  const updateSingleRate = async ({ roomId, dateKey, newRate }) => {
    // 1. Optimistic Local State Update
    const key = `${roomId}_${dateKey}`;
    setCustomRates(prev => ({
      ...prev,
      [key]: newRate
    }));

    // 2. Persist to Spring Boot Database API
    try {
      await saveSingleRateOverrideApi({
        propertyId: 1,
        roomId,
        dateKey,
        newRate
      });
    } catch (err) {
      console.error("Save single rate override error:", err);
    }
  };

  // Housekeeping status toggle action
  const toggleHousekeeping = async (roomId, currentStatus) => {
    const roomKey = String(roomId).trim();
    const cleanNameKey = roomKey.split('—')[0].split('-')[0].trim();

    const candidateKeys = [
      roomKey,
      cleanNameKey,
      `${selectedPropertyId}-${roomKey}`,
      `${selectedPropertyId}-${cleanNameKey}`
    ];

    let entry = null;
    let photoUrl = null;

    for (const k of candidateKeys) {
      const item = housekeepingMap[k] || housekeepingMap[k.toLowerCase()];
      if (item && typeof item === 'object') {
        if (!entry) entry = item;
        if (item.photoProofUrl) {
          entry = item;
          photoUrl = item.photoProofUrl;
          break;
        }
      }
    }

    let nextStatus;
    if (currentStatus === 'DIRTY') {
      nextStatus = 'IN_PROGRESS';
    } else if (currentStatus === 'IN_PROGRESS') {
      if (!photoUrl) {
        alert(`📷 Photo Evidence Required!\n\nA room cannot be changed to "Ready" / "Clean" unless the required photo evidence is provided.\n\nPlease open the Caretaker App to submit photo proof.`);
        return;
      }
      nextStatus = 'CLEAN';
    } else {
      nextStatus = 'DIRTY';
    }

    // 1. Optimistic Update
    setHousekeepingMap(prev => ({
      ...prev,
      [roomKey]: typeof entry === 'object' && entry ? { ...entry, status: nextStatus } : nextStatus
    }));

    // 2. Database Persistence
    try {
      const allowedPropIds = (propertiesList || []).map(p => String(p.id));
      const targetPropId = selectedPropertyId !== 'all' ? selectedPropertyId : (propertiesList[0]?.id || null);
      await updateHousekeepingStatusApi(roomKey, nextStatus, `Updated via StayOps Calendar`, targetPropId, allowedPropIds);
    } catch (err) {
      console.error("Toggle housekeeping error:", err);
      // Revert if API rejected (e.g. missing photo evidence error from backend)
      setHousekeepingMap(prev => ({
        ...prev,
        [roomKey]: entry
      }));
      alert(`📷 Photo Evidence Required: A room cannot be changed to "Ready" unless required photo evidence is provided.`);
    }
  };

  // Derived Grid Timeline Columns
  const daysArray = getDaysArray(startDate, numDays);

  // Derived Room List
  const allRooms = extractRoomsFromProperties(propertiesList, selectedPropertyId);
  const filteredRooms = searchQuery.trim()
    ? allRooms.filter(r => 
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        r.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allRooms;

  // Delete Blocked Dates Action (Persisted to Database)
  const removeBlockedDate = async (blockId) => {
    // 1. Optimistic Local State Update
    setBlockedDates(prev => prev.filter(b => String(b.id) !== String(blockId)));

    // 2. Persist Deletion to Spring Boot Database API
    try {
      if (blockId && !String(blockId).startsWith('BLK-')) {
        await deleteBlockedDateApi(blockId);
      }
    } catch (err) {
      console.error("Delete blocked date error:", err);
      loadData(true);
    }
  };

  return {
    startDate,
    setStartDate,
    numDays,
    setNumDays,
    viewMode,
    setViewMode,
    selectedPropertyId,
    setSelectedPropertyId,
    searchQuery,
    setSearchQuery,
    daysArray,
    propertiesList,
    reservationsList,
    guestsList,
    mealOrders,
    taxSettings,
    taxSettingsMap,
    filteredRooms,
    customRates,
    blockedDates,
    housekeepingMap,
    isLoading,
    loadData,
    handlePrevDays,
    handleNextDays,
    handleResetToday,
    applyBulkPrice,
    addBlockedDates,
    removeBlockedDate,
    updateSingleRate,
    toggleHousekeeping
  };
}


