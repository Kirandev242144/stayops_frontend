import React from 'react';
import { FiClock, FiShield } from 'react-icons/fi';
import { formatTime12Hr } from '../../../utils/timeFormat';

export default function StorefrontPolicies({ property }) {
  if (!property) return null;

  return (
    <div className="sf-policies-section">
      <div className="sf-section-subtitle">GUEST INFORMATION</div>
      <h2 className="sf-section-title sf-policies-title">House Policies & Guidelines</h2>

      <div className="sf-policies-grid">
        {/* Check-in / Check-out Box */}
        <div className="sf-policy-card">
          <h4 className="sf-policy-card-title">
            <FiClock /> Timings & Schedule
          </h4>
          <div className="sf-policy-row sf-policy-row-bordered">
            <span className="sf-policy-label">Check-In Time</span>
            <span className="sf-policy-val">{formatTime12Hr(property.checkInTime)}</span>
          </div>
          <div className="sf-policy-row">
            <span className="sf-policy-label">Check-Out Time</span>
            <span className="sf-policy-val">{formatTime12Hr(property.checkOutTime)}</span>
          </div>
        </div>

        {/* Cancellation Policy Box */}
        <div className="sf-policy-card">
          <h4 className="sf-policy-card-title">
            <FiShield /> Cancellation Policy
          </h4>
          <p className="sf-policy-desc">
            {property.cancellationPolicy}
          </p>
        </div>
      </div>
    </div>
  );
}

