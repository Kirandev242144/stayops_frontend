import React from "react";
import "./AdminStatCard.css";

/**
 * Reusable Metric KPI Card for the StayOps Admin Console.
 *
 * @param {string} title - The name of the metric (e.g. "Platform GMV")
 * @param {string|number} value - The formatted value (e.g. "₹18,42,000")
 * @param {string} change - Delta change (e.g. "+12.4% vs last mo")
 * @param {boolean} isPositive - Whether the delta trend is positive
 * @param {React.ReactNode} icon - Icon component to render
 * @param {string} subtitle - Explanatory footnote or timeframe
 * @param {string} accent - Optional accent color class ('teal', 'emerald', 'blue', 'purple')
 */
const AdminStatCard = ({
  title,
  value,
  change,
  isPositive = true,
  icon,
  subtitle,
  accent = "teal",
}) => {
  return (
    <div className={`admin-stat-card admin-stat-card--${accent}`}>
      <div className="admin-stat-card__top">
        <span className="admin-stat-card__title">{title}</span>
        {icon && <div className="admin-stat-card__icon-wrap">{icon}</div>}
      </div>

      <div className="admin-stat-card__main">
        <h3 className="admin-stat-card__value">{value}</h3>
      </div>

      <div className="admin-stat-card__bottom">
        {change && (
          <span
            className={`admin-stat-card__change ${
              isPositive ? "is-positive" : "is-negative"
            }`}
          >
            {isPositive ? "↑ " : "↓ "}
            {change}
          </span>
        )}
        {subtitle && (
          <span className="admin-stat-card__subtitle">{subtitle}</span>
        )}
      </div>
    </div>
  );
};

export default AdminStatCard;
