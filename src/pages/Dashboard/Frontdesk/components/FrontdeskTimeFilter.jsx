import React from 'react';
import { TIME_FILTERS, OP_TABS } from '../frontdeskConstants';

export default function FrontdeskTimeFilter({
  opTab,
  setOpTab,
  timeFilter,
  setTimeFilter,
  filteredCount = 0,
  completedCount = 0,
  inHouseCount = 0,
  alertsCount = 0
}) {
  const desktopFilters = [
    { id: TIME_FILTERS.TODAY, label: 'Today' },
    { id: TIME_FILTERS.TOMORROW, label: 'Tomorrow' },
    { id: TIME_FILTERS.WEEK, label: 'This Week Queue' }
  ];

  return (
    <>
      {/* ── 1. NATIVE MOBILE APP HORIZONTAL FILTER BAR (< 768px - Stitch Layout) ── */}
      <div className="fd-stitch-filter-bar" role="tablist">
        <button
          type="button"
          role="tab"
          className={`fd-stitch-filter-chip ${
            (opTab === OP_TABS.CHECKIN || opTab === OP_TABS.CHECKOUT) && timeFilter === TIME_FILTERS.TODAY ? 'active' : ''
          }`}
          onClick={() => {
            setTimeFilter(TIME_FILTERS.TODAY);
            if (opTab !== OP_TABS.CHECKIN && opTab !== OP_TABS.CHECKOUT) {
              setOpTab && setOpTab(OP_TABS.CHECKIN);
            }
          }}
        >
          Today
        </button>

        <button
          type="button"
          role="tab"
          className={`fd-stitch-filter-chip ${
            (opTab === OP_TABS.CHECKIN || opTab === OP_TABS.CHECKOUT) && timeFilter === TIME_FILTERS.TOMORROW ? 'active' : ''
          }`}
          onClick={() => {
            setTimeFilter(TIME_FILTERS.TOMORROW);
            if (opTab !== OP_TABS.CHECKIN && opTab !== OP_TABS.CHECKOUT) {
              setOpTab && setOpTab(OP_TABS.CHECKIN);
            }
          }}
        >
          Tomorrow
        </button>

        <div className="fd-stitch-filter-divider"></div>

        <button
          type="button"
          role="tab"
          className={`fd-stitch-filter-chip ${opTab === OP_TABS.INHOUSE ? 'active' : ''}`}
          onClick={() => setOpTab && setOpTab(OP_TABS.INHOUSE)}
        >
          <span>In-House</span>
          <span className="fd-stitch-chip-count">({inHouseCount})</span>
        </button>

        <button
          type="button"
          role="tab"
          className={`fd-stitch-filter-chip alert ${opTab === OP_TABS.NOSHOW ? 'active' : ''}`}
          onClick={() => setOpTab && setOpTab(OP_TABS.NOSHOW)}
        >
          <span className="fd-stitch-chip-dot"></span>
          <span>Alerts</span>
          <span className="fd-stitch-chip-count">({alertsCount})</span>
        </button>

        <button
          type="button"
          role="tab"
          className={`fd-stitch-filter-chip ${opTab === OP_TABS.COMPLETED ? 'active' : ''}`}
          onClick={() => setOpTab && setOpTab(OP_TABS.COMPLETED)}
        >
          Completed
        </button>
      </div>

      {/* ── 2. DESKTOP & LAPTOP FILTER BAR (>= 769px) ── */}
      {opTab === OP_TABS.COMPLETED ? (
        <div className="fd-completed-archive-bar fd-desktop-only">
          <div>
            <span className="fd-archive-badge">🏁 COMPLETED ARCHIVES</span>
            <span className="fd-archive-desc">
              Past Checked-out Stays &amp; Finalized GST Invoices
            </span>
          </div>
          <span className="fd-archive-count">
            Total <strong>{completedCount}</strong> archived stays
          </span>
        </div>
      ) : (
        <div className="fd-filter-bar fd-desktop-only">
          <div className="fd-filter-buttons">
            {desktopFilters.map(t => (
              <button
                key={t.id}
                type="button"
                className={`fd-filter-btn ${timeFilter === t.id ? 'active' : ''}`}
                onClick={() => setTimeFilter(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <span className="fd-filter-count">
            Showing <strong>{filteredCount}</strong> active guest queues
          </span>
        </div>
      )}
    </>
  );
}
