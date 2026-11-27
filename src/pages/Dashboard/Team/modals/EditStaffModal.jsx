import React, { useState, useEffect } from 'react';
import { FiX, FiUser, FiPhone, FiLock, FiShield, FiRefreshCw, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { fetchProperties } from '../../Reservations/propertyApi';
import PropertyScopeSelector from './PropertyScopeSelector';
import {
  DEFAULT_PROPERTIES,
  ROLE_OPTIONS,
  PRD_ROLES,
  getRoleDefaultPermissions,
  togglePropertySelection
} from './teamModalConstants';
import './TeamModals.css';

export default function EditStaffModal({ isOpen, member, onClose, onSave }) {
  const [name, setName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [role, setRole] = useState(PRD_ROLES.PROPERTY_MANAGER);
  const [assignedProperties, setAssignedProperties] = useState([]);
  const [status, setStatus] = useState('Active');
  const [availableProperties, setAvailableProperties] = useState(DEFAULT_PROPERTIES);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && member) {
      setName(member.name || '');
      setMobileNumber(member.mobileNumber || '');
      setPin(member.pin || member.password || '');
      setShowPin(false);
      
      // Normalize legacy roles (e.g. 'Caretaker' -> 'Caretaker / Ground Staff')
      let normalizedRole = member.role || PRD_ROLES.PROPERTY_MANAGER;
      if (normalizedRole === 'Caretaker' || normalizedRole === 'Housekeeper' || normalizedRole === 'Cook/Chef') {
        normalizedRole = PRD_ROLES.CARETAKER;
      }
      setRole(normalizedRole);

      setAssignedProperties(member.assignedProperties || ['all']);
      setStatus(member.status || 'Active');
      setError('');

      fetchProperties()
        .then((props) => {
          if (props && props.length > 0) {
            setAvailableProperties(props.map((p) => ({ id: String(p.id), title: p.title || p.name })));
          }
        })
        .catch(() => {
          setAvailableProperties(DEFAULT_PROPERTIES);
        });
    }
  }, [isOpen, member]);

  const handleGeneratePin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(randomPin);
    setShowPin(true);
  };

  const handlePropertyToggle = (propId) => {
    setAssignedProperties((prev) =>
      togglePropertySelection(prev, propId, availableProperties.length)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter staff member full name.');
      return;
    }
    if (!mobileNumber.trim() || !/^\d{10}$/.test(mobileNumber.trim())) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!pin.trim() || pin.trim().length < 4 || pin.trim().length > 6) {
      setError('Access PIN must be 4 to 6 digits.');
      return;
    }
    if (assignedProperties.length === 0) {
      setError('Please assign at least one property or select "All Properties".');
      return;
    }

    setSubmitting(true);
    try {
      const isAll = assignedProperties.includes('all');
      const assignedPropertyNames = isAll
        ? ['All Properties']
        : assignedProperties.map((id) => {
            const found = availableProperties.find((p) => p.id === id);
            return found ? found.title : `Property ${id}`;
          });

      const cleanPin = pin.trim();

      await onSave(member.id, {
        name: name.trim(),
        mobileNumber: mobileNumber.trim(),
        pin: cleanPin,
        password: cleanPin, // Backward-compatible
        role,
        assignedProperties,
        assignedPropertyNames,
        permissions: getRoleDefaultPermissions(role),
        status
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !member) return null;

  return (
    <div className="team-modal-overlay" onClick={onClose}>
      <div className="team-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="team-modal-header">
          <div>
            <h3>Edit Staff Member</h3>
            <p className="modal-subtitle">Update credentials, role, or property access</p>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            <FiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="team-modal-form">
          {error && <div className="team-modal-error">{error}</div>}

          {/* BASIC INFO, PIN & STATUS - 2x2 GRID */}
          <div className="team-form-grid-2x2">
            <div className="form-group">
              <label htmlFor="edit-staff-name">
                <FiUser className="form-label-icon" /> Full Name
              </label>
              <input
                id="edit-staff-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-staff-mobile">
                <FiPhone className="form-label-icon" /> Mobile Number (Login ID)
              </label>
              <div className="mobile-input-wrapper">
                <span className="mobile-prefix">+91</span>
                <input
                  id="edit-staff-mobile"
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="form-group-label-row">
                <label htmlFor="edit-staff-pin">
                  <FiLock className="form-label-icon" /> Access PIN
                </label>
                <button
                  type="button"
                  className="generate-pin-btn"
                  onClick={handleGeneratePin}
                  title="Generate Random 4-digit PIN"
                >
                  <FiRefreshCw size={11} /> Auto PIN
                </button>
              </div>
              <div className="pin-input-wrapper">
                <input
                  id="edit-staff-pin"
                  type={showPin ? "text" : "password"}
                  maxLength={6}
                  placeholder="4 to 6 digit PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                />
                <button
                  type="button"
                  className="pin-toggle-btn"
                  onClick={() => setShowPin(!showPin)}
                  title={showPin ? "Hide PIN" : "Show PIN"}
                >
                  {showPin ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="edit-staff-status">Account Status</label>
              <select
                id="edit-staff-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="Active">Active (Can log in)</option>
                <option value="Inactive">Inactive (Access suspended)</option>
              </select>
            </div>
          </div>

          {/* ROLE SELECTION — PRD ROLES */}
          <div className="form-group full-width">
            <div className="form-group-label-row">
              <label>
                <FiShield className="form-label-icon" /> Select Role & Responsibilities
              </label>
              <span className="role-hint">Standardized role responsibilities</span>
            </div>

            <div className="prd-role-cards-grid">
              {ROLE_OPTIONS.map((opt) => {
                const isSelected = role === opt.value;
                return (
                  <div
                    key={opt.value}
                    className={`prd-role-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => setRole(opt.value)}
                  >
                    <div className="prd-role-card-header">
                      <div className="prd-role-card-title">
                        <span className="prd-role-radio">
                          {isSelected && <span className="prd-role-radio-dot" />}
                        </span>
                        <strong>{opt.label}</strong>
                      </div>
                      {isSelected && (
                        <span className="prd-role-selected-badge">
                          <FiCheckCircle size={13} /> Selected
                        </span>
                      )}
                    </div>
                    <p className="prd-role-desc">{opt.responsibility}</p>
                    <div className="prd-role-scope-tag">
                      <strong>Scope:</strong> {opt.scope}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* PROPERTY SCOPE */}
          <PropertyScopeSelector
            availableProperties={availableProperties}
            assignedProperties={assignedProperties}
            onToggle={handlePropertyToggle}
          />

          <div className="team-modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
