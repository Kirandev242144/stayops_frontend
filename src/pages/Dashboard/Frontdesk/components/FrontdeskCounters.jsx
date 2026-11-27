import React from 'react';
import { 
  FiLogIn, 
  FiLogOut, 
  FiHome, 
  FiAlertTriangle, 
  FiArchive 
} from 'react-icons/fi';
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
    <>
      {/* ── 1. NATIVE MOBILE APP MICRO-METRIC STAT CARDS (< 768px - Stitch Layout) ── */}
      <div className="fd-stitch-kpis">
        {/* Arrivals Card */}
        <button
          type="button"
          className={`fd-stitch-kpi ${opTab === OP_TABS.CHECKIN ? 'active' : ''}`}
          onClick={() => setOpTab(OP_TABS.CHECKIN)}
        >
          <div className="fd-stitch-kpi-left">
            <span className="fd-stitch-kpi-num">{todayArrivals.length}</span>
            <span className="fd-stitch-kpi-label">Arrivals</span>
          </div>
          {todayArrivals.length > 0 && (
            <span className="fd-stitch-pending-pill">
              {todayArrivals.length} Pending
            </span>
          )}
        </button>

        {/* Departures Card */}
        <button
          type="button"
          className={`fd-stitch-kpi ${opTab === OP_TABS.CHECKOUT ? 'active' : ''}`}
          onClick={() => setOpTab(OP_TABS.CHECKOUT)}
        >
          <div className="fd-stitch-kpi-left">
            <span className="fd-stitch-kpi-num">{todayDepartures.length}</span>
            <span className="fd-stitch-kpi-label">Departures</span>
          </div>
          {todayDepartures.length > 0 && (
            <span className="fd-stitch-pending-pill blue">
              {todayDepartures.length} Ready
            </span>
          )}
        </button>
      </div>

      {/* ── 2. DESKTOP & LAPTOP SPACIOUS 5-COLUMN PMS CARDS (>= 769px) ── */}
      <div className="fd-counters-grid fd-desktop-counters">
        <div
          className={`fd-counter-card ${opTab === OP_TABS.CHECKIN ? 'active' : ''}`}
          onClick={() => setOpTab(OP_TABS.CHECKIN)}
          role="button"
          tabIndex={0}
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
          role="button"
          tabIndex={0}
        >
          <div className="fd-counter-title">Today's Check-out Departures</div>
          <div className="fd-counter-value">{todayDepartures.length}</div>
          <span className="fd-counter-sub">Folio & GST Invoice Ready</span>
        </div>

        <div
          className={`fd-counter-card ${opTab === OP_TABS.INHOUSE ? 'active' : ''}`}
          onClick={() => setOpTab(OP_TABS.INHOUSE)}
          role="button"
          tabIndex={0}
        >
          <div className="fd-counter-title">Currently In-House Guests</div>
          <div className="fd-counter-value">{inHouseGuests.length}</div>
          <span className="fd-counter-sub">Active Room Stay</span>
        </div>

        <div
          className={`fd-counter-card ${opTab === OP_TABS.NOSHOW ? 'active' : ''} ${noShowAlerts > 0 ? 'fd-counter-alert' : ''}`}
          onClick={() => setOpTab(OP_TABS.NOSHOW)}
          role="button"
          tabIndex={0}
        >
          <div className="fd-counter-title">
            {noShowAlerts > 0 && <FiAlertTriangle className="fd-alert-icon" />}
            No-Show / Late Arrivals
          </div>
          <div className="fd-counter-value">{noShowAlerts}</div>
          <span className="fd-counter-sub">
            {lateArrivals.length > 0 ? `${lateArrivals.length} late today` : ''}
          </span>
        </div>

        <div
          className={`fd-counter-card ${opTab === OP_TABS.COMPLETED ? 'active' : ''}`}
          onClick={() => setOpTab(OP_TABS.COMPLETED)}
          role="button"
          tabIndex={0}
        >
          <div className="fd-counter-title">Completed / Checked-out</div>
          <div className="fd-counter-value">{completedStays.length}</div>
          <span className="fd-counter-sub">Archived & Invoiced</span>
        </div>
      </div>
    </>
  );
}
