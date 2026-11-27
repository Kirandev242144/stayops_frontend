import React from 'react';
import { FiCamera, FiTool, FiCheckCircle, FiAlertTriangle, FiZap } from 'react-icons/fi';

export default function RoomOperationsTable({
  rooms = [],
  onOpenUpdate,
  onOpenMaintenance,
  onViewPhotoProof
}) {
  if (rooms.length === 0) {
    return (
      <div className="hk-table-card hk-table-empty">
        No rooms found matching the current filters.
      </div>
    );
  }

  return (
    <div className="hk-table-card">
      <div className="hk-table-wrap">
        <table className="hk-table">
          <thead>
            <tr>
              <th>Room Unit</th>
              <th>Property &amp; Type</th>
              <th>Occupancy Status</th>
              <th>Housekeeping</th>
              <th>Assigned Staff</th>
              <th>Task &amp; Priority</th>
              <th>Photo Proof</th>
              <th className="hk-text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rooms.map(room => {
              return (
                <tr key={room.id}>
                  {/* ROOM UNIT */}
                  <td>
                    <span className="hk-room-name">{room.name}</span>
                    {room.isUrgentTurnover && (
                      <span className="hk-urgent-badge">
                        URGENT
                      </span>
                    )}
                  </td>

                  {/* PROPERTY */}
                  <td>
                    <div>{room.propertyName}</div>
                    <div className="hk-type-sub">{room.category}</div>
                  </td>

                  {/* OCCUPANCY */}
                  <td>
                    <span className="hk-occ-status">
                      {room.isCheckedOutToday ? (
                        <span className="occ-departed">Departed {room.currentGuest ? `(${room.currentGuest})` : ''}</span>
                      ) : room.isDepartingToday ? (
                        <span className="occ-departing">Due Out {room.currentGuest ? `(${room.currentGuest})` : ''}</span>
                      ) : room.isArrivingToday ? (
                        <span className="occ-arriving">Arrival Due {room.currentGuest ? `(${room.currentGuest})` : ''}</span>
                      ) : room.occupancyStatus?.includes('Stayover') ? (
                        <span className="occ-stayover">In-House {room.currentGuest ? `(${room.currentGuest})` : ''}</span>
                      ) : (
                        <span className="occ-vacant">Vacant</span>
                      )}
                    </span>
                  </td>

                  {/* HOUSEKEEPING STATUS */}
                  <td>
                    {room.isOutOfOrder ? (
                      <span className="hk-badge badge-ooo">
                        <span className="hk-badge-dot dot-maintenance" /> Out of Order
                      </span>
                    ) : room.cleaningStatus === 'IN_PROGRESS' ? (
                      <span className="hk-badge badge-progress">
                        <span className="hk-badge-dot dot-progress" /> Cleaning
                      </span>
                    ) : room.isReadyForCheckin ? (
                      <span className="hk-badge badge-ready">
                        <span className="hk-badge-dot dot-ready" /> Ready for Check-in
                      </span>
                    ) : room.cleaningStatus === 'CLEAN' ? (
                      <span className="hk-badge badge-clean">
                        <span className="hk-badge-dot dot-ready" /> Cleaned
                      </span>
                    ) : (
                      <span className="hk-badge badge-dirty">
                        <span className="hk-badge-dot dot-dirty" /> Turnover Needed
                      </span>
                    )}

                    {room.maintenanceIssue && (
                      <div className="hk-defect-micro">
                        <FiAlertTriangle size={11} className="hk-icon-inline" /> {room.maintenanceIssue}
                      </div>
                    )}
                  </td>

                  {/* ASSIGNED STAFF */}
                  <td>
                    <span className={room.assignedTo ? 'hk-staff-text' : 'hk-staff-text-unassigned'}>
                      {room.assignedTo || 'Unassigned'}
                    </span>
                  </td>

                  {/* TASK & PRIORITY */}
                  <td>
                    <div className="hk-task-text-sm">
                      {(room.taskType || 'Turnover').replace('_', ' ').toLowerCase()}
                    </div>
                    <span className={`hk-prio-pill prio-${(room.priority || 'NORMAL').toLowerCase()}`}>
                      {room.priority === 'RUSH' && <FiZap size={9} />}
                      <span>{room.priority || 'NORMAL'}</span>
                    </span>
                  </td>

                  {/* PHOTO PROOF */}
                  <td>
                    {room.photoProofUrl ? (
                      <button
                        type="button"
                        onClick={() => onViewPhotoProof(room)}
                        className="hk-photo-audit-btn hk-photo-audit-btn-sm"
                      >
                        <FiCamera size={12} />
                        <span>2 Photos</span>
                      </button>
                    ) : (
                      <span className="hk-no-proof">No proof</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  <td className="hk-text-right">
                    <div className="hk-actions-wrap">
                      <button
                        type="button"
                        className="hk-btn-act hk-btn-act-primary hk-btn-act-sm"
                        onClick={() => onOpenUpdate(room)}
                      >
                        <FiCheckCircle size={11} /> Update
                      </button>
                      <button
                        type="button"
                        className="hk-btn-act hk-btn-act-secondary hk-btn-act-sm"
                        onClick={() => onOpenMaintenance(room)}
                      >
                        <FiTool size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
