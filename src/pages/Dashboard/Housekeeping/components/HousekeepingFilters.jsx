import React from 'react';
import { FiSearch, FiGrid, FiList, FiX, FiFilter } from 'react-icons/fi';

export default function HousekeepingFilters({
  properties = [],
  selectedPropertyId = 'all',
  onPropertyChange,
  statusFilter = 'all',
  onStatusFilterChange,
  searchQuery = '',
  onSearchChange,
  viewMode = 'grid',
  onViewModeChange
}) {
  return (
    <div className="hk-toolbar">
      <div className="hk-toolbar-left">
        {/* PROPERTY FILTER */}
        <div className="hk-prop-dropdown-wrap">
          <select
            className="hk-property-select"
            value={selectedPropertyId}
            onChange={(e) => onPropertyChange(e.target.value)}
            aria-label="Filter by property"
          >
            <option value="all">All Properties ({properties.length})</option>
            {properties.map(p => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* ACTIVE FILTER PILL (WHEN FILTERED) */}
        {statusFilter !== 'all' && (
          <div className="hk-active-filter-badge">
            <span>Filtered: <strong>{statusFilter.replace('_', ' ')}</strong></span>
            <button 
              type="button" 
              className="hk-clear-filter-btn" 
              onClick={() => onStatusFilterChange('all')}
              title="Reset filter to show all"
            >
              <FiX size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="hk-toolbar-right">
        {/* SLEEK SEARCH INPUT */}
        <div className="hk-search-wrap">
          <FiSearch size={13} className="hk-search-icon" />
          <input
            type="text"
            className="hk-search-input"
            placeholder="Search room, guest, staff..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search rooms"
          />
          {searchQuery && (
            <button
              type="button"
              className="hk-search-clear"
              onClick={() => onSearchChange('')}
              title="Clear search"
            >
              <FiX size={12} />
            </button>
          )}
        </div>

        {/* DENSE VIEW MODE TOGGLES */}
        <div className="hk-view-toggles" role="group" aria-label="View layout switcher">
          <button
            type="button"
            className={`hk-view-btn ${viewMode === 'grid' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Card Grid Matrix View"
            aria-label="Grid view"
          >
            <FiGrid size={14} />
          </button>
          <button
            type="button"
            className={`hk-view-btn ${viewMode === 'table' ? 'is-active' : ''}`}
            onClick={() => onViewModeChange('table')}
            title="Operations Table View"
            aria-label="Table view"
          >
            <FiList size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
