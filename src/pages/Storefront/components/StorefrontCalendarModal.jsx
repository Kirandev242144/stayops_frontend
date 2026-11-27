import React, { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiX, FiCalendar, FiCheck } from 'react-icons/fi';

export default function StorefrontCalendarModal({
  isOpen,
  onClose,
  checkIn,
  checkOut,
  onSelectDates,
  _availability
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const [currentViewDate, setCurrentViewDate] = useState(() => {
    return checkIn ? new Date(checkIn) : new Date();
  });

  const [tempCheckIn, setTempCheckIn] = useState(checkIn || todayStr);
  const [tempCheckOut, setTempCheckOut] = useState(checkOut || (() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split('T')[0];
  })());

  const [activeStep, setActiveStep] = useState('checkIn'); // 'checkIn' or 'checkOut'

  useEffect(() => {
    setTempCheckIn(checkIn);
    setTempCheckOut(checkOut);
  }, [checkIn, checkOut]);

  if (!isOpen) return null;

  // Navigation handlers
  const handlePrevMonth = () => {
    const prev = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() - 1, 1);
    const minMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    if (prev >= minMonth) {
      setCurrentViewDate(prev);
    }
  };

  const handleNextMonth = () => {
    setCurrentViewDate(new Date(currentViewDate.getFullYear(), currentViewDate.getMonth() + 1, 1));
  };

  // Date Math Helpers
  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();
  const monthName = currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Check if date is in past
  const isPastDate = (year, month, day) => {
    const d = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return d < today;
  };

  // Helper to format YYYY-MM-DD
  const formatYMD = (year, month, day) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Click day handler
  const handleDayClick = (dateStr) => {
    if (activeStep === 'checkIn' || new Date(dateStr) <= new Date(tempCheckIn)) {
      setTempCheckIn(dateStr);
      // Auto set checkOut to next day if checkOut is before or equal to checkIn
      const nextDay = new Date(dateStr);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split('T')[0];
      setTempCheckOut(nextDayStr);
      setActiveStep('checkOut');
    } else {
      setTempCheckOut(dateStr);
    }
  };

  // Calculate nights
  const start = new Date(tempCheckIn);
  const end = new Date(tempCheckOut);
  const diffTime = Math.max(0, end - start);
  const nightCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return 'Select';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleApply = () => {
    onSelectDates(tempCheckIn, tempCheckOut);
    onClose();
  };

  return (
    <div className="sf-modal-backdrop" onClick={onClose}>
      <div 
        className="sf-modal-box sf-calendar-modal-box" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Native Mobile Sheet Grab Handle */}
        <div className="sf-modal-grab-handle" />

        {/* Modal Header */}
        <div className="sf-calendar-modal-header">
          <div>
            <div className="sf-calendar-modal-badge">SELECT STAY DATES</div>
            <h3 className="sf-calendar-modal-title">Choose Dates</h3>
          </div>
          <button className="sf-calendar-close-btn" onClick={onClose}>
            <FiX />
          </button>
        </div>

        {/* Date Tabs (Check-In / Check-Out Selector) */}
        <div className="sf-calendar-tabs-row">
          <div 
            className={`sf-calendar-tab-card ${activeStep === 'checkIn' ? 'active' : ''}`}
            onClick={() => setActiveStep('checkIn')}
          >
            <span className="sf-calendar-tab-label">CHECK IN</span>
            <span className="sf-calendar-tab-val">{formatDateLabel(tempCheckIn)}</span>
          </div>

          <div className="sf-calendar-tab-arrow">→</div>

          <div 
            className={`sf-calendar-tab-card ${activeStep === 'checkOut' ? 'active' : ''}`}
            onClick={() => setActiveStep('checkOut')}
          >
            <span className="sf-calendar-tab-label">CHECK OUT</span>
            <span className="sf-calendar-tab-val">{formatDateLabel(tempCheckOut)}</span>
          </div>
        </div>

        {/* Month Navigation */}
        <div className="sf-calendar-month-nav">
          <button 
            className="sf-calendar-nav-arrow" 
            onClick={handlePrevMonth}
            aria-label="Previous Month"
          >
            <FiChevronLeft />
          </button>
          <span className="sf-calendar-month-title">{monthName}</span>
          <button 
            className="sf-calendar-nav-arrow" 
            onClick={handleNextMonth}
            aria-label="Next Month"
          >
            <FiChevronRight />
          </button>
        </div>

        {/* Days of Week Row */}
        <div className="sf-calendar-weekdays-grid">
          {daysOfWeek.map((dayName, i) => (
            <div key={i} className="sf-calendar-weekday">{dayName}</div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="sf-calendar-days-grid">
          {/* Empty cells before 1st day of month */}
          {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
            <div key={`empty-${idx}`} className="sf-calendar-day-cell empty" />
          ))}

          {/* Days 1 to daysInMonth */}
          {Array.from({ length: daysInMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const dateStr = formatYMD(year, month, dayNum);
            const disabled = isPastDate(year, month, dayNum);

            const isStart = dateStr === tempCheckIn;
            const isEnd = dateStr === tempCheckOut;
            const inRange = tempCheckIn && tempCheckOut && dateStr > tempCheckIn && dateStr < tempCheckOut;

            let cellClass = "sf-calendar-day-cell";
            if (disabled) cellClass += " disabled";
            if (isStart) cellClass += " range-start";
            if (isEnd) cellClass += " range-end";
            if (inRange) cellClass += " in-range";

            return (
              <button
                key={dayNum}
                disabled={disabled}
                className={cellClass}
                onClick={() => handleDayClick(dateStr)}
              >
                <span className="sf-calendar-day-number">{dayNum}</span>
              </button>
            );
          })}
        </div>

        {/* Footer Summary & Action */}
        <div className="sf-calendar-footer">
          <div className="sf-calendar-footer-info">
            <span className="sf-calendar-nights-badge">
              <FiCalendar /> {nightCount} Night{nightCount > 1 ? 's' : ''} Stay
            </span>
          </div>
          <button className="sf-calendar-apply-btn" onClick={handleApply}>
            <FiCheck /> APPLY DATES
          </button>
        </div>
      </div>
    </div>
  );
}
