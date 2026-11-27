import React from 'react';
import { formatDateKey, isToday, isWeekend } from '../utils/calendarUtils';

/**
 * OccupancySummaryRow Component
 * Renders the daily portfolio occupancy analytics footer row in the calendar grid.
 * Calculates utilization percentages and available room counts for each date column.
 */
export default function OccupancySummaryRow({ 
  daysArray = [], 
  totalRoomsCount = 0, 
  reservationsList = [] 
}) {
  if (daysArray.length === 0) return null;

  return (
    <div 
      className="cal-occ-footer-row" 
      style={{ gridTemplateColumns: `260px repeat(${daysArray.length}, minmax(110px, 1fr))` }}
    >
      <div className="cal-occ-label-box">
        <strong className="cal-occ-title">Portfolio Occupancy</strong>
        <span className="cal-occ-sub">Daily room utilization %</span>
      </div>

      {daysArray.map((dateObj, idx) => {
        const dateKey = formatDateKey(dateObj);
        const todayClass = isToday(dateObj) ? 'is-today' : '';
        const weekendClass = isWeekend(dateObj) ? 'is-weekend' : '';

        // Count active occupied room units overlapping this date key
        let occupiedCount = 0;
        reservationsList.forEach(b => {
          const status = (b.status || '').toLowerCase().trim();
          if (
            status.includes('cancel') ||
            status.includes('checkout') ||
            status.includes('check_out') ||
            status.includes('checked out') ||
            status.includes('depart') ||
            status.includes('noshow') ||
            status.includes('no_show') ||
            status.includes('void')
          ) {
            return;
          }
          const chkIn = formatDateKey(b.checkIn || b.checkin);
          const chkOut = formatDateKey(b.checkOut || b.checkout);
          if (dateKey >= chkIn && dateKey < chkOut) {
            if (Array.isArray(b.allocatedRooms) && b.allocatedRooms.length > 0) {
              occupiedCount += b.allocatedRooms.length;
            } else {
              occupiedCount += 1;
            }
          }
        });

        const totalCapacity = totalRoomsCount || 1;
        const occPercent = Math.min(100, Math.round((occupiedCount / totalCapacity) * 100));

        let occTheme = 'occ-low';
        if (occPercent >= 80) occTheme = 'occ-high';
        else if (occPercent >= 40) occTheme = 'occ-mid';

        const roomsLeft = Math.max(0, totalRoomsCount - occupiedCount);

        return (
          <div key={idx} className={`cal-occ-metric-cell ${todayClass} ${weekendClass}`}>
            <span className={`cal-occ-percent ${occTheme}`}>{occPercent}%</span>
            <div className="cal-occ-bar-track">
              <div className={`cal-occ-bar-fill ${occTheme}`} style={{ width: `${occPercent}%` }} />
            </div>
            <span className="cal-occ-avail">{roomsLeft} room{roomsLeft !== 1 ? 's' : ''} left</span>
          </div>
        );
      })}
    </div>
  );
}
