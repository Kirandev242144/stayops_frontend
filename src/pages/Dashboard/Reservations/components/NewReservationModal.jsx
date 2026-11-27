import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  FiX,
  FiDollarSign,
  FiClock,
  FiZap,
  FiCheckCircle,
  FiAlertTriangle,
  FiSmile,
  FiArrowLeft,
  FiArrowRight,
  FiCheck,
  FiAlertCircle,
  FiPlus,
  FiTrash2,
  FiFileText,
  FiEye,
  FiUploadCloud,
  FiSmartphone
} from 'react-icons/fi';
import { BOOKING_SOURCES } from '../constants';
import { formatTime12Hr } from '../../../../utils/timeFormat';
import { getRoomEffectiveRate } from '../utils/reservationPricing';
import { suggestOptimalRooms } from '../utils/roomSuggestion';
import { getRoomCapacity, calculateRoomsTotalCapacity, formatRoomCapacityLabel } from '../utils/roomCapacity';
import { getOccupiedRoomNames } from '../utils/reservationOccupancy';
import { uploadGuestDocument } from '../guestApi';
import MobileIdRequestModal from './MobileIdRequestModal';

/* ==========================================================================
   SUB-COMPONENTS FOR FORM SECTIONS
   ========================================================================== */

const ID_DOCUMENT_TYPES = [
  'Aadhaar Card',
  'Passport',
  'Driving License',
  'Voter ID',
  'PAN Card',
  'Other'
];

function GuestDetailsSection({ reservationForm, updateForm, propertyName, propertyId }) {
  const [selectedIdType, setSelectedIdType] = useState('Aadhaar Card');
  const [idNumberInput, setIdNumberInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const fileInputRef = useRef(null);

  const idDocuments = Array.isArray(reservationForm.idDocuments) ? reservationForm.idDocuments : [];

  const handleMobileIdReceived = (data) => {
    if (data.documents && Array.isArray(data.documents) && data.documents.length > 0) {
      const updatedDocs = [...idDocuments, ...data.documents];
      updateForm('idDocuments', updatedDocs);
      if (data.idType) updateForm('idType', data.idType);
      if (data.idNumber) updateForm('idNumber', data.idNumber);
      if (data.documentUrl) updateForm('idDocumentUrl', data.documentUrl);
    } else if (data.documentUrl) {
      const newDoc = {
        id: Date.now(),
        idType: data.idType || selectedIdType || 'Aadhaar Card',
        idNumber: data.idNumber || idNumberInput.trim() || '',
        documentName: `${data.idType || 'ID'} (Mobile Upload)`,
        documentUrl: data.documentUrl,
        uploadedAt: new Date().toISOString()
      };
      const updatedDocs = [...idDocuments, newDoc];
      updateForm('idDocuments', updatedDocs);
      updateForm('idType', newDoc.idType);
      if (newDoc.idNumber) updateForm('idNumber', newDoc.idNumber);
      updateForm('idDocumentUrl', data.documentUrl);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const dataUri = uploadEvent.target.result;
      let finalUrl = dataUri;

      try {
        const uploadRes = await uploadGuestDocument(file);
        if (uploadRes && uploadRes.url) {
          finalUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn("Backend document upload endpoint error, using local data URI:", err);
      }

      const newDoc = {
        id: Date.now(),
        idType: selectedIdType,
        idNumber: idNumberInput.trim() || reservationForm.idNumber || '',
        documentName: file.name,
        documentUrl: finalUrl,
        uploadedAt: new Date().toISOString()
      };

      const updatedDocs = [...idDocuments, newDoc];
      updateForm('idDocuments', updatedDocs);
      updateForm('idType', selectedIdType);
      if (newDoc.idNumber) {
        updateForm('idNumber', newDoc.idNumber);
      }
      updateForm('idDocumentUrl', finalUrl);

      setIsUploading(false);
      setIdNumberInput('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    };

    reader.onerror = () => {
      setIsUploading(false);
      alert("Could not read file. Please try again.");
    };

    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (index) => {
    const updatedDocs = idDocuments.filter((_, i) => i !== index);
    updateForm('idDocuments', updatedDocs);
    if (updatedDocs.length > 0) {
      updateForm('idType', updatedDocs[0].idType);
      updateForm('idNumber', updatedDocs[0].idNumber || '');
      updateForm('idDocumentUrl', updatedDocs[0].documentUrl || '');
    } else {
      updateForm('idType', 'Aadhaar Card');
      updateForm('idNumber', '');
      updateForm('idDocumentUrl', '');
    }
  };

  return (
    <div className="nwr-section">
      <div className="nwr-section-label">Guest Details</div>
      
      {/* Name and Phone */}
      <div className="nwr-row-2">
        <div className="nwr-field">
          <label className="nwr-label">Full Name *</label>
          <input
            type="text"
            className="nwr-input"
            placeholder="e.g. Kiran Dev"
            value={reservationForm.guestName || ''}
            onChange={e => updateForm('guestName', e.target.value)}
          />
        </div>
        <div className="nwr-field">
          <label className="nwr-label">WhatsApp Number *</label>
          <input
            type="tel"
            className="nwr-input"
            placeholder="e.g. 9876543210"
            value={reservationForm.guestPhone || ''}
            onChange={e => updateForm('guestPhone', e.target.value)}
          />
        </div>
      </div>

      {/* City and State */}
      <div className="nwr-row-2">
        <div className="nwr-field">
          <label className="nwr-label">City <span className="nwr-optional">(Optional)</span></label>
          <input
            type="text"
            className="nwr-input"
            placeholder="e.g. Bangalore"
            value={reservationForm.guestCity || ''}
            onChange={e => updateForm('guestCity', e.target.value)}
          />
        </div>
        <div className="nwr-field">
          <label className="nwr-label">State <span className="nwr-optional">(Optional)</span></label>
          <input
            type="text"
            className="nwr-input"
            placeholder="e.g. Karnataka"
            value={reservationForm.guestState || ''}
            onChange={e => updateForm('guestState', e.target.value)}
          />
        </div>
      </div>

      {/* ID DOCUMENTS SECTION */}
      <div className="nwr-id-section">
        <div className="nwr-id-header">
          <span className="nwr-id-heading">ID documents</span>
        </div>

        <div className="nwr-id-controls-row">
          <div className="nwr-id-select-wrap">
            <select
              className="nwr-select nwr-id-dropdown"
              value={selectedIdType}
              onChange={e => setSelectedIdType(e.target.value)}
            >
              {ID_DOCUMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="nwr-id-num-wrap">
            <input
              type="text"
              className="nwr-input nwr-id-num-input"
              placeholder={`Document number (optional)`}
              value={idNumberInput}
              onChange={e => setIdNumberInput(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="nwr-btn-add-id"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            title="Upload ID Document from Desktop"
          >
            {isUploading ? (
              <span>Uploading...</span>
            ) : (
              <>
                <FiPlus size={14} /> + ADD ID
              </>
            )}
          </button>

          <button
            type="button"
            className="nwr-btn-add-id nwr-btn-mobile-id"
            onClick={() => setIsMobileModalOpen(true)}
            title="Send upload link to guest's phone via WhatsApp or QR code"
          >
            <FiSmartphone size={14} /> Request via Phone
          </button>

          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
          />
        </div>

        {/* Uploaded Documents List or Empty State */}
        {idDocuments.length === 0 ? (
          <div className="nwr-id-empty-box">
            <span className="nwr-id-empty-text">No IDs uploaded yet</span>
          </div>
        ) : (
          <div className="nwr-id-docs-list">
            {idDocuments.map((doc, idx) => (
              <div key={doc.id || idx} className="nwr-id-item-card">
                <div className="nwr-id-item-left">
                  {doc.documentUrl?.startsWith('data:image') || doc.documentUrl?.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                    <img
                      src={doc.documentUrl}
                      alt={doc.idType}
                      className="nwr-id-thumb"
                      onClick={() => setPreviewDoc(doc)}
                    />
                  ) : (
                    <div className="nwr-id-file-icon" onClick={() => setPreviewDoc(doc)}>
                      <FiFileText size={18} />
                    </div>
                  )}
                  <div className="nwr-id-item-meta">
                    <div className="nwr-id-type-badge">{doc.idType}</div>
                    {doc.idNumber && (
                      <span className="nwr-id-number-val">No: <strong>{doc.idNumber}</strong></span>
                    )}
                    <span className="nwr-id-filename">{doc.documentName || 'Document attached'}</span>
                  </div>
                </div>

                <div className="nwr-id-item-actions">
                  <button
                    type="button"
                    className="nwr-id-action-btn"
                    onClick={() => setPreviewDoc(doc)}
                    title="View Document"
                  >
                    <FiEye size={14} /> View
                  </button>
                  <button
                    type="button"
                    className="nwr-id-action-btn danger"
                    onClick={() => handleRemoveDoc(idx)}
                    title="Remove ID"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Lightbox Preview */}
        {previewDoc && (
          <div className="nwr-preview-overlay" onClick={() => setPreviewDoc(null)}>
            <div className="nwr-preview-modal" onClick={e => e.stopPropagation()}>
              <div className="nwr-preview-header">
                <h4>{previewDoc.idType} {previewDoc.idNumber ? `(${previewDoc.idNumber})` : ''}</h4>
                <button type="button" onClick={() => setPreviewDoc(null)} className="nwr-preview-close">
                  <FiX size={16} />
                </button>
              </div>
              <div className="nwr-preview-body">
                {previewDoc.documentUrl?.startsWith('data:image') || previewDoc.documentUrl?.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                  <img src={previewDoc.documentUrl} alt="ID Document Preview" className="nwr-preview-img" />
                ) : (
                  <iframe src={previewDoc.documentUrl} title="Document Preview" className="nwr-preview-iframe" />
                )}
              </div>
            </div>
          </div>
        )}

        {/* Mobile ID Upload Modal */}
        <MobileIdRequestModal
          isOpen={isMobileModalOpen}
          onClose={() => setIsMobileModalOpen(false)}
          guestName={reservationForm.guestName || 'Guest'}
          guestPhone={reservationForm.guestPhone || ''}
          propertyName={propertyName || reservationForm.propertyName || 'StayOps Property'}
          propertyId={propertyId || reservationForm.propertyId || ''}
          onIdReceived={handleMobileIdReceived}
        />
      </div>
    </div>
  );
}

function PropertyUnitSection({
  reservationForm,
  propertiesList,
  availableRooms,
  selectedProperty,
  occupiedRoomNames,
  isCurrentRoomOccupied,
  occupiedRoomsFound = [],
  selectedRoomsList = [],
  roomMaxCapacity = 0,
  currentTotalGuests = 1,
  onPropertyChange,
  updateForm
}) {
  const isSatisfied = roomMaxCapacity >= currentTotalGuests;

  const handleAutoSuggestRooms = () => {
    const { suggestedRooms } = suggestOptimalRooms({
      guestCount: currentTotalGuests,
      availableRooms,
      occupiedRoomNames
    });

    if (suggestedRooms.length > 0 && updateForm) {
      updateForm('selectedRooms', suggestedRooms);
      updateForm('roomUnit', suggestedRooms.map(r => r.name).join(', '));
    }
  };

  const handleAddRoom = (e) => {
    const roomName = e.target.value;
    if (!roomName) return;
    const roomObj = availableRooms.find(r => r.name === roomName);
    if (!roomObj) return;

    const exists = selectedRoomsList.some(r => r.name === roomName);
    if (!exists) {
      const newList = [...selectedRoomsList, roomObj];
      if (updateForm) {
        updateForm('selectedRooms', newList);
        updateForm('roomUnit', newList.map(r => r.name).join(', '));
      }
    }
  };

  const handleRemoveRoom = (roomName) => {
    const newList = selectedRoomsList.filter(r => r.name !== roomName);
    if (updateForm) {
      updateForm('selectedRooms', newList);
      updateForm('roomUnit', newList.map(r => r.name).join(', '));
    }
  };

  return (
    <div className="nwr-section">
      <div className="nwr-section-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>Property & Unit Selection</span>
        <button
          type="button"
          onClick={handleAutoSuggestRooms}
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
            color: '#ffffff',
            border: 'none',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 1px 2px rgba(79,70,229,0.2)'
          }}
          title="Auto-select optimal room combination for guest count"
        >
          ✨ Suggest Rooms
        </button>
      </div>

      <div className="nwr-field" style={{ marginBottom: 12 }}>
        <label className="nwr-label">Property *</label>
        <select className="nwr-select" value={reservationForm.propertyId} onChange={onPropertyChange}>
          {propertiesList.length === 0 ? (
            <option value="">No properties configured</option>
          ) : (
            propertiesList.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))
          )}
        </select>
      </div>

      {/* UNIFIED ALLOCATED ROOM UNITS CARD */}
      <div style={{ padding: '12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#334155' }}>
            🛏️ Allocated Rooms {selectedRoomsList.length > 0 ? `(${selectedRoomsList.length})` : ''}:
          </span>
          <select 
            className="nwr-select" 
            style={{ width: 'auto', padding: '2px 8px', fontSize: 11, height: 26 }}
            value=""
            onChange={handleAddRoom}
          >
            <option value="">+ Add {selectedRoomsList.length === 0 ? 'Room / Unit' : 'Another Room'}</option>
            {availableRooms.map((u, i) => {
              const isOccupied = occupiedRoomNames.has(u.name.trim());
              const isSelected = selectedRoomsList.some(r => r.name === u.name);
              const capLabel = formatRoomCapacityLabel(u);
              return (
                <option key={i} value={u.name} disabled={isOccupied || isSelected}>
                  {isSelected 
                    ? `✓ [SELECTED] ${u.name}` 
                    : isOccupied 
                    ? `⛔ [OCCUPIED] ${u.name}` 
                    : `+ ${u.name} (${capLabel})`}
                </option>
              );
            })}
          </select>
        </div>

        {selectedRoomsList.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {selectedRoomsList.map((rm, idx) => {
              const effRate = getRoomEffectiveRate(rm, selectedProperty);
              return (
                <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#3730A3', padding: '4px 10px', borderRadius: 6, fontWeight: 500 }}>
                  {rm.name} {effRate > 0 ? `(₹${effRate.toLocaleString('en-IN')}/nt)` : ''}
                  <button
                    type="button"
                    onClick={() => handleRemoveRoom(rm.name)}
                    style={{ background: 'none', border: 'none', color: '#6366F1', cursor: 'pointer', padding: 0, marginLeft: 2, fontWeight: 700 }}
                    title="Remove room from selection"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: '#64748B', fontStyle: 'italic' }}>
            No rooms allocated yet. Select a room from the dropdown above or click ✨ Suggest Rooms.
          </div>
        )}
      </div>

      {/* LIVE OCCUPANCY & BED SUMMARY STATUS BAR */}
      <div style={{ marginTop: 8, padding: '8px 12px', background: !isSatisfied ? '#FFFBEB' : '#F0FDF4', border: `1px solid ${!isSatisfied ? '#FDE68A' : '#BBF7D0'}`, borderRadius: 8, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: !isSatisfied ? '#92400E' : '#166534', fontWeight: 500 }}>
          👥 {currentTotalGuests} guest{currentTotalGuests > 1 ? 's' : ''} — {selectedRoomsList.length} room{selectedRoomsList.length > 1 ? 's' : ''} selected (Beds: {roomMaxCapacity} / Needed: {currentTotalGuests})
        </span>
        <span style={{ fontSize: 11, fontWeight: 600, color: !isSatisfied ? '#B45309' : '#15803D' }}>
          {!isSatisfied ? '⚠️ Need More Capacity' : '✅ Capacity Satisfied'}
        </span>
      </div>

      {/* OCCUPIED ROOM WARNING CALLOUT */}
      {isCurrentRoomOccupied && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, fontSize: 12, color: '#991B1B', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiAlertTriangle size={16} />
          <span>
            <strong>Room Occupied:</strong> Selected room(s) "{occupiedRoomsFound.length > 0 ? occupiedRoomsFound.join(', ') : reservationForm.roomUnit}" is already booked/occupied for the selected dates ({reservationForm.checkIn} to {reservationForm.checkOut}). Please select another room.
          </span>
        </div>
      )}
    </div>
  );
}

function DatesGuestsSection({
  reservationForm,
  updateForm,
  todayStr,
  isCapacityExceeded,
  currentTotalGuests,
  roomMaxCapacity,
  childChargePerNight,
  freeChildMaxAge
}) {
  return (
    <div className="nwr-section">
      <div className="nwr-section-label">Dates & Guests</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
        <div className="nwr-field">
          <label className="nwr-label">Check-In Date *</label>
          <input
            type="date"
            className="nwr-input"
            min={todayStr}
            value={reservationForm.checkIn || ''}
            onChange={e => updateForm('checkIn', e.target.value)}
          />
        </div>
        <div className="nwr-field">
          <label className="nwr-label">Check-Out Date *</label>
          <input
            type="date"
            className="nwr-input"
            min={reservationForm.checkIn || todayStr}
            value={reservationForm.checkOut || ''}
            onChange={e => updateForm('checkOut', e.target.value)}
          />
        </div>

        <div className="nwr-field">
          <label className="nwr-label">Adults *</label>
          <input
            type="number"
            min="1"
            max="99"
            className="nwr-input"
            value={reservationForm.adultsCount || 1}
            onChange={e => updateForm('adultsCount', Math.max(1, Number(e.target.value) || 1))}
          />
        </div>

        <div className="nwr-field">
          <label className="nwr-label">Children</label>
          <input
            type="number"
            min="0"
            max="99"
            className="nwr-input"
            value={reservationForm.childrenCount || 0}
            onChange={e => updateForm('childrenCount', Math.max(0, Number(e.target.value) || 0))}
          />
        </div>
      </div>

      {/* CAPACITY EXCEEDED CALLOUT */}
      {isCapacityExceeded && (
        <div style={{ marginTop: 10, padding: '10px 14px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8, fontSize: 12, color: '#92400E', display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiAlertTriangle size={16} />
          <span>
            <strong>Capacity Exceeded:</strong> Total guests ({currentTotalGuests}) exceeds maximum capacity of {roomMaxCapacity} for {reservationForm.roomUnit}.
          </span>
        </div>
      )}

      {/* CHILD POLICY CALLOUT */}
      {(reservationForm.childrenCount || 0) > 0 && !isCapacityExceeded && (
        <div style={{ marginTop: 10, padding: '8px 12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 8, fontSize: 12, color: '#0369A1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <FiSmile size={14} style={{ color: '#0284C7' }} />
            <strong>Child Policy:</strong> {reservationForm.childrenCount} child(ren) • {childChargePerNight > 0 ? `+₹${childChargePerNight.toLocaleString('en-IN')}/night per child` : 'Free Stay (₹0 Extra Charge)'}
          </span>
          <span style={{ fontSize: 11, color: '#0284C7' }}>
            (children under {freeChildMaxAge} yrs stay free)
          </span>
        </div>
      )}
    </div>
  );
}

function PaymentPricingSection({
  reservationForm,
  updateForm,
  calculatedTotalAmount,
  isCash,
  isOnline
}) {
  return (
    <div className="nwr-section">
      <div className="nwr-section-label">Payment & Pricing</div>
      <div className="nwr-row-2">
        <div className="nwr-field">
          <label className="nwr-label">Total Booking Amount (₹) *</label>
          <input
            type="number"
            className="nwr-input"
            placeholder={`Auto: ${calculatedTotalAmount}`}
            value={reservationForm.manualTotalAmount !== null ? reservationForm.manualTotalAmount : ''}
            onChange={e => updateForm('manualTotalAmount', e.target.value === '' ? null : Number(e.target.value))}
          />
        </div>
        <div className="nwr-field">
          <label className="nwr-label">Payment Option *</label>
          <select
            className="nwr-select"
            value={reservationForm.paymentStatus}
            onChange={e => {
              const val = e.target.value;
              updateForm('paymentStatus', val);
              if (val === 'unpaid') {
                updateForm('paidAmount', 0);
              }
            }}
          >
            <option value="cash">Cash / UPI Received in Hand</option>
            <option value="unpaid">Unpaid (Collect at Checkout)</option>
            <option value="online">Collect via Razorpay (Desk Popup)</option>
          </select>
        </div>
      </div>

      <div className="nwr-row-2" style={{ marginTop: 10 }}>
        {isCash || isOnline ? (
          <div className="nwr-field">
            <label className="nwr-label">
              {isOnline ? 'Razorpay Deposit Amount (₹) *' : 'Cash / Advance Amount Collected (₹) *'}
            </label>
            <input
              type="number"
              className="nwr-input"
              placeholder="e.g. 5000"
              value={reservationForm.paidAmount ?? ''}
              onChange={e => updateForm('paidAmount', Number(e.target.value))}
            />
          </div>
        ) : (
          <div className="nwr-field">
            <label className="nwr-label">Collected Amount (₹)</label>
            <input
              type="text"
              className="nwr-input"
              disabled
              value="₹0 (Unpaid)"
            />
          </div>
        )}

        <div className="nwr-field">
          <label className="nwr-label">Booking Source *</label>
          <select
            className="nwr-select"
            value={reservationForm.bookingSource}
            onChange={e => updateForm('bookingSource', e.target.value)}
          >
            {BOOKING_SOURCES.map(src => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function SpecialRequestsSection({ reservationForm, updateForm }) {
  return (
    <div className="nwr-field">
      <label className="nwr-label">
        Special Requests <span className="nwr-optional">(optional)</span>
      </label>
      <textarea
        className="nwr-textarea"
        placeholder="e.g. Early check-in, ground floor, extra towels"
        rows={2}
        value={reservationForm.notes || ''}
        onChange={e => updateForm('notes', e.target.value)}
      />
    </div>
  );
}

function TariffSummaryPanel({
  pricing,
  selectedProperty,
  reservationForm,
  isUnpaid,
  adultsCount = 1,
  childrenCount = 0
}) {
  const {
    ratePerNight = 0,
    totalNights = 1,
    effectiveTotalAmount = 0,
    calculatedPaidAmount = 0,
    calculatedBalanceDue = 0,
    roomBaseTotal = 0,
    childTotalFee = 0,
    serviceChargeAmount = 0,
    serviceChargePercent = 0,
    gstAmount = 0,
    gstRate = 0,
    taxInclusive = false
  } = pricing;

  const displayPaidAmount = isUnpaid ? 0 : calculatedPaidAmount;
  const displayBalanceDue = isUnpaid ? effectiveTotalAmount : calculatedBalanceDue;

  return (
    <div className="nwr-tariff-panel">
      <div className="nwr-tariff-heading">Tariff Summary</div>

      {ratePerNight > 0 ? (
        <>
          <div className="nwr-tariff-property">
            <span>{selectedProperty?.name || '—'}</span>
            <span className="nwr-tariff-unit">{reservationForm.roomUnit || '—'}</span>
          </div>

          <div className="nwr-tariff-rate-row">
            <span className="nwr-tariff-rate">₹{ratePerNight.toLocaleString('en-IN')}</span>
            <span className="nwr-tariff-dim">&nbsp;/ night</span>
          </div>

          <div className="nwr-tariff-divider" />

          <div className="nwr-tariff-row">
            <span className="nwr-tariff-dim">Room Base Tariff ({totalNights} Night{totalNights > 1 ? 's' : ''})</span>
            <span>₹{roomBaseTotal.toLocaleString('en-IN')}</span>
          </div>

          {childTotalFee > 0 && (
            <div className="nwr-tariff-row">
              <span className="nwr-tariff-dim">Child Charges ({reservationForm.childrenCount} child)</span>
              <span>+₹{childTotalFee.toLocaleString('en-IN')}</span>
            </div>
          )}

          {serviceChargeAmount > 0 && (
            <div className="nwr-tariff-row">
              <span className="nwr-tariff-dim">Service Charge ({serviceChargePercent}%)</span>
              <span>+₹{serviceChargeAmount.toLocaleString('en-IN')}</span>
            </div>
          )}

          {gstAmount > 0 && !taxInclusive && (
            <div className="nwr-tariff-row">
              <span className="nwr-tariff-dim">GST Tax ({gstRate}%)</span>
              <span>+₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
          )}

          {taxInclusive && gstAmount > 0 && (
            <div className="nwr-tariff-row">
              <span className="nwr-tariff-dim">GST ({gstRate}% Included)</span>
              <span className="nwr-tariff-dim">₹{gstAmount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="nwr-tariff-row">
            <span className="nwr-tariff-dim">Total Booking Amount</span>
            <span className="nwr-tariff-bold">₹{effectiveTotalAmount.toLocaleString('en-IN')}</span>
          </div>

          <div className="nwr-tariff-row">
            <span className="nwr-tariff-dim">Collected Now</span>
            <span className={displayPaidAmount > 0 ? 'nwr-tariff-green' : 'nwr-tariff-dim'}>
              ₹{displayPaidAmount.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="nwr-tariff-divider" />

          <div className="nwr-tariff-balance">
            <span>Balance Due</span>
            <strong className={displayBalanceDue === 0 ? 'nwr-tariff-green' : 'nwr-tariff-amber'}>
              ₹{displayBalanceDue.toLocaleString('en-IN')}
            </strong>
          </div>

          {displayBalanceDue === 0 && (
            <div className="nwr-tariff-paid-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <FiCheckCircle size={13} /> Fully Settled
            </div>
          )}

          {displayBalanceDue > 0 && (
            <div className="nwr-tariff-note">
              {isUnpaid ? 'Collect full amount at checkout' : 'Remaining balance due at checkout'}
            </div>
          )}
        </>
      ) : (
        <div className="nwr-tariff-empty">
          <span>No rate configured</span>
          <span className="nwr-tariff-dim">Set pricing in Properties → Pricing tab</span>
        </div>
      )}

      <div className="nwr-tariff-dates">
        <div className="nwr-tariff-date-row">
          <span className="nwr-tariff-dim">Check-In</span>
          <span>{reservationForm.checkIn}{reservationForm.checkInTime ? ` • ${formatTime12Hr(reservationForm.checkInTime)}` : ''}</span>
        </div>
        <div className="nwr-tariff-date-row">
          <span className="nwr-tariff-dim">Check-Out</span>
          <span>{reservationForm.checkOut}{reservationForm.checkOutTime ? ` • ${formatTime12Hr(reservationForm.checkOutTime)}` : ''}</span>
        </div>

        <div className="nwr-tariff-date-row">
          <span className="nwr-tariff-dim">Guests</span>
          <span>
            {adultsCount} adult{adultsCount > 1 ? 's' : ''}
            {childrenCount > 0 ? `, ${childrenCount} child${childrenCount > 1 ? 'ren' : ''}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}

function ModalFooter({
  currentStep,
  onClose,
  onNext,
  onBack,
  isOnline,
  isCash,
  isRazorpayConfigured,
  isCurrentRoomOccupied,
  isCapacityExceeded,
  handleRazorpayClick,
  handleCreateWalkin
}) {
  const isDisabled = isCurrentRoomOccupied || isCapacityExceeded;

  return (
    <div className="nwr-footer">
      <button type="button" className="nwr-btn-ghost" onClick={onClose}>
        Cancel
      </button>

      <div className="nwr-footer-right">
        {currentStep > 1 && (
          <button
            type="button"
            className="nwr-btn-secondary"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FiArrowLeft size={14} /> Back
          </button>
        )}

        {currentStep < 3 ? (
          <button
            type="button"
            className="nwr-btn-primary"
            onClick={onNext}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <span>{currentStep === 1 ? 'Next: Stay & Rooms' : 'Next: Payment'}</span>
            <FiArrowRight size={14} />
          </button>
        ) : (
          isOnline ? (
            <button
              type="button"
              className={`nwr-btn-primary ${(!isRazorpayConfigured || isDisabled) ? 'disabled' : ''}`}
              onClick={handleRazorpayClick}
              disabled={isDisabled}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isRazorpayConfigured ? (
                <>
                  <FiZap size={15} /> Collect via Razorpay (Desk Popup)
                </>
              ) : (
                <>
                  <FiAlertTriangle size={15} /> Connect Razorpay in Settings
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              className={`nwr-btn-primary ${isDisabled ? 'disabled' : ''}`}
              onClick={handleCreateWalkin}
              disabled={isDisabled}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {isCash ? (
                <>
                  <FiDollarSign size={15} /> Confirm & Log Cash Receipt
                </>
              ) : (
                <>
                  <FiClock size={15} /> Confirm Booking (Unpaid)
                </>
              )}
            </button>
          )
        )}
      </div>
    </div>
  );
}

/* ==========================================================================
   MAIN COMPONENT
   ========================================================================== */

export default function NewReservationModal({
  isOpen,
  onClose,
  reservationForm,
  updateForm,
  propertiesList = [],
  availableRooms = [],
  selectedProperty,
  reservationsList = [],
  pricing = {},
  onPropertyChange,
  isRazorpayConfigured = false,
  onNavigateToSettings,
  handleCollectRazorpay,
  handleCreateWalkin
}) {
  const todayStr = new Date().toISOString().split('T')[0];

  const {
    calculatedTotalAmount = 0,
    childChargePerNight = 0,
    freeChildMaxAge = 5
  } = pricing;

  // 1. Normalized numeric guest counts
  const adultsCount = Math.max(1, Number(reservationForm.adultsCount) || 1);
  const childrenCount = Math.max(0, Number(reservationForm.childrenCount) || 0);
  const currentTotalGuests = adultsCount + childrenCount;

  // 2. Multi-room occupancy detection with date-only comparison and explicit status filtering
  const occupiedRoomNames = useMemo(() => {
    return getOccupiedRoomNames(reservationsList, {
      checkIn: reservationForm.checkIn,
      checkOut: reservationForm.checkOut,
      propertyId: reservationForm.propertyId
    });
  }, [reservationForm.checkIn, reservationForm.checkOut, reservationForm.propertyId, reservationsList]);

  // 3. Centralized allocated rooms list
  const selectedRoomsList = useMemo(() => {
    if (Array.isArray(reservationForm.selectedRooms) && reservationForm.selectedRooms.length > 0) {
      return reservationForm.selectedRooms;
    }
    if (reservationForm.roomUnit) {
      const units = reservationForm.roomUnit.split(',').map(u => u.trim()).filter(Boolean);
      const matched = availableRooms.filter(r => units.includes(r.name));
      return matched.length > 0 ? matched : [];
    }
    return [];
  }, [reservationForm.selectedRooms, reservationForm.roomUnit, availableRooms]);

  // 4. Combined capacity calculation across all selected rooms without hardcoded defaults
  const roomMaxCapacity = useMemo(() => {
    return calculateRoomsTotalCapacity(selectedRoomsList).totalCapacity;
  }, [selectedRoomsList]);

  // 5. Occupied rooms check for current selection
  const occupiedRoomsFound = useMemo(() => {
    return selectedRoomsList
      .map(r => r.name)
      .filter(name => occupiedRoomNames.has(name));
  }, [selectedRoomsList, occupiedRoomNames]);

  const isCurrentRoomOccupied = occupiedRoomsFound.length > 0;
  const isCapacityExceeded = roomMaxCapacity > 0 && currentTotalGuests > roomMaxCapacity;

  const [currentStep, setCurrentStep] = useState(1);
  const [stepError, setStepError] = useState('');

  // Reset to Step 1 whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setStepError('');
    }
  }, [isOpen]);

  const validateStep1 = () => {
    if (!reservationForm.guestName || !reservationForm.guestName.trim()) {
      setStepError("Please enter the guest's full name.");
      return false;
    }
    if (!reservationForm.guestPhone || !reservationForm.guestPhone.trim()) {
      setStepError("Please enter the guest's WhatsApp / mobile number.");
      return false;
    }
    setStepError('');
    return true;
  };

  const validateStep2 = () => {
    if (!reservationForm.checkIn || !reservationForm.checkOut) {
      setStepError("Please select both Check-In and Check-Out dates.");
      return false;
    }
    if (new Date(reservationForm.checkOut) <= new Date(reservationForm.checkIn)) {
      setStepError("Check-Out date must be after Check-In date.");
      return false;
    }

    if (selectedRoomsList.length === 0) {
      setStepError("Please allocate at least one room or click '✨ Suggest Rooms'.");
      return false;
    }
    if (isCurrentRoomOccupied) {
      setStepError(
        `Selected room(s) "${occupiedRoomsFound.join(', ')}" is already booked for these dates. Please choose another room.`
      );
      return false;
    }
    if (isCapacityExceeded) {
      setStepError(
        `Selected rooms accommodate ${roomMaxCapacity} guests, but ${currentTotalGuests} guests are required. Add another room or choose a larger room.`
      );
      return false;
    }
    setStepError('');
    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (validateStep1()) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      if (validateStep2()) {
        setCurrentStep(3);
      }
    }
  };

  const handleBackStep = () => {
    setStepError('');
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === currentStep) return;
    if (targetStep < currentStep) {
      setStepError('');
      setCurrentStep(targetStep);
    } else if (targetStep === 2) {
      if (validateStep1()) setCurrentStep(2);
    } else if (targetStep === 3) {
      if (validateStep1() && validateStep2()) setCurrentStep(3);
    }
  };

  if (!isOpen) return null;

  const handleRazorpayClick = () => {
    if (!isRazorpayConfigured) {
      const shouldNavigate = confirm(
        "Razorpay Gateway is not connected yet.\n\nWould you like to go to Settings -> Payments now to connect your Razorpay Key ID and Key Secret?"
      );
      if (shouldNavigate) {
        onClose();
        if (onNavigateToSettings) onNavigateToSettings();
      }
      return;
    }
    handleCollectRazorpay();
  };

  const isCash = reservationForm.paymentStatus === 'cash';
  const isOnline = reservationForm.paymentStatus === 'online';
  const isUnpaid = reservationForm.paymentStatus === 'unpaid';

  return (
    <div className="res-modal-backdrop" onClick={onClose}>
      <div className="nwr-modal" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="nwr-header">
          <div>
            <h3 className="nwr-title">New Walk-In Reservation</h3>
            <span className="nwr-subtitle">Front-desk guest booking</span>
          </div>
          <button type="button" className="nwr-close" onClick={onClose} aria-label="Close modal">
            <FiX size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="nwr-body">
          {/* LEFT: STEPPED FORM */}
          <div className="nwr-form">
            {/* STEPPER BREADCRUMB */}
            <div className="nwr-stepper">
              <button
                type="button"
                className={`nwr-step-pill ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}
                onClick={() => handleStepClick(1)}
              >
                <span className="nwr-step-num">
                  {currentStep > 1 ? <FiCheck size={12} strokeWidth={3} /> : '1'}
                </span>
                <span className="nwr-step-text">Guest Details</span>
              </button>

              <div className={`nwr-step-line ${currentStep > 1 ? 'completed' : ''}`} />

              <button
                type="button"
                className={`nwr-step-pill ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}
                onClick={() => handleStepClick(2)}
              >
                <span className="nwr-step-num">
                  {currentStep > 2 ? <FiCheck size={12} strokeWidth={3} /> : '2'}
                </span>
                <span className="nwr-step-text">Stay & Rooms</span>
              </button>

              <div className={`nwr-step-line ${currentStep > 2 ? 'completed' : ''}`} />

              <button
                type="button"
                className={`nwr-step-pill ${currentStep === 3 ? 'active' : ''}`}
                onClick={() => handleStepClick(3)}
              >
                <span className="nwr-step-num">3</span>
                <span className="nwr-step-text">Payment</span>
              </button>
            </div>

            {/* STEP VALIDATION ERROR BANNER */}
            {stepError && (
              <div className="nwr-step-error">
                <FiAlertCircle size={15} />
                <span>{stepError}</span>
              </div>
            )}

            {/* STEP 1: GUEST DETAILS ONLY */}
            {currentStep === 1 && (
              <div className="nwr-step-content">
                <GuestDetailsSection
                  reservationForm={reservationForm}
                  updateForm={updateForm}
                  propertyName={selectedProperty?.name || reservationForm.propertyName || 'StayOps'}
                  propertyId={reservationForm.propertyId}
                />
              </div>
            )}

            {/* STEP 2: DATES, GUEST COUNT & ROOM ALLOCATION COMBINED */}
            {currentStep === 2 && (
              <div className="nwr-step-content">
                <DatesGuestsSection
                  reservationForm={reservationForm}
                  updateForm={updateForm}
                  todayStr={todayStr}
                  isCapacityExceeded={isCapacityExceeded}
                  currentTotalGuests={currentTotalGuests}
                  roomMaxCapacity={roomMaxCapacity}
                  childChargePerNight={childChargePerNight}
                  freeChildMaxAge={freeChildMaxAge}
                />

                <PropertyUnitSection
                  reservationForm={reservationForm}
                  propertiesList={propertiesList}
                  availableRooms={availableRooms}
                  selectedProperty={selectedProperty}
                  occupiedRoomNames={occupiedRoomNames}
                  isCurrentRoomOccupied={isCurrentRoomOccupied}
                  occupiedRoomsFound={occupiedRoomsFound}
                  selectedRoomsList={selectedRoomsList}
                  roomMaxCapacity={roomMaxCapacity}
                  currentTotalGuests={currentTotalGuests}
                  onPropertyChange={onPropertyChange}
                  updateForm={updateForm}
                />
              </div>
            )}

            {/* STEP 3: PAYMENT & SETTLE */}
            {currentStep === 3 && (
              <div className="nwr-step-content">
                <PaymentPricingSection
                  reservationForm={reservationForm}
                  updateForm={updateForm}
                  calculatedTotalAmount={calculatedTotalAmount}
                  isCash={isCash}
                  isOnline={isOnline}
                />

                <SpecialRequestsSection
                  reservationForm={reservationForm}
                  updateForm={updateForm}
                />
              </div>
            )}
          </div>

          {/* RIGHT: LIVE TARIFF PANEL (PERSISTENT ACROSS ALL STEPS) */}
          <TariffSummaryPanel
            pricing={pricing}
            selectedProperty={selectedProperty}
            reservationForm={reservationForm}
            isUnpaid={isUnpaid}
            adultsCount={adultsCount}
            childrenCount={childrenCount}
          />
        </div>

        {/* FOOTER */}
        <ModalFooter
          currentStep={currentStep}
          onClose={onClose}
          onNext={handleNextStep}
          onBack={handleBackStep}
          isOnline={isOnline}
          isCash={isCash}
          isRazorpayConfigured={isRazorpayConfigured}
          isCurrentRoomOccupied={isCurrentRoomOccupied}
          isCapacityExceeded={isCapacityExceeded}
          handleRazorpayClick={handleRazorpayClick}
          handleCreateWalkin={handleCreateWalkin}
        />
      </div>
    </div>
  );
}


