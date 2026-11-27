import React, { useState, useMemo } from 'react';
import {
  FiArrowLeft,
  FiDownload,
  FiUserPlus,
  FiSearch,
  FiX,
  FiUsers,
  FiRepeat,
  FiDollarSign,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight
} from 'react-icons/fi';
import './GuestCRM.css';

/** Deterministic soft pastel avatar palette */
const AVATAR_PALETTE = [
  { bg: "#F1F5F9", text: "#334155" },
  { bg: "#ECFDF5", text: "#065F46" },
  { bg: "#EFF6FF", text: "#1E40AF" },
  { bg: "#FAF5FF", text: "#6B21A8" },
  { bg: "#FFFBEB", text: "#92400E" },
  { bg: "#FDF2F8", text: "#9D174D" }
];

function getAvatarStyle(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_PALETTE.length;
  return AVATAR_PALETTE[index];
}

export default function GuestCRM({
  guestsList = [],
  onBack,
  onExportCSV,
  onOpenAddGuest,
  onSelectGuest
}) {
  const [guestSearchQuery, setGuestSearchQuery] = useState('');
  const [guestFilterTab, setGuestFilterTab] = useState('all');

  // Compute CRM Directory Metrics
  const metrics = useMemo(() => {
    const total = guestsList.length;
    const returning = guestsList.filter(g => g.status === 'returning' || g.totalStays > 1).length;
    const verified = guestsList.filter(g =>
      Boolean(g.idType || g.idNumber || g.idDocumentUrl || (Array.isArray(g.idDocuments) && g.idDocuments.length > 0) || g.aadhaarNo)
    ).length;
    const pendingId = total - verified;
    const totalRevenue = guestsList.reduce((sum, g) => sum + (Number(g.totalRevenue) || 0), 0);
    const avgSpend = total > 0 ? Math.round(totalRevenue / total) : 0;
    const repeatRate = total > 0 ? Math.round((returning / total) * 100) : 0;

    return { total, returning, verified, pendingId, totalRevenue, avgSpend, repeatRate };
  }, [guestsList]);

  // Filter and Search logic
  const filteredGuests = useMemo(() => {
    const query = guestSearchQuery.trim().toLowerCase();

    return guestsList.filter(guest => {
      const name = (guest.name || '').toLowerCase();
      const phone = (guest.phone || '').toLowerCase();
      const email = (guest.email || '').toLowerCase();

      const matchSearch =
        query === '' ||
        name.includes(query) ||
        phone.includes(query) ||
        email.includes(query);

      if (!matchSearch) return false;

      const hasId = Boolean(
        guest.idType ||
        guest.idNumber ||
        guest.idDocumentUrl ||
        (Array.isArray(guest.idDocuments) && guest.idDocuments.length > 0) ||
        guest.aadhaarNo
      );

      const isReturning = guest.status === 'returning' || guest.totalStays > 1;

      if (guestFilterTab === 'returning') return isReturning;
      if (guestFilterTab === 'verified') return hasId;
      if (guestFilterTab === 'pending_id') return !hasId;

      return true;
    });
  }, [guestsList, guestSearchQuery, guestFilterTab]);

  return (
    <div className="gcrm-container">
      {/* 1. Header with Breadcrumb & Primary Actions */}
      <div className="gcrm-header">
        <div className="gcrm-header-left">
          <button
            type="button"
            className="gcrm-back-btn"
            onClick={onBack}
          >
            <FiArrowLeft size={14} /> Back to Reservations
          </button>
          <div className="gcrm-title-row">
            <h2 className="gcrm-title">Guest Directory & CRM</h2>
            <span className="gcrm-total-badge">{metrics.total} Guests</span>
          </div>
          <p className="gcrm-subtitle">
            Centralized database of all guest contacts, stay history, and lifetime value.
          </p>
        </div>

        <div className="gcrm-header-actions">
          <button
            type="button"
            className="gcrm-btn-secondary"
            onClick={onExportCSV}
            title="Download guest directory as CSV"
          >
            <FiDownload size={14} /> Export CSV
          </button>
          <button
            type="button"
            className="gcrm-btn-primary"
            onClick={onOpenAddGuest}
          >
            <FiUserPlus size={14} /> Add Guest Profile
          </button>
        </div>
      </div>

      {/* 2. Metrics / KPI Summary Grid */}
      <div className="gcrm-stats-grid">
        <div className="gcrm-stat-card">
          <div className="gcrm-stat-header">
            <span className="gcrm-stat-label">Total Guests</span>
            <FiUsers className="gcrm-stat-icon" />
          </div>
          <p className="gcrm-stat-value">{metrics.total}</p>
          <span className="gcrm-stat-meta">Active guest profiles in CRM</span>
        </div>

        <div className="gcrm-stat-card">
          <div className="gcrm-stat-header">
            <span className="gcrm-stat-label">Returning Guests</span>
            <FiRepeat className="gcrm-stat-icon" />
          </div>
          <p className="gcrm-stat-value">{metrics.returning}</p>
          <span className="gcrm-stat-meta">
            <span className="gcrm-stat-badge">{metrics.repeatRate}% Repeat Rate</span>
          </span>
        </div>

        <div className="gcrm-stat-card">
          <div className="gcrm-stat-header">
            <span className="gcrm-stat-label">Total Lifetime Spend</span>
            <FiDollarSign className="gcrm-stat-icon" />
          </div>
          <p className="gcrm-stat-value">₹{metrics.totalRevenue.toLocaleString('en-IN')}</p>
          <span className="gcrm-stat-meta">Cumulative portfolio spend</span>
        </div>

        <div className="gcrm-stat-card">
          <div className="gcrm-stat-header">
            <span className="gcrm-stat-label">Avg. Spend / Guest</span>
            <FiTrendingUp className="gcrm-stat-icon" />
          </div>
          <p className="gcrm-stat-value">₹{metrics.avgSpend.toLocaleString('en-IN')}</p>
          <span className="gcrm-stat-meta">Average lifetime revenue</span>
        </div>
      </div>

      {/* 3. Search Bar & Filter Tabs */}
      <div className="gcrm-filter-card">
        <div className="gcrm-search-box">
          <FiSearch className="gcrm-search-icon" />
          <input
            type="text"
            className="gcrm-search-input"
            placeholder="Search guests by name, phone, or email..."
            value={guestSearchQuery}
            onChange={e => setGuestSearchQuery(e.target.value)}
          />
          {guestSearchQuery && (
            <button
              type="button"
              className="gcrm-search-clear"
              onClick={() => setGuestSearchQuery('')}
              title="Clear search"
            >
              <FiX size={14} />
            </button>
          )}
        </div>

        <div className="gcrm-filter-tabs">
          <button
            type="button"
            className={`gcrm-tab-pill ${guestFilterTab === 'all' ? 'active' : ''}`}
            onClick={() => setGuestFilterTab('all')}
          >
            <span>All Guests</span>
            <span className="gcrm-tab-count">{metrics.total}</span>
          </button>
          <button
            type="button"
            className={`gcrm-tab-pill ${guestFilterTab === 'returning' ? 'active' : ''}`}
            onClick={() => setGuestFilterTab('returning')}
          >
            <span>Returning</span>
            <span className="gcrm-tab-count">{metrics.returning}</span>
          </button>
          <button
            type="button"
            className={`gcrm-tab-pill ${guestFilterTab === 'verified' ? 'active' : ''}`}
            onClick={() => setGuestFilterTab('verified')}
          >
            <span>Verified ID</span>
            <span className="gcrm-tab-count">{metrics.verified}</span>
          </button>
          <button
            type="button"
            className={`gcrm-tab-pill ${guestFilterTab === 'pending_id' ? 'active' : ''}`}
            onClick={() => setGuestFilterTab('pending_id')}
          >
            <span>ID Pending</span>
            <span className="gcrm-tab-count">{metrics.pendingId}</span>
          </button>
        </div>
      </div>

      {/* 4. Guest Directory Table */}
      <div className="gcrm-table-card">
        <div className="gcrm-table-scroll">
          <table className="gcrm-table">
            <thead>
              <tr>
                <th>Guest Details</th>
                <th>Phone Number</th>
                <th>Email Address</th>
                <th>Stay History</th>
                <th>Lifetime Spend</th>
                <th>Last Stay</th>
                <th>ID Verification</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan="8">
                    <div className="gcrm-empty-state">
                      <div className="gcrm-empty-icon">
                        <FiUsers />
                      </div>
                      <h4>No guest profiles found</h4>
                      <p>
                        {guestSearchQuery
                          ? `No results matching "${guestSearchQuery}". Try clearing search or switching filter.`
                          : 'No guests recorded in this view.'}
                      </p>
                      {guestSearchQuery && (
                        <button
                          type="button"
                          className="gcrm-btn-secondary"
                          onClick={() => setGuestSearchQuery('')}
                        >
                          Clear Search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGuests.map(g => {
                  const hasId = Boolean(
                    g.idType ||
                    g.idNumber ||
                    g.idDocumentUrl ||
                    (Array.isArray(g.idDocuments) && g.idDocuments.length > 0) ||
                    g.aadhaarNo
                  );
                  const isReturning = g.status === 'returning' || g.totalStays > 1;
                  const initial = g.name ? g.name.charAt(0).toUpperCase() : 'G';
                  const avatarStyle = getAvatarStyle(g.name || '');

                  return (
                    <tr key={g.id || g.dbId}>
                      <td>
                        <div className="gcrm-guest-cell">
                          <div
                            className="gcrm-avatar"
                            style={{ background: avatarStyle.bg, color: avatarStyle.text }}
                          >
                            {initial}
                          </div>
                          <div className="gcrm-guest-info">
                            <div className="gcrm-guest-name-row">
                              <span
                                className="gcrm-guest-name"
                                onClick={() => onSelectGuest(g)}
                                title="Open guest profile"
                              >
                                {g.name || 'Unnamed Guest'}
                              </span>
                              {isReturning && (
                                <span className="gcrm-badge-returning">Returning</span>
                              )}
                            </div>
                            <span className="gcrm-guest-id">{g.id || `G-${g.dbId}`}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        {g.phone ? (
                          <a href={`tel:${g.phone}`} className="gcrm-contact-link">
                            {g.phone}
                          </a>
                        ) : (
                          <span className="gcrm-text-muted">—</span>
                        )}
                      </td>

                      <td>
                        {g.email ? (
                          <a href={`mailto:${g.email}`} className="gcrm-contact-link">
                            {g.email}
                          </a>
                        ) : (
                          <span className="gcrm-text-muted">—</span>
                        )}
                      </td>

                      <td>
                        <span className="gcrm-stays-pill">
                          {g.totalStays || 0} {g.totalStays === 1 ? 'Stay' : 'Stays'}
                        </span>
                      </td>

                      <td>
                        <strong className="gcrm-text-bold">
                          ₹{(Number(g.totalRevenue) || 0).toLocaleString('en-IN')}
                        </strong>
                      </td>

                      <td>
                        <span className="gcrm-text-muted">{g.lastStay || '—'}</span>
                      </td>

                      <td>
                        {hasId ? (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            <span
                              className="gcrm-id-badge verified"
                              title={g.idNumber ? `ID No: ${g.idNumber}` : undefined}
                            >
                              <FiCheckCircle size={12} />
                              {g.idType || 'ID Verified'}
                            </span>
                            {g.idDocumentUrl && (
                              <button
                                type="button"
                                className="gcrm-btn-view-id"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectGuest(g);
                                }}
                                title="View uploaded ID document"
                              >
                                View ID
                              </button>
                            )}
                          </div>
                        ) : (
                          <span className="gcrm-id-badge pending">
                            <FiAlertCircle size={12} />
                            ID Pending
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="gcrm-action-btn"
                          onClick={() => onSelectGuest(g)}
                        >
                          <span>View Profile</span>
                          <FiArrowRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredGuests.length > 0 && (
          <div className="gcrm-table-footer">
            <span>Showing {filteredGuests.length} of {metrics.total} guests</span>
            <span>StayOps CRM Directory</span>
          </div>
        )}
      </div>
    </div>
  );
}
