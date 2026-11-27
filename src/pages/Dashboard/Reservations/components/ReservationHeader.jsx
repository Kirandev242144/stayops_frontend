import React from 'react';
import { FiPlus, FiUsers } from 'react-icons/fi';

export default function ReservationHeader({ onOpenCrm, onOpenNewRes }) {
  return (
    <div className="res-header-bar">
      <div className="res-header-title-group">
        <h2 className="res-header-title">Reservations</h2>
        <p className="res-header-subtitle">
          Manage guest bookings, check-in status, and payment receipts across channels.
        </p>
      </div>
      <div className="res-header-actions">
        <button
          type="button"
          className="res-btn res-btn-outline"
          onClick={onOpenCrm}
        >
          <FiUsers size={14} /> Guests CRM
        </button>
        <button
          type="button"
          className="res-btn res-btn-primary"
          onClick={onOpenNewRes}
        >
          <FiPlus size={14} /> New Reservation
        </button>
      </div>
    </div>
  );
}
