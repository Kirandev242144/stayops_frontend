import { useState, useEffect, useCallback } from 'react';
import { fetchProperties } from '../propertyApi';
import { fetchReservations } from '../reservationApi';
import { fetchGuests } from '../guestApi';
import { fetchMealOrders } from '../../Frontdesk/frontdeskApi';
import { fetchRateOverrides } from '../../Calendar/calendarApi';
import { API_BASE_URL } from '../../../../config/api';
import { useWebSocketContext } from '../../../../context/WebSocketContext';

/**
 * Custom hook to manage fetching and real-time WebSocket sync
 * for Properties, Reservations, Guests, Meal Orders, Tax Settings, and Custom Rates.
 */
export function useReservationsData() {
  const [propertiesList, setPropertiesList] = useState([]);
  const [reservationsList, setReservationsList] = useState([]);
  const [guestsList, setGuestsList] = useState([]);
  const [mealOrders, setMealOrders] = useState([]);
  const [customRates, setCustomRates] = useState({});
  const [taxSettings, setTaxSettings] = useState(null);
  const [taxSettingsMap, setTaxSettingsMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { subscribe } = useWebSocketContext();

  const loadAllData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: token ? `Bearer ${token}` : "" };

      const [props, resList, gList, mList, rMap] = await Promise.all([
        fetchProperties(),
        fetchReservations(),
        fetchGuests(),
        fetchMealOrders().catch(() => []),
        fetchRateOverrides().catch(() => ({}))
      ]);

      setPropertiesList(props || []);
      setReservationsList(resList || []);
      setGuestsList(gList || []);
      setMealOrders(mList || []);
      setCustomRates(rMap || {});

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
            console.error(`Tax settings fetch error for prop ${p.id}:`, tErr);
          }
        }));
        setTaxSettingsMap(tMap);
        setTaxSettings(tMap[props[0].id] || null);
      }
    } catch (err) {
      console.error("Data load error:", err);
      setError("Unable to connect to backend service.");
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData(false);
  }, [loadAllData]);

  // Handle real-time WebSocket delta events in-memory without extra HTTP requests
  const handleWebSocketMessage = useCallback((msg) => {
    if (!msg || !msg.event) return;
    const { event, data } = msg;

    if (event === "RESERVATION_CREATED" && data && data.id) {
      setReservationsList(prev => {
        const exists = prev.some(r => String(r.id) === String(data.id));
        if (exists) {
          return prev.map(r => String(r.id) === String(data.id) ? { ...r, ...data } : r);
        }
        return [data, ...prev];
      });
    } else if ((event === "RESERVATION_UPDATED" || event === "PAYMENT_UPDATED") && data && data.id) {
      setReservationsList(prev => 
        prev.map(r => String(r.id) === String(data.id) ? { ...r, ...data } : r)
      );
    } else if (event === "RESERVATION_DELETED" && data && data.id) {
      setReservationsList(prev => prev.filter(r => String(r.id) !== String(data.id)));
    } else {
      // Fallback for unhandled/batch events
      loadAllData(true);
    }
  }, [loadAllData]);

  // Real-time WebSocket channel subscriptions & silent auto-refresh for direct DB edits (e.g. DBeaver)
  useEffect(() => {
    const unsub1 = subscribe("BOOKING_UPDATED", handleWebSocketMessage);
    const unsub2 = subscribe("FRONTDESK", handleWebSocketMessage);
    const unsub3 = subscribe("RESERVATIONS", handleWebSocketMessage);
    const unsub4 = subscribe("MEALS", handleWebSocketMessage);

    // Auto-refresh when tab regains focus or becomes visible (e.g. switching back from DBeaver)
    const handleFocus = () => {
      loadAllData(true);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadAllData(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic heartbeat poll (every 30 seconds) as a backup safety net
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadAllData(true);
      }
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
  }, [subscribe, loadAllData, handleWebSocketMessage]);

  return {
    propertiesList,
    reservationsList,
    guestsList,
    mealOrders,
    customRates,
    taxSettings,
    taxSettingsMap,
    isLoading,
    error,
    loadAllData
  };
}

