import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiRefreshCw, 
  FiPlus, 
  FiCheckSquare,
  FiHome,
  FiTool,
  FiArrowLeft
} from 'react-icons/fi';
import { 
  loadHousekeepingHubData, 
  updateRoomCleaningStatus, 
  reportRoomMaintenance, 
  resolveRoomMaintenance 
} from './housekeepingService';
import HousekeepingStats from './components/HousekeepingStats';
import HousekeepingFilters from './components/HousekeepingFilters';
import RoomCard from './components/RoomCard';
import RoomOperationsTable from './components/RoomOperationsTable';
import UpdateRoomStatusModal from './components/UpdateRoomStatusModal';
import MaintenanceModal from './components/MaintenanceModal';
import PhotoAuditModal from './components/PhotoAuditModal';
import { useWebSocketContext } from '../../../context/WebSocketContext';
import { toast } from 'react-toastify';
import './Housekeeping.css';

export default function Housekeeping({ onBack }) {
  const { subscribe } = useWebSocketContext();

  const [properties, setProperties] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & View Mode
  const [selectedPropertyId, setSelectedPropertyId] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal Targets
  const [activeUpdateRoom, setActiveUpdateRoom] = useState(null);
  const [activeMaintenanceRoom, setActiveMaintenanceRoom] = useState(null);
  const [activePhotoAuditRoom, setActivePhotoAuditRoom] = useState(null);

  // 1. Load Data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setError(null);
    try {
      const data = await loadHousekeepingHubData(selectedPropertyId);
      setProperties(data.properties || []);
      setRooms(data.rooms || []);
      setTeamMembers(data.teamMembers || []);
    } catch (err) {
      console.error('Failed to load housekeeping data:', err);
      setError('Could not load housekeeping data. Please check connection.');
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedPropertyId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 2. Real-time WebSocket Listeners
  useEffect(() => {
    const unsubHk = subscribe('HOUSEKEEPING', () => {
      loadData(true);
    });

    const unsubFrontdesk = subscribe('FRONTDESK', (msg) => {
      if (msg?.event === 'RESERVATION_CHECKED_OUT' || msg?.event === 'RESERVATION_CHECKED_IN') {
        loadData(true);
      }
    });

    return () => {
      if (unsubHk) unsubHk();
      if (unsubFrontdesk) unsubFrontdesk();
    };
  }, [subscribe, loadData]);

  // 3. Computed KPI Stats (Accurate to Hotel Operational Reality)
  const stats = useMemo(() => {
    let readyForCheckin = 0;
    let dirty = 0;
    let inProgress = 0;
    let outOfOrder = 0;
    let urgentTurnovers = 0;

    rooms.forEach(r => {
      const st = r.cleaningStatus;
      if (st === 'OUT_OF_ORDER' || r.maintenanceIssue) {
        outOfOrder++;
      } else if (st === 'IN_PROGRESS') {
        inProgress++;
      } else if (r.isReadyForCheckin) {
        readyForCheckin++;
      } else if (st === 'DIRTY') {
        dirty++;
      } else if (st === 'CLEAN' || st === 'INSPECTED') {
        // Clean but occupied (stayover clean)
        readyForCheckin++;
      } else {
        dirty++;
      }

      if (r.isUrgentTurnover) urgentTurnovers++;
    });

    return {
      total: rooms.length,
      readyForCheckin,
      dirty,
      inProgress,
      outOfOrder,
      urgentTurnovers
    };
  }, [rooms]);

  // 4. Filtered Room List
  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'OUT_OF_ORDER') {
          if (room.cleaningStatus !== 'OUT_OF_ORDER' && !room.maintenanceIssue) return false;
        } else if (statusFilter === 'READY') {
          if (!room.isReadyForCheckin && room.cleaningStatus !== 'CLEAN' && room.cleaningStatus !== 'INSPECTED') return false;
        } else if (statusFilter === 'DIRTY') {
          if (room.cleaningStatus !== 'DIRTY') return false;
        } else if (statusFilter === 'IN_PROGRESS') {
          if (room.cleaningStatus !== 'IN_PROGRESS') return false;
        } else if (room.cleaningStatus !== statusFilter) {
          return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (room.name || '').toLowerCase().includes(q);
        const matchesProp = (room.propertyName || '').toLowerCase().includes(q);
        const matchesStaff = (room.assignedTo || '').toLowerCase().includes(q);
        const matchesGuest = (room.currentGuest || '').toLowerCase().includes(q);
        if (!matchesName && !matchesProp && !matchesStaff && !matchesGuest) {
          return false;
        }
      }

      return true;
    });
  }, [rooms, statusFilter, searchQuery]);

  // 5. Handlers
  const handleUpdateStatusSubmit = async (payload) => {
    try {
      await updateRoomCleaningStatus(payload);
      toast.success(`Housekeeping status for ${payload.roomName || payload.roomId} updated successfully!`);
      await loadData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to update room status');
      throw err;
    }
  };

  const handleReportMaintenanceSubmit = async (payload) => {
    try {
      await reportRoomMaintenance(payload);
      toast.success(`Maintenance issue reported for room ${payload.roomId}`);
      await loadData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to report maintenance');
      throw err;
    }
  };

  const handleResolveMaintenanceSubmit = async (payload) => {
    try {
      await resolveRoomMaintenance(payload);
      toast.success(`Maintenance resolved for room ${payload.roomId}`);
      await loadData(true);
    } catch (err) {
      toast.error(err.message || 'Failed to resolve maintenance');
      throw err;
    }
  };

  return (
    <div className="hk-hub-container">
      {/* MINIMALIST HEADER */}
      <header className="hk-header">
        <div className="hk-header-titles">
          <div className="hk-title-row">
            <h1 className="hk-title">Housekeeping</h1>
            
          </div>
          <p className="hk-subtitle">
            Real-time room turnovers, staff task assignments &amp; inspection readiness.
          </p>
        </div>

        <div className="hk-header-actions">
          {onBack && (
            <button
              type="button"
              className="hk-btn hk-btn-secondary"
              onClick={onBack}
              title="Return to Front Desk"
            >
              <FiArrowLeft size={13} />
              <span>Front Desk</span>
            </button>
          )}

          <button
            type="button"
            className="hk-btn hk-btn-secondary"
            onClick={() => loadData(false)}
            title="Refresh room statuses"
          >
            <FiRefreshCw size={13} className={isLoading ? 'ppm-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            className="hk-btn hk-btn-secondary"
            onClick={() => loadData(false)}
            title="Refresh room statuses"
          >
            <FiRefreshCw size={13} className={isLoading ? 'ppm-spin' : ''} />
            <span>Button</span>
          </button>
        </div>
      </header>

      {error && (
        <div className="hk-alert-banner">
          {error}
        </div>
      )}

      {/* KPI METRIC STRIP */}
      <HousekeepingStats
        stats={stats}
        activeFilter={statusFilter}
        onFilterChange={setStatusFilter}
        onUrgentClick={() => setStatusFilter('DIRTY')}
      />

      {/* TOOLBAR CONTROLS */}
      <HousekeepingFilters
        properties={properties}
        selectedPropertyId={selectedPropertyId}
        onPropertyChange={setSelectedPropertyId}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* CONTENT AREA: GRID VS TABLE */}
      {isLoading ? (
        <div className="hk-loading-state">
          Loading real-time room statuses &amp; team assignments...
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className="hk-empty-state">
          <FiHome size={28} className="hk-empty-icon" />
          <div className="hk-empty-title">No Rooms Found</div>
          <div className="hk-empty-desc">
            Try adjusting your property selector or clearing status filters.
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="hk-cards-grid">
          {filteredRooms.map(room => (
            <RoomCard
              key={room.id}
              room={room}
              onOpenUpdate={setActiveUpdateRoom}
              onOpenMaintenance={setActiveMaintenanceRoom}
              onViewPhotoProof={setActivePhotoAuditRoom}
            />
          ))}
        </div>
      ) : (
        <RoomOperationsTable
          rooms={filteredRooms}
          onOpenUpdate={setActiveUpdateRoom}
          onOpenMaintenance={setActiveMaintenanceRoom}
          onViewPhotoProof={setActivePhotoAuditRoom}
        />
      )}

      {/* OVERLAY MODALS */}
      <UpdateRoomStatusModal
        isOpen={Boolean(activeUpdateRoom)}
        room={activeUpdateRoom}
        teamMembers={teamMembers}
        onClose={() => setActiveUpdateRoom(null)}
        onSubmit={handleUpdateStatusSubmit}
      />

      <MaintenanceModal
        isOpen={Boolean(activeMaintenanceRoom)}
        room={activeMaintenanceRoom}
        onClose={() => setActiveMaintenanceRoom(null)}
        onSubmitReport={handleReportMaintenanceSubmit}
        onSubmitResolve={handleResolveMaintenanceSubmit}
      />

      <PhotoAuditModal
        isOpen={Boolean(activePhotoAuditRoom)}
        room={activePhotoAuditRoom}
        onClose={() => setActivePhotoAuditRoom(null)}
      />
    </div>
  );
}
