import React from 'react';
import { calculateFolio } from '../../Frontdesk/utils/folioCalculator';

export default function ReservationStats({ reservationsList = [], mealOrders = [], taxSettings = null }) {
  const totalBookings = reservationsList.length;
  const arrivingToday = reservationsList.filter(b => b.status === 'confirmed' || b.status === 'checkin' || b.status === 'CONFIRMED').length;
  const inHouseCount = reservationsList.filter(b => b.status === 'inhouse' || b.status === 'checkedin' || b.status === 'occupied' || b.status === 'CHECKED_IN').length;

  const activeUnpaidBookings = reservationsList.filter(b => {
    if (b.status === 'cancelled' || b.status === 'CANCELLED') return false;
    const folio = calculateFolio(b, mealOrders, taxSettings);
    return folio.balanceDue > 0;
  });

  const pendingAmount = activeUnpaidBookings.reduce((sum, b) => {
    const folio = calculateFolio(b, mealOrders, taxSettings);
    return sum + folio.balanceDue;
  }, 0);
  const pendingCount = activeUnpaidBookings.length;

  return (
    <div className="res-stats-grid">
      <div className="res-stat-card">
        <span className="res-stat-label">Total Bookings</span>
        <div className="res-stat-value">{totalBookings}</div>
        <span className="res-stat-sub">Portfolio Total</span>
      </div>

      <div className="res-stat-card">
        <span className="res-stat-label">Arriving Today</span>
        <div className="res-stat-value">{arrivingToday}</div>
        <span className="res-stat-sub green">Check-in ready</span>
      </div>

      <div className="res-stat-card">
        <span className="res-stat-label">In House Guests</span>
        <div className="res-stat-value green">{inHouseCount}</div>
        <span className="res-stat-sub">Currently occupied</span>
      </div>

      <div className="res-stat-card">
        <span className="res-stat-label">Pending Payments</span>
        <div className="res-stat-value amber">
          &#8377;{pendingAmount.toLocaleString('en-IN')}
        </div>
        <span className="res-stat-sub amber">
          {pendingCount} booking desk payments
        </span>
      </div>
    </div>
  );
}
