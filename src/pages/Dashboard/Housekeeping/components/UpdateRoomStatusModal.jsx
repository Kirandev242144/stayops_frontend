import React, { useState, useEffect } from 'react';
import { 
  FiX, 
  FiCheck, 
  FiCamera, 
  FiAlertTriangle, 
  FiTrash2, 
  FiUser,
  FiZap,
  FiPlus,
  FiClock
} from 'react-icons/fi';
import { LuBedDouble, LuShowerHead } from 'react-icons/lu';

// Standard 2 presets as requested
const DEFAULT_PRESET_SOP = [
  'Fresh bed linens, mattress protector & pillow covers replaced',
  'Bathroom sanitized, scrubbed & floor dried'
];

export default function UpdateRoomStatusModal({
  isOpen,
  room,
  teamMembers = [],
  onClose,
  onSubmit
}) {
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [checklistItems, setChecklistItems] = useState([]);
  const [newText, setNewText] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Mandatory Dual Photos
  const [bedroomPhoto, setBedroomPhoto] = useState('');
  const [bathroomPhoto, setBathroomPhoto] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load state when room or modal opens
  useEffect(() => {
    if (room && isOpen) {
      const initialStatus = room.cleaningStatus || room.rawHkRecord?.status || 'DIRTY';
      const isDirtyTurnover = initialStatus === 'DIRTY' || room.cleaningStatus === 'DIRTY' || room.isCheckedOutToday;

      setAssignedTo(room.assignedTo || room.rawHkRecord?.assignedTo || '');
      setNotes(room.notes || room.rawHkRecord?.notes || '');

      const propId = room.propertyId || '1';
      const storageKey = `stayops_hk_min_checklist_${propId}`;

      // 1. Initialize Checklist (Default to 2 presets, or restore user's saved tasks)
      let customTpl = null;
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            customTpl = parsed.filter(t => t && String(t).trim());
          }
        }
      } catch {}

      let currentChecklist = room.checklist || room.rawHkRecord?.checklistJson;
      if (typeof currentChecklist === 'string') {
        try {
          currentChecklist = JSON.parse(currentChecklist);
        } catch {}
      }

      const templateTexts = (customTpl && customTpl.length > 0) 
        ? customTpl 
        : DEFAULT_PRESET_SOP;

      if (!isDirtyTurnover && Array.isArray(currentChecklist) && currentChecklist.length > 0) {
        // Restore existing in-progress/clean tasks
        const valid = currentChecklist
          .filter(c => c && (c.text || String(c)).trim())
          .map((item, idx) => ({
            id: item.id || `task-${idx}-${Date.now()}`,
            text: (item.text || String(item)).trim(),
            completed: Boolean(item.completed)
          }));
        setChecklistItems(valid.length > 0 ? valid : templateTexts.map((text, idx) => ({
          id: `preset-${idx + 1}`,
          text,
          completed: false
        })));
      } else {
        // New turnover: start fresh with the 2 presets (or property's saved template) all unchecked
        setChecklistItems(templateTexts.map((text, idx) => ({
          id: `preset-${idx + 1}`,
          text,
          completed: false
        })));
      }

      // 2. Parse photos (only retain photos if room is clean/inspected, never for dirty checkout turnover)
      const currentPhotoProof = isDirtyTurnover ? null : (room.photoProofUrl || room.rawHkRecord?.photoProofUrl);
      if (currentPhotoProof) {
        try {
          const parsed = typeof currentPhotoProof === 'string' ? JSON.parse(currentPhotoProof) : currentPhotoProof;
          if (parsed && typeof parsed === 'object') {
            setBedroomPhoto(parsed.bedroom || '');
            setBathroomPhoto(parsed.bathroom || '');
          } else {
            setBedroomPhoto(String(currentPhotoProof));
            setBathroomPhoto('');
          }
        } catch {
          setBedroomPhoto(String(currentPhotoProof));
          setBathroomPhoto('');
        }
      } else {
        setBedroomPhoto('');
        setBathroomPhoto('');
      }

      setShowAdd(false);
      setNewText('');
      setError('');
    }
  }, [room, isOpen]);

  if (!isOpen || !room) return null;

  // Toggle item completion
  const handleToggle = (id) => {
    setChecklistItems(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  // Add task easily
  const handleAddTask = (e) => {
    e?.preventDefault();
    const trimmed = newText.trim();
    if (!trimmed) return;

    const newItem = {
      id: `custom-${Date.now()}`,
      text: trimmed,
      completed: false
    };

    const updated = [...checklistItems, newItem];
    setChecklistItems(updated);
    setNewText('');
    setShowAdd(false);

    // Save customized list for property
    const propId = room.propertyId || '1';
    try {
      localStorage.setItem(`stayops_hk_min_checklist_${propId}`, JSON.stringify(updated.map(i => i.text)));
    } catch {}
  };

  // Delete task easily
  const handleDeleteTask = (id, e) => {
    e?.stopPropagation();
    const updated = checklistItems.filter(item => item.id !== id);
    setChecklistItems(updated);

    const propId = room.propertyId || '1';
    try {
      localStorage.setItem(`stayops_hk_min_checklist_${propId}`, JSON.stringify(updated.map(i => i.text)));
    } catch {}
  };

  // Photo Upload Handler
  const handlePhotoUpload = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === 'bedroom') {
        setBedroomPhoto(event.target.result);
      } else if (target === 'bathroom') {
        setBathroomPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Validation
  const totalCount = checklistItems.length;
  const completedCount = checklistItems.filter(i => i.completed).length;
  const isAllChecklistDone = totalCount > 0 && completedCount === totalCount;
  const hasBothPhotos = Boolean(bedroomPhoto && bathroomPhoto);
  const isReady = isAllChecklistDone && hasBothPhotos;
  const isUrgent = Boolean(room.isUrgentTurnover || room.priority === 'URGENT' || room.priority === 'RUSH');

  // Automatic Status Representation
  let statusText = 'Needs cleaning';
  let statusClass = 'hk-min-status-dirty';

  if (room.cleaningStatus === 'CLEAN' && isReady) {
    statusText = 'Clean & Ready';
    statusClass = 'hk-min-status-ready';
  } else if (isReady) {
    statusText = 'Ready to Mark Clean';
    statusClass = 'hk-min-status-ready';
  } else if (completedCount > 0 || bedroomPhoto || bathroomPhoto || room.cleaningStatus === 'IN_PROGRESS') {
    statusText = 'In Progress';
    statusClass = 'hk-min-status-progress';
  }

  // Primary: Mark Room as Ready
  const handleMarkAsReady = async () => {
    if (!isReady) {
      if (!isAllChecklistDone) {
        setError(`Checklist Incomplete: All ${totalCount} tasks must be checked (${completedCount}/${totalCount} completed).`);
        return;
      }
      if (!hasBothPhotos) {
        setError('Both Bedroom and Bathroom photos must be uploaded before marking Ready.');
        return;
      }
    }

    setIsSubmitting(true);
    setError('');
    try {
      const photoPayload = JSON.stringify({ bedroom: bedroomPhoto, bathroom: bathroomPhoto });
      await onSubmit({
        propertyId: room.propertyId,
        roomId: room.name || room.rawId || room.id,
        roomName: room.name,
        rawId: room.rawId,
        unitId: room.id,
        status: 'CLEAN',
        taskType: 'TURNOVER',
        priority: isUrgent ? 'URGENT' : 'NORMAL',
        assignedTo: assignedTo || null,
        notes: (notes && !notes.toLowerCase().includes('turnover required')) ? notes : 'Turnover completed with verified photo proof',
        checklist: checklistItems,
        photoUrl: photoPayload
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to mark room ready.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Secondary: Save In-Progress Cleaning
  const handleSaveProgress = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const hasAnyPhoto = Boolean(bedroomPhoto || bathroomPhoto);
      const photoPayload = hasBothPhotos
        ? JSON.stringify({ bedroom: bedroomPhoto, bathroom: bathroomPhoto })
        : (bedroomPhoto || bathroomPhoto || null);

      const nextStatus = (completedCount > 0 || hasAnyPhoto) ? 'IN_PROGRESS' : 'DIRTY';

      await onSubmit({
        propertyId: room.propertyId,
        roomId: room.name || room.rawId || room.id,
        roomName: room.name,
        rawId: room.rawId,
        unitId: room.id,
        status: nextStatus,
        taskType: 'TURNOVER',
        priority: isUrgent ? 'URGENT' : 'NORMAL',
        assignedTo: assignedTo || null,
        notes,
        checklist: checklistItems,
        photoUrl: photoPayload
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save cleaning progress.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="hk-modal-backdrop" onClick={onClose}>
      <div className="hk-min-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* COMPACT MINIMALIST HEADER */}
        <header className="hk-min-header">
          <div className="hk-min-title-group">
            <div className="hk-min-title-row">
              <h3 className="hk-min-title">House Cleaning</h3>
              <span className={`hk-min-status-tag ${statusClass}`}>
                {statusText}
              </span>
              {isUrgent && (
                <span className="hk-min-urgent-tag">
                  <FiZap size={10} /> Today's Arrival
                </span>
              )}
            </div>
            <span className="hk-min-room-sub">
              {room.name} Room &bull; {room.propertyName}
            </span>
          </div>

          <button type="button" className="hk-modal-close" onClick={onClose} aria-label="Close modal">
            <FiX size={17} />
          </button>
        </header>

        {/* MODAL CONTENT */}
        <div className="hk-min-body">
          {error && (
            <div className="hk-modal-alert">
              <FiAlertTriangle size={14} />
              <span>{error}</span>
            </div>
          )}

          {/* CARETAKER INLINE SELECTOR */}
          <div className="hk-min-caretaker-row">
            <span className="hk-min-caretaker-lbl">
              <FiUser size={13} /> Caretaker
            </span>
            <select
              className="hk-min-caretaker-select"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
            >
              <option value="">Unassigned</option>
              {teamMembers.map(m => (
                <option key={m.id} value={m.name}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* CHECKLIST (2 PRESETS BY DEFAULT + EASY ADD & DELETE) */}
          <div className="hk-min-checklist-section">
            <div className="hk-min-checklist-head">
              <span className="hk-min-sec-title">
                Checklist 
                <span className={`hk-min-counter-pill ${isAllChecklistDone ? 'all-done' : ''}`}>
                  {completedCount}/{totalCount}
                </span>
              </span>

              <button
                type="button"
                className="hk-min-add-btn"
                onClick={() => setShowAdd(prev => !prev)}
              >
                <FiPlus size={12} /> Add item
              </button>
            </div>

            <div className="hk-min-list">
              {checklistItems.map((item, idx) => (
                <div 
                  key={item.id} 
                  className={`hk-min-item ${item.completed ? 'is-done' : ''}`}
                  onClick={() => handleToggle(item.id)}
                >
                  <div className="hk-min-item-left">
                    <div className={`hk-min-checkbox ${item.completed ? 'checked' : ''}`}>
                      {item.completed && <FiCheck size={12} />}
                    </div>
                    <span className="hk-min-item-text">
                      {item.text}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="hk-min-del-btn"
                    onClick={(e) => handleDeleteTask(item.id, e)}
                    title="Delete item"
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}

              {/* INLINE EASY ADD INPUT */}
              {showAdd && (
                <div className="hk-min-inline-add">
                  <input
                    type="text"
                    className="hk-min-inline-input"
                    placeholder="Type task and press Enter..."
                    value={newText}
                    onChange={(e) => setNewText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTask(e)}
                    autoFocus
                  />
                  <button
                    type="button"
                    className="hk-min-btn-add-confirm"
                    onClick={handleAddTask}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="hk-min-btn-add-cancel"
                    onClick={() => {
                      setShowAdd(false);
                      setNewText('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* DUAL PHOTO EVIDENCE (COMPACT 2 CARDS) */}
          <div className="hk-min-photos-section">
            <div className="hk-min-checklist-head">
              <span className="hk-min-sec-title">
                Photo Proof <span className="hk-req-star">*</span>
              </span>
              <span className="hk-photos-sub">
                {(bedroomPhoto ? 1 : 0) + (bathroomPhoto ? 1 : 0)}/2
              </span>
            </div>

            <div className="hk-min-photo-grid">
              {/* BEDROOM */}
              <div className={`hk-min-photo-card ${bedroomPhoto ? 'has-photo' : ''}`}>
                <div className="hk-min-photo-card-head">
                  <span className="hk-slot-label-group">
                    <LuBedDouble size={14} /> Bedroom
                  </span>
                </div>

                {bedroomPhoto ? (
                  <div className="hk-min-preview-wrap">
                    <img src={bedroomPhoto} alt="Bedroom proof" className="hk-min-preview-img" />
                    <button 
                      type="button" 
                      className="hk-min-retake-btn" 
                      onClick={() => setBedroomPhoto('')}
                    >
                      <FiTrash2 size={10} /> Retake
                    </button>
                  </div>
                ) : (
                  <label className="hk-min-photo-dropzone">
                    <FiCamera size={18} />
                    <span>Take / Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoUpload(e, 'bedroom')}
                      className="hk-file-input-hidden"
                    />
                  </label>
                )}
              </div>

              {/* BATHROOM */}
              <div className={`hk-min-photo-card ${bathroomPhoto ? 'has-photo' : ''}`}>
                <div className="hk-min-photo-card-head">
                  <span className="hk-slot-label-group">
                    <LuShowerHead size={14} /> Bathroom
                  </span>
                </div>

                {bathroomPhoto ? (
                  <div className="hk-min-preview-wrap">
                    <img src={bathroomPhoto} alt="Bathroom proof" className="hk-min-preview-img" />
                    <button 
                      type="button" 
                      className="hk-min-retake-btn" 
                      onClick={() => setBathroomPhoto('')}
                    >
                      <FiTrash2 size={10} /> Retake
                    </button>
                  </div>
                ) : (
                  <label className="hk-min-photo-dropzone">
                    <FiCamera size={18} />
                    <span>Take / Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(e) => handlePhotoUpload(e, 'bathroom')}
                      className="hk-file-input-hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* NOTES (OPTIONAL COMPACT) */}
          <div className="hk-field">
            <input
              type="text"
              className="hk-field-input"
              placeholder="Notes / instructions (optional)..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ fontSize: '12px', padding: '6px 10px' }}
            />
          </div>
        </div>

        {/* MINIMAL FOOTER */}
        <footer className="hk-min-footer">
          <button
            type="button"
            className="hk-btn-text"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="hk-btn hk-btn-secondary"
              onClick={handleSaveProgress}
              disabled={isSubmitting}
              style={{ fontSize: '12px', padding: '6px 12px' }}
            >
              Save
            </button>

            <button
              type="button"
              className="hk-min-btn-ready"
              onClick={handleMarkAsReady}
              disabled={isSubmitting || !isReady}
              title={!isReady ? 'Check all items & upload both photos to mark Ready' : 'Mark Clean & Ready'}
            >
              <FiCheck size={14} />
              <span>{isSubmitting ? 'Saving...' : 'Mark as Ready'}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
