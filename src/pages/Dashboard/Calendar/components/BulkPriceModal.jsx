import React, { useState } from 'react';
import { FiX, FiDollarSign, FiCalendar, FiCheck, FiPercent, FiTrendingUp, FiLayers } from 'react-icons/fi';
import { formatDateKey } from '../utils/calendarUtils';
import './BulkPriceModal.css';

export default function BulkPriceModal({
  isOpen,
  onClose,
  roomsList = [],
  onApplyBulkPrice
}) {
  if (!isOpen) return null;

  const todayStr = formatDateKey(new Date());

  const [selectedRoomId, setSelectedRoomId] = useState('all');
  const [startDateStr, setStartDateStr] = useState(todayStr);
  const [endDateStr, setEndDateStr] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 7);
    return formatDateKey(end);
  });

  const [adjustmentType, setAdjustmentType] = useState('fixed'); // 'fixed', 'percent', 'flat'
  const [rateValue, setRateValue] = useState('5500');

  // Days of week (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const [selectedDays, setSelectedDays] = useState({
    0: true, // Sun
    1: true, // Mon
    2: true, // Tue
    3: true, // Wed
    4: true, // Thu
    5: true, // Fri
    6: true  // Sat
  });

  const toggleDay = (dayIndex) => {
    setSelectedDays(prev => ({ ...prev, [dayIndex]: !prev[dayIndex] }));
  };

  const handleSelectAllDays = (select) => {
    const next = {};
    for (let i = 0; i < 7; i++) next[i] = select;
    setSelectedDays(next);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const val = Number(rateValue);
    if (isNaN(val)) {
      alert("Please enter a valid numeric value.");
      return;
    }
    if (adjustmentType === 'fixed' && val < 0) {
      alert("Fixed nightly rate cannot be negative.");
      return;
    }

    onApplyBulkPrice({
      roomId: selectedRoomId,
      startDateStr,
      endDateStr,
      adjustmentType,
      rateValue: val,
      selectedDays
    });

    onClose();
  };

  const dayLabels = [
    { idx: 1, label: 'Mon' },
    { idx: 2, label: 'Tue' },
    { idx: 3, label: 'Wed' },
    { idx: 4, label: 'Thu' },
    { idx: 5, label: 'Fri' },
    { idx: 6, label: 'Sat' },
    { idx: 0, label: 'Sun' }
  ];

  return (
    <div className="bpm-backdrop" onClick={onClose}>
      <div className="bpm-card" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="bpm-header">
          <div className="bpm-header-content">
            <div className="bpm-header-icon-box">
              <FiDollarSign size={22} />
            </div>
            <div>
              <h3 className="bpm-title">Bulk Update Nightly Rates</h3>
              <span className="bpm-subtitle">
                Update rack rates across date ranges & specific days of week
              </span>
            </div>
          </div>
          <button type="button" className="bpm-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={18} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="bpm-body">

            {/* Target Room */}
            <div className="bpm-field">
              <label className="bpm-label">
                <FiLayers size={14} color="#0D9488" />
                Select Target Room / Category
              </label>
              <select
                className="bpm-select"
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
              >
                <option value="all">All Room Units</option>
                {roomsList.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.propertyName})
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="bpm-grid-2col">
              <div className="bpm-field">
                <label className="bpm-label">
                  <FiCalendar size={14} color="#0D9488" />
                  Start Date
                </label>
                <input
                  type="date"
                  className="bpm-input"
                  value={startDateStr}
                  onChange={e => setStartDateStr(e.target.value)}
                  required
                />
              </div>

              <div className="bpm-field">
                <label className="bpm-label">
                  <FiCalendar size={14} color="#0D9488" />
                  End Date
                </label>
                <input
                  type="date"
                  className="bpm-input"
                  value={endDateStr}
                  onChange={e => setEndDateStr(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Pricing Strategy Segmented Control */}
            <div className="bpm-field">
              <label className="bpm-label">Pricing Strategy</label>
              <div className="bpm-strategy-container">
                <button
                  type="button"
                  className={`bpm-strategy-btn ${adjustmentType === 'fixed' ? 'active' : ''}`}
                  onClick={() => setAdjustmentType('fixed')}
                >
                  <FiDollarSign className="bpm-strat-icon" size={15} />
                  Fixed Price (₹)
                </button>
                <button
                  type="button"
                  className={`bpm-strategy-btn ${adjustmentType === 'percent' ? 'active' : ''}`}
                  onClick={() => setAdjustmentType('percent')}
                >
                  <FiPercent className="bpm-strat-icon" size={15} />
                  Percentage (%)
                </button>
                <button
                  type="button"
                  className={`bpm-strategy-btn ${adjustmentType === 'flat' ? 'active' : ''}`}
                  onClick={() => setAdjustmentType('flat')}
                >
                  <FiTrendingUp className="bpm-strat-icon" size={15} />
                  Flat (+/- ₹)
                </button>
              </div>
            </div>

            {/* Price Value Input */}
            <div className="bpm-field">
              <label className="bpm-label">
                {adjustmentType === 'fixed' 
                  ? 'New Nightly Rate (₹)' 
                  : adjustmentType === 'percent' 
                  ? 'Adjustment Percentage (%)' 
                  : 'Flat Adjustment Amount (₹)'}
              </label>
              <div className="bpm-input-wrapper">
                <span className="bpm-input-prefix">
                  {adjustmentType === 'fixed' ? '₹' : adjustmentType === 'percent' ? '%' : '±₹'}
                </span>
                <input
                  type="number"
                  className="bpm-input"
                  placeholder={adjustmentType === 'fixed' ? 'e.g. 5500' : 'e.g. 15'}
                  value={rateValue}
                  onChange={e => setRateValue(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Days of Week Filter */}
            <div className="bpm-field">
              <div className="bpm-label-row">
                <label className="bpm-label">Apply to Specific Days</label>
                <div className="bpm-day-actions">
                  <button type="button" className="bpm-link-btn" onClick={() => handleSelectAllDays(true)}>All Days</button>
                  <button type="button" className="bpm-link-btn" onClick={() => handleSelectAllDays(false)}>Clear</button>
                </div>
              </div>

              <div className="bpm-days-grid">
                {dayLabels.map(d => (
                  <button
                    key={d.idx}
                    type="button"
                    className={`bpm-day-chip ${selectedDays[d.idx] ? 'active' : ''}`}
                    onClick={() => toggleDay(d.idx)}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="bpm-footer">
            <button type="button" className="bpm-btn bpm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bpm-btn bpm-btn-primary">
              <FiCheck size={16} /> Apply Price Updates
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
