import React, { useState } from 'react';
import { 
  FiCalendar, 
  FiUser, 
  FiHome, 
  FiPhone, 
  FiDollarSign, 
  FiClock, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiLock,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiMoon
} from 'react-icons/fi';
import { formatDateKey, isToday, isWeekend } from '../utils/calendarUtils';
import './MobileCalendarAgenda.css';

/**
 * MobileCalendarAgenda Component
 * A native mobile-first interactive agenda and daily room status view.
 * Enables quick date selection, room availability glance, swipeable date scrubber,
 * active guest stays inspection, and instant reservation/rate actions.
 */
export default function MobileCalendarAgenda({
  startDate,
  setStartDate,
  roomsList = [],
  reservationsList = [],
  blockedDates = [],
  customRates = {},
  housekeepingMap = {},
  onSelectBooking,
  onEmptySlotClick,
  onOpenNewResModal,
  onOpenBlockDatesModal
}) {
  const [activeDate, setActiveDate] = useState(() => {
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const activeDateKey = formatDateKey(activeDate);

  // Generate a 14-day touch strip starting from startDate
  const dateStrip = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const handlePrevDay = () => {
    const next = new Date(activeDate);
    next.setDate(activeDate.getDate() - 1);
    setActiveDate(next);
  };

  const handleNextDay = () => {
    const next = new Date(activeDate);
    next.setDate(activeDate.getDate() + 1);
    setActiveDate(next);
  };

  const handleJumpToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setActiveDate(today);
    setStartDate(today);
  };

  // Build room status cards for the active selected day
  const roomCards = roomsList.map((room) => {
    // 1. Check reservation
    const activeBooking = reservationsList.find((b) => {
      const matchRoom = (
        String(b.roomId) === String(room.id) ||
        (b.rooms && b.rooms.some(r => String(r.id || r.roomId) === String(room.id)))
      );
      if (!matchRoom) return false;
      const chkIn = formatDateKey(b.checkIn || b.checkin);
      const chkOut = formatDateKey(b.checkOut || b.checkout);
      return activeDateKey >= chkIn && activeDateKey < chkOut;
    });

    // 2. Check blocked date
    const activeBlock = blockedDates.find((blk) => {
      const matchesRoom = blk.roomId === 'all' || String(blk.roomId) === String(room.id);
      const matchesProp = !blk.propertyId || String(blk.propertyId) === String(room.propertyId);
      return matchesRoom && matchesProp && (activeDateKey >= blk.startDateStr && activeDateKey <= blk.endDateStr);
    });

    // 3. Rate
    const rateOverride = customRates[`${room.id}_${activeDateKey}`];
    const nightlyPrice = rateOverride !== undefined ? rateOverride : (room.basePrice || room.price || 0);

    // 4. Housekeeping
    const hkStatus = housekeepingMap[room.id] || room.housekeepingStatus || 'CLEAN';

    return {
      room,
      activeBooking,
      activeBlock,
      nightlyPrice,
      hkStatus
    };
  });

  // Calculate quick metrics for the day
  const occupiedCount = roomCards.filter(r => r.activeBooking).length;
  const blockedCount = roomCards.filter(r => r.activeBlock).length;
  const availableCount = roomCards.length - occupiedCount - blockedCount;

  return (
    <div className="mob-cal-agenda-container">
      {/* ── 1. NATIVE HORIZONTAL DATE SCRUBBER ── */}
      <div className="mob-cal-scrubber-card">
        <div className="mob-cal-scrubber-header">
          <div className="mob-cal-header-title">
            <span className="mob-cal-month-year">
              {activeDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </span>
            <span className="mob-cal-weekday">
              {activeDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          <div className="mob-cal-header-controls">
            <button 
              type="button" 
              className="mob-cal-today-btn"
              onClick={handleJumpToday}
            >
              Today
            </button>
            <div className="mob-cal-stepper">
              <button type="button" onClick={handlePrevDay} aria-label="Previous day">
                <FiChevronLeft size={16} />
              </button>
              <button type="button" onClick={handleNextDay} aria-label="Next day">
                <FiChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Day Pills */}
        <div className="mob-cal-days-strip">
          {dateStrip.map((dObj) => {
            const dKey = formatDateKey(dObj);
            const isSelected = dKey === activeDateKey;
            const isCurToday = isToday(dObj);
            const isWknd = isWeekend(dObj);
            const dayNum = dObj.getDate();
            const dayName = dObj.toLocaleDateString('en-US', { weekday: 'narrow' });

            return (
              <button
                key={dKey}
                type="button"
                className={`mob-cal-day-pill ${isSelected ? 'selected' : ''} ${isCurToday ? 'today' : ''} ${isWknd ? 'weekend' : ''}`}
                onClick={() => setActiveDate(dObj)}
              >
                <span className="mob-pill-dayname">{dayName}</span>
                <span className="mob-pill-daynum">{dayNum}</span>
                {isCurToday && <span className="mob-pill-dot" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. DAILY OCCUPANCY METRIC CHIPS ── */}
      <div className="mob-cal-metric-chips">
        <div className="mob-metric-chip green">
          <span className="mob-chip-num">{availableCount}</span>
          <span className="mob-chip-label">Available</span>
        </div>
        <div className="mob-metric-chip blue">
          <span className="mob-chip-num">{occupiedCount}</span>
          <span className="mob-chip-label">Occupied</span>
        </div>
        <div className="mob-metric-chip amber">
          <span className="mob-chip-num">{blockedCount}</span>
          <span className="mob-chip-label">Blocked</span>
        </div>
      </div>

      {/* ── 3. ROOM UNITS AGENDA LIST ── */}
      <div className="mob-cal-room-list">
        {roomCards.map(({ room, activeBooking, activeBlock, nightlyPrice, hkStatus }) => {
          if (activeBooking) {
            const guestName = activeBooking.guestName || activeBooking.guest?.name || 'Guest';
            const channel = activeBooking.channel || 'Direct';
            const status = (activeBooking.status || 'CONFIRMED').toUpperCase();
            const isCheckedIn = status === 'CHECKED_IN';
            const checkInStr = activeBooking.checkIn ? new Date(activeBooking.checkIn).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '';
            const checkOutStr = activeBooking.checkOut ? new Date(activeBooking.checkOut).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : '';

            return (
              <div 
                key={room.id}
                className="mob-cal-room-card occupied"
                onClick={() => onSelectBooking && onSelectBooking(activeBooking)}
              >
                <div className="mob-room-card-header">
                  <div className="mob-room-title-box">
                    <span className="mob-room-badge occupied">OCCUPIED</span>
                    <strong className="mob-room-name">{room.name}</strong>
                  </div>
                  <span className="mob-room-price">₹{Number(nightlyPrice).toLocaleString('en-IN')}<small>/nt</small></span>
                </div>

                <div className="mob-room-booking-body">
                  <div className="mob-guest-row">
                    <FiUser size={15} className="mob-guest-icon" />
                    <span className="mob-guest-name">{guestName}</span>
                    <span className="mob-channel-pill">{channel}</span>
                  </div>

                  <div className="mob-stay-dates-row">
                    <FiCalendar size={13} className="mob-stay-icon" />
                    <span>{checkInStr} &rarr; {checkOutStr}</span>
                    <span className={`mob-status-pill ${isCheckedIn ? 'checkedin' : 'confirmed'}`}>
                      {isCheckedIn ? 'In-House' : 'Confirmed'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          if (activeBlock) {
            return (
              <div key={room.id} className="mob-cal-room-card blocked">
                <div className="mob-room-card-header">
                  <div className="mob-room-title-box">
                    <span className="mob-room-badge blocked">BLOCKED</span>
                    <strong className="mob-room-name">{room.name}</strong>
                  </div>
                  <FiLock size={15} color="#D97706" />
                </div>
                <p className="mob-blocked-reason">
                  {activeBlock.reason || 'Maintenance / Owner Hold'}
                </p>
              </div>
            );
          }

          // Available Room Slot
          return (
            <div 
              key={room.id}
              className="mob-cal-room-card available"
              onClick={() => onEmptySlotClick && onEmptySlotClick(room, activeDate)}
            >
              <div className="mob-room-card-header">
                <div className="mob-room-title-box">
                  <span className="mob-room-badge available">AVAILABLE</span>
                  <strong className="mob-room-name">{room.name}</strong>
                </div>
                <span className="mob-room-price">₹{Number(nightlyPrice).toLocaleString('en-IN')}<small>/nt</small></span>
              </div>

              <div className="mob-room-avail-actions">
                <span className="mob-hk-tag">
                  HK: {hkStatus === 'CLEAN' ? 'Verified Clean' : (hkStatus === 'DIRTY' ? 'Dirty' : 'In Cleaning')}
                </span>
                <button 
                  type="button" 
                  className="mob-book-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onEmptySlotClick) onEmptySlotClick(room, activeDate);
                  }}
                >
                  <FiPlus size={14} /> Book Room
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
