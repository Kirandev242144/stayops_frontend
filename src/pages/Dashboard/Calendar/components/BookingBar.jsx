import React from 'react';
import { calculateFolio } from '../../Frontdesk/utils/folioCalculator';

/**
 * BookingBar Component
 * Renders an individual reservation booking block spanning across date columns
 * in the PMS tape chart grid. Handles status color themes, payment status pills,
 * same-day turnover margins, and click/hover handlers.
 */
export default function BookingBar({
  booking,
  posInfo,
  mealOrders = [],
  taxSettings = null,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  onClickBooking
}) {
  if (!booking || !posInfo || !posInfo.isVisible) return null;

  const folio = calculateFolio(booking, mealOrders, taxSettings);
  const statusStr = String(booking.status || 'confirmed').toLowerCase();

  // Determine status color theme
  let statusTheme = 'bar-slate-confirmed';
  if (statusStr === 'checkedin' || statusStr === 'checked_in' || statusStr === 'inhouse') {
    statusTheme = 'bar-slate-checkedin';
  } else if (statusStr === 'cancelled') {
    statusTheme = 'bar-slate-cancelled';
  } else if (booking.bookingSource && booking.bookingSource !== 'Walk-In' && booking.bookingSource !== 'Direct') {
    statusTheme = 'bar-slate-ota';
  }

  const isPendingDue = folio.balanceDue > 0 && statusStr !== 'cancelled';
  const guestName = booking.guestName || booking.guest || 'Guest';
  const firstLetter = guestName.charAt(0).toUpperCase();

  const isMultiRoom = (Array.isArray(booking.allocatedRooms) && booking.allocatedRooms.length > 1) || 
                      (booking.roomUnit && booking.roomUnit.includes(','));

  return (
    <div
      className={`cal-booking-block ${statusTheme} ${isPendingDue ? 'is-pending-due' : ''}`}
      style={{
        gridColumnStart: posInfo.gridColStart,
        gridColumnEnd: posInfo.gridColEnd,
        marginLeft: `${posInfo.marginLeftPercent}%`,
        marginRight: `${posInfo.marginRightPercent}%`
      }}
      onMouseEnter={e => onMouseEnter && onMouseEnter(e, booking)}
      onMouseMove={e => onMouseMove && onMouseMove(e, booking)}
      onMouseLeave={onMouseLeave}
      onClick={e => {
        e.stopPropagation();
        onClickBooking(booking);
      }}
    >
      <div className="cal-block-inner">
        <div className="cal-guest-avatar">{firstLetter}</div>
        <span className="cal-guest-name">{guestName}</span>
        
        <div className="cal-block-pills">
          {isMultiRoom && <span className="cal-night-pill" style={{ background: 'rgba(99,102,241,0.2)', color: '#818cf8', fontWeight: 600 }} title="Multi-Room Linked Booking">&#128279; Multi</span>}
          <span className="cal-night-pill">{posInfo.stayNights}n</span>
          {isPendingDue ? (
            <span className="cal-due-pill">
              Due &#8377;{folio.balanceDue.toLocaleString('en-IN')}
            </span>
          ) : (
            <span className="cal-paid-pill">✓ Paid</span>
          )}
        </div>
      </div>
    </div>
  );
}
