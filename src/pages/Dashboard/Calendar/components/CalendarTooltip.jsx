import React from 'react';
import { calculateFolio } from '../../Frontdesk/utils/folioCalculator';
import { formatTime12Hr } from '../../../../utils/timeFormat';


/**
 * CalendarTooltip Component
 * Floating popup tooltip displayed when hovering over a booking block in the tape chart grid.
 * Displays guest contact information, stay dates, check-in/out times, folio total, and pending balance.
 */
export default function CalendarTooltip({ booking, mealOrders = [], taxSettings = null, position }) {
  if (!booking || !position) return null;

  const folio = calculateFolio(booking, mealOrders, taxSettings);
  const guestName = booking.guestName || booking.guest || 'Guest';
  const phone = booking.guestPhone || booking.phone || 'No contact on file';
  const bookingRef = booking.id || `BK-${booking.dbId}`;
  const channel = booking.bookingSource || booking.ota || 'Walk-In';
  const status = (booking.status || 'confirmed').toUpperCase();

  const inTime = booking.checkInTime ? formatTime12Hr(booking.checkInTime) : '2:00 PM';
  const outTime = booking.checkOutTime ? formatTime12Hr(booking.checkOutTime) : '11:00 AM';

  const TT_WIDTH = 280;
  const TT_HEIGHT = 220;

  // Position tooltip right next to mouse cursor with viewport boundary flip
  let left = position.x + 15;
  if (left + TT_WIDTH > window.innerWidth - 12) {
    left = Math.max(12, position.x - TT_WIDTH - 12);
  }

  let top = position.y + 15;
  if (top + TT_HEIGHT > window.innerHeight - 12) {
    top = Math.max(12, position.y - TT_HEIGHT - 12);
  }

  return (
    <div
      className="cal-tooltip-card"
      style={{
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        zIndex: 99999,
        pointerEvents: 'none'
      }}
    >
      <div className="cal-tt-header">
        <div className="cal-tt-ref-box">
          <strong className="cal-tt-ref">{bookingRef}</strong>
          <span className="cal-tt-channel">{channel}</span>
        </div>
        <span className={`cal-tt-status-pill status-${status.toLowerCase()}`}>
          {status}
        </span>
      </div>

      <div className="cal-tt-body">
        <div className="cal-tt-row">
          <span className="cal-tt-label">Guest</span>
          <strong className="cal-tt-val">{guestName}</strong>
        </div>
        <div className="cal-tt-row">
          <span className="cal-tt-label">Phone</span>
          <span className="cal-tt-val">{phone}</span>
        </div>
        <div className="cal-tt-row">
          <span className="cal-tt-label">Dates</span>
          <span className="cal-tt-val">{booking.checkIn || booking.checkin} &rarr; {booking.checkOut || booking.checkout}</span>
        </div>
        <div className="cal-tt-row">
          <span className="cal-tt-label">Check-In / Out</span>
          <span className="cal-tt-val" style={{ color: '#0D9488', fontWeight: 600 }}>
            In: {inTime} &bull; Out: {outTime}
          </span>
        </div>
      </div>

      <div className="cal-tt-footer">
        <div className="cal-tt-fin-col">
          <span className="cal-tt-fin-sub">Total Folio</span>
          <strong className="cal-tt-fin-amt">&#8377;{folio.totalFolio.toLocaleString('en-IN')}</strong>
        </div>
        <div className="cal-tt-fin-col align-right">
          <span className="cal-tt-fin-sub">Balance Due</span>
          <strong className={`cal-tt-fin-amt ${folio.balanceDue > 0 ? 'due-amber' : 'paid-green'}`}>
            {folio.balanceDue > 0 ? `\u20B9${folio.balanceDue.toLocaleString('en-IN')}` : '✓ Paid'}
          </strong>
        </div>
      </div>
    </div>
  );
}
