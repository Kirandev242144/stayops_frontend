import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { API_BASE_URL } from '../config/api';
import { formatTime12Hr, getHourFromTime } from '../utils/timeFormat';
import { isLateArrival, shouldPromptNoShow } from '../pages/Dashboard/Frontdesk/utils/frontdeskStatus';
import { useWebSocketContext } from './WebSocketContext';

const NotificationContext = createContext(null);

const STORAGE_KEY_CUSTOM = 'stayops_custom_notifications_v1';
const STORAGE_KEY_READ = 'stayops_notifications_read_v2';
const STORAGE_KEY_DISMISSED = 'stayops_notifications_dismissed_v2';

/**
 * Returns current date in YYYY-MM-DD format based on local system timezone
 */
function getLocalDateString(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Safely parses operations configuration from a property object
 */
function parsePropertyOperations(operations) {
  if (!operations) return null;
  if (typeof operations === 'object') return operations;
  try {
    return JSON.parse(operations);
  } catch {
    return null;
  }
}

export function NotificationProvider({ children, onNavigate }) {
  // Read IDs set and Dismissed IDs set stored in localStorage
  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_READ);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [dismissedIds, setDismissedIds] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_DISMISSED);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Custom notifications (e.g. created on checkout or user actions)
  const [customNotifications, setCustomNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CUSTOM);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];

      // Initial cleanup: keep only the newest notification per unique event / reservation
      const seen = new Map();
      parsed.forEach(n => {
        if (!n) return;
        const resId = n.meta?.reservationId;
        const key = resId ? `${n.type || 'alert'}_${resId}` : (n.id || `${n.title}_${n.meta?.roomUnit || ''}`);
        const existing = seen.get(key);
        if (!existing || (n.timestamp || 0) > (existing.timestamp || 0)) {
          seen.set(key, n);
        }
      });
      return Array.from(seen.values());
    } catch {
      return [];
    }
  });

  // Dynamically detected operational notifications (late arrivals, no-shows, etc.)
  const [operationalNotifications, setOperationalNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // WebSocket sync to trigger instant re-scans when reservations change
  const ws = useWebSocketContext();

  // Persist read and dismissed IDs
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_READ, JSON.stringify(Array.from(readIds)));
    } catch (e) {
      console.warn('Could not save read notification states', e);
    }
  }, [readIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_DISMISSED, JSON.stringify(Array.from(dismissedIds)));
    } catch (e) {
      console.warn('Could not save dismissed notification states', e);
    }
  }, [dismissedIds]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CUSTOM, JSON.stringify(customNotifications));
    } catch (e) {
      console.warn('Could not save custom notifications', e);
    }
  }, [customNotifications]);

  /**
   * Scan reservations and properties to generate active operational alerts
   * Detects:
   * 1. Overdue arrivals from previous dates (guest has not checked in)
   * 2. Today's arrivals past check-in time + grace hours
   * 3. Reservations explicitly flagged as late arrival
   * 4. Potential No-Shows exceeding grace windows
   */
  const scanOperationalAlerts = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setIsLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch reservations and properties in parallel
      const [resResponse, propResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/reservations`, { headers }).catch(() => null),
        fetch(`${API_BASE_URL}/properties`, { headers }).catch(() => null)
      ]);

      if (!resResponse || !resResponse.ok) return;

      const rawReservations = await resResponse.json();
      const rawProperties = propResponse && propResponse.ok ? await propResponse.json() : [];

      if (!Array.isArray(rawReservations)) return;

      const now = new Date();
      const todayStr = getLocalDateString(now);

      // Build properties operations lookup map
      const propMap = {};
      if (Array.isArray(rawProperties)) {
        rawProperties.forEach(p => {
          const ops = parsePropertyOperations(p.operations);
          propMap[p.id] = ops;
          propMap[String(p.id)] = ops;
        });
      }

      const generatedAlerts = [];

      rawReservations.forEach(r => {
        const resId = r.bookingRef || (r.id ? `BK-${r.id}` : 'BK-UNKNOWN');
        const guestName = r.guestName || 'Guest';
        const roomUnit = r.roomUnit || 'Room';
        const rawCheckIn = r.checkIn || r.checkin || r.check_in || '';
        const checkIn = typeof rawCheckIn === 'string' ? rawCheckIn.split('T')[0].trim() : '';
        const checkInTime = r.checkInTime || r.check_in_time || '14:00';
        const status = (r.status || '').toLowerCase();
        const propOps = propMap[r.propertyId] || null;

        // Only scan pending arrivals (not checked in, not checked out, not cancelled)
        const isPendingArrival = ['confirmed', 'checkin', ''].includes(status);
        if (!isPendingArrival || !checkIn) return;

        const isOverdue = checkIn < todayStr;
        const isToday = checkIn === todayStr;

        // Skip future arrivals
        if (!isOverdue && !isToday) return;

        // 1. LATE ARRIVAL NOTIFICATION
        const isFlaggedLate = Boolean(r.isLateArrival || r.is_late_arrival);
        const isLateByFrontdesk = isLateArrival(
          { ...r, checkin: checkIn, status: 'confirmed' },
          propOps,
          now
        );
        const isHourLate = isToday && getHourFromTime(checkInTime) >= 18;

        const isLate = isOverdue || isFlaggedLate || isLateByFrontdesk || isHourLate;

        if (isLate) {
          const alertId = `late_arrival_${resId}`;
          generatedAlerts.push({
            id: alertId,
            type: 'late_arrival',
            category: 'late_arrival',
            priority: 'urgent',
            title: `Late Arrival · ${guestName}`,
            message: isOverdue
              ? `${roomUnit} • Check-in was scheduled for ${checkIn} (${formatTime12Hr(checkInTime)}). Overdue arrival.`
              : `${roomUnit} • Scheduled arrival at ${formatTime12Hr(checkInTime)}. Guest has not checked in yet.`,
            meta: {
              guestName,
              roomUnit,
              checkInDate: checkIn,
              checkInTime: formatTime12Hr(checkInTime),
              reservationId: resId,
              dbId: r.id,
              isOverdue
            },
            timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
            actionLabel: 'Open Frontdesk',
            actionTab: 'frontdesk'
          });
        }

        // 2. POTENTIAL NO-SHOW NOTIFICATION
        const isNoShowPrompt = isOverdue || shouldPromptNoShow(
          { ...r, checkin: checkIn, status: 'confirmed' },
          propOps,
          now
        );

        if (isNoShowPrompt) {
          const alertId = `no_show_${resId}`;
          generatedAlerts.push({
            id: alertId,
            type: 'no_show',
            category: 'urgent',
            priority: 'high',
            title: `Potential No-Show · ${guestName}`,
            message: isOverdue
              ? `${roomUnit} • Scheduled arrival on ${checkIn} has passed without check-in.`
              : `${roomUnit} • Arrival time exceeded grace buffer. Review booking status.`,
            meta: {
              guestName,
              roomUnit,
              checkInDate: checkIn,
              reservationId: resId,
              dbId: r.id,
              isOverdue
            },
            timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
            actionLabel: 'Check Frontdesk',
            actionTab: 'frontdesk'
          });
        }

        // 3. PAYMENT NOTIFICATION
        // Detect active in-house reservations where payment was received
        // NOTE: Exclude checked-out reservations because departure notifications already report payment settlement!
        const isCheckedOut = status.includes('checkout') || status.includes('check_out') || status.includes('checkedout') || status.includes('depart') || status === 'completed';
        if (isCheckedOut) return;

        const isPaidInFull = (r.paymentStatus || '').toLowerCase() === 'paid in full' ||
                             (r.paymentStatus || '').toLowerCase() === 'paid' ||
                             (Number(r.amountPaid) > 0 && Number(r.amountPaid) >= Number(r.totalAmount));
        if (isPaidInFull && (isToday || isOverdue)) {
          const alertId = `payment_${resId}`;
          const paidAmt = Number(r.amountPaid || r.totalAmount || 0);
          generatedAlerts.push({
            id: alertId,
            type: 'payment',
            category: 'payment',
            priority: 'normal',
            title: `Payment Received · ${guestName}`,
            message: `${roomUnit} • ₹${paidAmt.toLocaleString('en-IN')} marked as Paid in Full (${resId}).`,
            meta: {
              guestName,
              roomUnit,
              checkInDate: checkIn,
              reservationId: resId,
              amount: paidAmt
            },
            timestamp: r.createdAt ? new Date(r.createdAt).getTime() : Date.now(),
            actionLabel: 'View Bookings',
            actionTab: 'reservations'
          });
        }
      });

      setOperationalNotifications(generatedAlerts);
    } catch (err) {
      console.error('Failed to scan operational alerts:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run initial scan and periodic background re-scan every 60 seconds
  useEffect(() => {
    scanOperationalAlerts();
    const timer = setInterval(() => {
      scanOperationalAlerts();
    }, 60000);
    return () => clearInterval(timer);
  }, [scanOperationalAlerts]);

  // Real-time synchronization via WebSocket
  useEffect(() => {
    if (!ws?.subscribe) return;
    const unsubscribe = ws.subscribe((message) => {
      if (
        message?.type === 'RESERVATION_UPDATE' ||
        message?.type === 'NEW_RESERVATION' ||
        message?.type === 'CHECKIN_UPDATE' ||
        message?.type === 'STATUS_UPDATE'
      ) {
        scanOperationalAlerts();
      }
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, [ws, scanOperationalAlerts]);

  // Combine custom and dynamic operational notifications with strict semantic deduplication
  const allNotifications = useMemo(() => {
    const combined = [...customNotifications, ...operationalNotifications];
    const uniqueMap = new Map();

    combined.forEach(item => {
      if (!item || !item.id || dismissedIds.has(item.id)) return;

      // Deduplication Key: group by reservationId + type, or title + roomUnit
      const resId = item.meta?.reservationId;
      const dedupeKey = resId ? `${item.type || 'alert'}_${resId}` : (item.id || `${item.title}_${item.meta?.roomUnit || ''}`);

      if (!uniqueMap.has(dedupeKey)) {
        uniqueMap.set(dedupeKey, {
          ...item,
          read: readIds.has(item.id)
        });
      } else {
        // Keep the record with the most recent timestamp
        const existing = uniqueMap.get(dedupeKey);
        if ((item.timestamp || 0) > (existing.timestamp || 0)) {
          uniqueMap.set(dedupeKey, {
            ...item,
            read: readIds.has(item.id) || existing.read
          });
        }
      }
    });

    // Cross-event deduplication:
    // When a checkout/departure notification exists for a reservation, suppress any redundant payment or arrival alerts for that reservation
    const checkoutResIds = new Set();
    uniqueMap.forEach((notif) => {
      if ((notif.type === 'checkout' || notif.category === 'checkout') && notif.meta?.reservationId) {
        checkoutResIds.add(String(notif.meta.reservationId));
      }
    });

    const finalFiltered = Array.from(uniqueMap.values()).filter(notif => {
      if (notif.type !== 'checkout' && notif.category !== 'checkout' && notif.meta?.reservationId) {
        if (checkoutResIds.has(String(notif.meta.reservationId))) {
          return false; // Suppress redundant payment/arrival alerts for departed guest
        }
      }
      return true;
    });

    // Sort by timestamp descending (newest first)
    return finalFiltered.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [customNotifications, operationalNotifications, dismissedIds, readIds]);

  const unreadCount = useMemo(() => {
    return allNotifications.filter(n => !n.read).length;
  }, [allNotifications]);

  /** Mark single notification as read */
  const markAsRead = useCallback((id) => {
    setReadIds(prev => new Set([...prev, id]));
  }, []);

  /** Mark all current notifications as read */
  const markAllAsRead = useCallback(() => {
    setReadIds(prev => {
      const updated = new Set(prev);
      allNotifications.forEach(n => updated.add(n.id));
      return updated;
    });
  }, [allNotifications]);

  /** Dismiss / delete notification */
  const dismissNotification = useCallback((id) => {
    setDismissedIds(prev => new Set([...prev, id]));
    setCustomNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /** Clear all notifications */
  const clearAll = useCallback(() => {
    setDismissedIds(prev => {
      const updated = new Set(prev);
      allNotifications.forEach(n => updated.add(n.id));
      return updated;
    });
    setCustomNotifications([]);
    try {
      localStorage.removeItem(STORAGE_KEY_CUSTOM);
    } catch {}
  }, [allNotifications]);

  /**
   * Programmatically add a new notification (with smart deduplication)
   */
  const addNotification = useCallback((notif) => {
    if (!notif) return;
    const resId = notif.meta?.reservationId;
    const dedupeKey = notif.id || (resId ? `${notif.type || 'alert'}_${resId}` : `notif_${Date.now()}`);

    const newNotif = {
      id: dedupeKey,
      timestamp: Date.now(),
      read: false,
      ...notif
    };

    setCustomNotifications(prev => {
      // If adding a checkout notification, purge any old checkout test duplicates or payment alerts for this reservation
      if ((notif.type === 'checkout' || notif.category === 'checkout') && resId) {
        const withoutOld = prev.filter(n => {
          if (n.id === dedupeKey) return false;
          if (n.meta?.reservationId === resId) return false;
          return true;
        });
        return [newNotif, ...withoutOld];
      }

      // Replace if same ID or same type + reservationId
      const filtered = prev.filter(n => {
        if (n.id === dedupeKey) return false;
        if (resId && n.type === notif.type && n.meta?.reservationId === resId) return false;
        return true;
      });
      return [newNotif, ...filtered];
    });
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications: allNotifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        clearAll,
        addNotification,
        refresh: scanOperationalAlerts,
        onNavigate
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      markAsRead: () => {},
      markAllAsRead: () => {},
      dismissNotification: () => {},
      clearAll: () => {},
      addNotification: () => {},
      refresh: () => {}
    };
  }
  return context;
}
