import React, { useState, useEffect } from 'react';
import { FiClock, FiX, FiCheck } from 'react-icons/fi';
import { formatTime12Hr, parseTime24Hr, getHourFromTime } from '../../utils/timeFormat';
import './ClockPickerModal.css';

/**
 * ClockPickerModal Component
 * Material-style circular analog clock face time picker.
 * Features interactive circular dial, 12h/24h AM/PM switching, hours/minutes mode transition,
 * and precise touch/click selection.
 */
export default function ClockPickerModal({
  isOpen,
  onClose,
  initialTime = "14:00",
  onSaveTime,
  title = "Select Time"
}) {
  if (!isOpen) return null;

  // Mode state: 'hours' or 'minutes'
  const [mode, setMode] = useState('hours');

  // Time state initialization
  const [selectedHour24, setSelectedHour24] = useState(() => getHourFromTime(initialTime));
  const [selectedMinute, setSelectedMinute] = useState(() => {
    if (!initialTime) return 0;
    const parts = String(initialTime).split(':');
    if (parts.length >= 2) {
      const min = parseInt(parts[1], 10);
      return isNaN(min) ? 0 : min;
    }
    return 0;
  });

  const [ampm, setAmpm] = useState(() => (selectedHour24 >= 12 ? 'PM' : 'AM'));

  // Sync state whenever initialTime changes or modal opens
  useEffect(() => {
    const hr = getHourFromTime(initialTime);
    setSelectedHour24(hr);
    setAmpm(hr >= 12 ? 'PM' : 'AM');

    if (initialTime) {
      const parts = String(initialTime).split(':');
      if (parts.length >= 2) {
        const min = parseInt(parts[1], 10);
        setSelectedMinute(isNaN(min) ? 0 : min);
      }
    }
    setMode('hours');
  }, [initialTime, isOpen]);

  // Derived 12-hour value (1-12)
  const hour12 = selectedHour24 % 12 === 0 ? 12 : selectedHour24 % 12;

  // Handle AM/PM Toggle
  const handleToggleAmpm = (newAmpm) => {
    setAmpm(newAmpm);
    if (newAmpm === 'PM' && hour12 < 12) {
      setSelectedHour24(hour12 + 12);
    } else if (newAmpm === 'AM' && hour12 === 12) {
      setSelectedHour24(0);
    } else if (newAmpm === 'AM' && hour12 < 12) {
      setSelectedHour24(hour12);
    } else if (newAmpm === 'PM' && hour12 === 12) {
      setSelectedHour24(12);
    }
  };

  // Select Hour
  const handleSelectHour12 = (val12) => {
    let hr24 = val12;
    if (ampm === 'PM' && val12 < 12) hr24 = val12 + 12;
    if (ampm === 'AM' && val12 === 12) hr24 = 0;

    setSelectedHour24(hr24);
    // Auto transition to minutes mode for seamless UX
    setMode('minutes');
  };

  // Select Minute
  const handleSelectMinute = (minVal) => {
    setSelectedMinute(minVal);
  };

  // Submit Handler
  const handleSave = () => {
    const hrFormatted = selectedHour24 < 10 ? `0${selectedHour24}` : `${selectedHour24}`;
    const minFormatted = selectedMinute < 10 ? `0${selectedMinute}` : `${selectedMinute}`;
    const time24 = `${hrFormatted}:${minFormatted}`;
    const time12 = formatTime12Hr(time24);

    if (onSaveTime) {
      onSaveTime(time24, time12);
    }
    onClose();
  };

  // Geometry calculations for placing dial nodes on a 250px container (Center: 125, 125)
  const CENTER = 125;
  const RADIUS_OUTER = 95;
  const RADIUS_INNER = 62;

  // Calculate Node Position (x, y) given angle in degrees
  const getCoordinates = (angleDeg, radius) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: CENTER + radius * Math.cos(angleRad),
      y: CENTER + radius * Math.sin(angleRad)
    };
  };

  // Outer 12-Hour Nodes (1 to 12)
  const hourNodes12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(h => {
    const angle = h * 30; // 360 / 12 = 30 deg
    const pos = getCoordinates(angle, RADIUS_OUTER);
    return { val: h, angle, x: pos.x, y: pos.y };
  });

  // Inner 24-Hour Nodes (13 to 23, 00)
  const hourNodes24Inner = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23].map(h => {
    const angle = (h % 12) * 30;
    const pos = getCoordinates(angle, RADIUS_INNER);
    return { val: h, angle, x: pos.x, y: pos.y };
  });

  // Minute Nodes (00 to 55 step 5)
  const minuteNodes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55].map(m => {
    const angle = m * 6; // 360 / 60 = 6 deg per minute, 5 min = 30 deg
    const pos = getCoordinates(angle, RADIUS_OUTER);
    return { val: m, angle, x: pos.x, y: pos.y };
  });

  // Determine current pointer angle and length
  let currentAngle = 0;
  let currentRadius = RADIUS_OUTER;

  if (mode === 'hours') {
    currentAngle = (hour12 % 12) * 30;
    if (selectedHour24 >= 13 || selectedHour24 === 0) {
      // Inner ring active
      currentRadius = RADIUS_OUTER; 
    }
  } else {
    currentAngle = selectedMinute * 6;
    currentRadius = RADIUS_OUTER;
  }

  // Format header strings
  const formattedHourStr = hour12 < 10 ? `0${hour12}` : `${hour12}`;
  const formattedMinStr = selectedMinute < 10 ? `0${selectedMinute}` : `${selectedMinute}`;

  return (
    <div className="cpm-backdrop" onClick={onClose}>
      <div className="cpm-card" onClick={e => e.stopPropagation()}>
        
        {/* Vibrant Blue Header */}
        <div className="cpm-header">
          <div className="cpm-time-display">
            <span
              className={`cpm-time-unit ${mode === 'hours' ? 'active' : ''}`}
              onClick={() => setMode('hours')}
              title="Click to select Hour"
            >
              {formattedHourStr}
            </span>
            <span className="cpm-time-colon">:</span>
            <span
              className={`cpm-time-unit ${mode === 'minutes' ? 'active' : ''}`}
              onClick={() => setMode('minutes')}
              title="Click to select Minutes"
            >
              {formattedMinStr}
            </span>
          </div>

          <div className="cpm-ampm-switcher">
            <button
              type="button"
              className={`cpm-ampm-btn ${ampm === 'AM' ? 'active' : ''}`}
              onClick={() => handleToggleAmpm('AM')}
            >
              AM
            </button>
            <button
              type="button"
              className={`cpm-ampm-btn ${ampm === 'PM' ? 'active' : ''}`}
              onClick={() => handleToggleAmpm('PM')}
            >
              PM
            </button>
          </div>
        </div>

        {/* Circular Clock Dial */}
        <div className="cpm-body">
          <div className="cpm-clock-face">
            
            {/* Center Pivot */}
            <div className="cpm-pivot" />

            {/* Hand Pointer */}
            <div
              className="cpm-hand"
              style={{
                width: `${currentRadius}px`,
                transform: `rotate(${currentAngle - 90}deg)`
              }}
            >
              <div className="cpm-hand-head">
                {mode === 'hours' ? hour12 : formattedMinStr}
              </div>
            </div>

            {/* Render Nodes based on mode */}
            {mode === 'hours' ? (
              <>
                {hourNodes12.map(node => {
                  const isSelected = hour12 === node.val;
                  return (
                    <div
                      key={`h12-${node.val}`}
                      className={`cpm-num-node ${isSelected ? 'selected' : ''}`}
                      style={{ left: `${node.x}px`, top: `${node.y}px` }}
                      onClick={() => handleSelectHour12(node.val)}
                    >
                      {node.val}
                    </div>
                  );
                })}
              </>
            ) : (
              <>
                {minuteNodes.map(node => {
                  const isSelected = Math.abs(selectedMinute - node.val) < 2.5;
                  return (
                    <div
                      key={`m-${node.val}`}
                      className={`cpm-num-node ${isSelected ? 'selected' : ''}`}
                      style={{ left: `${node.x}px`, top: `${node.y}px` }}
                      onClick={() => handleSelectMinute(node.val)}
                    >
                      {node.val < 10 ? `0${node.val}` : node.val}
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="cpm-mode-label">
            {mode === 'hours' ? 'Select Hour' : 'Select Minutes'}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="cpm-footer">
          <button type="button" className="cpm-cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cpm-submit-btn" onClick={handleSave}>
            Change
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * ClockTimeInput Component
 * Reusable form input control with clickable clock icon that pops open the analog ClockPickerModal.
 */
export function ClockTimeInput({ value, onChange, label, className = "", required = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const display12Hr = formatTime12Hr(value || '14:00');

  return (
    <div className="clock-time-input-container">
      <input
        type="text"
        className={`clock-time-input-field ${className}`}
        value={display12Hr}
        onClick={() => setIsModalOpen(true)}
        readOnly
        required={required}
        title="Click to open interactive analog clock picker"
      />
      <button
        type="button"
        className="clock-time-input-btn"
        onClick={() => setIsModalOpen(true)}
        title="Open clock picker"
      >
        <FiClock size={16} />
      </button>

      <ClockPickerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialTime={value || '14:00'}
        onSaveTime={(time24) => {
          if (onChange) onChange(time24);
        }}
        title={label || "Select Time"}
      />
    </div>
  );
}
