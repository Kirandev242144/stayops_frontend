import React from 'react';
import { FiSearch, FiCheckSquare } from 'react-icons/fi';

export default function FrontdeskHeader({ 
  searchQuery, 
  setSearchQuery, 
  onOpenHousekeeping 
}) {
  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <>
      {/* ── 1. NATIVE MOBILE APP HEADING & SEARCH (< 768px - Stitch Layout) ── */}
      <div className="fd-stitch-header">
        {/* Title + Date on left, Live badge on right */}
        <div className="fd-stitch-title-row">
          <div>
            <h1 className="fd-stitch-main-title">Front Desk</h1>
            <p className="fd-stitch-date-sub">{formattedToday}</p>
          </div>
          <div className="fd-stitch-live-badge">
            <span className="fd-stitch-live-dot"></span>
            <span>Live</span>
          </div>
        </div>

        {/* Sleek Search + House Keeping Action Row */}
        <div className="fd-stitch-search-row">
          <div className="fd-stitch-search-box">
            <FiSearch className="fd-stitch-search-icon" size={14} />
            <input
              type="search"
              placeholder="Search guests, rooms, bookings..."
              className="fd-stitch-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {onOpenHousekeeping && (
            <button
              type="button"
              className="fd-stitch-hk-btn"
              onClick={onOpenHousekeeping}
              title="Open Housekeeping Hub"
            >
              <FiCheckSquare size={14} className="fd-stitch-hk-icon" />
              <span>House Keeping</span>
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
