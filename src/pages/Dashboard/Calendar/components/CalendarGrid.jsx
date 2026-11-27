import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

import { 
  FiCheckCircle, 
  FiAlertCircle, 
  FiRefreshCw, 
  FiCamera 
} from 'react-icons/fi';
import { 
  isToday, 
  isWeekend, 
  formatDateKey, 
  calculateBookingPosition,
  resolveRoomHousekeeping,
  filterActiveRoomReservations
} from '../utils/calendarUtils';
import BookingBar from './BookingBar';
import CalendarTooltip from './CalendarTooltip';
import OccupancySummaryRow from './OccupancySummaryRow';

/**
 * CalendarGrid Component
 * Renders the multi-room tape chart timeline matrix with interactive drag-to-select range booking,
 * daily slot cells with per-night rate tags, reservation booking blocks, blocked date bars,
 * housekeeping status toggles, and daily occupancy summary footer.
 */
export default function CalendarGrid({
  daysArray = [],
  roomsList = [],
  reservationsList = [],
  mealOrders = [],
  taxSettings = null,
  viewMode = 'rates_and_stays',
  customRates = {},
  blockedDates = [],
  housekeepingMap = {},
  onClickBooking,
  onEmptySlotClick,
  onRangeSlotSelect,
  onOpenInlineRateModal,
  onToggleHousekeeping,
  onOpenPhotoProofModal,
  onUnblockDate
}) {
  const [tooltipData, setTooltipData] = useState(null);
  
  // Drag-to-select date range state: { roomId, startIdx, currentIdx }
  const [dragState, setDragState] = useState(null);

  // Global mouseup event listener to complete drag-to-select range
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (!dragState) return;

      const { roomId, startIdx, currentIdx } = dragState;
      setDragState(null);

      const room = roomsList.find(r => r.id === roomId);
      if (!room) return;

      const minIdx = Math.min(startIdx, currentIdx);
      const maxIdx = Math.max(startIdx, currentIdx);

      // Check if selected night cells contain unavailable slots
      const hasUnavailable = daysArray.slice(minIdx, maxIdx + 1).some((dObj) => {
        const dateKey = formatDateKey(dObj);
        const todayKey = formatDateKey(new Date());
        if (dateKey < todayKey) return true;

        const roomResList = filterActiveRoomReservations(reservationsList, room);
        const roomBlocks = blockedDates.filter(blk => {
          const matchesRoom = blk.roomId === 'all' || String(blk.roomId) === String(room.id);
          const matchesProp = !blk.propertyId || String(blk.propertyId) === String(room.propertyId);
          return matchesRoom && matchesProp;
        });

        const isOccupied = roomResList.some(b => {
          const inStr = formatDateKey(b.checkIn || b.checkin);
          const outStr = formatDateKey(b.checkOut || b.checkout);
          return dateKey >= inStr && dateKey < outStr;
        });

        const isBlocked = roomBlocks.some(blk => dateKey >= blk.startDateStr && dateKey <= blk.endDateStr);
        return isOccupied || isBlocked;
      });

      if (hasUnavailable) {
        toast.warning("Selected date range contains occupied, blocked, or past dates.");
        return;
      }

      const checkInDate = daysArray[minIdx];
      let checkOutDate;
      if (maxIdx + 1 < daysArray.length) {
        checkOutDate = daysArray[maxIdx + 1];
      } else {
        const next = new Date(daysArray[maxIdx]);
        next.setDate(next.getDate() + 1);
        checkOutDate = next;
      }

      if (onRangeSlotSelect) {
        onRangeSlotSelect(room, checkInDate, checkOutDate);
      } else if (onEmptySlotClick) {
        onEmptySlotClick(room, checkInDate);
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [dragState, daysArray, roomsList, reservationsList, blockedDates, onRangeSlotSelect, onEmptySlotClick]);

  // Group rooms by category
  const roomCategories = roomsList.reduce((acc, r) => {
    const cat = r.category || 'Standard Units';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  // Scope reservations for occupancy analytics to only the active visible properties
  const activePropertyIds = new Set(roomsList.map(r => String(r.propertyId)).filter(Boolean));
  const scopedReservationsList = activePropertyIds.size > 0
    ? reservationsList.filter(b => {
        const bPropId = String(b.propertyId || b.property_id || b.property?.id || '');
        return !bPropId || activePropertyIds.has(bPropId);
      })
    : reservationsList;

  const handleMouseEnterBooking = (e, booking) => {
    setTooltipData({
      booking,
      position: {
        x: e.clientX,
        y: e.clientY
      }
    });
  };

  const handleMouseMoveBooking = (e, booking) => {
    setTooltipData({
      booking,
      position: {
        x: e.clientX,
        y: e.clientY
      }
    });
  };

  const handleMouseLeaveBooking = () => {
    setTooltipData(null);
  };

  const gridTemplateCols = `260px repeat(${daysArray.length}, minmax(110px, 1fr))`;

  return (
    <div className="cal-matrix-card">
      <div className="cal-matrix-scroll">

        {/* 1. TIMELINE HEADER AXIS */}
        <div className="cal-matrix-header" style={{ gridTemplateColumns: gridTemplateCols }}>
          <div className="cal-corner-cell">
            <span className="cal-corner-title">ROOM UNIT & HOUSEKEEPING</span>
          </div>

          {daysArray.map((dateObj, idx) => {
            const today = isToday(dateObj);
            const weekend = isWeekend(dateObj);
            const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
            const monthDay = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

            return (
              <div
                key={idx}
                className={`cal-date-col-header ${today ? 'is-today' : ''} ${weekend ? 'is-weekend' : ''}`}
              >
                <span className="cal-hdr-day">{dayName}</span>
                <strong className="cal-hdr-date">{monthDay}</strong>
                {today && <span className="cal-hdr-today-pill">TODAY</span>}
              </div>
            );
          })}
        </div>

        {/* 2. CATEGORY GROUPS & ROOM ROWS */}
        {Object.keys(roomCategories).length === 0 ? (
          <div className="cal-empty-view">
            <p>No room units found matching your property or filter.</p>
          </div>
        ) : (
          Object.entries(roomCategories).map(([category, rooms]) => (
            <div key={category} className="cal-cat-section">
              {/* Category Strip */}
              <div className="cal-cat-strip">
                <span className="cal-cat-strip-accent" />
                <strong className="cal-cat-name">{category}</strong>
                <span className="cal-cat-badge">{rooms.length} Unit{rooms.length > 1 ? 's' : ''}</span>
              </div>

              {/* Category Room Rows */}
              {rooms.map(room => {
                // Active/upcoming reservations for this unit
                const roomResList = filterActiveRoomReservations(reservationsList, room);

                // Filter blocked date ranges for this unit
                const roomBlocks = blockedDates.filter(blk => {
                  const matchesRoom = blk.roomId === 'all' || String(blk.roomId) === String(room.id);
                  const matchesProp = !blk.propertyId || String(blk.propertyId) === String(room.propertyId);
                  return matchesRoom && matchesProp;
                });

                // Resolve housekeeping status & photo proof url cleanly
                const hkInfo = resolveRoomHousekeeping(room, housekeepingMap);
                const { status: hkStatus, isClean, isDirty, isInProgress, photoProofUrl, rawEntry, roomKey } = hkInfo;

                return (
                  <div key={room.id} className="cal-room-row" style={{ gridTemplateColumns: gridTemplateCols }}>
                    
                    {/* Sticky Room Directory Cell */}
                    <div className="cal-room-meta-cell">
                      <div className="cal-room-meta-top">
                        <strong className="cal-unit-title">{room.name}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            className={`cal-hk-pill-btn hk-status-${isClean ? 'clean' : isDirty ? 'dirty' : 'progress'}`}
                            title={`Room Cleaning Status: ${hkStatus}. Click to toggle (Clean / Dirty / In Progress).`}
                            onClick={() => onToggleHousekeeping && onToggleHousekeeping(roomKey, hkStatus)}
                          >
                            <span className="cal-hk-dot" />
                            {isClean && <FiCheckCircle className="cal-hk-icon" />}
                            {isDirty && <FiAlertCircle className="cal-hk-icon" />}
                            {isInProgress && <FiRefreshCw className="cal-hk-icon spinning" />}
                            <span>{isClean ? 'Clean' : isDirty ? 'Dirty' : 'Cleaning'}</span>
                          </button>
                        </div>
                      </div>

                      <div className="cal-room-meta-bottom">
                        <span className="cal-spec-pill">&#128101; {room.capacity} Guests</span>
                        <span className="cal-rate-pill">&#8377;{room.pricePerNight.toLocaleString('en-IN')}/nt</span>
                        
                        {photoProofUrl && (
                          <button
                            type="button"
                            className="cal-proof-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenPhotoProofModal) onOpenPhotoProofModal(room, rawEntry);
                            }}
                            title="View Verified Caretaker Photo Proof"
                          >
                            <FiCamera size={11} /> Proof
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Timeline Cell Slots Matrix */}
                    <div 
                      className="cal-slots-container" 
                      style={{ gridTemplateColumns: `repeat(${daysArray.length}, minmax(110px, 1fr))` }}
                    >
                      {daysArray.map((dateObj, dIdx) => {
                        const today = isToday(dateObj);
                        const weekend = isWeekend(dateObj);
                        const dateKey = formatDateKey(dateObj);
                        const todayKey = formatDateKey(new Date());
                        const isPast = dateKey < todayKey;
                        const customRateKey = `${room.id}_${dateKey}`;
                        const effectiveRate = customRates[customRateKey] ?? room.pricePerNight;

                        // Check if room unit is already occupied by an active reservation on dateKey
                        const isOccupiedOnDate = roomResList.some(b => {
                          const chkIn = formatDateKey(b.checkIn || b.checkin);
                          const chkOut = formatDateKey(b.checkOut || b.checkout);
                          return dateKey >= chkIn && dateKey < chkOut;
                        });

                        // Check if room unit is blocked on dateKey
                        const isBlockedOnDate = roomBlocks.some(blk => {
                          return dateKey >= blk.startDateStr && dateKey <= blk.endDateStr;
                        });

                        const isSlotUnavailable = isPast || isOccupiedOnDate || isBlockedOnDate;

                        return (
                          <div
                            key={dIdx}
                            className={`cal-matrix-slot ${today ? 'is-today' : ''} ${weekend ? 'is-weekend' : ''} ${isPast ? 'is-past' : ''} ${isSlotUnavailable ? 'slot-unavailable' : ''}`}
                            onMouseDown={(e) => {
                              if (e.button !== 0 || isSlotUnavailable) return;
                              e.preventDefault(); // Prevent native text selection during drag
                              setDragState({
                                roomId: room.id,
                                startIdx: dIdx,
                                currentIdx: dIdx
                              });
                            }}
                            onMouseEnter={() => {
                              if (dragState && dragState.roomId === room.id) {
                                setDragState(prev => prev ? { ...prev, currentIdx: dIdx } : null);
                              }
                            }}
                            onClick={() => {
                              if (isPast) {
                                toast.warning(`Cannot create reservations for past dates (${dateKey}).`);
                                return;
                              }
                              if (isOccupiedOnDate) {
                                toast.warning(`${room.name} is already reserved on ${dateKey}.`);
                                return;
                              }
                              if (isBlockedOnDate) {
                                toast.warning(`${room.name} is blocked on ${dateKey}.`);
                                return;
                              }
                              if (!dragState) {
                                onEmptySlotClick(room, dateObj);
                              }
                            }}
                            title={
                              isPast 
                                ? `Past date (${dateKey})` 
                                : isOccupiedOnDate 
                                  ? `${room.name} is already occupied on ${dateKey}` 
                                  : isBlockedOnDate 
                                    ? `${room.name} is blocked on ${dateKey}` 
                                    : `Drag across cells or click to book ${room.name} on ${dateKey}`
                            }
                          >
                            {/* Rates & Stays Mode: Display per-day price tag */}
                            {viewMode === 'rates_and_stays' && (
                              <div
                                className="cal-slot-rate-tag"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenInlineRateModal(room, dateKey, effectiveRate);
                                }}
                                title="Click to edit rate for this date"
                              >
                                &#8377;{effectiveRate.toLocaleString('en-IN')}
                              </div>
                            )}

                            {/* Only show + Book button if slot is available and not in past */}
                            {!isSlotUnavailable && (
                              <span className="cal-slot-hover-plus">+ Book</span>
                            )}
                          </div>
                        );
                      })}

                      {/* Render Dynamic Drag Selection Pill Capsule (like mobile-calendar) */}
                      {dragState && dragState.roomId === room.id && (() => {
                        const minIdx = Math.min(dragState.startIdx, dragState.currentIdx);
                        const maxIdx = Math.max(dragState.startIdx, dragState.currentIdx);
                        const nights = maxIdx - minIdx + 1;

                        let outObj;
                        if (maxIdx + 1 < daysArray.length) {
                          outObj = daysArray[maxIdx + 1];
                        } else {
                          outObj = new Date(daysArray[maxIdx]);
                          outObj.setDate(outObj.getDate() + 1);
                        }

                        const outStr = outObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                        const totalCols = nights + 1;
                        const marginLeftPercent = (0.42 / totalCols) * 100;
                        const marginRightPercent = (0.46 / totalCols) * 100;

                        return (
                          <div
                            className="cal-drag-selection-pill"
                            style={{
                              gridColumnStart: minIdx + 1,
                              gridColumnEnd: minIdx + 1 + totalCols,
                              marginLeft: `${marginLeftPercent}%`,
                              marginRight: `${marginRightPercent}%`
                            }}
                          >
                            <span>{nights}x &bull; Check-out {outStr}</span>
                          </div>
                        );
                      })()}

                      {/* Render Blocked Date Range Bars */}
                      {roomBlocks.map((block, bIdx) => {
                        const posInfo = calculateBookingPosition(block.startDateStr, block.endDateStr, daysArray);
                        if (!posInfo.isVisible) return null;

                        return (
                          <div
                            key={`blk-${bIdx}`}
                            className="cal-booking-block bar-slate-blocked"
                            style={{
                              gridColumnStart: posInfo.gridColStart,
                              gridColumnEnd: posInfo.gridColEnd,
                              cursor: 'pointer'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onUnblockDate) onUnblockDate(block);
                            }}
                            title={`Blocked: ${block.category} (${block.notes}). Click to unblock.`}
                          >
                            <div className="cal-block-inner cal-block-unblock-row">
                              <span className="cal-guest-name">🔒 {block.category}: {block.notes}</span>
                              <span className="cal-unblock-badge">
                                🔓 Unblock
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Render Reservation Blocks */}
                      {roomResList.map(b => {
                        const posInfo = calculateBookingPosition(b.checkIn || b.checkin, b.checkOut || b.checkout, daysArray);
                        if (!posInfo.isVisible) return null;

                        return (
                          <BookingBar
                            key={b.id || b.dbId}
                            booking={b}
                            posInfo={posInfo}
                            mealOrders={mealOrders}
                            taxSettings={taxSettings}
                            onMouseEnter={handleMouseEnterBooking}
                            onMouseMove={handleMouseMoveBooking}
                            onMouseLeave={handleMouseLeaveBooking}
                            onClickBooking={onClickBooking}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* 3. OCCUPANCY ANALYTICS FOOTER ROW */}
        <OccupancySummaryRow
          daysArray={daysArray}
          totalRoomsCount={roomsList.length}
          reservationsList={scopedReservationsList}
        />
      </div>

      {/* HOVER TOOLTIP CARD */}
      {tooltipData && (
        <CalendarTooltip
          booking={tooltipData.booking}
          mealOrders={mealOrders}
          taxSettings={taxSettings}
          position={tooltipData.position}
        />
      )}
    </div>
  );
}
