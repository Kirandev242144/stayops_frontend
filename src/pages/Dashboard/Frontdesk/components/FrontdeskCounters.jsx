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

  const counterItems = [
    {
      id: OP_TABS.CHECKIN,
      shortLabel: 'Check-in',
      fullTitle: "Today's Check-in Arrivals",
      count: todayArrivals.length,
      icon: FiLogIn,
      sub: pendingBalanceArrivals.length > 0 ? `${pendingBalanceArrivals.length} Balance Pending` : '100% Pre-paid'
    },
    {
      id: OP_TABS.CHECKOUT,
      shortLabel: 'Check-out',
      fullTitle: "Today's Check-out Departures",
      count: todayDepartures.length,
      icon: FiLogOut,
      sub: 'Folio & GST Invoice Ready'
    },
    {
      id: OP_TABS.INHOUSE,
      shortLabel: 'In-House',
      fullTitle: "Currently In-House Guests",
      count: inHouseGuests.length,
      icon: FiHome,
      sub: 'Active Room Stay'
    },
    {
      id: OP_TABS.NOSHOW,
      shortLabel: 'Alerts',
      fullTitle: "No-Show / Late Arrivals",
      count: noShowAlerts,
      icon: FiAlertTriangle,
      isAlert: noShowAlerts > 0,
      sub: noShowAlerts === 0 ? 'All arrived on time' : `${noShowAlerts} requiring review`
    },
    {
      id: OP_TABS.COMPLETED,
      shortLabel: 'Completed',
      fullTitle: "Completed / Checked-out",
      count: completedStays.length,
      icon: FiArchive,
      sub: 'Archived & Invoiced'
    }
  ];

  return (
    <div className="fd-counters-grid" role="tablist">
      {counterItems.map(item => {
        const Icon = item.icon;
        const isActive = opTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`fd-counter-card ${isActive ? 'active' : ''} ${item.isAlert ? 'fd-counter-alert' : ''}`}
            onClick={() => setOpTab(item.id)}
          >
            <div className="fd-counter-header-row">
              <span className="fd-counter-icon">
                <Icon size={14} />
              </span>
              <span className="fd-counter-title">{item.fullTitle}</span>
              <span className="fd-counter-mobile-label">{item.shortLabel}</span>
            </div>
            <div className="fd-counter-value">{item.count}</div>
            <span className="fd-counter-sub">{item.sub}</span>
          </button>
        );
      })}
    </div>
  );
}
