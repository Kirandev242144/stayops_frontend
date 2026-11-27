import React from "react";
import "./AdminBadge.css";

/**
 * Reusable semantic status badge for the StayOps Admin Console.
 * Standardizes styling across properties, tenants, plans, and system status.
 *
 * @param {string} status - One of: 'active', 'trial', 'suspended', 'pending', 'verified', 'pro', 'hub', 'lite', 'warning', 'danger'
 * @param {string} label - Optional custom text to display; defaults to capitalized status
 * @param {boolean} dot - Whether to include a small pulsing/static indicator dot
 */
const AdminBadge = ({ status = "active", label, dot = false }) => {
  const normalizedStatus = String(status).toLowerCase().trim();
  const displayLabel = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span className={`admin-badge admin-badge--${normalizedStatus}`}>
      {dot && <span className="admin-badge__dot" aria-hidden="true" />}
      <span className="admin-badge__label">{displayLabel}</span>
    </span>
  );
};

export default AdminBadge;
