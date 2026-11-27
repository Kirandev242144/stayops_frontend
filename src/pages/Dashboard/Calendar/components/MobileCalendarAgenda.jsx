import React, { useState } from 'react';
import { 
  FiCalendar, 
  FiUser, 
  FiHome, 
  FiLock,
  FiChevronLeft,
  FiChevronRight,
  FiPlus,
  FiSearch,
  FiDollarSign,
  FiCheckCircle,
  FiClock,
  FiArrowRight,
  FiX
} from 'react-icons/fi';
import { formatDateKey, isToday, isWeekend } from '../utils/calendarUtils';
import './MobileCalendarAgenda.css';

/**
 * MobileCalendarAgenda Component
 * Clean native mobile app interface for property managers and owners.
 */
export default function MobileCalendarAgenda({
  startDate,
  setStartDate,
  roomsList = [],
  reservationsList = [],
  blockedDates = [],
  customRates = {},
  housekeepingMap = {},
  selectedPropertyId = 'all',
  setSelectedPropertyId,
  propertiesList = [],
  searchQuery = '',
  setSearchQuery,
  onSelectBooking,
  onEmptySlotClick,
  onOpenNewResModal,
  onOpenBlockDatesModal,
  onOpenBulkPriceModal
}) {
  const [activeDate, setActiveDate] = useState(() => {
    const d = new Date(startDate);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [showSearch, setShowSearch] = useState(false);

  const activeDateKey = formatDateKey(activeDate);

  // 14-day horizontal touch strip starting from active date's vicinity
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

  // Filter rooms by search query if any
  const filteredRooms = roomsList.filter(room => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchName = (room.name || '').toLowerCase().includes(q);
    const matchCategory = (room.category || '').toLowerCase().includes(q);
    return matchName || matchCategory;
  });

  // Build room status cards for the active day
  const roomCards = filteredRooms.map((room) => {
    // 1. Check reservation
    const activeBooking = reservationsList.find((b) => {
      const matchRoom = (
        String(b.roomId) === String(room.id) ||
        String(b.roomId) === String(room.rawId) ||
        (b.rooms && b.rooms.some(r => String(r.id || r.roomId) === String(room.id) || String(r.id || r.roomId) === String(room.rawId)))
      );
      if (!matchRoom) return false;
      const chkIn = formatDateKey(b.checkIn || b.checkin);
      const chkOut = formatDateKey(b.checkOut || b.checkout);
      return activeDateKey >= chkIn && activeDateKey < chkOut;
    });

    // 2. Check blocked date
    const activeBlock = blockedDates.find((blk) => {
      const matchesRoom = blk.roomId === 'all' || String(blk.roomId) === String(room.id) || String(blk.roomId) === String(room.rawId);
      const matchesProp = !blk.propertyId || String(blk.propertyId) === String(room.propertyId);
      return matchesRoom && matchesProp && (activeDateKey >= blk.startDateStr && activeDateKey <= blk.endDateStr);
    });

    // 3. Resolve nightly rate accurately
    const rateOverride = customRates[`${room.id}_${activeDateKey}`] || customRates[`${room.rawId}_${activeDateKey}`];
    const resolvedRate = rateOverride !== undefined 
      ? rateOverride 
      : (room.pricePerNight || room.rate || room.baseRate || room.price || 4500);

    // 4. Housekeeping
    const hkStatus = housekeepingMap[room.id] || housekeepingMap[room.rawId] || room.housekeepingStatus || 'CLEAN';

    return {
      room,
      activeBooking,
      activeBlock,
      nightlyPrice: resolvedRate,
      hkStatus
    };
  });

  // Calculate daily occupancy numbers
  const occupiedCount = roomCards.filter(r => r.activeBooking).length;
  const blockedCount = roomCards.filter(r => r.activeBlock).length;
  const availableCount = Math.max(0, roomCards.length - occupiedCount - blockedCount);

  return (
    <div className="mob-cal-container">
      {/* ── 1. NATIVE TOP TOOLBAR ── */}
      <div className="mob-cal-top-card">
        {/* Row 1: Property Selector & Primary Booking Action */}
        <div className="mob-cal-top-row">
          <div className="mob-cal-property-pill">
            <FiHome size={15} className="mob-cal-prop-icon" />
            <select
              className="mob-cal-property-select"
              value={selectedPropertyId}
              onChange={(e) => setSelectedPropertyId && setSelectedPropertyId(e.target.value)}
            >
              <option value="all">All Properties</option>
              {propertiesList.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            className="mob-cal-new-booking-btn"
            onClick={onOpenNewResModal}
          >
            <FiPlus size={15} />
            <span>+ Booking</span>
          </button>
        </div>

        {/* Row 2: Secondary Quick Action Chips */}
        <div className="mob-cal-secondary-row">
          <button
            type="button"
            className={`mob-cal-action-chip ${showSearch ? 'active' : ''}`}
            onClick={() => setShowSearch(!showSearch)}
            aria-label="Search rooms"
          >
            <FiSearch size={13} />
            <span>Search</span>
          </button>

          <button
            type="button"
            className="mob-cal-action-chip"
            onClick={onOpenBlockDatesModal}
            aria-label="Block Dates"
          >
            <FiLock size={13} color="#D97706" />
            <span>Block Dates</span>
          </button>

          <button
            type="button"
            className="mob-cal-action-chip"
            onClick={onOpenBulkPriceModal}
            aria-label="Bulk Rates"
          >
            <FiDollarSign size={13} color="#0D9488" />
            <span>Bulk Rates</span>
          </button>
        </div>

        {/* Collapsible Search Input */}
        {showSearch && (
          <div className="mob-cal-search-bar">
            <FiSearch size={14} className="mob-cal-search-inner-icon" />
            <input
              type="text"
              className="mob-cal-search-input"
              placeholder="Search room name or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button 
                type="button" 
                className="mob-cal-search-clear"
                onClick={() => setSearchQuery && setSearchQuery('')}
              >
                <FiX size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── 2. NATIVE HORIZONTAL DATE SCRUBBER ── */}
      <div className="mob-cal-scrubber-card">
        <div className="mob-cal-scrubber-header">
          <div className="mob-cal-header-title">
            <strong className="mob-cal-month-year">
              {activeDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
            </strong>
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

        {/* Horizontal Swipeable Day Pills */}
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

      {/* ── 3. OCCUPANCY SUMMARY CHIPS ── */}
      <div className="mob-cal-metric-chips">
        <div className="mob-metric-chip green">
          <span className="mob-chip-dot green" />
          <span className="mob-chip-num">{availableCount}</span>
          <span className="mob-chip-label">Available</span>
        </div>
        <div className="mob-metric-chip blue">
          <span className="mob-chip-dot blue" />
          <span className="mob-chip-num">{occupiedCount}</span>
          <span className="mob-chip-label">Occupied</span>
        </div>
        <div className="mob-metric-chip amber">
          <span className="mob-chip-dot amber" />
          <span className="mob-chip-num">{blockedCount}</span>
          <span className="mob-chip-label">Blocked</span>
        </div>
      </div>

      {/* ── 4. ROOMS FEED ── */}
      <div className="mob-cal-room-list">
        {roomCards.length === 0 ? (
          <div className="mob-cal-empty-state">
            <p>No room units match your selection.</p>
          </div>
        ) : (
          roomCards.map(({ room, activeBooking, activeBlock, nightlyPrice, hkStatus }) => {
            // OCCUPIED ROOM CARD
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
                    <span className="mob-room-price">
                      ₹{Number(nightlyPrice).toLocaleString('en-IN')}<small>/nt</small>
                    </span>
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

            // BLOCKED ROOM CARD
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

            // AVAILABLE ROOM CARD
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
                  <span className="mob-room-price">
                    ₹{Number(nightlyPrice).toLocaleString('en-IN')}<small>/nt</small>
                  </span>
                </div>

                <div className="mob-room-avail-actions">
                  <span className={`mob-hk-tag ${hkStatus.toLowerCase()}`}>
                    HK: {hkStatus === 'CLEAN' ? 'Clean' : (hkStatus === 'DIRTY' ? 'Dirty' : 'In Cleaning')}
                  </span>
                  <button 
                    type="button" 
                    className="mob-book-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onEmptySlotClick) onEmptySlotClick(room, activeDate);
                    }}
                  >
                    <FiPlus size={13} /> Book Unit
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
