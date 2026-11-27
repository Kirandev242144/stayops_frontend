import { OP_TABS, TIME_FILTERS } from '../frontdeskConstants';
import { isLateArrival, shouldPromptNoShow, isMissedArrival } from './frontdeskStatus';

export function getFrontdeskQueue({
  reservationsList = [],
  opTab = OP_TABS.CHECKIN,
  timeFilter = TIME_FILTERS.TODAY,
  searchQuery = "",
  propertyOperations = null,
  now = new Date()
}) {
  const query = searchQuery.trim().toLowerCase();
  const todayISO = now.toISOString().split('T')[0];

  const tomorrowObj = new Date(now);
  tomorrowObj.setDate(tomorrowObj.getDate() + 1);
  const tomorrowISO = tomorrowObj.toISOString().split('T')[0];

  const weekObj = new Date(now);
  weekObj.setDate(weekObj.getDate() + 7);
  const weekEndISO = weekObj.toISOString().split('T')[0];
  


  return reservationsList.filter(r => {
    const matchSearch = !query ||
      (r.guest || '').toLowerCase().includes(query) ||
      (r.id || '').toLowerCase().includes(query) ||
      (r.propertyName || '').toLowerCase().includes(query) ||
      (r.phone || '').includes(query);

    if (!matchSearch) return false;

    if (opTab === OP_TABS.CHECKIN) {
      if (r.status !== 'confirmed' && r.status !== 'checkin') return false;
      if (timeFilter === TIME_FILTERS.TODAY) return r.checkin === todayISO;
      if (timeFilter === TIME_FILTERS.TOMORROW) return r.checkin === tomorrowISO;
      if (timeFilter === TIME_FILTERS.WEEK) return r.checkin >= todayISO && r.checkin <= weekEndISO;
      return true;
    }

    if (opTab === OP_TABS.CHECKOUT) {
      return r.status === 'inhouse' || r.status === 'checkedin';
    }

    if (opTab === OP_TABS.INHOUSE) {
      return r.status === 'inhouse' || r.status === 'checkedin';
    }

    if (opTab === OP_TABS.COMPLETED) {
      return r.status === 'checkedout' || r.status === 'completed';
    }

    if (opTab === OP_TABS.NOSHOW) {
      if (r.status === 'no_show') return true;
      if (isMissedArrival(r, now)) return true;
      if (shouldPromptNoShow(r, propertyOperations, now)) return true;
      return false;
    }

    return true;
  });
}
