import React, { useState } from "react";
import { FiX, FiEdit2, FiHome, FiMapPin, FiClock, FiFileText, FiPhone, FiMail, FiDollarSign } from "react-icons/fi";
import { formatTime12Hr, CHECKIN_TIME_OPTIONS, CHECKOUT_TIME_OPTIONS } from "../../../utils/timeFormat";
import { API_BASE_URL } from "../../../config/api";
import PropertyLocationPicker from "./Map/PropertyLocationPicker";
import "./EditPropertyModal.css";

const PROPERTY_TYPES = [
  "Homestay",
  "Villa",
  "Resort",
  "Hotel",
  "Apartment",
  "Cottage",
  "Guesthouse"
];

const STATUS_OPTIONS = ["Active", "Paused", "Inactive"];

export default function EditPropertyModal({ isOpen, property, onClose, onSave, initialTab = "general" }) {
  if (!isOpen || !property) return null;

  const parseJson = (str, fallback = {}) => {
    if (!str) return fallback;
    if (typeof str === "object") return str;
    try {
      return JSON.parse(str);
    } catch {
      return fallback;
    }
  };

  const initialOperations = parseJson(property.operations, {});

  const [activeTab, setActiveTab] = useState(initialTab);

  React.useEffect(() => {
    if (isOpen && initialTab) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const [formData, setFormData] = useState({
    name: property.name || "",
    type: property.type || "Homestay",
    status: property.status || "Active",
    baseRate: property.baseRate !== undefined && property.baseRate !== null ? property.baseRate : 0,
    address: property.address || "",
    city: property.city || "",
    state: property.state || "",
    postalCode: property.postalCode || "",
    location: property.location || "",
    lat: property.lat !== undefined && property.lat !== null ? property.lat : null,
    lng: property.lng !== undefined && property.lng !== null ? property.lng : null,
    contactPhone: property.contactPhone || "",
    contactEmail: property.contactEmail || "",
    description: property.description || "",
    // Operations (Loaded from DB)
    checkIn: formatTime12Hr(initialOperations.checkIn || "2:00 PM"),
    checkOut: formatTime12Hr(initialOperations.checkOut || "11:00 AM"),
    checkInMethod: initialOperations.checkInMethod || "Host check-in",
    houseRules: initialOperations.houseRules || ""
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const operationsObj = {
      ...initialOperations,
      checkIn: formData.checkIn,
      checkOut: formData.checkOut,
      checkInMethod: formData.checkInMethod,
      houseRules: formData.houseRules
    };

    const payload = {
      name: formData.name.trim(),
      type: formData.type,
      status: formData.status,
      baseRate: Number(formData.baseRate) || 0,
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      postalCode: formData.postalCode.trim(),
      location: formData.city.trim() && formData.state.trim() 
        ? `${formData.city.trim()}, ${formData.state.trim()}`
        : (formData.location.trim() || `${formData.city.trim()}`),
      contactPhone: formData.contactPhone.trim(),
      contactEmail: formData.contactEmail.trim(),
      description: formData.description.trim(),
      lat: formData.lat,
      lng: formData.lng,
      operations: JSON.stringify(operationsObj)
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="res-modal-backdrop" onClick={onClose}>
      <div className="res-modal-card epm-modal-card" onClick={e => e.stopPropagation()}>
        
        {/* MODAL HEADER */}
        <div className="res-modal-head">
          <div>
            <h3 className="res-modal-title">✏️ Edit Property & Operations</h3>
            <span className="res-modal-subtitle">Update basic details, address, pricing and check-in rules for {property.name}</span>
          </div>
          <button type="button" className="res-modal-close-btn" onClick={onClose}>
            <FiX size={18} />
          </button>
        </div>

        {/* MODAL TAB SELECTOR */}
        <div className="epm-tab-bar">
          <button 
            type="button"
            className={`res-pill-btn ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FiHome size={13} className="epm-tab-icon" /> General & Location
          </button>
          <button
            type="button"
            className={`res-pill-btn ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
          >
            <FiPhone size={13} className="epm-tab-icon" /> Contact & Description
          </button>
          <button
            type="button"
            className={`res-pill-btn ${activeTab === 'operations' ? 'active' : ''}`}
            onClick={() => setActiveTab('operations')}
          >
            <FiClock size={13} className="epm-tab-icon" /> Operations & Rules
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="res-modal-body">

          {/* TAB 1: GENERAL & LOCATION */}
          {activeTab === 'general' && (
            <>
              <div className="res-form-row-2">
                <div className="res-form-group">
                  <label className="res-form-label">Property Name *</label>
                  <input
                    type="text"
                    className="res-form-input"
                    value={formData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    required
                    placeholder="e.g. Sri Nature Homestay"
                  />
                </div>

                <div className="res-form-group">
                  <label className="res-form-label">Property Category *</label>
                  <select
                    className="res-form-select"
                    value={formData.type}
                    onChange={e => handleChange('type', e.target.value)}
                  >
                    {PROPERTY_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="res-form-row-2">
                <div className="res-form-group">
                  <label className="res-form-label">Property Status *</label>
                  <select
                    className="res-form-select"
                    value={formData.status}
                    onChange={e => handleChange('status', e.target.value)}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="res-form-group">
                  <label className="res-form-label">Default Base Rate (&#8377; / night)</label>
                  <input
                    type="number"
                    min="0"
                    className="res-form-input"
                    value={formData.baseRate}
                    onChange={e => handleChange('baseRate', e.target.value)}
                    placeholder="5000"
                  />
                </div>
              </div>

              <div className="res-form-section-title epm-section-title">LOCATION & ADDRESS</div>

              <div className="res-form-group">
                <label className="res-form-label">Street Address</label>
                <input
                  type="text"
                  className="res-form-input"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder="e.g. Estate Road, Coffee Plantation, Mudigere"
                />
              </div>

              <div className="res-form-row-3">
                <div className="res-form-group">
                  <label className="res-form-label">City *</label>
                  <input
                    type="text"
                    className="res-form-input"
                    value={formData.city}
                    onChange={e => handleChange('city', e.target.value)}
                    required
                    placeholder="Chikmagaluru"
                  />
                </div>

                <div className="res-form-group">
                  <label className="res-form-label">State *</label>
                  <input
                    type="text"
                    className="res-form-input"
                    value={formData.state}
                    onChange={e => handleChange('state', e.target.value)}
                    required
                    placeholder="Karnataka"
                  />
                </div>

                <div className="res-form-group">
                  <label className="res-form-label">Postal Code</label>
                  <input
                    type="text"
                    className="res-form-input"
                    value={formData.postalCode}
                    onChange={e => handleChange('postalCode', e.target.value)}
                    placeholder="577101"
                  />
                </div>
              </div>

              {/* Interactive OpenStreetMap Location Picker with Nominatim Auto-Geocoding */}
              <PropertyLocationPicker
                address={formData.address}
                city={formData.city}
                state={formData.state}
                postalCode={formData.postalCode}
                lat={formData.lat}
                lng={formData.lng}
                onChange={({ lat, lng }) => {
                  setFormData((prev) => ({ ...prev, lat, lng }));
                }}
              />
            </>
          )}

          {/* TAB 2: CONTACT & DESCRIPTION */}
          {activeTab === 'contact' && (
            <>
              <div className="res-form-row-2">
                <div className="res-form-group">
                  <label className="res-form-label">Contact Phone *</label>
                  <input
                    type="text"
                    className="res-form-input"
                    value={formData.contactPhone}
                    onChange={e => handleChange('contactPhone', e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>

                <div className="res-form-group">
                  <label className="res-form-label">Contact Email</label>
                  <input
                    type="email"
                    className="res-form-input"
                    value={formData.contactEmail}
                    onChange={e => handleChange('contactEmail', e.target.value)}
                    placeholder="owner@srinature.com"
                  />
                </div>
              </div>

              <div className="res-form-group">
                <label className="res-form-label">Property Description</label>
                <textarea
                  className="nwr-textarea"
                  rows={5}
                  value={formData.description}
                  onChange={e => handleChange('description', e.target.value)}
                  placeholder="Describe your property, surroundings, scenic views, nearby attractions, and guest experience..."
                />
              </div>
            </>
          )}

          {/* TAB 3: OPERATIONS & RULES */}
          {activeTab === 'operations' && (
            <>
              <div className="res-form-row-2">
                <div className="res-form-group">
                  <label className="res-form-label">Check-In Time *</label>
                  <select
                    className="res-form-select"
                    value={formatTime12Hr(formData.checkIn)}
                    onChange={e => handleChange('checkIn', e.target.value)}
                  >
                    {CHECKIN_TIME_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div className="res-form-group">
                  <label className="res-form-label">Check-Out Time *</label>
                  <select
                    className="res-form-select"
                    value={formatTime12Hr(formData.checkOut)}
                    onChange={e => handleChange('checkOut', e.target.value)}
                  >
                    {CHECKOUT_TIME_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="res-form-group">
                <label className="res-form-label">Check-In Method</label>
                <select
                  className="res-form-select"
                  value={formData.checkInMethod}
                  onChange={e => handleChange('checkInMethod', e.target.value)}
                >
                  <option value="Host check-in">Host check-in (Caretaker on site)</option>
                  <option value="Self check-in (Key lockbox)">Self check-in (Key lockbox)</option>
                  <option value="24/7 Front Desk">24/7 Front Desk</option>
                  <option value="Digital Keypad">Digital Keypad Access</option>
                </select>
              </div>

              <div className="res-form-group">
                <label className="res-form-label">House Rules & Guest Guidelines</label>
                <textarea
                  className="nwr-textarea"
                  rows={4}
                  value={formData.houseRules}
                  onChange={e => handleChange('houseRules', e.target.value)}
                  placeholder="e.g. Quiet hours after 10 PM. No smoking indoors. Pets allowed upon prior confirmation."
                />
              </div>
            </>
          )}

          {/* FOOTER */}
          <div className="res-modal-footer">
            <button
              type="button"
              className="res-btn res-btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="res-btn res-btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Update Property"}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
