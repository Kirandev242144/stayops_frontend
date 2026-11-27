import React from 'react';
import { FiHome, FiCheck } from 'react-icons/fi';

export default function PropertyScopeSelector({
  availableProperties = [],
  assignedProperties = [],
  onToggle
}) {
  const isAllSelected = assignedProperties.includes('all');

  return (
    <div className="form-group full-width">
      <div className="form-group-label-row">
        <label>
          <FiHome className="form-label-icon" /> Assign Property / Scope
        </label>
        <span className="role-hint">Select properties or assign all</span>
      </div>

      <div className="property-select-grid">
        {/* All Properties Chip */}
        <button
          type="button"
          className={`property-select-chip ${isAllSelected ? 'selected' : ''}`}
          onClick={() => onToggle('all')}
        >
          <span className="chip-indicator">
            {isAllSelected && <FiCheck className="chip-check-icon" />}
          </span>
          <span className="chip-label">All Properties</span>
        </button>

        {/* Individual Property Chips */}
        {availableProperties.map((prop) => {
          const isSelected = !isAllSelected && assignedProperties.includes(prop.id);
          return (
            <button
              key={prop.id}
              type="button"
              className={`property-select-chip ${isSelected ? 'selected' : ''}`}
              onClick={() => onToggle(prop.id)}
            >
              <span className="chip-indicator">
                {isSelected && <FiCheck className="chip-check-icon" />}
              </span>
              <span className="chip-label">{prop.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
