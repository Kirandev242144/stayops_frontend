import React, { useState, useRef } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiLoader,
  FiPlus,
  FiTrash2,
  FiEdit2,
  FiUpload,
  FiX,
  FiWifi,
  FiSearch,
  FiLock,
  FiImage
} from "react-icons/fi";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../../config/api";
import { ROOM_AMENITY_CATEGORIES, PROPERTY_AMENITY_CATEGORIES } from "../../../constants/amenities";
import PropertyLocationPicker from "./Map/PropertyLocationPicker";
import "./CreateProperty.css";

// Initial state for manual room creation modal
const emptyRoomState = {
  id: null,
  name: "",
  quantity: "1",
  baseRate: "3500",
  weekendRate: "4000",
  guests: "2",
  maxAdults: "2",
  maxChildren: "0",
  bedrooms: "1",
  beds: "1",
  bedType: "King",
  bathrooms: "1",
  bathroomType: "Private",
  unitNumbers: "",
  wifiName: "",
  wifiPassword: "",
  amenities: ["WiFi", "Air conditioning", "Hot water shower", "Private bathroom"],
  photos: []
};

export default function CreateProperty({ onBack, onCreated }) {
  // Step indicator state (Step 1: Information & Address, Step 2: Rooms Setup)
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Property Amenities state (user can select or skip)
  const [selectedPropertyAmenities, setSelectedPropertyAmenities] = useState([
    "Free WiFi",
    "Free Parking",
    "Power Backup / Generator",
    "CCTV & 24/7 Security"
  ]);
  const [skipPropertyAmenities, setSkipPropertyAmenities] = useState(false);

  // Step 1: Basic property details and address state
  const [basicInfo, setBasicInfo] = useState({
    name: "",
    type: "Villa",
    description: "",
    address: "",
    landmark: "",
    city: "",
    state: "",
    postalCode: "",
    permitId: "",
    contactEmail: "",
    contactPhone: "",
    lat: null,
    lng: null
  });

  // Step 2: Manually added room categories state
  const [roomsList, setRoomsList] = useState([]);

  // Modal state for adding or editing a room category
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [roomModalForm, setRoomModalForm] = useState(emptyRoomState);
  const [amenitySearch, setAmenitySearch] = useState("");
  const roomFileInputRef = useRef(null);

  // Updates basic property info state fields
  const handleBasicInfoChange = (field, val) => {
    setBasicInfo(prev => ({ ...prev, [field]: val }));
  };

  // Opens modal for adding or editing a room category
  const openAddRoomModal = (roomToEdit = null) => {
    if (roomToEdit) {
      setRoomModalForm({
        ...roomToEdit,
        quantity: String(roomToEdit.quantity),
        baseRate: String(roomToEdit.baseRate),
        weekendRate: String(roomToEdit.weekendRate || roomToEdit.baseRate),
        guests: String(roomToEdit.guests),
        maxAdults: String(roomToEdit.maxAdults || roomToEdit.guests),
        maxChildren: String(roomToEdit.maxChildren || 0),
        bedrooms: String(roomToEdit.bedrooms || 1),
        beds: String(roomToEdit.beds || 1),
        bathrooms: String(roomToEdit.bathrooms || 1),
        wifiName: roomToEdit.wifiName || "",
        wifiPassword: roomToEdit.wifiPassword || "",
        amenities: roomToEdit.amenities || ["WiFi", "Air conditioning"],
        photos: roomToEdit.photos || []
      });
    } else {
      setRoomModalForm({
        ...emptyRoomState,
        id: Date.now(),
        name: `Room #${roomsList.length + 1}`
      });
    }
    setAmenitySearch("");
    setShowRoomModal(true);
  };

  // Toggles room amenity selection inside room modal
  const handleToggleRoomAmenity = (item) => {
    setRoomModalForm(prev => {
      const exists = prev.amenities.includes(item);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter(a => a !== item)
          : [...prev.amenities, item]
      };
    });
  };

  // Toggles property amenity selection
  const handleTogglePropertyAmenity = (item) => {
    setSelectedPropertyAmenities(prev =>
      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item]
    );
  };

  // Handles room photo file selection and converts to Data URLs
  const handleRoomPhotoUpload = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPhotos = [];
    let processedCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (event) => {
        newPhotos.push(event.target.result);
        processedCount++;
        if (processedCount === files.length) {
          setRoomModalForm(prev => ({
            ...prev,
            photos: [...prev.photos, ...newPhotos]
          }));
          toast.success(`${files.length} room photo(s) added!`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Removes a photo from room modal form
  const handleRemoveRoomPhoto = (index) => {
    setRoomModalForm(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  // Saves room form to rooms list state
  const handleSaveRoomModal = (e) => {
    e.preventDefault();
    if (!roomModalForm.name.trim()) {
      toast.error("Please enter a room category name.");
      return;
    }
    if (!roomModalForm.baseRate || Number(roomModalForm.baseRate) <= 0) {
      toast.error("Please enter a valid nightly rate.");
      return;
    }
    if (!roomModalForm.amenities || roomModalForm.amenities.length === 0) {
      toast.error("Please select at least 1 room amenity for this room category.");
      return;
    }
    if (!roomModalForm.photos || roomModalForm.photos.length === 0) {
      toast.error("Please upload at least 1 photo for this room category.");
      return;
    }

    const formattedRoom = {
      id: roomModalForm.id || Date.now(),
      name: roomModalForm.name.trim(),
      quantity: Math.max(1, Number(roomModalForm.quantity) || 1),
      baseRate: Number(roomModalForm.baseRate) || 0,
      weekendRate: Number(roomModalForm.weekendRate) || Number(roomModalForm.baseRate) || 0,
      guests: Number(roomModalForm.guests) || 2,
      maxAdults: Number(roomModalForm.maxAdults) || Number(roomModalForm.guests) || 2,
      maxChildren: Number(roomModalForm.maxChildren) || 0,
      bedrooms: Number(roomModalForm.bedrooms) || 1,
      beds: Number(roomModalForm.beds) || 1,
      bedType: roomModalForm.bedType || "King",
      bathrooms: Number(roomModalForm.bathrooms) || 1,
      bathroomType: roomModalForm.bathroomType || "Private",
      unitNumbers: roomModalForm.unitNumbers?.trim() || "",
      wifiName: roomModalForm.wifiName?.trim() || "",
      wifiPassword: roomModalForm.wifiPassword?.trim() || "",
      amenities: roomModalForm.amenities || [],
      photos: roomModalForm.photos || []
    };

    setRoomsList(prev => {
      const exists = prev.some(r => r.id === formattedRoom.id);
      if (exists) {
        return prev.map(r => (r.id === formattedRoom.id ? formattedRoom : r));
      }
      return [...prev, formattedRoom];
    });

    setShowRoomModal(false);
    toast.success(`Room "${formattedRoom.name}" saved successfully!`);
  };

  // Removes a room category from rooms list
  const handleDeleteRoom = (id) => {
    if (roomsList.length <= 1) {
      toast.warning("Property must have at least 1 room category.");
      return;
    }
    setRoomsList(prev => prev.filter(r => r.id !== id));
  };

  // Validates Step 1 fields before advancing to Step 2
  const handleNextStep = (e) => {
    e.preventDefault();
    if (!basicInfo.name.trim()) {
      toast.error("Please enter property name.");
      return;
    }
    if (!basicInfo.state) {
      toast.error("Please select a state / UT.");
      return;
    }
    setCurrentStep(2);
  };

  // Submits complete property and room inventory payload to backend API
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (roomsList.length === 0) {
      toast.error("Please add at least 1 room category to your property.");
      return;
    }

    setLoading(true);
    try {
      const totalRoomsCount = roomsList.reduce((sum, r) => sum + (Number(r.quantity) || 1), 0);
      const primaryBaseRate = Number(roomsList[0]?.baseRate) || 3500;

      // Extract all unique room amenities for property-level compatibility fallback
      const allRoomAmenities = Array.from(
        new Set(roomsList.flatMap(r => r.amenities || []))
      );

      const finalPropertyAmenities = skipPropertyAmenities ? [] : selectedPropertyAmenities;

      const roomTypesArray = roomsList.map(r => ({
        id: r.id,
        name: r.name,
        description: `Room at ${basicInfo.name}`,
        quantity: r.quantity,
        guests: r.guests,
        maxAdults: r.maxAdults,
        maxChildren: r.maxChildren,
        bedrooms: r.bedrooms,
        beds: r.beds,
        bedType: r.bedType,
        bathrooms: r.bathrooms,
        bathroomType: r.bathroomType,
        unitNumbers: r.unitNumbers,
        baseRate: r.baseRate,
        weekendRate: r.weekendRate,
        wifiName: r.wifiName,
        wifiPassword: r.wifiPassword,
        amenities: r.amenities,
        photos: r.photos,
        status: "Active"
      }));

      // Find primary Wi-Fi details from first room with Wi-Fi set
      const primaryWifiRoom = roomsList.find(r => r.wifiName) || {};

      const operationsObj = {
        checkIn: "2:00 PM",
        checkOut: "11:00 AM",
        checkInMethod: "Host check-in",
        houseRules: "Standard house rules apply. Quiet hours after 10 PM. No smoking indoors.",
        wifiName: primaryWifiRoom.wifiName || "",
        wifiPassword: primaryWifiRoom.wifiPassword || "",
        amenities: finalPropertyAmenities
      };

      const payload = {
        name: basicInfo.name,
        type: basicInfo.type,
        description: basicInfo.description,
        address: basicInfo.address,
        landmark: basicInfo.landmark,
        city: basicInfo.city,
        state: basicInfo.state,
        postalCode: basicInfo.postalCode,
        permitId: basicInfo.permitId,
        contactEmail: basicInfo.contactEmail,
        contactPhone: basicInfo.contactPhone,
        baseRate: primaryBaseRate,
        isEntireVilla: basicInfo.type === "Villa" || basicInfo.type === "Homestay",
        rooms: totalRoomsCount,
        lat: basicInfo.lat,
        lng: basicInfo.lng,
        roomTypesJson: JSON.stringify(roomTypesArray),
        operationsJson: JSON.stringify(operationsObj),
        propertyAmenitiesJson: JSON.stringify(finalPropertyAmenities)
      };

      const response = await fetch(`${API_BASE_URL}/properties`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error("Failed to create property on server");
      }

      const data = await response.json();
      toast.success("🎉 Property & room inventory created successfully!");

      if (onCreated) {
        onCreated({
          ...data,
          roomTypes: JSON.stringify(roomTypesArray),
          channels: []
        });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to create property. Make sure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-property-page">
      <div className="create-property-page-header">
        <button type="button" className="create-property-back" onClick={onBack}>
          <FiArrowLeft /> Back to Properties
        </button>

        <div className="create-property-heading">
          <h1>Add New Property</h1>
          <p>Create a property listing and setup room inventory in 2 simple steps.</p>
        </div>

        {/* Wizard progress steps bar */}
        <div className="wiz-steps-bar">
          <div className={`wiz-step-pill ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}>
            <span className="wiz-num">{currentStep > 1 ? "✓" : "1"}</span>
            <span>1. Property Information & Address</span>
          </div>

          <div className="wiz-step-line" />

          <div className={`wiz-step-pill ${currentStep === 2 ? "active" : ""}`}>
            <span className="wiz-num">2</span>
            <span>2. Room Inventory, Amenities & Photos</span>
          </div>
        </div>
      </div>

      <div className="create-property-card">
        {/* STEP 1: PROPERTY INFORMATION & ADDRESS */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep}>
            <div className="create-property-card-section">
              <h2>Property Basic Information</h2>
              <p className="create-property-section-description">
                Enter your property identity, classification, and contact details.
              </p>

              <div className="create-property-form-grid">
                <label className="create-property-field-full">
                  Property Name *
                  <input
                    type="text"
                    required
                    value={basicInfo.name}
                    onChange={(e) => handleBasicInfoChange("name", e.target.value)}
                    placeholder="e.g. Sunset Villa Coorg, Pine Tree Homestay"
                  />
                </label>

                <label>
                  Property Type *
                  <select
                    value={basicInfo.type}
                    onChange={(e) => handleBasicInfoChange("type", e.target.value)}
                  >
                    <option value="Homestay">Homestay</option>
                    <option value="Villa">Villa / Private Home</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Resort">Resort</option>
                    <option value="Apartment">Apartment / Flat</option>
                    <option value="Guest House">Guest House</option>
                  </select>
                </label>

                <label>
                  Government Permit / Tourism License ID
                  <input
                    type="text"
                    value={basicInfo.permitId}
                    onChange={(e) => handleBasicInfoChange("permitId", e.target.value)}
                    placeholder="e.g. KA-TOUR-2026-889"
                  />
                </label>

                <label className="create-property-field-full">
                  Property Summary / Description
                  <textarea
                    value={basicInfo.description}
                    onChange={(e) => handleBasicInfoChange("description", e.target.value)}
                    placeholder="Describe your property location, ambience, surroundings, and hospitality experience..."
                    rows="3"
                  />
                </label>
              </div>
            </div>

            <div className="create-property-card-section">
              <h2>Property Location & Address</h2>
              <p className="create-property-section-description">
                Provide precise street address details for map navigation and guest invoices.
              </p>

              <div className="create-property-form-grid">
                <label className="create-property-field-full">
                  Street Address *
                  <input
                    type="text"
                    required
                    value={basicInfo.address}
                    onChange={(e) => handleBasicInfoChange("address", e.target.value)}
                    placeholder="e.g. 12/B Plantation Road, near Raja Seat"
                  />
                </label>

                <label>
                  Landmark / Locality
                  <input
                    type="text"
                    value={basicInfo.landmark}
                    onChange={(e) => handleBasicInfoChange("landmark", e.target.value)}
                    placeholder="e.g. Near Bus Stand / Opposite SBI"
                  />
                </label>

                <label>
                  City / Town *
                  <input
                    type="text"
                    required
                    value={basicInfo.city}
                    onChange={(e) => handleBasicInfoChange("city", e.target.value)}
                    placeholder="e.g. Madikeri, Chikmagalur"
                  />
                </label>

                <label>
                  State / UT *
                  <select
                    required
                    value={basicInfo.state}
                    onChange={(e) => handleBasicInfoChange("state", e.target.value)}
                  >
                    <option value="">Select State / UT</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Kerala">Kerala</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Goa">Goa</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Uttarakhand">Uttarakhand</option>
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Other">Other State / UT</option>
                  </select>
                </label>

                <label>
                  Postal Code (Pincode)
                  <input
                    type="text"
                    value={basicInfo.postalCode}
                    onChange={(e) => handleBasicInfoChange("postalCode", e.target.value)}
                    placeholder="e.g. 571201"
                  />
                </label>

                <label>
                  Contact Phone *
                  <input
                    type="tel"
                    required
                    value={basicInfo.contactPhone}
                    onChange={(e) => handleBasicInfoChange("contactPhone", e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                </label>

                <label>
                  Contact Email
                  <input
                    type="email"
                    value={basicInfo.contactEmail}
                    onChange={(e) => handleBasicInfoChange("contactEmail", e.target.value)}
                    placeholder="host@property.com"
                  />
                </label>
              </div>

              {/* Interactive OpenStreetMap Location Picker with Nominatim Auto-Geocoding */}
              <PropertyLocationPicker
                address={basicInfo.address}
                city={basicInfo.city}
                state={basicInfo.state}
                postalCode={basicInfo.postalCode}
                lat={basicInfo.lat}
                lng={basicInfo.lng}
                onChange={({ lat, lng }) => {
                  setBasicInfo((prev) => ({ ...prev, lat, lng }));
                }}
              />
            </div>

            <div className="create-property-actions">
              <button type="button" className="create-property-cancel" onClick={onBack}>
                Cancel
              </button>
              <button type="submit" className="create-property-submit">
                Continue to Step 2: Room Inventory →
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: ROOM INVENTORY, ROOM AMENITIES, WI-FI & PHOTOS */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit}>
            <div className="create-property-card-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h2>Room Inventory & Nightly Rates</h2>
                  <p className="create-property-section-description" style={{ margin: 0 }}>
                    Add your room categories. Each room can have its own photos, amenities, Wi-Fi password, and pricing.
                  </p>
                </div>

                <button
                  type="button"
                  className="wiz-add-cat-btn"
                  style={{ width: "auto" }}
                  onClick={() => openAddRoomModal()}
                >
                  <FiPlus /> Add Room Category
                </button>
              </div>

              {roomsList.length === 0 ? (
                <div style={{ padding: 28, textAlign: "center", background: "#F8FAFC", borderRadius: 8, border: "1px dashed #CBD5E1", color: "#64748B", fontSize: 13 }}>
                  No room added yet. Click <strong>"+ Add Room Category"</strong> to setup your first room.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {roomsList.map((room) => (
                    <div key={room.id} className="wiz-unit-box" style={{ margin: 0, padding: "18px 20px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0F172A" }}>{room.name}</h3>
                            <span style={{ background: "#E0F2FE", color: "#0369A1", fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 12 }}>
                              {room.quantity} {room.quantity === 1 ? "Unit" : "Units"}
                            </span>
                          </div>

                          <div style={{ fontSize: 12.5, color: "#64748B", display: "flex", gap: 14, flexWrap: "wrap" }}>
                            <span><strong>₹{Number(room.baseRate).toLocaleString("en-IN")}</strong> / night</span>
                            <span>{room.guests} Guests max ({room.maxAdults} Adults{room.maxChildren ? `, ${room.maxChildren} Child` : ""})</span>
                            <span>{room.beds} Bed ({room.bedType}) · {room.bathrooms} Bath</span>
                            {room.unitNumbers && <span>Units: {room.unitNumbers}</span>}
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            type="button"
                            className="create-property-cancel"
                            style={{ height: 32, padding: "0 12px", fontSize: 12 }}
                            onClick={() => openAddRoomModal(room)}
                          >
                            <FiEdit2 size={12} /> Edit Room
                          </button>

                          <button
                            type="button"
                            className="wiz-del-btn"
                            style={{ height: 32, padding: "0 10px" }}
                            onClick={() => handleDeleteRoom(room.id)}
                          >
                            <FiTrash2 size={12} /> Remove
                          </button>
                        </div>
                      </div>

                      {/* Wi-Fi Details Badge */}
                      {(room.wifiName || room.wifiPassword) && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#EEF2FF", border: "1px solid #C7D2FE", borderRadius: 6, padding: "4px 10px", fontSize: 12, color: "#4338CA", marginTop: 6, marginBottom: 8 }}>
                          <FiWifi size={13} />
                          <span><strong>Wi-Fi:</strong> {room.wifiName || "Network"}</span>
                          {room.wifiPassword && <span>· <strong>Password:</strong> {room.wifiPassword}</span>}
                        </div>
                      )}

                      {/* Room Amenities Chips Preview */}
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="wiz-chips-wrap" style={{ marginTop: 8 }}>
                          {room.amenities.map(a => (
                            <span key={a} style={{ background: "#F1F5F9", color: "#334155", padding: "3px 9px", borderRadius: 12, fontSize: 11.5, fontWeight: 600 }}>
                              {a}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Room Photos Thumbnails */}
                      {room.photos && room.photos.length > 0 && (
                        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                          {room.photos.map((pUrl, pIdx) => (
                            <img
                              key={pIdx}
                              src={pUrl}
                              alt={`${room.name} photo ${pIdx + 1}`}
                              style={{ width: 60, height: 48, objectFit: "cover", borderRadius: 6, border: "1px solid #CBD5E1" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PROPERTY-WIDE AMENITIES CARD */}
            <div className="create-property-card-section">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
                <div>
                  <h2>Property Amenities & Facilities</h2>
                  <p className="create-property-section-description" style={{ margin: 0 }}>
                    Select property-wide features available to guests across the entire property (e.g. Swimming Pool, Free Parking, Power Backup, Security).
                  </p>
                </div>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "8px 14px",
                    background: skipPropertyAmenities ? "#EFF6FF" : "#F8FAFC",
                    border: `1px solid ${skipPropertyAmenities ? "#93C5FD" : "#CBD5E1"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    color: skipPropertyAmenities ? "#1D4ED8" : "#475569",
                    userSelect: "none"
                  }}
                >
                  <input
                    type="checkbox"
                    checked={skipPropertyAmenities}
                    onChange={(e) => setSkipPropertyAmenities(e.target.checked)}
                    style={{ width: 16, height: 16, cursor: "pointer" }}
                  />
                  <span>Skip Property Amenities for now</span>
                </label>
              </div>

              {skipPropertyAmenities ? (
                <div style={{ padding: "18px 20px", background: "#F1F5F9", borderRadius: 8, color: "#64748B", fontSize: 13 }}>
                  ⚡ <strong>Property amenities skipped.</strong> Your public storefront and PMS will not show property-level amenities yet. You can edit and add property amenities anytime later from property settings.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  {PROPERTY_AMENITY_CATEGORIES.map((catObj) => (
                    <div key={catObj.category} style={{ background: "#FAFAFA", borderRadius: 8, padding: 16, border: "1px solid #F1F5F9" }}>
                      <h4 style={{ margin: "0 0 10px 0", fontSize: 13.5, fontWeight: 700, color: "#334155", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        {catObj.category}
                      </h4>
                      <div className="wiz-chips-grid">
                        {catObj.items.map((item) => {
                          const isSelected = selectedPropertyAmenities.includes(item);
                          return (
                            <button
                              key={item}
                              type="button"
                              className={`wiz-chip-btn ${isSelected ? "selected" : ""}`}
                              onClick={() => handleTogglePropertyAmenity(item)}
                            >
                              <span className="wiz-chip-check">{isSelected ? "✓" : "+"}</span>
                              <span>{item}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="create-property-actions">
              <button
                type="button"
                className="create-property-cancel"
                onClick={() => setCurrentStep(1)}
              >
                ← Back to Step 1
              </button>

              <button
                type="submit"
                className="create-property-submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FiLoader className="spin-icon" /> Creating Property...
                  </>
                ) : (
                  <>
                    <FiCheck /> Save & Create Property 🎉
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ADD / EDIT ROOM CATEGORY MODAL */}
      {showRoomModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: 20
          }}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              width: "100%",
              maxWidth: 680,
              maxHeight: "90vh",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "16px 22px",
                borderBottom: "1px solid #E2E8F0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#F8FAFC"
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: "#0F172A" }}>
                  {roomModalForm.id ? "Edit Room Category" : "Add Room Category"}
                </h3>
                <span style={{ fontSize: 12, color: "#64748B" }}>Setup rates, capacity, Wi-Fi credentials, photos and room amenities.</span>
              </div>
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                style={{ background: "transparent", border: 0, cursor: "pointer", color: "#64748B" }}
              >
                <FiX size={20} />
              </button>
            </div>

            {/* Modal Form Scrollable Body */}
            <form onSubmit={handleSaveRoomModal} style={{ padding: 22, overflowY: "auto", flex: 1 }}>
              {/* SECTION 1: BASIC INFO & PRICING */}
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                1. Basic Info & Nightly Rates
              </h4>
              <div className="create-property-form-grid">
                <label className="create-property-field-full">
                  Room Category Name *
                  <input
                    type="text"
                    required
                    value={roomModalForm.name}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Deluxe King Room, Executive Suite, Whole Villa"
                  />
                </label>

                <label>
                  Number of Units *
                  <input
                    type="number"
                    min="1"
                    required
                    value={roomModalForm.quantity}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, quantity: e.target.value }))}
                  />
                </label>

                <label>
                  Nightly Base Rate (₹) *
                  <input
                    type="number"
                    min="0"
                    required
                    value={roomModalForm.baseRate}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, baseRate: e.target.value }))}
                    placeholder="3500"
                  />
                </label>

                <label>
                  Weekend Rate (₹)
                  <input
                    type="number"
                    min="0"
                    value={roomModalForm.weekendRate}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, weekendRate: e.target.value }))}
                    placeholder="4000"
                  />
                </label>

                <label>
                  Room Numbers / Names (Optional)
                  <input
                    type="text"
                    value={roomModalForm.unitNumbers}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, unitNumbers: e.target.value }))}
                    placeholder="e.g. 101, 102, 103"
                  />
                </label>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #E2E8F0", margin: "20px 0" }} />

              {/* SECTION 2: CAPACITY & BEDDING */}
              <h4 style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                2. Capacity & Bed Configuration
              </h4>
              <div className="create-property-form-grid">
                <label>
                  Max Adults Capacity
                  <input
                    type="number"
                    min="1"
                    value={roomModalForm.maxAdults}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, maxAdults: e.target.value, guests: e.target.value }))}
                  />
                </label>

                <label>
                  Max Children Capacity
                  <input
                    type="number"
                    min="0"
                    value={roomModalForm.maxChildren}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, maxChildren: e.target.value }))}
                  />
                </label>

                <label>
                  Bed Configuration
                  <select
                    value={roomModalForm.bedType}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, bedType: e.target.value }))}
                  >
                    <option value="King">King Bed</option>
                    <option value="Queen">Queen Bed</option>
                    <option value="Twin">Twin Beds</option>
                    <option value="Single">Single Bed</option>
                    <option value="King + Single">King + Single</option>
                  </select>
                </label>

                <label>
                  Bathroom Type
                  <select
                    value={roomModalForm.bathroomType}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, bathroomType: e.target.value }))}
                  >
                    <option value="Private">Private Bathroom</option>
                    <option value="Shared">Shared Bathroom</option>
                  </select>
                </label>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #E2E8F0", margin: "20px 0" }} />

              {/* SECTION 3: ROOM WI-FI CREDENTIALS */}
              <h4 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6 }}>
                <FiWifi size={14} color="#4F46E5" /> 3. Room Wi-Fi Credentials
              </h4>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748B" }}>
                Guests can view these Wi-Fi credentials on their digital check-in voucher & invoice.
              </p>
              <div className="create-property-form-grid">
                <label>
                  Wi-Fi Network Name (SSID)
                  <input
                    type="text"
                    value={roomModalForm.wifiName}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, wifiName: e.target.value }))}
                    placeholder="e.g. StayOps_Villa_5G"
                  />
                </label>

                <label>
                  Wi-Fi Password
                  <input
                    type="text"
                    value={roomModalForm.wifiPassword}
                    onChange={(e) => setRoomModalForm(prev => ({ ...prev, wifiPassword: e.target.value }))}
                    placeholder="e.g. StayOpsGuest2026"
                  />
                </label>
              </div>

              <hr style={{ border: 0, borderTop: "1px solid #E2E8F0", margin: "20px 0" }} />

              {/* SECTION 4: ROOM AMENITIES */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  4. Room Amenities & Facilities * <span style={{ color: "#DC2626", textTransform: "none", fontSize: 11, fontWeight: 600 }}>(At least 1 required)</span>
                </h4>

                <div className="wiz-amenity-search-box">
                  <FiSearch size={13} color="#64748B" />
                  <input
                    type="text"
                    placeholder="Search amenities..."
                    value={amenitySearch}
                    onChange={(e) => setAmenitySearch(e.target.value)}
                  />
                </div>
              </div>

              {ROOM_AMENITY_CATEGORIES.map((cat, cIdx) => {
                const filteredItems = cat.items.filter(i =>
                  i.toLowerCase().includes(amenitySearch.toLowerCase())
                );
                if (filteredItems.length === 0) return null;

                return (
                  <div key={cIdx} style={{ marginBottom: 14 }}>
                    <span className="wiz-category-label">{cat.category}</span>
                    <div className="wiz-chips-wrap">
                      {filteredItems.map(item => {
                        const isSelected = roomModalForm.amenities.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            className={`wiz-chip ${isSelected ? "selected" : ""}`}
                            onClick={() => handleToggleRoomAmenity(item)}
                          >
                            {isSelected && <span className="wiz-chip-check">✓</span>}
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <hr style={{ border: 0, borderTop: "1px solid #E2E8F0", margin: "20px 0" }} />

              {/* SECTION 5: ROOM PHOTOS */}
              <h4 style={{ margin: "0 0 4px", fontSize: 13, fontWeight: 800, color: "#0F172A", textTransform: "uppercase", letterSpacing: "0.5px", display: "flex", alignItems: "center", gap: 6 }}>
                <FiImage size={14} color="#08a8b8" /> 5. Room Photos * <span style={{ color: "#DC2626", textTransform: "none", fontSize: 11, fontWeight: 600 }}>(At least 1 photo required)</span>
              </h4>
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#64748B" }}>
                Upload photos specific to this room category.
              </p>

              <div>
                <input
                  type="file"
                  ref={roomFileInputRef}
                  style={{ display: "none" }}
                  accept="image/*"
                  multiple
                  onChange={handleRoomPhotoUpload}
                />
                <button
                  type="button"
                  className="wiz-add-cat-btn"
                  style={{ width: "auto", padding: "8px 14px", fontSize: 12 }}
                  onClick={() => roomFileInputRef.current?.click()}
                >
                  <FiUpload /> Upload Room Photos
                </button>

                {roomModalForm.photos && roomModalForm.photos.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
                    {roomModalForm.photos.map((pUrl, idx) => (
                      <div key={idx} style={{ position: "relative", width: 85, height: 65, borderRadius: 8, overflow: "hidden", border: "1px solid #CBD5E1" }}>
                        <img src={pUrl} alt={`Room photo ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomPhoto(idx)}
                          style={{ position: "absolute", top: 3, right: 3, background: "rgba(0,0,0,0.65)", color: "#fff", border: 0, borderRadius: "50%", width: 18, height: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          <FiX size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 24, paddingTop: 14, borderTop: "1px solid #E2E8F0" }}>
                <button
                  type="button"
                  className="create-property-cancel"
                  onClick={() => setShowRoomModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="create-property-submit"
                >
                  Save Room Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}