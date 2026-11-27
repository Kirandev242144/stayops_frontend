import React, { useState, useEffect, useCallback } from 'react';
import { FiClock, FiAlertTriangle, FiCheckCircle, FiEye, FiX } from 'react-icons/fi';
import TaxInvoiceModal from '../../../components/tax/TaxInvoiceModal';
import './Frontdesk.css';

// API Services
import {
  fetchFrontdeskReservations,
  fetchMealOrders,
  updateReservationStatus,
  updateReservationPayment,
  createMealOrder
} from './frontdeskApi';
import { updateHousekeepingStatus } from './housekeepingApi';

// Constants & Utilities
import { OP_TABS, TIME_FILTERS } from './frontdeskConstants';
import { getFrontdeskQueue } from './utils/frontdeskQueues';

// Presentation Components & Modals
import FrontdeskHeader from './components/FrontdeskHeader';
import FrontdeskCounters from './components/FrontdeskCounters';
import FrontdeskTimeFilter from './components/FrontdeskTimeFilter';
import GuestMovementCard from './components/GuestMovementCard';
import CompletedStayCard from './components/CompletedStayCard';
import CheckoutSettlementModal from './components/CheckoutSettlementModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import AddServiceOrderModal from './components/AddServiceOrderModal';
import MealOrderModal from './components/MealOrderModal';
import NoShowModal from './components/NoShowModal';
import BookingVoucherModal from './components/BookingVoucherModal';
import RazorpayQrModal from './components/RazorpayQrModal';
import CheckInModal from './components/CheckInModal';
import Housekeeping from '../Housekeeping/Housekeeping';

import { API_BASE_URL } from '../../../config/api';

import { useWebSocketContext } from '../../../context/WebSocketContext';
import { useNotifications } from '../../../context/NotificationContext';

export default function Frontdesk({ onNavigate }) {
  const { addNotification, refresh: refreshNotifications } = useNotifications();
  const [showHousekeepingView, setShowHousekeepingView] = useState(false);
  const [reservationsList, setReservationsList] = useState([]);
  const [mealOrders, setMealOrders] = useState([]);
  const [taxSettings, setTaxSettings] = useState(null);
  const [taxSettingsMap, setTaxSettingsMap] = useState({});
  const [propertyOperations, setPropertyOperations] = useState(null);
  const [propertiesList, setPropertiesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const { subscribe } = useWebSocketContext();

  // Tab & Filter State
  const [opTab, setOpTab] = useState(OP_TABS.CHECKIN);
  const [timeFilter, setTimeFilter] = useState(TIME_FILTERS.TODAY);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Active Target State
  const [selectedResDetails, setSelectedResDetails] = useState(null);
  const [selectedInvoiceRes, setSelectedInvoiceRes] = useState(null);

  const [paymentTargetRes, setPaymentTargetRes] = useState(null);
  const [paymentInitialAmt, setPaymentInitialAmt] = useState('');

  const [razorpayQrTargetRes, setRazorpayQrTargetRes] = useState(null);
  const [razorpayQrAmount, setRazorpayQrAmount] = useState(0);

  const [mealTargetRes, setMealTargetRes] = useState(null);
  const [serviceTargetRes, setServiceTargetRes] = useState(null);
  const [checkoutSettleTargetRes, setCheckoutSettleTargetRes] = useState(null);
  const [checkInTargetRes, setCheckInTargetRes] = useState(null);
  const [noShowTargetRes, setNoShowTargetRes] = useState(null);
  const [viewingIdDoc, setViewingIdDoc] = useState(null);

  // Initial Data Load
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: token ? `Bearer ${token}` : '' };

      const [resData, mealData, propsData] = await Promise.all([
        fetchFrontdeskReservations().catch(() => []),
        fetchMealOrders().catch(() => []),
        fetch(`${API_BASE_URL}/properties`, { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);
      setReservationsList(resData);
      setMealOrders(mealData);
      setPropertiesList(propsData || []);

      if (propsData && propsData.length > 0) {
        const primaryProp = propsData[0];
        try {
          const opsObj = typeof primaryProp.operations === 'string' ? JSON.parse(primaryProp.operations) : primaryProp.operations;
          setPropertyOperations(opsObj || null);
        } catch (e) {
          setPropertyOperations(null);
        }

        const tMap = {};
        await Promise.all(propsData.map(async (p) => {
          try {
            const taxRes = await fetch(`${API_BASE_URL}/properties/${p.id}/taxes`, { headers });
            if (taxRes.ok) {
              const taxData = await taxRes.json();
              tMap[p.id] = taxData;
              tMap[String(p.id)] = taxData;
            }
          } catch (tErr) {
            console.error(`Frontdesk tax fetch error for prop ${p.id}:`, tErr);
          }
        }));
        setTaxSettingsMap(tMap);
        setTaxSettings(tMap[primaryProp.id] || null);
      }
    } catch (err) {
      console.error("Frontdesk data load error:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, []);

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
    } else {
      loadData(true);
    }
  }, [loadData]);

  // Live WebSocket Subscriptions & Silent Auto-Sync for Direct DB Edits (e.g. DBeaver)
  useEffect(() => {
    const unsub1 = subscribe("FRONTDESK", handleWebSocketMessage);
    const unsub2 = subscribe("BOOKING_UPDATED", handleWebSocketMessage);
    const unsub3 = subscribe("MEALS", handleWebSocketMessage);

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
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [subscribe, loadData, handleWebSocketMessage]);

  // Operational Queue Derivation
  const filteredQueue = getFrontdeskQueue({
    reservationsList,
    opTab,
    timeFilter,
    searchQuery,
    propertyOperations
  });

  const completedCount = reservationsList.filter(r => r.status === 'checkedout' || r.status === 'completed').length;

  // ── HANDLERS (API-FIRST CONSISTENCY) ──

  const handleExecuteCheckIn = (res) => {
    setCheckInTargetRes(res);
  };

  const handleConfirmCheckIn = async ({ res, idType, idNumber, idDocumentUrl, guestCity, guestState, skipId }) => {
    const targetId = res.dbId || res.id;
    try {
      const extraFields = {};
      if (!skipId) {
        if (idType) extraFields.idType = idType;
        if (idNumber) extraFields.idNumber = idNumber;
        if (idDocumentUrl) extraFields.idDocumentUrl = idDocumentUrl;
        if (guestCity) extraFields.guestCity = guestCity;
        if (guestState) extraFields.guestState = guestState;
      }

      if (targetId) {
        await updateReservationStatus(targetId, 'checkedin', extraFields);
      }
      setReservationsList(prev => prev.map(r => (r.id === res.id || (r.dbId && r.dbId === res.dbId)) ? {
        ...r,
        status: 'checkedin',
        ...extraFields
      } : r));
      setCheckInTargetRes(null);
    } catch (err) {
      console.error("Check-in error:", err);
      alert(`Could not complete check-in: ${err.message}`);
    }
  };

  const handleExecuteCheckOutPrompt = (res) => {
    setCheckoutSettleTargetRes(res);
  };

  const handleConfirmCheckout = async ({ res, settleFull, paymentMode, folio }) => {
    const targetId = res.dbId || res.id;
    let finalPaidAmt = folio.paidAmount;
    let finalStatusStr = res.paymentStatus || 'Partial';

    if (settleFull || folio.refundDue > 0) {
      finalPaidAmt = folio.totalFolio;
      finalStatusStr = 'Paid in Full';
    }

    const payload = {
      amountPaid: finalPaidAmt,
      totalAmount: folio.totalFolio ?? folio.roomTariff,
      paymentStatus: finalStatusStr,
      checkOut: folio.earlyCheckoutDate || res.checkout,
      notes: folio.isEarlyDeparture 
        ? `${res.notes ? res.notes + ' | ' : ''}Early departure on ${folio.earlyCheckoutDate} (${folio.actualNights} night(s) stayed)` 
        : res.notes
    };

    try {
      if (targetId) {
        await updateReservationPayment(targetId, payload);
        await updateReservationStatus(targetId, 'checkedout');
      }

      // Explicitly mark room and all candidate aliases as DIRTY in housekeeping status
      const candidateRoomKeys = new Set();
      if (res.roomUnit) candidateRoomKeys.add(String(res.roomUnit).trim());
      if (res.unit) candidateRoomKeys.add(String(res.unit).trim());
      if (res.roomName) candidateRoomKeys.add(String(res.roomName).trim());
      if (res.roomTypeId) candidateRoomKeys.add(String(res.roomTypeId).trim());
      if (res.roomId) candidateRoomKeys.add(String(res.roomId).trim());
      if (Array.isArray(res.allocatedRooms)) {
        res.allocatedRooms.forEach(ar => {
          if (ar.roomUnit) candidateRoomKeys.add(String(ar.roomUnit).trim());
          if (ar.roomId) candidateRoomKeys.add(String(ar.roomId).trim());
          if (ar.roomTypeId) candidateRoomKeys.add(String(ar.roomTypeId).trim());
        });
      }

      const allowedPropIds = (propertiesList || []).map(p => String(p.id));
      const propId = res.propertyId || (propertiesList[0]?.id || null);
      const noteText = `Turnover required: Checked-out guest (${res.guestName || res.guest || 'Guest'})`;

      for (const k of candidateRoomKeys) {
        if (!k) continue;
        await updateHousekeepingStatus(k, 'DIRTY', noteText, propId, allowedPropIds).catch(() => {});
        const cleanK = String(k).split('—')[0].split('-')[0].trim();
        if (cleanK && cleanK !== k) {
          await updateHousekeepingStatus(cleanK, 'DIRTY', noteText, propId, allowedPropIds).catch(() => {});
        }
      }

      const updatedObj = {
        ...res,
        status: 'checkedout',
        totalAmount: folio.totalFolio ?? folio.roomTariff,
        checkout: folio.earlyCheckoutDate || res.checkout,
        amountPaid: finalPaidAmt,
        balanceDue: settleFull ? 0 : folio.balanceDue,
        paymentStatus: finalStatusStr,
        notes: payload.notes
      };

      setReservationsList(prev => prev.map(r => r.id === res.id ? updatedObj : r));
      setCheckoutSettleTargetRes(null);
      setSelectedInvoiceRes(updatedObj);

      if (folio.isEarlyDeparture && folio.refundDue > 0) {
        alert(`⚡ Early Check-Out completed for ${res.guest}!\nRefund of ₹${folio.refundDue.toLocaleString('en-IN')} issued via ${paymentMode}.\nFolio settled to ₹${folio.totalFolio.toLocaleString('en-IN')}.`);
      } else if (settleFull) {
        alert(`🔑 Check-Out completed for ${res.guest}!\nFull payment settled via ${paymentMode}.`);
      } else {
        alert(`⚠️ ${res.guest} checked out with pending balance of ₹${folio.balanceDue.toLocaleString('en-IN')}.`);
      }

      // Departure time formatting
      const now = new Date();
      const departureTimeStr = now.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      let paymentSummary = '';
      if (folio.isEarlyDeparture && folio.refundDue > 0) {
        paymentSummary = `Folio settled to ₹${folio.totalFolio.toLocaleString('en-IN')} (₹${folio.refundDue.toLocaleString('en-IN')} refunded via ${paymentMode})`;
      } else if (settleFull || (folio.balanceDue || 0) === 0) {
        paymentSummary = `₹${finalPaidAmt.toLocaleString('en-IN')} settled via ${paymentMode} (Paid in Full)`;
      } else if (finalPaidAmt > 0) {
        paymentSummary = `₹${finalPaidAmt.toLocaleString('en-IN')} collected via ${paymentMode} · ₹${folio.balanceDue.toLocaleString('en-IN')} balance pending`;
      } else {
        paymentSummary = `₹0 collected · ₹${folio.balanceDue.toLocaleString('en-IN')} balance pending`;
      }

      if (addNotification) {
        const resIdentifier = res.bookingRef || (res.id ? `BK-${res.id}` : targetId);
        addNotification({
          id: `checkout_${resIdentifier}`,
          type: 'checkout',
          category: 'checkout',
          priority: 'normal',
          title: `Guest Checked Out · ${res.guest || res.guestName || 'Guest'}`,
          message: `${res.roomUnit || 'Room'} • Departed at ${departureTimeStr} • ${paymentSummary}.`,
          meta: {
            guestName: res.guest || res.guestName,
            roomUnit: res.roomUnit,
            reservationId: resIdentifier,
            departureTime: departureTimeStr,
            amount: finalPaidAmt,
            paymentMode,
            paymentStatus: finalStatusStr,
            balanceDue: settleFull ? 0 : folio.balanceDue
          },
          actionLabel: 'Check Frontdesk',
          actionTab: 'frontdesk'
        });
      }
      if (refreshNotifications) refreshNotifications();
    } catch (err) {
      console.error("Check-out error:", err);
      alert(`Check-out failed: ${err.message}`);
    }
  };

  const handleSavePayment = async ({ res, amountToRecord, newTotalReceived, remainingBal, paymentMode }) => {
    const numericId = res.dbId || String(res.id).replace(/[^0-9]/g, '');
    const newStatusStr = remainingBal === 0 ? 'Paid in Full' : `Partial: \u20B9${newTotalReceived.toLocaleString('en-IN')} paid`;

    try {
      if (numericId) {
        await updateReservationPayment(numericId, {
          amountPaid: newTotalReceived,
          paymentStatus: newStatusStr
        });
      }

      setReservationsList(prev => prev.map(r => r.id === res.id ? {
        ...r,
        balanceDue: remainingBal,
        amountPaid: newTotalReceived,
        paymentStatus: newStatusStr
      } : r));

      setPaymentTargetRes(null);
      alert(`💳 Payment of \u20B9${amountToRecord.toLocaleString('en-IN')} recorded for ${res.guest}!\nRemaining balance: \u20B9${remainingBal.toLocaleString('en-IN')}`);

      if (addNotification) {
        const resRef = res.bookingRef || (res.id ? `BK-${res.id}` : numericId);
        addNotification({
          id: `payment_${resRef}`,
          type: 'payment',
          category: 'payment',
          priority: 'normal',
          title: `Payment Received · ${res.guest || res.guestName || 'Guest'}`,
          message: `${res.roomUnit || 'Room'} • ₹${amountToRecord.toLocaleString('en-IN')} recorded (${newStatusStr}).`,
          meta: {
            guestName: res.guest || res.guestName,
            roomUnit: res.roomUnit,
            reservationId: resRef,
            amount: amountToRecord
          },
          actionLabel: 'Check Frontdesk',
          actionTab: 'frontdesk'
        });
      }
      if (refreshNotifications) refreshNotifications();
    } catch (err) {
      console.error("Payment record error:", err);
      alert(`Could not record payment: ${err.message}`);
    }
  };

  const handleSaveMealOrder = async (payload) => {
    try {
      await createMealOrder(payload);
      setMealOrders(prev => [
        {
          id: `MEAL-${Date.now()}`,
          resId: String(payload.reservationId),
          guest: payload.guestName,
          item: `${payload.mealType ? `${payload.mealType}: ` : ''}${payload.itemName}`,
          amount: payload.amount,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
      setMealTargetRes(null);
      alert(`🍱 Meal order of \u20B9${Number(payload.amount).toLocaleString('en-IN')} added for ${payload.guestName}!`);
    } catch (err) {
      console.error("Meal order error:", err);
      alert(`Could not save meal order: ${err.message}`);
    }
  };

  const handleSaveServiceOrder = async (payload) => {
    try {
      await createMealOrder(payload);
      setMealOrders(prev => [
        {
          id: `SVC-${Date.now()}`,
          resId: String(payload.reservationId),
          guest: payload.guestName,
          item: `${payload.mealType ? `${payload.mealType}: ` : ''}${payload.itemName}`,
          amount: payload.amount,
          timestamp: new Date().toISOString()
        },
        ...prev
      ]);
      setServiceTargetRes(null);
      alert(`✨ Extra service of \u20B9${Number(payload.amount).toLocaleString('en-IN')} added for ${payload.guestName} (${payload.itemName})!`);
    } catch (err) {
      console.error("Service order error:", err);
      alert(`Could not save service order: ${err.message}`);
    }
  };

  const handleConfirmNoShow = async ({ res, noShowReason, noShowRefundPolicy, folio }) => {
    const targetId = res.dbId || res.id;
    const currentPaid = folio.paidAmount;

    let refundAmt = 0;
    let retainedAmt = currentPaid;
    let policyDesc = 'No Refund';

    if (noShowRefundPolicy === 'retain_one_night') {
      const oneNightRate = Math.round(folio.roomTariff / Math.max(1, res.lengthDays || 1));
      retainedAmt = Math.min(currentPaid, oneNightRate);
      refundAmt = Math.max(0, currentPaid - retainedAmt);
      policyDesc = `Retained 1 Night (₹${retainedAmt.toLocaleString('en-IN')})`;
    } else if (noShowRefundPolicy === 'retain_full') {
      retainedAmt = currentPaid;
      refundAmt = 0;
      policyDesc = `Retained 100% (₹${retainedAmt.toLocaleString('en-IN')})`;
    } else if (noShowRefundPolicy === 'full_refund') {
      retainedAmt = 0;
      refundAmt = currentPaid;
      policyDesc = `Full Refund Processed (₹${refundAmt.toLocaleString('en-IN')})`;
    }

    const newPaymentStatus = `No-Show: ${policyDesc}`;
    const newPaidTotal = currentPaid - refundAmt;

    try {
      if (targetId) {
        await updateReservationStatus(targetId, 'no_show');
        await updateReservationPayment(targetId, {
          amountPaid: newPaidTotal,
          paymentStatus: newPaymentStatus
        });
      }

      setReservationsList(prev => prev.map(r => r.id === res.id ? {
        ...r,
        status: 'no_show',
        paymentStatus: newPaymentStatus,
        balanceDue: 0,
        amountPaid: newPaidTotal,
        refundedAmount: refundAmt
      } : r));

      setNoShowTargetRes(null);
      alert(`⚠️ ${res.guest} marked as No-Show!\nPolicy applied: ${policyDesc}`);
    } catch (err) {
      console.error("No-show update error:", err);
      alert(`Could not mark No-Show: ${err.message}`);
    }
  };

  if (showHousekeepingView) {
    return (
      <div className="fd-container">
        <Housekeeping onBack={() => setShowHousekeepingView(false)} />
      </div>
    );
  }

  return (
    <div className="fd-container">
      {/* HEADER BAR */}
      <FrontdeskHeader
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenHousekeeping={() => setShowHousekeepingView(true)}
      />

      {/* COUNTERS */}
      <FrontdeskCounters
        reservationsList={reservationsList}
        mealOrders={mealOrders}
        opTab={opTab}
        setOpTab={setOpTab}
        propertyOperations={propertyOperations}
        taxSettings={taxSettingsMap || taxSettings}
      />

      {/* TIME FILTER */}
      <FrontdeskTimeFilter
        opTab={opTab}
        setOpTab={setOpTab}
        timeFilter={timeFilter}
        setTimeFilter={setTimeFilter}
        filteredCount={filteredQueue.length}
        completedCount={completedCount}
        inHouseCount={reservationsList.filter(r => r.status === 'inhouse' || r.status === 'checkedin').length}
        alertsCount={reservationsList.filter(r => r.status === 'no_show').length}
      />

      {/* QUEUE CARDS */}
      {filteredQueue.length === 0 ? (
        <div className="fd-empty-card">
          <div className={`fd-empty-icon-circle ${opTab === OP_TABS.NOSHOW ? 'success' : ''}`}>
            {opTab === OP_TABS.NOSHOW ? (
              <FiCheckCircle size={24} color="#10B981" />
            ) : opTab === OP_TABS.CHECKIN ? (
              <FiClock size={24} color="#64748B" />
            ) : (
              <FiAlertTriangle size={24} color="#64748B" />
            )}
          </div>
          <h3 className="fd-empty-title">
            {opTab === OP_TABS.CHECKIN ? 'No Check-in Arrivals Pending'
              : opTab === OP_TABS.CHECKOUT ? 'No Check-out Departures Pending'
              : opTab === OP_TABS.NOSHOW ? 'No Late Arrivals or No-Shows'
              : 'No Operational Bookings Found'}
          </h3>
          <p className="fd-empty-desc">
            {opTab === OP_TABS.CHECKIN ? 'All scheduled check-ins for today have been completed or no arrivals are queued.'
              : opTab === OP_TABS.NOSHOW ? 'All guests have arrived on time. No action needed — great operations!'
              : 'There are no active departures matching your filter.'}
          </p>
        </div>
      ) : (
        <div className="fd-cards-list">
          {filteredQueue.map(res => (
            res.status === 'checkedout' || res.status === 'completed' ? (
              <CompletedStayCard
                key={res.id}
                res={res}
                mealOrders={mealOrders}
                taxSettings={taxSettingsMap || taxSettings}
                onOpenTaxInvoice={r => setSelectedInvoiceRes(r)}
                onOpenVoucher={r => setSelectedResDetails(r)}
              />
            ) : (
              <GuestMovementCard
                key={res.id}
                res={res}
                mealOrders={mealOrders}
                taxSettings={taxSettingsMap || taxSettings}
                onExecuteCheckIn={handleExecuteCheckIn}
                onExecuteCheckOut={handleExecuteCheckOutPrompt}
                onOpenRecordPayment={(r, amt) => {
                  setPaymentTargetRes(r);
                  setPaymentInitialAmt(amt);
                }}
                onOpenRazorpayQr={(r, amt) => {
                  setRazorpayQrTargetRes(r);
                  setRazorpayQrAmount(amt);
                }}
                onOpenAddMeal={r => setMealTargetRes(r)}
                onOpenAddService={r => setServiceTargetRes(r)}
                onOpenVoucher={r => setSelectedResDetails(r)}
                onViewIdDocument={r => setViewingIdDoc(r)}
              />
            )
          ))}
        </div>
      )}

      {/* MODALS */}
      <CheckoutSettlementModal
        isOpen={Boolean(checkoutSettleTargetRes)}
        res={checkoutSettleTargetRes}
        mealOrders={mealOrders}
        taxSettings={taxSettingsMap || taxSettings}
        onClose={() => setCheckoutSettleTargetRes(null)}
        onConfirmCheckout={handleConfirmCheckout}
      />

      <CheckInModal
        isOpen={Boolean(checkInTargetRes)}
        res={checkInTargetRes}
        onClose={() => setCheckInTargetRes(null)}
        onConfirmCheckIn={handleConfirmCheckIn}
      />

      <RecordPaymentModal
        isOpen={Boolean(paymentTargetRes)}
        res={paymentTargetRes}
        initialAmount={paymentInitialAmt}
        mealOrders={mealOrders}
        taxSettings={taxSettingsMap || taxSettings}
        onClose={() => setPaymentTargetRes(null)}
        onSavePayment={handleSavePayment}
      />

      <RazorpayQrModal
        isOpen={Boolean(razorpayQrTargetRes)}
        res={razorpayQrTargetRes}
        amount={razorpayQrAmount}
        onClose={() => setRazorpayQrTargetRes(null)}
        onNavigateToSettings={() => onNavigate && onNavigate("settings")}
        onPaymentConfirmed={handleSavePayment}
      />

      <MealOrderModal
        isOpen={Boolean(mealTargetRes)}
        res={mealTargetRes}
        onClose={() => setMealTargetRes(null)}
        onSaveMealOrder={handleSaveMealOrder}
      />

      <AddServiceOrderModal
        isOpen={Boolean(serviceTargetRes)}
        res={serviceTargetRes}
        onClose={() => setServiceTargetRes(null)}
        onSaveServiceOrder={handleSaveServiceOrder}
      />

      <NoShowModal
        isOpen={Boolean(noShowTargetRes)}
        res={noShowTargetRes}
        mealOrders={mealOrders}
        onClose={() => setNoShowTargetRes(null)}
        onConfirmNoShow={handleConfirmNoShow}
      />

      <BookingVoucherModal
        isOpen={Boolean(selectedResDetails)}
        res={selectedResDetails}
        mealOrders={mealOrders}
        taxSettings={taxSettingsMap || taxSettings}
        onClose={() => setSelectedResDetails(null)}
        onOpenRecordPayment={(r, amt) => {
          setPaymentTargetRes(r);
          setPaymentInitialAmt(amt);
        }}
        onOpenTaxInvoice={r => setSelectedInvoiceRes(r)}
      />

      {selectedInvoiceRes && (
        <TaxInvoiceModal
          res={selectedInvoiceRes}
          onClose={() => setSelectedInvoiceRes(null)}
          taxSettings={taxSettingsMap || taxSettings}
          mealOrders={mealOrders}
        />
      )}

      {/* FRONTDESK ID LIGHTBOX MODAL */}
      {viewingIdDoc && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100000,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setViewingIdDoc(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '92vw',
              maxHeight: '92vh',
              background: '#ffffff',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              <div>
                <span style={{ fontWeight: 650, fontSize: 13.5, color: '#1e293b' }}>
                  🪪 Guest ID Proof — {viewingIdDoc.guest || viewingIdDoc.guestName || 'Guest'}
                </span>
                <span style={{ marginLeft: 10, fontSize: 12, color: '#64748b' }}>
                  ({viewingIdDoc.idType || 'Govt ID'}{viewingIdDoc.idNumber ? ` • ${viewingIdDoc.idNumber}` : ''})
                </span>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <a
                  href={viewingIdDoc.idDocumentUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ fontSize: 12, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
                >
                  Open in New Tab ↗
                </a>
                <button
                  type="button"
                  onClick={() => setViewingIdDoc(null)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', color: '#475569' }}
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>
            <div style={{ padding: 14, overflow: 'auto', display: 'flex', justifyContent: 'center', background: '#090d16' }}>
              <img
                src={viewingIdDoc.idDocumentUrl}
                alt="Guest ID Proof"
                style={{ maxWidth: '100%', maxHeight: '76vh', objectFit: 'contain', borderRadius: 6 }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}