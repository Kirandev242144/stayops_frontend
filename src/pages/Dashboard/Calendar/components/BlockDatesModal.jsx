import React, { useState } from 'react';
import { FiX, FiLock, FiCheck, FiCalendar, FiLayers, FiAlertCircle } from 'react-icons/fi';
import { formatDateKey } from '../utils/calendarUtils';
import './BlockDatesModal.css';

export default function BlockDatesModal({
  isOpen,
  onClose,
  roomsList = [],
  onSaveBlockDates
}) {
  if (!isOpen) return null;

  const todayStr = formatDateKey(new Date());

  const [selectedRoomId, setSelectedRoomId] = useState(roomsList[0]?.id || 'all');
  const [startDateStr, setStartDateStr] = useState(todayStr);
  const [endDateStr, setEndDateStr] = useState(() => {
    const end = new Date();
    end.setDate(end.getDate() + 3);
    return formatDateKey(end);
  });

  const [blockCategory, setBlockCategory] = useState('Maintenance'); // 'Maintenance', 'Owner Stay', 'Out of Order'
  const [reasonNotes, setReasonNotes] = useState('Scheduled Maintenance & Inspection');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startDateStr || !endDateStr) {
      alert("Please select Start and End dates.");
      return;
    }

    onSaveBlockDates({
      roomId: selectedRoomId,
      startDateStr,
      endDateStr,
      category: blockCategory,
      notes: reasonNotes
    });

    onClose();
  };

  return (
    <div className="bdm-backdrop" onClick={onClose}>
      <div className="bdm-card" onClick={e => e.stopPropagation()}>
        
        {/* Minimalist Light Header */}
        <div className="bdm-header">
          <div className="bdm-header-content">
            <div className="bdm-header-icon-box">
              <FiLock size={20} />
            </div>
            <div>
              <h3 className="bdm-title">Block Dates / Maintenance</h3>
              <span className="bdm-subtitle">
                Mark rooms as out of order or blocked for owner stays
              </span>
            </div>
          </div>
          <button type="button" className="bdm-close-btn" onClick={onClose} aria-label="Close modal">
            <FiX size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="bdm-body">

            {/* Target Room */}
            <div className="bdm-field">
              <label className="bdm-label">
                <FiLayers size={14} color="#D97706" />
                Select Room Unit
              </label>
              <select
                className="bdm-select"
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
            <div className="bdm-grid-2col">
              <div className="bdm-field">
                <label className="bdm-label">
                  <FiCalendar size={14} color="#D97706" />
                  Block Start Date
                </label>
                <input
                  type="date"
                  className="bdm-input"
                  value={startDateStr}
                  onChange={e => setStartDateStr(e.target.value)}
                  required
                />
              </div>

              <div className="bdm-field">
                <label className="bdm-label">
                  <FiCalendar size={14} color="#D97706" />
                  Block End Date
                </label>
                <input
                  type="date"
                  className="bdm-input"
                  value={endDateStr}
                  onChange={e => setEndDateStr(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Block Category */}
            <div className="bdm-field">
              <label className="bdm-label">
                <FiAlertCircle size={14} color="#D97706" />
                Block Category
              </label>
              <select
                className="bdm-select"
                value={blockCategory}
                onChange={e => setBlockCategory(e.target.value)}
              >
                <option value="Maintenance">🛠️ Maintenance / Renovation</option>
                <option value="Owner Stay">👤 Owner Stay / Personal Use</option>
                <option value="Out of Order">🛑 Out of Order (OOO)</option>
              </select>
            </div>

            {/* Reason Notes */}
            <div className="bdm-field">
              <label className="bdm-label">Reason / Internal Notes</label>
              <input
                type="text"
                className="bdm-input"
                placeholder="e.g. Bathroom plumbing repair & painting"
                value={reasonNotes}
                onChange={e => setReasonNotes(e.target.value)}
              />
            </div>

          </div>

          {/* Modal Footer */}
          <div className="bdm-footer">
            <button type="button" className="bdm-btn bdm-btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="bdm-btn bdm-btn-primary">
              <FiCheck size={16} /> Confirm Date Block
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
