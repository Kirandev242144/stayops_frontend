import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FiRefreshCw, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiCamera, 
  FiCheckSquare, 
  FiArrowLeft,
  FiUploadCloud,
  FiUser,
  FiClock,
  FiFileText,
  FiCheck
} from 'react-icons/fi';
import { fetchProperties } from '../Dashboard/Reservations/propertyApi';
import { fetchReservations } from '../Dashboard/Reservations/reservationApi';
import { 
  fetchHousekeepingStatusesApi, 
  updateHousekeepingStatusApi, 
  uploadHousekeepingProofApi 
} from '../Dashboard/Calendar/calendarApi';
import { fetchPettyCashBalanceApi } from '../Dashboard/PettyCash/pettyCashApi';
import PettyCashExpenseModal from './components/PettyCashExpenseModal';
import { extractRoomsFromProperties } from '../Dashboard/Calendar/utils/calendarUtils';
import { useWebSocketContext } from '../../context/WebSocketContext';
import './CaretakerApp.css';

// Preset sample photo proofs for quick simulation
const PRESET_SAMPLE_PHOTOS = [
  {
    id: 'bed',
    title: 'Fresh Bed Linen',
    url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'bathroom',
    title: 'Sanitized Bathroom',
    url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'room',
    title: 'Full Room Turnover',
    url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80'
  }
];

export default function CaretakerApp() {
  const navigate = useNavigate();
  const { subscribe } = useWebSocketContext();

  const [propertiesList, setPropertiesList] = useState([]);
  const [selectedPropId, setSelectedPropId] = useState('all');
  const [housekeepingMap, setHousekeepingMap] = useState({});
  const [reservationsList, setReservationsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'dirty', 'progress', 'clean'

  // Photo Proof Drawer Modal State
  const [activeUploadRoom, setActiveUploadRoom] = useState(null);
  const [caretakerName, setCaretakerName] = useState('Ramesh (Caretaker)');
  const [cleaningNotes, setCleaningNotes] = useState('Deep cleaned, fresh linens & sanitized amenities');
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState(PRESET_SAMPLE_PHOTOS[0].url);
  const [customFileBase64, setCustomFileBase64] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inspection Checklist State
  const [checklist, setChecklist] = useState({
    linen: true,
    bathroom: true,
    trash: true,
    amenities: true
  });

  // Petty Cash Expense State
  const [pettyBalance, setPettyBalance] = useState(10000);
  const [isPettyModalOpen, setIsPettyModalOpen] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const props = await fetchProperties().catch(() => []);
      const allowedPropIds = (props || []).map(p => String(p.id));

      const [hkMap, resList, pBal] = await Promise.all([
        fetchHousekeepingStatusesApi(selectedPropId, allowedPropIds).catch(() => ({})),
        fetchReservations().catch(() => []),
        fetchPettyCashBalanceApi(selectedPropId, allowedPropIds).catch(() => 10000)
      ]);
      setPropertiesList(props || []);
      setHousekeepingMap(hkMap || {});
      setReservationsList(resList || []);
      setPettyBalance(pBal || 10000);
    } catch (err) {
      console.error("Caretaker app load error:", err);
    } finally {
      if (!isSilent) setIsLoading(false);
    }
  }, [selectedPropId]);

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Handle real-time WebSocket delta events in-memory without extra HTTP requests
  const handleWebSocketMessage = useCallback((msg) => {
    if (!msg || !msg.event) return;
    const { event, data } = msg;

    if (event === "PETTY_CASH_UPDATED") {
      fetchPettyCashBalanceApi(selectedPropId).then(setPettyBalance).catch(() => {});
    } else if (event === "RESERVATION_CREATED" && data && data.id) {
      setReservationsList(prev => {
        const exists = prev.some(r => String(r.id) === String(data.id));
        if (exists) return prev.map(r => String(r.id) === String(data.id) ? { ...r, ...data } : r);
        return [data, ...prev];
      });
    } else if ((event === "RESERVATION_UPDATED" || event === "PAYMENT_UPDATED") && data && data.id) {
      setReservationsList(prev => prev.map(r => String(r.id) === String(data.id) ? { ...r, ...data } : r));
    } else if (event === "RESERVATION_DELETED" && data && data.id) {
      setReservationsList(prev => prev.filter(r => String(r.id) !== String(data.id)));
    } else if ((event === "STATUS_UPDATED" || event === "PROOF_UPLOADED") && data && data.roomId) {
      const roomKey = String(data.roomId).trim();
      const nextStatus = data.status || 'CLEAN';

      setHousekeepingMap(prev => ({
        ...prev,
        [roomKey]: {
          status: nextStatus,
          photoProofUrl: data.photoProofUrl || null,
          cleanedBy: data.cleanedBy || null,
          notes: data.notes || null,
          lastCleanedAt: data.lastCleanedAt || null,
          updatedAt: data.updatedAt || null
        }
      }));
    } else {
      loadData(true);
    }
  }, [loadData, selectedPropId]);

  // Real-time WebSocket listener & silent auto-refresh for direct DB edits (e.g. DBeaver)
  useEffect(() => {
    const unsub1 = subscribe("FRONTDESK", handleWebSocketMessage);
    const unsub2 = subscribe("RESERVATIONS", handleWebSocketMessage);
    const unsub3 = subscribe("PETTY_CASH", handleWebSocketMessage);

    const handleFocus = () => loadData(true);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') loadData(true);
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic heartbeat poll (every 30 seconds) as a backup safety net
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') loadData(true);
    }, 30000);

    return () => {
      unsub1();
      unsub2();
      unsub3();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(intervalId);
    };
  }, [subscribe, loadData, handleWebSocketMessage]);

  const allRooms = extractRoomsFromProperties(propertiesList, selectedPropId);

  // Helper to look up room housekeeping entry using candidate keys
  const getRoomHkEntry = useCallback((room) => {
    if (!room) return null;
    const nameKey = String(room.name || '').trim();
    const cleanNameKey = nameKey.split('—')[0].split('-')[0].trim();
    const idKey = String(room.id || '').trim();
    const rawIdKey = room.rawId !== undefined ? String(room.rawId).trim() : '';
    const propIdKey = room.propertyId ? String(room.propertyId).trim() : '1';

    const candidateKeys = [
      nameKey,
      cleanNameKey,
      idKey,
      `${propIdKey}-${idKey}`,
      `${propIdKey}-${nameKey}`,
      `${propIdKey}-${cleanNameKey}`,
      rawIdKey,
      `${propIdKey}-${rawIdKey}`
    ].filter(Boolean);

    // 1. Prioritize verified CLEAN entry with photoProofUrl
    for (const k of candidateKeys) {
      const entry = housekeepingMap[k] || housekeepingMap[k.toLowerCase()];
      if (entry && typeof entry === 'object' && String(entry.status).toUpperCase() === 'CLEAN' && entry.photoProofUrl) {
        return entry;
      }
    }

    // 2. Otherwise return first matching entry
    for (const k of candidateKeys) {
      const entry = housekeepingMap[k] || housekeepingMap[k.toLowerCase()];
      if (entry) return entry;
    }
    return null;
  }, [housekeepingMap]);

  const getRoomStatus = useCallback((room) => {
    const entry = getRoomHkEntry(room);
    if (entry && typeof entry === 'object' && entry.status) {
      return entry.status.toUpperCase();
    }
    if (typeof entry === 'string') {
      return entry.toUpperCase();
    }

    // Fallback: Check if there is any checked-out reservation for this room without photo proof
    if (room && reservationsList.length > 0) {
      const roomName = String(room.name || '').toLowerCase().trim();
      const roomCleanName = roomName.split('—')[0].split('-')[0].trim();
      const roomId = String(room.id || '').toLowerCase().trim();
      const propIdStr = room.propertyId ? String(room.propertyId).trim() : '';

      const hasCheckedOutGuest = reservationsList.some(r => {
        const status = String(r.status || '').toLowerCase();
        if (!status.includes('checkout') && !status.includes('check_out') && !status.includes('checked out') && !status.includes('completed')) {
          return false;
        }
        if (propIdStr && r.propertyId && String(r.propertyId).trim() !== propIdStr) {
          return false;
        }
        const unit = String(r.roomUnit || r.unit || '').toLowerCase().trim();
        const unitClean = unit.split('—')[0].split('-')[0].trim();
        return unit === roomName || unitClean === roomCleanName || unit === roomId || unit.includes(roomCleanName);
      });

      if (hasCheckedOutGuest) {
        return 'DIRTY';
      }
    }

    return 'CLEAN';
  }, [getRoomHkEntry, reservationsList]);

  // Status Action: Mark In-Progress
  const handleStartCleaning = async (room) => {
    const roomKey = String(room.name || room.id).trim();
    const cleanName = roomKey.split('—')[0].split('-')[0].trim();
    const allowedPropIds = (propertiesList || []).map(p => String(p.id));
    const propId = room.propertyId || (propertiesList[0]?.id || null);

    try {
      await updateHousekeepingStatusApi(roomKey, 'IN_PROGRESS', 'Caretaker started cleaning turnover', propId, allowedPropIds);
      if (cleanName && cleanName !== roomKey) {
        await updateHousekeepingStatusApi(cleanName, 'IN_PROGRESS', 'Caretaker started cleaning turnover', propId, allowedPropIds).catch(() => {});
      }
      const inProgObj = { status: 'IN_PROGRESS' };

      setHousekeepingMap(prev => ({
        ...prev,
        [roomKey]: inProgObj,
        [cleanName]: inProgObj,
        [String(room.id)]: inProgObj
      }));
    } catch (err) {
      console.error("Error starting cleaning:", err);
    }
  };

  // Custom File Upload Handler
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCustomFileBase64(reader.result);
        setSelectedPhotoUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Photo Proof & Mark Clean
  const handleSubmitProof = async () => {
    if (!activeUploadRoom) return;
    if (!selectedPhotoUrl && !customFileBase64) {
      alert("📷 Photo Evidence Required!\n\nA room cannot be changed to 'Ready' / 'Clean' unless required photo evidence is provided.");
      return;
    }
    setIsSubmitting(true);
    const roomKey = String(activeUploadRoom.name || activeUploadRoom.id).trim();
    const cleanName = roomKey.split('—')[0].split('-')[0].trim();
    const allowedPropIds = (propertiesList || []).map(p => String(p.id));
    const propId = activeUploadRoom.propertyId || (propertiesList[0]?.id || null);

    try {
      await uploadHousekeepingProofApi({
        propertyId: propId,
        roomId: roomKey,
        photoUrl: selectedPhotoUrl,
        cleanedBy: caretakerName,
        notes: cleaningNotes
      }, allowedPropIds);

      const cleanObj = {
        status: 'CLEAN',
        photoProofUrl: selectedPhotoUrl,
        cleanedBy: caretakerName,
        notes: cleaningNotes,
        lastCleanedAt: new Date().toISOString()
      };

      setHousekeepingMap(prev => ({
        ...prev,
        [roomKey]: cleanObj,
        [cleanName]: cleanObj,
        [String(activeUploadRoom.id)]: cleanObj
      }));

      setActiveUploadRoom(null);
    } catch (err) {
      console.error("Submit proof error:", err);
      alert("Could not upload proof. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Logic
  const filteredRooms = allRooms.filter(room => {
    const status = getRoomStatus(room);

    if (activeFilter === 'dirty') return status === 'DIRTY';
    if (activeFilter === 'progress') return status === 'IN_PROGRESS';
    if (activeFilter === 'clean') return status === 'CLEAN';
    return true;
  });

  // Summary Counts
  const counts = allRooms.reduce((acc, r) => {
    const st = getRoomStatus(r);
    if (st === 'DIRTY') acc.dirty++;
    else if (st === 'IN_PROGRESS') acc.progress++;
    else acc.clean++;
    return acc;
  }, { dirty: 0, progress: 0, clean: 0 });

  return (
    <div className="ct-page">
      {/* MOBILE SIMULATION HEADER */}
      <header className="ct-header">
        <div className="ct-header-left">
          <button className="ct-back-btn" onClick={() => navigate('/dashboard')} title="Back to PMS Desk">
            <FiArrowLeft size={18} />
          </button>
          <div>
            <h1 className="ct-app-title">📱 Caretaker Portal</h1>
            <span className="ct-app-sub">Turnover & Photo-Proof Mobile Simulation</span>
          </div>
        </div>
        <button className="ct-refresh-btn" onClick={() => loadData(false)} title="Refresh statuses">
          <FiRefreshCw size={16} className={isLoading ? 'spinning' : ''} />
        </button>
      </header>

      {/* FILTER BAR & SUMMARY CARDS */}
      <div className="ct-container">
        {/* STATS CARDS */}
        <div className="ct-stats-grid">
          <div className={`ct-stat-card card-dirty ${activeFilter === 'dirty' ? 'active' : ''}`} onClick={() => setActiveFilter(activeFilter === 'dirty' ? 'all' : 'dirty')}>
            <div className="ct-stat-num">{counts.dirty}</div>
            <div className="ct-stat-lbl">🔴 Dirty Rooms</div>
          </div>
          <div className={`ct-stat-card card-progress ${activeFilter === 'progress' ? 'active' : ''}`} onClick={() => setActiveFilter(activeFilter === 'progress' ? 'all' : 'progress')}>
            <div className="ct-stat-num">{counts.progress}</div>
            <div className="ct-stat-lbl">🟡 In Cleaning</div>
          </div>
          <div className={`ct-stat-card card-clean ${activeFilter === 'clean' ? 'active' : ''}`} onClick={() => setActiveFilter(activeFilter === 'clean' ? 'all' : 'clean')}>
            <div className="ct-stat-num">{counts.clean}</div>
            <div className="ct-stat-lbl">🟢 Verified Clean</div>
          </div>
          <div className="ct-stat-card card-petty" onClick={() => setIsPettyModalOpen(true)}>
            <div className="ct-stat-num">₹{pettyBalance.toLocaleString('en-IN')}</div>
            <div className="ct-stat-lbl">Petty Cash (Record Expense)</div>
          </div>
        </div>

        {/* PROPERTY FILTER & TABS */}
        <div className="ct-toolbar">
          <select className="ct-select" value={selectedPropId} onChange={e => setSelectedPropId(e.target.value)}>
            <option value="all">All Properties</option>
            {propertiesList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <div className="ct-tabs">
            <button className={`ct-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>All ({allRooms.length})</button>
            <button className={`ct-tab ${activeFilter === 'dirty' ? 'active' : ''}`} onClick={() => setActiveFilter('dirty')}>Dirty ({counts.dirty})</button>
            <button className={`ct-tab ${activeFilter === 'progress' ? 'active' : ''}`} onClick={() => setActiveFilter('progress')}>Cleaning ({counts.progress})</button>
            <button className={`ct-tab ${activeFilter === 'clean' ? 'active' : ''}`} onClick={() => setActiveFilter('clean')}>Clean ({counts.clean})</button>
          </div>
        </div>

        {/* ROOM CARDS LIST */}
        {isLoading ? (
          <div className="ct-empty-state">
            <FiRefreshCw className="spinning" size={24} />
            <p>Loading rooms & cleaning queue...</p>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="ct-empty-state">
            <FiCheckCircle size={32} style={{ color: '#10B981' }} />
            <p>No rooms found in this category.</p>
          </div>
        ) : (
          <div className="ct-room-grid">
            {filteredRooms.map(room => {
              const entry = getRoomHkEntry(room);
              const status = getRoomStatus(room);
              const proofUrl = (entry && typeof entry === 'object') ? entry.photoProofUrl : null;
              const byWho = (entry && typeof entry === 'object') ? entry.cleanedBy : null;
              const lastCleanedStr = (entry && typeof entry === 'object' && entry.lastCleanedAt) 
                ? new Date(entry.lastCleanedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : null;

              const isDirty = status === 'DIRTY';
              const isProgress = status === 'IN_PROGRESS';
              const isClean = status === 'CLEAN';

              return (
                <div key={room.id} className={`ct-room-card status-border-${status.toLowerCase()}`}>
                  <div className="ct-card-header">
                    <div>
                      <h3 className="ct-room-name">{room.name}</h3>
                      <span className="ct-room-prop">{room.propertyName || 'Property'} • {room.category}</span>
                    </div>
                    <span className={`ct-status-badge st-${status.toLowerCase()}`}>
                      {isDirty && <><FiAlertCircle /> Dirty</>}
                      {isProgress && <><FiRefreshCw className="spinning" /> Cleaning</>}
                      {isClean && <><FiCheckCircle /> Clean</>}
                    </span>
                  </div>

                  {/* ROOM DETAILS & PROOF PREVIEW IF CLEAN */}
                  {isClean && proofUrl && (
                    <div className="ct-proof-preview-box">
                      <img src={proofUrl} alt="Cleaning Proof" className="ct-proof-img-thumb" />
                      <div className="ct-proof-meta">
                        <span className="ct-meta-line"><FiUser /> {byWho || 'Caretaker'}</span>
                        {lastCleanedStr && <span className="ct-meta-line"><FiClock /> {lastCleanedStr}</span>}
                        <span className="ct-meta-tag"><FiCheck /> Verified Photo Proof</span>
                      </div>
                    </div>
                  )}

                  {/* ACTIONS */}
                  <div className="ct-card-actions">
                    {isDirty && (
                      <button className="ct-btn ct-btn-progress" onClick={() => handleStartCleaning(room)}>
                        <FiRefreshCw /> Start Cleaning
                      </button>
                    )}

                    {(isDirty || isProgress) && (
                      <button className="ct-btn ct-btn-camera" onClick={() => setActiveUploadRoom(room)}>
                        <FiCamera /> Take Photo Proof & Mark Clean
                      </button>
                    )}

                    {isClean && (
                      <button className="ct-btn ct-btn-outline" onClick={() => setActiveUploadRoom(room)}>
                        <FiCamera /> Re-Inspect / Update Photo
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PHOTO PROOF UPLOAD DRAWER MODAL */}
      {activeUploadRoom && (
        <div className="ct-modal-overlay" onClick={() => setActiveUploadRoom(null)}>
          <div className="ct-modal-drawer" onClick={e => e.stopPropagation()}>
            <div className="ct-modal-header">
              <h3>📷 Submit Photo Proof: {activeUploadRoom.name}</h3>
              <button className="ct-close-btn" onClick={() => setActiveUploadRoom(null)}>✕</button>
            </div>

            <div className="ct-modal-body">
              {/* CARETAKER INFO */}
              <div className="ct-form-group">
                <label className="ct-label"><FiUser /> Caretaker / Staff Name *</label>
                <input
                  type="text"
                  className="ct-input"
                  value={caretakerName}
                  onChange={e => setCaretakerName(e.target.value)}
                  placeholder="e.g. Ramesh Dev"
                />
              </div>

              {/* INSPECTION CHECKLIST */}
              <div className="ct-form-group">
                <label className="ct-label"><FiCheckSquare /> Cleaning Inspection Checklist</label>
                <div className="ct-checklist-grid">
                  <label className="ct-check-item">
                    <input type="checkbox" checked={checklist.linen} onChange={e => setChecklist(prev => ({ ...prev, linen: e.target.checked }))} />
                    <span>Fresh Linen & Bedding</span>
                  </label>
                  <label className="ct-check-item">
                    <input type="checkbox" checked={checklist.bathroom} onChange={e => setChecklist(prev => ({ ...prev, bathroom: e.target.checked }))} />
                    <span>Sanitized Bathroom</span>
                  </label>
                  <label className="ct-check-item">
                    <input type="checkbox" checked={checklist.trash} onChange={e => setChecklist(prev => ({ ...prev, trash: e.target.checked }))} />
                    <span>Trash Emptied</span>
                  </label>
                  <label className="ct-check-item">
                    <input type="checkbox" checked={checklist.amenities} onChange={e => setChecklist(prev => ({ ...prev, amenities: e.target.checked }))} />
                    <span>Towels & Soap Replaced</span>
                  </label>
                </div>
              </div>

              {/* PHOTO PROOF SELECTOR */}
              <div className="ct-form-group">
                <label className="ct-label"><FiCamera /> Select Inspection Photo Proof</label>
                
                {/* PRESET SAMPLES */}
                <div className="ct-preset-grid">
                  {PRESET_SAMPLE_PHOTOS.map(p => (
                    <div
                      key={p.id}
                      className={`ct-preset-card ${selectedPhotoUrl === p.url ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedPhotoUrl(p.url);
                        setCustomFileBase64(null);
                      }}
                    >
                      <img src={p.url} alt={p.title} />
                      <span>{p.title}</span>
                    </div>
                  ))}
                </div>

                {/* CUSTOM FILE UPLOAD OPTION */}
                <div style={{ marginTop: 10 }}>
                  <label className="ct-upload-file-btn">
                    <FiUploadCloud size={16} /> Snap / Upload Custom Photo from Device
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              {/* PREVIEW DISPLAY */}
              {selectedPhotoUrl && (
                <div className="ct-preview-container">
                  <span className="ct-preview-lbl">Selected Inspection Photo Preview:</span>
                  <img src={selectedPhotoUrl} alt="Inspection Preview" className="ct-preview-img" />
                </div>
              )}

              {/* NOTES */}
              <div className="ct-form-group" style={{ marginTop: 12 }}>
                <label className="ct-label"><FiFileText /> Cleaning Notes (Optional)</label>
                <textarea
                  className="ct-textarea"
                  rows={2}
                  value={cleaningNotes}
                  onChange={e => setCleaningNotes(e.target.value)}
                />
              </div>
            </div>

            <div className="ct-modal-footer">
              <button className="ct-btn-cancel" onClick={() => setActiveUploadRoom(null)}>Cancel</button>
              <button className="ct-btn-submit" onClick={handleSubmitProof} disabled={isSubmitting}>
                {isSubmitting ? 'Uploading...' : '✓ Submit Photo Proof & Mark Clean'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PETTY CASH EXPENSE MODAL */}
      <PettyCashExpenseModal
        isOpen={isPettyModalOpen}
        onClose={() => setIsPettyModalOpen(false)}
        propertiesList={propertiesList}
        defaultPropertyId={propertiesList[0]?.id || ''}
        currentBalance={pettyBalance}
        onExpenseRecorded={(res) => {
          setPettyBalance(res.newBalance);
        }}
      />
    </div>
  );
}
