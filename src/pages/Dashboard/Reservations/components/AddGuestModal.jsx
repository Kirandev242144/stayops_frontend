import React from 'react';
import { FiX } from 'react-icons/fi';

export default function AddGuestModal({
  isOpen,
  onClose,
  guestForm,
  setGuestForm,
  onSubmit
}) {
  if (!isOpen) return null;

  return (
    <div className="res-modal-backdrop" onClick={onClose}>
      <div className="res-modal-card" style={{ maxWidth: 440 }} onClick={e => e.stopPropagation()}>
        <div className="res-modal-head">
          <div>
            <h3 className="res-modal-title">+ ADD NEW GUEST PROFILE</h3>
            <span className="res-modal-subtitle">Save guest information to CRM</span>
          </div>
          <button type="button" className="res-modal-close-btn" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>
        <form onSubmit={onSubmit} className="res-modal-body">
          <div className="res-form-group">
            <label className="res-form-label">Full Name *</label>
            <input
              required
              className="res-form-input"
              placeholder="Guest Full Name"
              value={guestForm.name}
              onChange={e => setGuestForm({ ...guestForm, name: e.target.value })}
              autoFocus
            />
          </div>
          <div className="res-form-group">
            <label className="res-form-label">WhatsApp Mobile Phone *</label>
            <input
              required
              className="res-form-input"
              placeholder="Mobile Phone Number"
              value={guestForm.phone}
              onChange={e => setGuestForm({ ...guestForm, phone: e.target.value })}
            />
          </div>
          <div className="res-form-group">
            <label className="res-form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="res-form-input"
              placeholder="guest@example.com"
              value={guestForm.email}
              onChange={e => setGuestForm({ ...guestForm, email: e.target.value })}
            />
          </div>
          <div className="res-form-group">
            <label className="res-form-label">ID Document Type</label>
            <select
              className="res-form-input"
              value={guestForm.idType || "Aadhaar Card"}
              onChange={e => setGuestForm({ ...guestForm, idType: e.target.value })}
            >
              <option value="Aadhaar Card">Aadhaar Card</option>
              <option value="Passport">Passport</option>
              <option value="Driving License">Driving License</option>
              <option value="Voter ID">Voter ID</option>
              <option value="PAN Card">PAN Card</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="res-form-group">
            <label className="res-form-label">ID Card Number (Optional)</label>
            <input
              className="res-form-input"
              placeholder="e.g. 1234 5678 9012"
              value={guestForm.aadhaar || guestForm.idNumber || ""}
              onChange={e => setGuestForm({ ...guestForm, aadhaar: e.target.value, idNumber: e.target.value })}
            />
          </div>
          <div className="res-form-group">
            <label className="res-form-label">Attach ID Document (Optional)</label>
            <input
              type="file"
              className="res-form-input"
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (ev) => {
                  setGuestForm(prev => ({
                    ...prev,
                    idDocumentUrl: ev.target.result,
                    documentName: file.name
                  }));
                };
                reader.readAsDataURL(file);
              }}
            />
            {guestForm.documentName && (
              <span style={{ fontSize: 11, color: '#059669', marginTop: 3 }}>
                ✓ {guestForm.documentName} attached
              </span>
            )}
          </div>
          <div className="res-modal-foot">
            <button type="button" className="res-btn res-btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="res-btn res-btn-primary">
              Save Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
