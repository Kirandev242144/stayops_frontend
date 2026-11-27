import React, { useState, useEffect } from 'react';
import { FiMoreVertical, FiFileText, FiXCircle, FiDollarSign } from 'react-icons/fi';
import { RESERVATION_STATUS } from '../constants';
import { calculateFolio } from '../../Frontdesk/utils/folioCalculator';
import { getTodayStr, getBookingDates } from '../utils/reservationFilters';

export default function ReservationTable({
  reservations = [],
  mealOrders = [],
  taxSettings = null,
  dateFilter = 'today',
  onSelectDateFilter,
  onMarkPaid,
  onViewVoucher,
  onOpenCancelModal
}) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const todayStr = getTodayStr();

  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  return (
    <div className="res-table-card">
      <table className="res-table">
        <thead>
          <tr>
            <th className="res-table-th">Booking Ref / Channel</th>
            <th className="res-table-th">Guest Details</th>
            <th className="res-table-th">Property Unit</th>
            <th className="res-table-th">Dates & Stay</th>
            <th className="res-table-th">Amount & Payment</th>
            <th className="res-table-th">Status</th>
            <th className="res-table-th">Actions</th>
          </tr>
        </thead>
        <tbody>
          {reservations.length === 0 ? (
            <tr>
              <td colSpan="7" className="res-empty-cell">
                <div className="res-empty-state-box">
                  <span className="res-empty-title">
                    {dateFilter === 'today'
                      ? 'No active stays or arrivals today'
                      : dateFilter === 'upcoming'
                      ? 'No upcoming reservations'
                      : 'No reservations found'}
                  </span>
                  <span className="res-empty-sub">
                    {dateFilter === 'today'
                      ? 'You can check Upcoming reservations or view All Bookings.'
                      : 'Try clearing your filters or selecting another date preset.'}
                  </span>
                  {dateFilter !== 'all' && onSelectDateFilter && (
                    <button
                      type="button"
                      className="res-empty-action-btn"
                      onClick={() => onSelectDateFilter('all')}
                    >
                      View All Bookings
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            reservations.map(b => {
              const isOpen = openMenuId === b.id;
              const isCancelled = b.status === 'cancelled' || b.status === RESERVATION_STATUS.CANCELLED;
              const isCheckedOut = b.status === 'checkedout' || b.status === RESERVATION_STATUS.CHECKED_OUT || b.status === 'Checked Out';
              const isCheckedIn = b.status === 'checkedin' || b.status === RESERVATION_STATUS.CHECKED_IN || b.status === 'Checked In' || b.status === 'inhouse' || b.status === 'occupied';
              const isNoShow = b.status === 'no_show' || b.status === RESERVATION_STATUS.NO_SHOW || b.status === 'No-Show';
              const isCancellable = !isCancelled && !isCheckedOut && !isNoShow;

              const folio = calculateFolio(b, mealOrders, taxSettings);
              const collectedAmount = folio.paidAmount;
              const isRefunded = folio.isRefunded || b.paymentStatus === 'Refunded' || b.paymentStatus === 'Refund Processed' || b.paymentStatus === 'Full Refund' || b.refundStatus === 'REFUNDED' || b.isRefunded === true || (typeof b.notes === 'string' && (b.notes.includes('Refund:') || b.notes.includes('Refund Processed')));

              return (
                <tr key={b.id} className={isOpen ? "res-row-active" : ""}>
                  <td className="res-table-td">
                    <strong className="res-ref-title">{b.id}</strong>
                    <span className="res-channel-badge">{b.bookingSource || 'Walk-In'}</span>
                  </td>

                  <td className="res-table-td">
                    <div className="res-guest-cell">
                      <div className="res-guest-avatar">
                        {b.guestName ? b.guestName.charAt(0).toUpperCase() : 'G'}
                      </div>
                      <div className="res-guest-info">
                        <span className="res-guest-name">{b.guestName}</span>
                        <span className="res-guest-phone">{b.guestPhone}</span>
                      </div>
                    </div>
                  </td>

                  <td className="res-table-td">
                    <span className="res-prop-title">{b.propertyName}</span>
                    <div className="res-sub-text">
                      {b.roomUnit} &mdash; {
                        b.adultsCount
                          ? `${b.adultsCount} Adult${b.adultsCount > 1 ? 's' : ''}${b.childrenCount > 0 ? `, ${b.childrenCount} Child${b.childrenCount > 1 ? 'ren' : ''}` : ''}`
                          : `${b.guestCount || 1} Guest${(b.guestCount || 1) > 1 ? 's' : ''}`
                      }
                    </div>
                  </td>

                  <td className="res-table-td">
                    <div className="res-prop-title">{b.checkIn} &rarr; {b.checkOut}</div>
                    {(() => {
                      // Terminal states (cancelled, no-show, checked-out) require no active action tag
                      if (isCancelled || isNoShow || isCheckedOut) {
                        return null;
                      }

                      const { checkIn: bIn, checkOut: bOut } = getBookingDates(b);

                      // If guest is currently in-house (checked in)
                      if (isCheckedIn) {
                        if (bOut === todayStr) {
                          return (
                            <div style={{ marginTop: 4 }}>
                              <span className="res-activity-tag departing">Departing Today</span>
                            </div>
                          );
                        }
                        return (
                          <div style={{ marginTop: 4 }}>
                            <span className="res-activity-tag inhouse">In-House</span>
                          </div>
                        );
                      }

                      // If guest is confirmed (pending arrival)
                      if (bIn === todayStr) {
                        return (
                          <div style={{ marginTop: 4 }}>
                            <span className="res-activity-tag arriving">Arriving Today</span>
                          </div>
                        );
                      }
                      if (bIn && bIn < todayStr) {
                        return (
                          <div style={{ marginTop: 4 }}>
                            <span className="res-activity-tag arriving" style={{ background: '#FEF2F2', color: '#DC2626', borderColor: '#FECACA' }}>
                              Late Arrival
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </td>

                  <td className="res-table-td">
                    <strong className="res-ref-title">&#8377;{folio.totalFolio.toLocaleString('en-IN')}</strong>
                    {isCancelled ? (
                      isRefunded ? (
                        <div style={{ marginTop: 4 }}>
                          <span className="res-due-tag" style={{ background: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }}>
                            Refunded: &#8377;{collectedAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : collectedAmount > 0 ? (
                        <div style={{ marginTop: 4 }}>
                          <span className="res-due-tag" style={{ background: '#EFF6FF', color: '#1D4ED8', borderColor: '#BFDBFE' }}>
                            Paid: &#8377;{collectedAmount.toLocaleString('en-IN')}
                          </span>
                        </div>
                      ) : (
                        <div style={{ marginTop: 4 }}>
                          <span className="res-sub-text" style={{ fontStyle: 'italic' }}>No Dues (Cancelled)</span>
                        </div>
                      )
                    ) : folio.balanceDue > 0 ? (
                      <div className="res-due-wrapper">
                        <span className="res-due-tag">Due: &#8377;{folio.balanceDue.toLocaleString('en-IN')}</span>
                        <button
                          type="button"
                          className="res-mark-paid-btn"
                          onClick={() => onMarkPaid(b, folio)}
                        >
                          Mark Paid
                        </button>
                      </div>
                    ) : isRefunded ? (
                      <div style={{ marginTop: 4 }}>
                        <span className="res-due-tag" style={{ background: '#F0FDF4', color: '#15803D', borderColor: '#BBF7D0' }}>
                          Refunded
                        </span>
                      </div>
                    ) : (
                      <span className="res-paid-tag">Paid in Full</span>
                    )}
                  </td>

                  <td className="res-table-td">
                    {b.status === RESERVATION_STATUS.CHECKED_IN && (
                      <span className="res-badge res-badge-checkedin">Checked In</span>
                    )}
                    {b.status === RESERVATION_STATUS.CHECKED_OUT && (
                      <span className="res-badge res-badge-checkedout">Checked Out</span>
                    )}
                    {b.status === RESERVATION_STATUS.NO_SHOW && (
                      <span className="res-badge res-badge-noshow">No-Show</span>
                    )}
                    
{isCancelled && (
  <span 
    className="res-badge res-badge-cancelled" 
    title={b.notes ? `Cancellation Reason:\n${b.notes}` : "Cancelled booking"}
    style={{ cursor: 'help' }}
  >
    Cancelled
  </span>
)}
                    {(b.status === RESERVATION_STATUS.CONFIRMED || b.status === "confirmed" || !b.status) && !isCancelled && (
                      <span className="res-badge res-badge-confirmed">Confirmed</span>
                    )}
                  </td>

                  <td className="res-table-td res-actions-cell">
                    <div className="res-actions-wrapper">
                      <button
                        type="button"
                        className="res-btn res-btn-outline res-btn-sm"
                        onClick={() => onViewVoucher(b)}
                      >
                        Voucher
                      </button>

                      <div className={`res-menu-container ${isOpen ? 'is-open' : ''}`}>
                      <button
                        type="button"
                        className="res-dots-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === b.id ? null : b.id);
                        }}
                        title="More Actions"
                      >
                        <FiMoreVertical size={16} />
                      </button>

                      {openMenuId === b.id && (
                        <div className="res-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            className="res-dropdown-item"
                            onClick={() => {
                              setOpenMenuId(null);
                              onViewVoucher(b);
                            }}
                          >
                            <FiFileText size={14} /> View Voucher
                          </button>

                          {isCancellable && (
                            <button
                              type="button"
                              className="res-dropdown-item res-dropdown-item-danger"
                              onClick={() => {
                                setOpenMenuId(null);
                                onOpenCancelModal(b);
                              }}
                            >
                              <FiXCircle size={14} /> Cancel Booking
                            </button>
                          )}

                          {!isCancelled && folio.balanceDue > 0 && (
                            <button
                              type="button"
                              className="res-dropdown-item"
                              onClick={() => {
                                setOpenMenuId(null);
                                onMarkPaid(b, folio);
                              }}
                            >
                              <FiDollarSign size={14} /> Mark Paid
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            );
          })
        )}
        </tbody>
      </table>
    </div>
  );
}

