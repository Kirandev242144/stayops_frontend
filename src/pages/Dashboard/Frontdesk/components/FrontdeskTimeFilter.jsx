import React from 'react';
import { TIME_FILTERS, OP_TABS } from '../frontdeskConstants';

export default function FrontdeskTimeFilter({
  opTab,
  timeFilter,
  setTimeFilter,
  filteredCount = 0,
  completedCount = 0
}) {
  if (opTab === OP_TABS.COMPLETED) {
    return (
      <div className="fd-completed-archive-bar">
        <div>
          <span className="fd-archive-badge">🏁 COMPLETED ARCHIVES</span>
          <span className="fd-archive-desc">
            Past Checked-out Stays & Finalized GST Invoices
          </span>
        </div>
        <span className="fd-archive-count">
          Total <strong>{completedCount}</strong> archived stays
        </span>
      </div>
    );
  }

  const filters = [
    { id: TIME_FILTERS.TODAY, label: 'Today', mobileLabel: 'Today' },
    { id: TIME_FILTERS.TOMORROW, label: 'Tomorrow', mobileLabel: 'Tomorrow' },
    { id: TIME_FILTERS.WEEK, label: 'This Week Queue', mobileLabel: 'This Week' }
  ];

  return (
    <div className="fd-filter-bar">
      <div className="fd-filter-buttons">
        {filters.map(t => (
          <button
            key={t.id}
            type="button"
            className={`fd-filter-btn ${timeFilter === t.id ? 'active' : ''}`}
            onClick={() => setTimeFilter(t.id)}
          >
            <span className="fd-filter-btn-desktop">{t.label}</span>
            <span className="fd-filter-btn-mobile">{t.mobileLabel}</span>
          </button>
        ))}
      </div>

      <span className="fd-filter-count">
        Showing <strong>{filteredCount}</strong> active guest queues
      </span>
    </div>
  );
}
