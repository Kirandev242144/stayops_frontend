import React, { useState } from 'react';
import { FiCalendar, FiUsers, FiMinus, FiPlus, FiEdit2 } from 'react-icons/fi';
import StorefrontCalendarModal from './StorefrontCalendarModal';

export default function StorefrontSearchWidget({
  checkIn,
  checkOut,
  adults,
  childrenCount,
  onCheckInChange,
  onCheckOutChange,
  onAdultsChange,
  onChildrenChange,
  onSearchSubmit,
  onCancelInline,
  isInline = false,
  availability
}) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Calculate night duration
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.max(0, end - start);
  const nightCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const formatDateDisplay = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const handleSelectDates = (newCheckIn, newCheckOut) => {
    onCheckInChange(newCheckIn);
    onCheckOutChange(newCheckOut);
  };

  return (
    <>
      <div className={`sf-search-card ${isInline ? 'sf-search-card-inline' : ''}`}>
        {/* DATES ROW (2-COL ON MOBILE, CONTENTS ON DESKTOP) */}
        <div className="sf-search-dates-row">
          {/* CHECK IN */}
          <div 
            className="sf-search-col sf-custom-date-trigger" 
            onClick={() => setIsCalendarOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="sf-search-label">
              <FiCalendar /> CHECK IN
            </div>
            <div className="sf-search-val-custom">
              {checkIn}
              <FiEdit2 className="sf-date-edit-icon" />
            </div>
            <div className="sf-search-subtext-muted">
              {formatDateDisplay(checkIn)}
            </div>
          </div>

          <div className="sf-search-divider" />

          {/* CHECK OUT */}
          <div 
            className="sf-search-col sf-custom-date-trigger" 
            onClick={() => setIsCalendarOpen(true)}
            style={{ cursor: 'pointer' }}
          >
            <div className="sf-search-label">
              <FiCalendar /> CHECK OUT
            </div>
            <div className="sf-search-val-custom">
              {checkOut}
              <FiEdit2 className="sf-date-edit-icon" />
            </div>
            <div className="sf-search-subtext-primary">
              {nightCount} night{nightCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <div className="sf-search-divider desktop-only" />

        {/* GUESTS STEPPER */}
        <div className="sf-search-col sf-search-guests-col">
          <div className="sf-search-label">
            <FiUsers /> GUESTS
          </div>
          <div className="sf-search-stepper-group">
            <div className="sf-search-stepper-item">
              <button 
                type="button" 
                className="sf-stepper-btn" 
                onClick={() => onAdultsChange(Math.max(1, adults - 1))}
              >
                <FiMinus />
              </button>
              <span className="sf-search-guest-text-adults">
                {adults} Adult{adults > 1 ? 's' : ''}
              </span>
              <button 
                type="button" 
                className="sf-stepper-btn" 
                onClick={() => onAdultsChange(adults + 1)}
              >
                <FiPlus />
              </button>
            </div>

            <div className="sf-search-stepper-item">
              <button 
                type="button" 
                className="sf-stepper-btn" 
                onClick={() => onChildrenChange(Math.max(0, childrenCount - 1))}
              >
                <FiMinus />
              </button>
              <span className="sf-search-guest-text-children">
                {childrenCount} Child{childrenCount !== 1 ? 'ren' : ''}
              </span>
              <button 
                type="button" 
                className="sf-stepper-btn" 
                onClick={() => onChildrenChange(childrenCount + 1)}
              >
                <FiPlus />
              </button>
            </div>
          </div>
        </div>

        {/* CTA BUTTON */}
        <div className="sf-search-action-group">
          <button 
            className="sf-search-submit-btn"
            onClick={onSearchSubmit}
          >
            SEARCH AVAILABILITY
          </button>
          {isInline && onCancelInline && (
            <button 
              type="button" 
              onClick={onCancelInline}
              className="sf-search-cancel-btn"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* CUSTOM CALENDAR MODAL */}
      <StorefrontCalendarModal 
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        checkIn={checkIn}
        checkOut={checkOut}
        onSelectDates={handleSelectDates}
        availability={availability}
      />
    </>
  );
}
