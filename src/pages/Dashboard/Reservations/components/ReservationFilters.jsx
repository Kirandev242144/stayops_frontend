import React from 'react';
import { FiSearch, FiCalendar, FiClock, FiSun, FiLayers } from 'react-icons/fi';
import { BOOKING_SOURCES, RESERVATION_STATUS, RESERVATION_DATE_PRESETS } from '../constants';

export default function ReservationFilters({
  searchTerm,
  setSearchTerm,
  channelFilter,
  setChannelFilter,
  statusFilter,
  setStatusFilter,
  dateFilter = 'today',
  setDateFilter,
  dateCounts = { today: 0, upcoming: 0, month: 0, year: 0, all: 0 }
}) {
  const datePresets = [
    { key: RESERVATION_DATE_PRESETS.TODAY, label: 'Today', icon: FiSun, count: dateCounts.today },
    { key: RESERVATION_DATE_PRESETS.UPCOMING, label: 'Upcoming', icon: FiClock, count: dateCounts.upcoming },
    { key: RESERVATION_DATE_PRESETS.THIS_MONTH, label: 'This Month', icon: FiCalendar, count: dateCounts.month },
    { key: RESERVATION_DATE_PRESETS.THIS_YEAR, label: 'This Year', icon: FiLayers, count: dateCounts.year },
    { key: RESERVATION_DATE_PRESETS.ALL, label: 'All Bookings', count: dateCounts.all }
  ];

  const statusOptions = [
    { key: RESERVATION_STATUS.ALL, label: 'All Statuses' },
    { key: RESERVATION_STATUS.CONFIRMED, label: 'Confirmed' },
    { key: RESERVATION_STATUS.CHECKED_IN, label: 'Checked In' },
    { key: RESERVATION_STATUS.CHECKED_OUT, label: 'Checked Out' },
    { key: RESERVATION_STATUS.NO_SHOW, label: 'No-Show' },
    { key: RESERVATION_STATUS.CANCELLED, label: 'Cancelled' }
  ];

  return (
    <div className="res-filters-container">
      {/* 1. QUICK DATE PRESETS ROW */}
      <div className="res-date-presets-row">
        <div className="res-date-presets-list">
          {datePresets.map(({ key, label, icon: Icon, count }) => {
            const isActive = dateFilter === key;
            return (
              <button
                key={key}
                type="button"
                className={`res-date-preset-btn ${isActive ? 'active' : ''}`}
                onClick={() => setDateFilter && setDateFilter(key)}
              >
                {Icon && <Icon className="res-date-preset-icon" />}
                <span className="res-date-preset-label">{label}</span>
                <span className={`res-date-preset-count ${isActive ? 'active' : ''}`}>
                  {count != null ? count : 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. SEARCH, CHANNEL, & STATUS CONTROLS */}
      <div className="res-filter-bar">
        <div className="res-search-wrapper">
          <FiSearch className="res-search-icon" />
          <input
            className="res-search-input"
            placeholder="Search by guest name, phone, booking ID, or property..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          className="res-select-channel"
          value={channelFilter}
          onChange={e => setChannelFilter(e.target.value)}
        >
          <option value="all">All Channels</option>
          {BOOKING_SOURCES.map(source => (
            <option key={source} value={source}>{source}</option>
          ))}
        </select>

        <div className="res-status-pills">
          {statusOptions.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              className={`res-pill-btn ${statusFilter === key ? 'active' : ''}`}
              onClick={() => setStatusFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
