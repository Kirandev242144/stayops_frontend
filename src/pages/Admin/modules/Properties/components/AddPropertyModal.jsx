import React, { useState } from "react";
import AdminModal from "../../../components/common/AdminModal";
import { FiPlus, FiHome, FiMapPin, FiUser, FiGlobe } from "react-icons/fi";
import { toast } from "react-toastify";
import "./AddPropertyModal.css";

const CATEGORIES = [
  "Heritage Homestay",
  "Luxury Villa",
  "Nature Resort",
  "Boutique Hotel",
  "Colonial Villa",
  "Eco Lodge",
  "Serviced Apartment",
];

const AddPropertyModal = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Heritage Homestay");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Karnataka");
  const [rooms, setRooms] = useState(8);
  const [baseRate, setBaseRate] = useState(4500);
  const [ownerName, setOwnerName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [slug, setSlug] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-slugify when property name changes
  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Property name is required.");
      return;
    }

    if (!city.trim()) {
      toast.error("City location is required.");
      return;
    }

    if (!ownerEmail.trim()) {
      toast.error("Owner email is required.");
      return;
    }

    setIsSubmitting(true);

    const generatedSlug = (slug.trim() || name.toLowerCase().replace(/[^a-z0-9]/g, "")).toLowerCase();
    const roomQty = Number(rooms) || 1;
    const rateVal = Number(baseRate) || 3500;

    const payload = {
      name: name.trim(),
      type: category,
      city: city.trim(),
      state: state.trim(),
      rooms: roomQty,
      baseRate: rateVal,
      contactEmail: ownerEmail.trim(),
      contactPhone: ownerPhone.trim() || "+91 98000 00000",
      description: `Newly registered ${category.toLowerCase()} in ${city}, ${state}.`,
      roomTypesJson: JSON.stringify([
        {
          id: "1",
          name: "Standard Room",
          quantity: roomQty,
          count: roomQty,
          baseRate: rateVal,
          rate: rateVal,
          maxAdults: 2,
          maxGuests: 2,
        },
      ]),
      propertyAmenitiesJson: JSON.stringify([
        "Free WiFi",
        "Free Parking",
        "24/7 Power Backup",
        "Housekeeping",
      ]),
      operationsJson: JSON.stringify({
        checkIn: "14:00",
        checkOut: "11:00",
        themeConfig: {
          subdomain: generatedSlug,
        },
      }),
    };

    try {
      await onAdd(payload);
      onClose();

      // Reset form
      setName("");
      setCity("");
      setOwnerName("");
      setOwnerEmail("");
      setOwnerPhone("");
      setSlug("");
    } catch (err) {
      // Error handled by parent toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Property"
      subtitle="Onboard a new hotel, villa, or homestay to the StayOps PMS platform."
      maxWidth="580px"
      footer={
        <>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            <FiPlus size={15} />
            <span>{isSubmitting ? "Registering..." : "Register Property"}</span>
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="add-prop-form">
        {/* Row 1: Name & Category */}
        <div className="add-prop-row">
          <div className="add-prop-group">
            <label htmlFor="prop-name-input">Property Name *</label>
            <input
              id="prop-name-input"
              type="text"
              placeholder="e.g. Whispering Pines Estate"
              value={name}
              onChange={handleNameChange}
              required
            />
          </div>

          <div className="add-prop-group">
            <label htmlFor="prop-cat-select">Category</label>
            <select
              id="prop-cat-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Location */}
        <div className="add-prop-row">
          <div className="add-prop-group">
            <label htmlFor="prop-city-input">City / Destination *</label>
            <input
              id="prop-city-input"
              type="text"
              placeholder="e.g. Coorg, Wayanad, Ooty"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
          </div>

          <div className="add-prop-group">
            <label htmlFor="prop-state-input">State</label>
            <input
              id="prop-state-input"
              type="text"
              value={state}
              onChange={(e) => setState(e.target.value)}
            />
          </div>
        </div>

        {/* Row 3: Inventory & Tariff */}
        <div className="add-prop-row">
          <div className="add-prop-group">
            <label htmlFor="prop-rooms-input">Room Units Count</label>
            <input
              id="prop-rooms-input"
              type="number"
              min="1"
              max="500"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
            />
          </div>

          <div className="add-prop-group">
            <label htmlFor="prop-rate-input">Base Rate per Night (INR)</label>
            <input
              id="prop-rate-input"
              type="number"
              min="500"
              step="100"
              value={baseRate}
              onChange={(e) => setBaseRate(e.target.value)}
            />
          </div>
        </div>

        {/* Row 4: Owner Info */}
        <div className="add-prop-row">
          <div className="add-prop-group">
            <label htmlFor="prop-owner-input">Owner Full Name</label>
            <input
              id="prop-owner-input"
              type="text"
              placeholder="e.g. Rajesh Kumar"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
            />
          </div>

          <div className="add-prop-group">
            <label htmlFor="prop-email-input">Owner Work Email *</label>
            <input
              id="prop-email-input"
              type="email"
              placeholder="owner@property.com"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Row 5: Contact Phone & Subdomain Slug */}
        <div className="add-prop-row">
          <div className="add-prop-group">
            <label htmlFor="prop-phone-input">Owner Mobile Phone</label>
            <input
              id="prop-phone-input"
              type="tel"
              placeholder="+91 98765 43210"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
            />
          </div>

          <div className="add-prop-group">
            <label htmlFor="prop-slug-input">Direct Storefront Subdomain</label>
            <div className="slug-input-wrapper">
              <input
                id="prop-slug-input"
                type="text"
                placeholder="my-resort"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
              />
              <span className="slug-suffix">.stayops.in</span>
            </div>
          </div>
        </div>
      </form>
    </AdminModal>
  );
};

export default AddPropertyModal;
