import React, { useMemo, useState } from "react";
import {
  FiArrowLeft,
  FiCheck,
  FiImage,
  FiPlus,
  FiUpload,
  FiWifi,
  FiCalendar,
  FiHome,
  FiDollarSign,
  FiX,
  FiTrash2,
  FiClock,
  FiFileText,
} from "react-icons/fi";

import "./PropertySetup.css";

const STEPS = [
  { id: "rooms", label: "Rooms & Units", icon: FiHome },
  { id: "photos", label: "Photos", icon: FiImage },
  { id: "amenities", label: "Amenities", icon: FiWifi },
  { id: "pricing", label: "Pricing", icon: FiDollarSign },
  { id: "operations", label: "Guest & Stay Rules", icon: FiCalendar },
];

const propertyAmenities = [
  "Wi-Fi", "Free parking", "Swimming pool", "Garden", "Restaurant",
  "Breakfast", "Air conditioning", "Pet friendly", "Wheelchair accessible",
  "Gym", "Spa", "BBQ", "Kitchen", "Laundry", "Room service",
];

const roomAmenities = [
  "Air conditioning", "Wi-Fi", "TV", "Private bathroom", "Hot water",
  "Balcony", "Mountain view", "Garden view", "Mini fridge", "Wardrobe",
  "Work desk", "Hair dryer", "Tea / coffee maker", "Room service",
];

const emptyRoomForm = {
  name: "",
  description: "",
  guests: 2,
  maxAdults: 2,
  maxChildren: 1,
  bedrooms: 1,
  beds: 1,
  bedType: "King",
  bathrooms: 1,
  bathroomType: "Private",
  quantity: 1,
  unitNumbers: "",
  selectedAmenities: ["Wi-Fi", "Private bathroom"],
  photos: [],
  unitCategory: "standard",
  linkedRoomIds: [],
};

const PropertySetup = ({ property, onBack, onComplete }) => {
  const [activeStep, setActiveStep] = useState("rooms");
  const [completed, setCompleted] = useState([]);

  const isEntirePropertyType = ["Villa", "Homestay", "Apartment"].includes(property?.type);

  const [rooms, setRooms] = useState(() => {
    if (isEntirePropertyType) {
      return [{
        id: Date.now(),
        name: `Entire ${property?.type || "Property"}`,
        description: `Full access to the ${property?.type?.toLowerCase() || "property"} including all bedrooms and private amenities.`,
        guests: 4,
        maxAdults: 4,
        maxChildren: 2,
        bedrooms: 2,
        beds: 3,
        bedType: "King + Single",
        bathrooms: 2,
        bathroomType: "Private",
        quantity: 1,
        unitNumbers: "1",
        selectedAmenities: ["Wi-Fi", "Private bathroom", "Kitchen", "Air conditioning"],
        photos: [],
        unitCategory: "standard",
        linkedRoomIds: [],
      }];
    }
    return [];
  });
  const [roomForm, setRoomForm] = useState(emptyRoomForm);
  const [showRoomForm, setShowRoomForm] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState(["Wi-Fi", "Free parking"]);
  const [propertyPhotos, setPropertyPhotos] = useState([]);
  const [pricing, setPricing] = useState({ roomRates: {}, minStay: 1, maxStay: 30 });
  const [operations, setOperations] = useState({
    checkIn: "2:00 PM",
    checkOut: "11:00 AM",
    checkInMethod: "Host check-in",
    checkInInstructions: "",
    houseRules: "",
  });

  const currentIndex = STEPS.findIndex((step) => step.id === activeStep);
  const currentStep = STEPS[currentIndex];
  const progress = Math.round((completed.length / STEPS.length) * 100);

  const setupSummary = useMemo(() => ({
    rooms: rooms.length,
    units: rooms.reduce((total, room) => total + Number(room.quantity || 0), 0),
    amenities: selectedAmenities.length,
    photos: propertyPhotos.length,
  }), [rooms, selectedAmenities, propertyPhotos]);

  const markComplete = (stepId = activeStep) => {
    setCompleted((current) => current.includes(stepId) ? current : [...current, stepId]);
  };

  const goNext = () => {
    markComplete();
    if (currentIndex < STEPS.length - 1) {
      setActiveStep(STEPS[currentIndex + 1].id);
      return;
    }
    onComplete?.({ rooms, selectedAmenities, propertyPhotos, pricing, operations });
  };

  const goPrevious = () => {
    if (currentIndex > 0) setActiveStep(STEPS[currentIndex - 1].id);
  };

  const updateRoomField = (field, value) => {
    setRoomForm((current) => ({ ...current, [field]: value }));
  };

  const toggleRoomAmenity = (amenity) => {
    setRoomForm((current) => ({
      ...current,
      selectedAmenities: current.selectedAmenities.includes(amenity)
        ? current.selectedAmenities.filter((item) => item !== amenity)
        : [...current.selectedAmenities, amenity],
    }));
  };

  const toggleLinkedRoom = (roomId) => {
    setRoomForm((current) => {
      const exists = current.linkedRoomIds.includes(roomId);
      return {
        ...current,
        linkedRoomIds: exists
          ? current.linkedRoomIds.filter((id) => id !== roomId)
          : [...current.linkedRoomIds, roomId],
      };
    });
  };

  const addRoom = (event) => {
    event.preventDefault();
    if (!roomForm.name.trim()) return;

    const room = {
      ...roomForm,
      id: Date.now(),
      name: roomForm.name.trim(),
      description: roomForm.description.trim(),
      guests: Number(roomForm.guests) || 1,
      maxAdults: Number(roomForm.maxAdults) || Number(roomForm.guests) || 1,
      maxChildren: Number(roomForm.maxChildren) || 0,
      bedrooms: Number(roomForm.bedrooms) || 1,
      beds: Number(roomForm.beds) || 1,
      bathrooms: Number(roomForm.bathrooms) || 1,
      unitNumbers: roomForm.unitNumbers?.trim() || "",
      quantity: roomForm.unitCategory === "composite" ? 1 : Math.max(1, Number(roomForm.quantity) || 1),
      unitCategory: roomForm.unitCategory,
      linkedRoomIds: roomForm.unitCategory === "composite" ? roomForm.linkedRoomIds : [],
    };

    setRooms((current) => [...current, room]);
    setRoomForm(emptyRoomForm);
    setShowRoomForm(false);
  };

  const removeRoom = (roomId) => {
    setRooms((current) => current.filter((room) => room.id !== roomId));
    setPricing((current) => {
      const nextRoomRates = { ...current.roomRates };
      delete nextRoomRates[roomId];
      return { ...current, roomRates: nextRoomRates };
    });
  };

  const togglePropertyAmenity = (amenity) => {
    setSelectedAmenities((current) => current.includes(amenity)
      ? current.filter((item) => item !== amenity)
      : [...current, amenity]);
  };

  const addFiles = (files, setter) => {
    const selected = Array.from(files || []).map((file) => ({
      id: `${file.name}-${file.lastModified}-${Math.random()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file: file,
    }));
    setter((current) => [...current, ...selected]);
  };

  const removePhoto = (photoId) => {
    setPropertyPhotos((current) => current.filter((photo) => photo.id !== photoId));
  };

  return (
    <div className="property-setup-page">
      <header className="property-setup-header">
        <button type="button" className="property-setup-back" onClick={onBack}>
          <FiArrowLeft /> Back to Properties
        </button>

        <div className="property-setup-heading">
          <div>
            <span className="property-setup-eyebrow">PROPERTY SETUP</span>
            <h1>{property?.name || "New Property"}</h1>
            <p>Set up the information StayOps can later send to OTAs. Channel connections are handled separately.</p>
          </div>
          <div className="property-setup-progress">
            <strong>{progress}%</strong>
            <span>Setup complete</span>
          </div>
        </div>
      </header>

      <div className="property-setup-shell">
        <aside className="property-setup-sidebar">
          <div className="property-setup-sidebar-title">
            <span>Setup checklist</span>
            <small>{completed.length}/{STEPS.length}</small>
          </div>

          <div className="property-setup-steps">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isComplete = completed.includes(step.id);
              return (
                <button
                  type="button"
                  key={step.id}
                  className={`property-setup-step ${isActive ? "active" : ""}`}
                  onClick={() => setActiveStep(step.id)}
                >
                  <span className={`property-setup-step-number ${isComplete ? "complete" : ""}`}>
                    {isComplete ? <FiCheck /> : index + 1}
                  </span>
                  <span className="property-setup-step-text">
                    <strong>{step.label}</strong>
                    <small>{isComplete ? "Completed" : isActive ? "In progress" : "Not started"}</small>
                  </span>
                  <Icon className="property-setup-step-icon" />
                </button>
              );
            })}
          </div>
        </aside>

        <main className="property-setup-content">
          <div className="property-setup-content-header">
            <div>
              <span>STEP {currentIndex + 1} OF {STEPS.length}</span>
              <h2>{currentStep.label}</h2>
            </div>
            <div className="property-setup-mini-summary">
              <span>{setupSummary.rooms} room types</span>
              <span>{setupSummary.units} units</span>
              <span>{setupSummary.amenities} amenities</span>
              <span>{setupSummary.photos} photos</span>
            </div>
          </div>

          {activeStep === "rooms" && (
            <section className="setup-section">
              <div className="setup-intro">
                <div>
                  <h3>Rooms & Units</h3>
                  <p>Create what guests can actually book. This is also the source for OTA capacity, beds, bathrooms, amenities and room photos.</p>
                </div>
                <button type="button" className="setup-primary-button" onClick={() => setShowRoomForm(true)}>
                  <FiPlus /> Add Room
                </button>
              </div>

              {rooms.length === 0 && !showRoomForm && (
                <div className="setup-empty-state">
                  <FiHome />
                  <strong>No rooms yet</strong>
                  <span>Add a room such as Couple Room, Family Room or Bedroom 1.</span>
                  <button type="button" className="setup-secondary-button" onClick={() => setShowRoomForm(true)}>
                    <FiPlus /> Add Room
                  </button>
                </div>
              )}

              {rooms.map((room) => {
                return (
                  <div className="setup-room-card" key={room.id}>
                    <div className="setup-room-card-main">
                      <div className="setup-room-title-row">
                        <div>
                          <h4>{room.name}</h4>
                          <p>{room.guests} guests · {room.bedrooms} bedroom{room.bedrooms === 1 ? "" : "s"} · {room.beds} {room.beds === 1 ? "bed" : "beds"} · {room.bathrooms} bathroom{room.bathrooms === 1 ? "" : "s"}</p>
                        </div>
                      </div>

                      {room.description && <div className="setup-room-description">{room.description}</div>}

                      <div className="setup-room-meta">
                        <span>{room.quantity} sellable {room.quantity === 1 ? "unit" : "units"}</span>
                        <span>{room.selectedAmenities.length} amenities</span>
                        <span>{room.photos.length} photos</span>
                      </div>
                    </div>
                    <button type="button" className="setup-icon-danger" title="Remove room type" onClick={() => removeRoom(room.id)}>
                      <FiTrash2 />
                    </button>
                  </div>
                );
              })}

              {showRoomForm && (
                <form className="setup-form-card setup-room-form" onSubmit={addRoom}>
                  <div className="setup-form-card-header">
                    <div>
                      <h4>Add Room</h4>
                      <p>Enter the room information once. StayOps can reuse it for direct bookings and connected OTAs.</p>
                    </div>
                    <button type="button" className="setup-icon-button" onClick={() => setShowRoomForm(false)}><FiX /></button>
                  </div>

                  <div className="setup-form-block">
                    <div className="setup-form-block-title">Room details</div>
                    <div className="setup-form-grid">
                      <label className="full"><span>Room Name *</span><input required value={roomForm.name} onChange={(e) => updateRoomField("name", e.target.value)} placeholder="e.g. Couple Room, Deluxe Room" /></label>
                      <label className="full"><span>Description</span><textarea rows="3" value={roomForm.description} onChange={(e) => updateRoomField("description", e.target.value)} placeholder="Describe this room, sleeping arrangement and what guests can expect." /></label>
                      <label><span>Total Guests Max *</span><input type="number" min="1" value={roomForm.guests} onChange={(e) => updateRoomField("guests", e.target.value)} /></label>
                      <label><span>Max Adults</span><input type="number" min="1" value={roomForm.maxAdults} onChange={(e) => updateRoomField("maxAdults", e.target.value)} /></label>
                      <label><span>Max Children</span><input type="number" min="0" value={roomForm.maxChildren} onChange={(e) => updateRoomField("maxChildren", e.target.value)} /></label>
                      <label><span>Bedrooms</span><input type="number" min="1" value={roomForm.bedrooms} onChange={(e) => updateRoomField("bedrooms", e.target.value)} /></label>
                      <label><span>Number of Beds</span><input type="number" min="1" value={roomForm.beds} onChange={(e) => updateRoomField("beds", e.target.value)} /></label>
                      <label><span>Bed Type</span><select value={roomForm.bedType} onChange={(e) => updateRoomField("bedType", e.target.value)}><option>King</option><option>Queen</option><option>Double</option><option>Single</option><option>Twin</option><option>King + Single</option><option>Multiple Beds</option></select></label>
                      <label><span>Bathrooms</span><input type="number" min="1" value={roomForm.bathrooms} onChange={(e) => updateRoomField("bathrooms", e.target.value)} /></label>
                      <label><span>Bathroom Type</span><select value={roomForm.bathroomType} onChange={(e) => updateRoomField("bathroomType", e.target.value)}><option>Private</option><option>Shared</option><option>Mix of private and shared</option></select></label>
                      <label><span>How many rooms do you have? *</span><input type="number" min="1" value={roomForm.quantity} onChange={(e) => updateRoomField("quantity", e.target.value)} placeholder="e.g. 3" /></label>
                      <label><span>Room Numbers / Names <small>(Optional)</small></span><input value={roomForm.unitNumbers} onChange={(e) => updateRoomField("unitNumbers", e.target.value)} placeholder="e.g. 101, 102, 103" /></label>
                    </div>
                  </div>

                  <div className="setup-form-block">
                    <div className="setup-form-block-title">Room amenities</div>
                    <div className="setup-amenity-grid room-amenities-grid">
                      {roomAmenities.map((amenity) => {
                        const selected = roomForm.selectedAmenities.includes(amenity);
                        return <button type="button" key={amenity} className={`setup-amenity ${selected ? "selected" : ""}`} onClick={() => toggleRoomAmenity(amenity)}><span>{selected && <FiCheck />}</span>{amenity}</button>;
                      })}
                    </div>
                  </div>

                  <div className="setup-form-block">
                    <div className="setup-form-block-title">Room photos</div>
                    <label className="setup-mini-upload">
                      <FiUpload /><span>Choose room photos</span><small>JPG, PNG or WEBP</small>
                      <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => addFiles(e.target.files, (updater) => setRoomForm((current) => ({ ...current, photos: typeof updater === "function" ? updater(current.photos) : updater })))} />
                    </label>
                    {roomForm.photos.length > 0 && <div className="setup-photo-grid">{roomForm.photos.map((photo) => <img key={photo.id} src={photo.url} alt={photo.name} />)}</div>}
                  </div>

                  <div className="setup-form-actions">
                    <button type="button" className="setup-secondary-button" onClick={() => setShowRoomForm(false)}>Cancel</button>
                    <button type="submit" className="setup-primary-button"><FiCheck /> Save Room</button>
                  </div>
                </form>
              )}
            </section>
          )}

          {activeStep === "photos" && (
            <section className="setup-section">
              <div className="setup-intro"><div><h3>Property Photos</h3><p>Add photos that represent the overall property. Room-specific photos stay with their room type.</p></div></div>
              <label className="setup-upload-zone">
                <div className="setup-upload-icon"><FiUpload /></div>
                <h4>Upload property photos</h4>
                <p>Add exterior, living areas, common spaces and other property-level photos.</p>
                <span className="setup-secondary-button"><FiImage /> Choose Photos</span>
                <small>JPG, PNG or WEBP · Use clear landscape photos where possible</small>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => addFiles(e.target.files, setPropertyPhotos)} />
              </label>

              {propertyPhotos.length > 0 ? (
                <div className="setup-photo-grid property-photo-grid">
                  {propertyPhotos.map((photo) => <div className="setup-photo-item" key={photo.id}><img src={photo.url} alt={photo.name} /><button type="button" onClick={() => removePhoto(photo.id)}><FiX /></button></div>)}
                </div>
              ) : (
                <div className="setup-photo-note"><FiImage /><div><strong>No property photos added yet.</strong><span>You can add them later without changing your room inventory.</span></div></div>
              )}
            </section>
          )}

          {activeStep === "amenities" && (
            <section className="setup-section">
              <div className="setup-intro"><div><h3>Property Amenities</h3><p>Select amenities available across the property. Room-specific amenities are configured inside each room type.</p></div></div>
              <div className="setup-amenity-grid">
                {propertyAmenities.map((amenity) => {
                  const selected = selectedAmenities.includes(amenity);
                  return <button type="button" key={amenity} className={`setup-amenity ${selected ? "selected" : ""}`} onClick={() => togglePropertyAmenity(amenity)}><span>{selected && <FiCheck />}</span>{amenity}</button>;
                })}
              </div>
            </section>
          )}

          {activeStep === "pricing" && (
            <section className="setup-section">
              <div className="setup-intro"><div><h3>Pricing</h3><p>Set the selling rate once for each room type. Channel Manager will use these rates later when syncing OTAs.</p></div></div>

              {rooms.length === 0 ? (
                <div className="setup-pricing-empty"><FiHome /><strong>Add a room type first</strong><span>Create at least one room before setting its rate.</span><button type="button" className="setup-secondary-button" onClick={() => setActiveStep("rooms")}><FiArrowLeft /> Back to Rooms & Units</button></div>
              ) : (
                <>
                  <div className="setup-pricing-list">
                    {rooms.map((room) => {
                      const roomRate = pricing.roomRates[room.id] || { baseRate: "", weekendRate: "" };
                      return <div className="setup-pricing-room" key={room.id}>
                        <div className="setup-pricing-room-header"><div><h4>{room.name}</h4><span>{room.quantity} sellable {room.quantity === 1 ? "unit" : "units"} • up to {room.guests} guests</span></div></div>
                        <div className="setup-form-grid">
                          <label><span>Base Nightly Rate *</span><div className="setup-input-prefix"><b>₹</b><input required type="number" min="0" value={roomRate.baseRate} onChange={(e) => setPricing((current) => ({ ...current, roomRates: { ...current.roomRates, [room.id]: { ...roomRate, baseRate: e.target.value } } }))} placeholder="7500" /></div></label>
                          <label><span>Weekend Rate</span><div className="setup-input-prefix"><b>₹</b><input type="number" min="0" value={roomRate.weekendRate} onChange={(e) => setPricing((current) => ({ ...current, roomRates: { ...current.roomRates, [room.id]: { ...roomRate, weekendRate: e.target.value } } }))} placeholder="Optional" /></div></label>
                        </div>
                      </div>;
                    })}
                  </div>

                  <div className="setup-pricing-stay">
                    <div className="setup-form-block-title">Stay limits</div>
                    <div className="setup-form-grid">
                      <label><span>Minimum Stay (nights)</span><input type="number" min="1" value={pricing.minStay} onChange={(e) => setPricing({ ...pricing, minStay: e.target.value })} /></label>
                      <label><span>Maximum Stay (nights)</span><input type="number" min="1" value={pricing.maxStay} onChange={(e) => setPricing({ ...pricing, maxStay: e.target.value })} /></label>
                    </div>
                  </div>

                  <div className="setup-note"><FiDollarSign /><span>Do not enter Airbnb or Booking.com prices here. This is your StayOps base selling price. Channel-specific markups and pricing rules belong in Channel Manager.</span></div>
                </>
              )}
            </section>
          )}

          {activeStep === "operations" && (
            <section className="setup-section">
              <div className="setup-intro"><div><h3>Guest & Stay Rules</h3><p>Set the basic operating information guests and future channel connections can use. Channel-specific settings stay in Channel Manager.</p></div></div>

              <div className="setup-form-block">
                <div className="setup-form-block-title"><FiClock /> Check-in & Check-out</div>
                <div className="setup-form-grid">
                  <label><span>Check-in Time</span><input type="time" value={operations.checkIn} onChange={(e) => setOperations({ ...operations, checkIn: e.target.value })} /></label>
                  <label><span>Check-out Time</span><input type="time" value={operations.checkOut} onChange={(e) => setOperations({ ...operations, checkOut: e.target.value })} /></label>
                  <label className="full"><span>Check-in Method</span><select value={operations.checkInMethod} onChange={(e) => setOperations({ ...operations, checkInMethod: e.target.value })}><option>Host check-in</option><option>Self check-in</option><option>Lockbox</option><option>Smart lock</option><option>Front desk</option></select></label>
                </div>
              </div>

              <div className="setup-form-block">
                <div className="setup-form-block-title"><FiFileText /> Guest information</div>
                <div className="setup-form-grid">
                  <label className="full"><span>Check-in Instructions</span><textarea rows="4" value={operations.checkInInstructions} onChange={(e) => setOperations({ ...operations, checkInInstructions: e.target.value })} placeholder="How should guests find the property, collect keys or enter?" /></label>
                  <label className="full"><span>House Rules</span><textarea rows="4" value={operations.houseRules} onChange={(e) => setOperations({ ...operations, houseRules: e.target.value })} placeholder="For example: no smoking, quiet hours, pets allowed, parties not allowed." /></label>
                </div>
              </div>

              <div className="setup-note"><FiCalendar /><span>These are property defaults. When you connect Airbnb or another OTA later, Channel Manager can map or override the channel-specific rules without changing your core property data.</span></div>
            </section>
          )}

          <div className="property-setup-footer">
            <button type="button" className="setup-secondary-button" disabled={currentIndex === 0} onClick={goPrevious}><FiArrowLeft /> Back</button>
            <div>
              <button type="button" className="setup-skip-button" onClick={goNext}>{currentIndex === STEPS.length - 1 ? "Finish Later" : "Skip for now"}</button>
              <button type="button" className="setup-primary-button" onClick={goNext}><FiCheck />{currentIndex === STEPS.length - 1 ? "Finish Setup" : "Save & Continue"}</button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default PropertySetup;
