import React from 'react';
import { FiSearch, FiCheckSquare } from 'react-icons/fi';

export default function FrontdeskHeader({ searchQuery, setSearchQuery, onOpenHousekeeping }) {
  return (
    <div className="fd-header-bar">
      <div>
        <div className="fd-header-sub">
          <span className="fd-badge-tag">GROUND OPERATIONS</span>
          <span className="fd-header-desc">Real-time Guest Arrivals & Departures Execution</span>
        </div>
        <h1 className="fd-header-title">Check-in & Check-out Operations</h1>
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
            title="Open Housekeeping & Turnover Hub"
          >
            <FiCheckSquare size={14} />
            <span>Housekeeping</span>
          </button>
        )}
      </div>
    </div>
  );
}
