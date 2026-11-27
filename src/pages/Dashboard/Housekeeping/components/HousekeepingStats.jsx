import React from 'react';
import { 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle, 
  FiTool,
  FiLayers,
  FiArrowRight
} from 'react-icons/fi';

export default function HousekeepingStats({
  stats,
  activeFilter,
  onFilterChange,
  onUrgentClick
}) {
  const {
    total = 0,
    readyForCheckin = 0,
    dirty = 0,
    inProgress = 0,
    outOfOrder = 0,
    urgentTurnovers = 0
  } = stats || {};

  const metrics = [
    {
      id: 'all',
      label: 'Total Units',
      count: total,
      dotClass: 'dot-neutral'
    },
    {
      id: 'DIRTY',
      label: 'Turnover Needed',
      count: dirty,
      dotClass: 'dot-dirty',
      badge: dirty > 0 ? `${dirty} Due` : null
    },
    {
      id: 'IN_PROGRESS',
      label: 'In Cleaning',
      count: inProgress,
      dotClass: 'dot-progress'
    },
    {
      id: 'READY',
      label: 'Ready for Arrival',
      count: readyForCheckin,
      dotClass: 'dot-ready'
    },
    {
      id: 'OUT_OF_ORDER',
      label: 'Out of Order',
      count: outOfOrder,
      dotClass: 'dot-maintenance'
    }
  ];

  return (
    <div className="hk-stats-wrapper">
      {/* URGENT RUSH ALERT STRIP (ONLY WHEN SAME-DAY ARRIVAL REQUIRES IMMEDIATE TURNOVER) */}
      {urgentTurnovers > 0 && (
        <div className="hk-rush-strip">
          <div className="hk-rush-left">
            <span className="hk-rush-badge">RUSH PRIORITY</span>
            <span className="hk-rush-text">
              <strong>{urgentTurnovers} incoming guest arrival{urgentTurnovers > 1 ? 's' : ''}</strong> scheduled today for uncleaned rooms. Immediate caretaker turnover required.
            </span>
          </div>
          <button
            type="button"
            className="hk-rush-btn"
            onClick={onUrgentClick}
          >
            View Rush Rooms <FiArrowRight size={12} />
          </button>
        </div>
      )}

      {/* MINIMALIST METRIC STRIP */}
      <div className="hk-metric-strip" role="tablist" aria-label="Housekeeping Status Metrics">
        {metrics.map(m => {
          const isActive = activeFilter === m.id;
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`hk-metric-cell ${isActive ? 'is-active' : ''}`}
              onClick={() => onFilterChange(m.id)}
            >
              <div className="hk-metric-header">
                <span className={`hk-metric-dot ${m.dotClass}`} />
                <span className="hk-metric-label">{m.label}</span>
                {m.badge && <span className="hk-metric-badge">{m.badge}</span>}
              </div>
              <div className="hk-metric-num">{m.count}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
