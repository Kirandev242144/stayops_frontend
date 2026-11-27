import React from 'react';
import { FiSearch, FiCheckSquare } from 'react-icons/fi';

export default function FrontdeskHeader({ 
  searchQuery, 
  setSearchQuery, 
  onOpenHousekeeping 
}) {
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <>
      {/* ── 1. NATIVE MOBILE APP HEADING & SEARCH (< 768px) ── */}
      <div className="fd-mobile-app-header">
        <div className="fd-mobile-title-block">
          <h1 className="fd-mobile-main-heading">Front Desk</h1>
          <span className="fd-mobile-date-subtitle">{formattedToday}</span>
        </div>

        <div className="fd-mobile-search-row">
          <div className="fd-mobile-search-field">
            <FiSearch className="fd-mobile-search-icon" size={17} />
            <input
              type="text"
              placeholder="Search bookings..."
              className="fd-mobile-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {onOpenHousekeeping && (
            <button
              type="button"
              className="fd-mobile-btn-hk"
              onClick={onOpenHousekeeping}
              title="Open Housekeeping Hub"
            >
              <FiCheckSquare size={17} />
              <span>Rooms</span>
            </button>
          )}
        </div>
      </div>

      {/* ── 2. DESKTOP & LAPTOP HEADER (>= 769px) ── */}
      <div className="fd-header-bar fd-desktop-header">
        <div>
          <div className="fd-header-sub">
            <span className="fd-badge-tag">GROUND OPERATIONS</span>
            <span className="fd-header-desc">Real-time Guest Arrivals &amp; Departures Execution</span>
          </div>
          <h1 className="fd-header-title">Check-in &amp; Check-out Operations</h1>
        </div>

        <div className="fd-header-controls">
          <div className="fd-search-wrapper">
            <FiSearch className="fd-search-icon" />
            <input
              type="text"
              placeholder="Search guest or RES ID..."
              className="fd-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {onOpenHousekeeping && (
            <button
              type="button"
              className="fd-header-btn-housekeeping"
              onClick={onOpenHousekeeping}
              title="Open Housekeeping &amp; Turnover Hub"
            >
              <FiCheckSquare size={14} />
              <span>Housekeeping</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
