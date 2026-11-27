import React from 'react';
import { FiAlertTriangle } from 'react-icons/fi';
import { OP_TABS } from '../frontdeskConstants';
import { isLateArrival, isMissedArrival } from '../utils/frontdeskStatus';
import { calculateFolio } from '../utils/folioCalculator';

export default function FrontdeskCounters({
  reservationsList = [],
  mealOrders = [],
  opTab,
  setOpTab,
  propertyOperations = null,
  taxSettings = null
}) {
  const now = new Date();
  const todayISO = now.toISOString().split('T')[0];

  const todayArrivals = reservationsList.filter(r => (r.status === 'confirmed' || r.status === 'checkin') && r.checkin === todayISO);
  const todayDepartures = reservationsList.filter(r => (r.status === 'inhouse' || r.status === 'checkedin') && r.checkout === todayISO);
  const inHouseGuests = reservationsList.filter(r => r.status === 'inhouse' || r.status === 'checkedin');
  const completedStays = reservationsList.filter(r => r.status === 'checkedout' || r.status === 'completed');
  const noShowGuests = reservationsList.filter(r => r.status === 'no_show');

  const lateArrivals = todayArrivals.filter(r => isLateArrival(r, propertyOperations, now));
  const missedArrivals = reservationsList.filter(r => isMissedArrival(r, now));
  const noShowAlerts = lateArrivals.length + missedArrivals.length + noShowGuests.length;

  const pendingBalanceArrivals = todayArrivals.filter(r => {
    const folio = calculateFolio(r, mealOrders, taxSettings);
    return folio.isBalancePending;
  });

  return (
    <div className="fd-counters-grid">
      <div
        className={`fd-counter-card ${opTab === OP_TABS.CHECKIN ? 'active' : ''}`}
        onClick={() => setOpTab(OP_TABS.CHECKIN)}
      >
        <div className="fd-counter-title">Today's Check-in Arrivals</div>
        <div className="fd-counter-value">{todayArrivals.length}</div>
        <span className="fd-counter-sub">
          {pendingBalanceArrivals.length > 0 ? `${pendingBalanceArrivals.length} Balance Pending` : '100% Pre-paid Queue'}
        </span>
      </div>

      <div
        className={`fd-counter-card ${opTab === OP_TABS.CHECKOUT ? 'active' : ''}`}
        onClick={() => setOpTab(OP_TABS.CHECKOUT)}
      >
        <div className="fd-counter-title">Today's Check-out Departures</div>
        <div className="fd-counter-value">{todayDepartures.length}</div>
        <span className="fd-counter-sub">Folio & GST Invoice Ready</span>
      </div>

      <div
        className={`fd-counter-card ${opTab === OP_TABS.INHOUSE ? 'active' : ''}`}
        onClick={() => setOpTab(OP_TABS.INHOUSE)}
      >
        <div className="fd-counter-title">Currently In-House Guests</div>
        <div className="fd-counter-value">{inHouseGuests.length}</div>
        <span className="fd-counter-sub">Active Room Stay</span>
      </div>

      <div
        className={`fd-counter-card ${opTab === OP_TABS.NOSHOW ? 'active' : ''} ${noShowAlerts > 0 ? 'fd-counter-alert' : ''}`}
        onClick={() => setOpTab(OP_TABS.NOSHOW)}
      >
        <div className="fd-counter-title">
          {noShowAlerts > 0 && <FiAlertTriangle className="fd-alert-icon" />}
          No-Show / Late Arrivals
        </div>
        <div className="fd-counter-value">{noShowAlerts}</div>
        <span className="fd-counter-sub">
          {lateArrivals.length > 0 ? `${lateArrivals.length} late today` : ''}
          {missedArrivals.length > 0 ? `${lateArrivals.length > 0 ? ' · ' : ''}${missedArrivals.length} missed` : ''}
          {noShowGuests.length > 0 ? `${(lateArrivals.length > 0 || missedArrivals.length > 0) ? ' · ' : ''}${noShowGuests.length} marked` : ''}
          {noShowAlerts === 0 ? 'All guests arrived on time' : ''}
        </span>
      </div>

      <div
        className={`fd-counter-card ${opTab === OP_TABS.COMPLETED ? 'active' : ''}`}
        onClick={() => setOpTab(OP_TABS.COMPLETED)}
      >
        <div className="fd-counter-title">Completed / Checked-out Stays</div>
        <div className="fd-counter-value">{completedStays.length}</div>
        <span className="fd-counter-sub">Archived & Invoiced</span>
      </div>
    </div>
  );
}
