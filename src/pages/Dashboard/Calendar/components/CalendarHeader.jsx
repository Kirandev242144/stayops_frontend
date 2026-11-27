import React from 'react';
import { 
  FiChevronLeft, 
  FiChevronRight, 
  FiCalendar, 
  FiSearch, 
  FiPlus, 
  FiHome,
  FiActivity,
  FiLock,
  FiDollarSign,
  FiGrid,
  FiLayers
} from 'react-icons/fi';
import { formatDateKey } from '../utils/calendarUtils';

/**
 * CalendarHeader Component
 * Renders the top navigation toolbar, view mode toggles, property selector,
 * date range steppers, quick search input, and status legend.
 */
export default function CalendarHeader({
  startDate,
  setStartDate,
  numDays,
  setNumDays,
  viewMode,
  setViewMode,
  selectedPropertyId,
  setSelectedPropertyId,
  searchQuery,
  setSearchQuery,
  propertiesList = [],
  onPrevDays,
  onNextDays,
  onResetToday,
  onOpenNewResModal,
  onOpenBlockDatesModal,
  onOpenBulkPriceModal
}) {
  const formattedStartStr = formatDateKey(startDate);

  // Compute end date for label display (e.g., Sep 12 – Sep 25, 2026)
  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + numDays - 1);
  
  const startMonthStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endMonthStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="cal-header-card">
      {/* TOP ROW: Title & Main Actions */}
      <div className="cal-top-row">
        <div className="cal-title-box">
          <div className="cal-badge-pill">
            <FiActivity size={13} color="#0D9488" />
            <span>StayOps</span>
            <span className="cal-live-pulse" />
          </div>
          <h2 className="cal-main-heading">Calendar</h2>
        </div>

        <div className="cal-top-right">
          {/* View Mode Switcher */}
          <div className="cal-segment-control">
            <button
              type="button"
              className={`cal-segment-btn ${viewMode === 'rates_and_stays' ? 'active' : ''}`}
              onClick={() => setViewMode('rates_and_stays')}
              title="Show Nightly Rates & Stays Timeline"
            >
              <FiGrid size={13} style={{ marginRight: 4 }} />
              Rates & Stays
            </button>
            <button
              type="button"
              className={`cal-segment-btn ${viewMode === 'stays' ? 'active' : ''}`}
              onClick={() => setViewMode('stays')}
              title="Show Stays Timeline Only"
            >
              <FiLayers size={13} style={{ marginRight: 4 }} />
              Stays Only
            </button>
          </div>

          {/* Block Dates Action */}
          <button
            type="button"
            className="cal-btn-slate-action"
            onClick={onOpenBlockDatesModal}
          >
            <FiLock size={14} color="#F59E0B" />
            <span>Block Dates</span>
          </button>

          {/* Bulk Update Price Action */}
          <button
            type="button"
            className="cal-btn-slate-action"
            onClick={onOpenBulkPriceModal}
          >
            <FiDollarSign size={14} color="#0D9488" />
            <span>Bulk Update Price</span>
          </button>

          {/* Quick Search Input */}
          <div className="cal-search-field">
            <FiSearch className="cal-search-icon" size={15} />
            <input
              type="text"
              className="cal-search-input"
              placeholder="Search room unit or guest..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Create Reservation Primary CTA */}
          <button
            type="button"
            className="cal-primary-btn"
            onClick={onOpenNewResModal}
          >
            <FiPlus size={16} />
            <span>New Reservation</span>
          </button>
        </div>
      </div>

      {/* CONTROLS ROW: Property Dropdown, Date Range Stepper, Scale Toggles & Legend */}
      <div className="cal-toolbar-row">
        <div className="cal-toolbar-left">
          {/* Property Selector Pill */}
          <div className="cal-select-box">
            <FiHome size={14} className="cal-select-icon" />
            <select
              className="cal-property-dropdown"
              value={selectedPropertyId}
              onChange={e => setSelectedPropertyId(e.target.value)}
            >
              <option value="all">All Properties</option>
              {propertiesList.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Today Button */}
          <button
            type="button"
            className="cal-today-pill"
            onClick={onResetToday}
          >
            Today
          </button>

          {/* Date Navigator Stepper */}
          <div className="cal-nav-stepper">
            <button
              type="button"
              className="cal-nav-btn"
              onClick={onPrevDays}
              title={`Previous ${numDays} Days`}
            >
              <FiChevronLeft size={16} />
            </button>

            <div className="cal-range-label">
              <FiCalendar size={13} className="cal-range-icon" />
              <span>{startMonthStr} &ndash; {endMonthStr}</span>
              <input
                type="date"
                className="cal-hidden-date-input"
                value={formattedStartStr}
                onChange={e => {
                  if (e.target.value) {
                    const newD = new Date(e.target.value);
                    newD.setHours(0, 0, 0, 0);
                    setStartDate(newD);
                  }
                }}
              />
            </div>

            <button
              type="button"
              className="cal-nav-btn"
              onClick={onNextDays}
              title={`Next ${numDays} Days`}
            >
              <FiChevronRight size={16} />
            </button>
          </div>

          {/* 7D / 14D / 30D View Segment Controls */}
          <div className="cal-segment-control">
            <button
              type="button"
              className={`cal-segment-btn ${numDays === 7 ? 'active' : ''}`}
              onClick={() => setNumDays(7)}
            >
              7D
            </button>
            <button
              type="button"
              className={`cal-segment-btn ${numDays === 14 ? 'active' : ''}`}
              onClick={() => setNumDays(14)}
            >
              14D
            </button>
            <button
              type="button"
              className={`cal-segment-btn ${numDays === 30 ? 'active' : ''}`}
              onClick={() => setNumDays(30)}
            >
              30D
            </button>
          </div>
        </div>

        {/* Status Legend Badges */}
        <div className="cal-legend-bar">
          <div className="cal-legend-badge checkedin">
            <span className="cal-badge-dot" />
            <span>Checked In</span>
          </div>
          <div className="cal-legend-badge confirmed">
            <span className="cal-badge-dot" />
            <span>Confirmed</span>
          </div>
          <div className="cal-legend-badge pending">
            <span className="cal-badge-dot" />
            <span>Pending Due</span>
          </div>
          <div className="cal-legend-badge ota">
            <span className="cal-badge-dot" />
            <span>OTA Channel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
