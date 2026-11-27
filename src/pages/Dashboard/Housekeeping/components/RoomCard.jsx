import React from 'react';
import { 
  FiHome, 
  FiUser, 
  FiCamera, 
  FiTool, 
  FiCheckCircle, 
  FiClock, 
  FiAlertCircle,
  FiCheckSquare,
  FiArrowRight,
  FiZap,
  FiArrowUpRight
} from 'react-icons/fi';

export default function RoomCard({
  room,
  onOpenUpdate,
  onOpenMaintenance,
  onViewPhotoProof
}) {
  const {
    name = 'Room',
    propertyName = 'Property',
    category = 'Standard',
    cleaningStatus = 'DIRTY',
    occupancyStatus = 'Vacant',
    currentGuest,
    isUrgentTurnover,
    isReadyForCheckin,
    isDepartingToday,
    isCheckedOutToday,
    isArrivingToday,
    assignedTo,
    priority = 'NORMAL',
    taskType = 'TURNOVER',
    photoProofUrl,
    cleanedBy,
    lastCleanedAt,
    maintenanceIssue,
    maintenanceSeverity,
    checklist
  } = room;

  const statusKey = cleaningStatus.toLowerCase();
  const isOutOfOrder = cleaningStatus === 'OUT_OF_ORDER' || Boolean(maintenanceIssue);

  // Reality-based Status Label
  const getStatusBadge = () => {
    if (isOutOfOrder) {
      return {
        label: 'Out of Order',
        className: 'badge-ooo',
        dotClass: 'dot-maintenance'
      };
    }
    if (cleaningStatus === 'IN_PROGRESS') {
      return {
        label: 'Cleaning in Progress',
        className: 'badge-progress',
        dotClass: 'dot-progress'
      };
    }
    if (isReadyForCheckin) {
      return {
        label: 'Ready for Check-in',
        className: 'badge-ready',
        dotClass: 'dot-ready'
      };
    }
    if (cleaningStatus === 'CLEAN' || cleaningStatus === 'INSPECTED') {
      return {
        label: 'Cleaned & Audited',
        className: 'badge-clean',
        dotClass: 'dot-ready'
      };
    }
    // Dirty / Turnover needed
    if (isCheckedOutToday) {
      return {
        label: 'Turnover Needed (Departed)',
        className: 'badge-dirty',
        dotClass: 'dot-dirty'
      };
    }
    if (isDepartingToday) {
      return {
        label: 'Turnover Needed (Due Out)',
        className: 'badge-dirty',
        dotClass: 'dot-dirty'
      };
    }
    return {
      label: 'Turnover Needed',
      className: 'badge-dirty',
      dotClass: 'dot-dirty'
    };
  };

  const statusBadge = getStatusBadge();
  const completedChecklistCount = Array.isArray(checklist)
    ? checklist.filter(i => i.completed).length
    : checklist && typeof checklist === 'object'
      ? Object.values(checklist).filter(Boolean).length
      : 0;

  const totalChecklistCount = Array.isArray(checklist)
    ? checklist.length
    : 5;

  // Formatted task display
  const formattedTask = (taskType || 'Turnover')
    .replace('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());

  // Staff initials helper
  const getStaffInitials = (staffName) => {
    if (!staffName) return '—';
    const parts = staffName.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return staffName.slice(0, 2).toUpperCase();
  };

  return (
    <article className={`hk-card ${isUrgentTurnover ? 'is-urgent' : ''} ${isOutOfOrder ? 'is-ooo' : ''}`}>
      {/* 1. TOP HEADER */}
      <header className="hk-card-head">
        <div className="hk-card-title-group">
          <h3 className="hk-card-unit">{name}</h3>
          <span className="hk-card-sub">
            {propertyName} &bull; {category}
          </span>
        </div>

        <span className={`hk-badge ${statusBadge.className}`}>
          <span className={`hk-badge-dot ${statusBadge.dotClass}`} />
          {statusBadge.label}
        </span>
      </header>

      {/* 2. OPERATIONAL BODY */}
      <div className="hk-card-body">
        {/* OCCUPANCY ROW */}
        <div className="hk-info-row">
          <span className="hk-info-label">Occupancy</span>
          <div className="hk-occupancy-tag">
            {isCheckedOutToday ? (
              <span className="hk-occ-status occ-departed">
                Departed: <strong>{currentGuest || 'Guest'}</strong> (Checked Out)
              </span>
            ) : isDepartingToday ? (
              <span className="hk-occ-status occ-departing">
                Departing Today: <strong>{currentGuest || 'Guest'}</strong> (Due Out)
              </span>
            ) : isArrivingToday ? (
              <span className="hk-occ-status occ-arriving">
                Arrival Expected: <strong>{currentGuest || 'Guest'}</strong>
              </span>
            ) : occupancyStatus.includes('Stayover') ? (
              <span className="hk-occ-status occ-stayover">
                In-House Stayover: <strong>{currentGuest || 'Guest'}</strong>
              </span>
            ) : (
              <span className="hk-occ-status occ-vacant">
                Vacant Unit
              </span>
            )}
          </div>
        </div>

        {/* TASK & PRIORITY ROW */}
        <div className="hk-info-row">
          <span className="hk-info-label">Task</span>
          <div className="hk-task-wrap">
            <span className="hk-task-name">{formattedTask}</span>
            <span className={`hk-prio-pill prio-${(priority || 'NORMAL').toLowerCase()}`}>
              {priority === 'RUSH' && <FiZap size={10} />}
              <span>{priority}</span>
            </span>
          </div>
        </div>

        {/* STAFF ASSIGNMENT ROW */}
        <div className="hk-info-row">
          <span className="hk-info-label">Caretaker</span>
          <div className="hk-staff-pill">
            <span className="hk-staff-avatar">{getStaffInitials(assignedTo)}</span>
            <span className="hk-staff-name">{assignedTo || 'Unassigned'}</span>
          </div>
        </div>

        {/* VERIFIED AUDIT PROOF BADGE (IF CAPTURED) */}
        {photoProofUrl && (
          <button 
            type="button"
            className="hk-photo-audit-btn"
            onClick={() => onViewPhotoProof(room)}
            title="Inspect verified turnover photos"
          >
            <div className="hk-photo-audit-left">
              <FiCamera size={13} />
              <span>Verified Dual Photos</span>
            </div>
            <span className="hk-photo-audit-link">View Proof <FiArrowUpRight size={11} /></span>
          </button>
        )}

        {/* SOP CHECKLIST PROGRESS BADGE */}
        {checklist && (
          <div className="hk-checklist-tag">
            <FiCheckSquare size={12} color="#16a34a" />
            <span>SOP Checklist: <strong>{completedChecklistCount}/{totalChecklistCount}</strong> Items Verified</span>
          </div>
        )}

        {/* MAINTENANCE DEFECT ALERT */}
        {maintenanceIssue && (
          <div className="hk-defect-alert">
            <FiTool size={12} />
            <div className="hk-defect-info">
              <strong>Defect ({maintenanceSeverity || 'MODERATE'}):</strong> {maintenanceIssue}
            </div>
          </div>
        )}
      </div>

      {/* 3. CARD ACTIONS FOOTER */}
      <footer className="hk-card-actions">
        <button
          type="button"
          className="hk-btn-act hk-btn-act-primary"
          onClick={() => onOpenUpdate(room)}
        >
          <FiCheckCircle size={13} /> Update / Clean
        </button>

        <button
          type="button"
          className="hk-btn-act hk-btn-act-secondary"
          onClick={() => onOpenMaintenance(room)}
          title="Report room defect or resolve maintenance"
        >
          <FiTool size={13} /> Maintenance
        </button>
      </footer>
    </article>
  );
}
