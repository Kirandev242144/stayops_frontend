import React from 'react';
import {
  FiWifi,
  FiZap,
  FiShield,
  FiCoffee,
  FiSun,
  FiActivity,
  FiWind,
  FiClock,
  FiCheckCircle,
  FiTv,
  FiTruck,
  FiHeart
} from 'react-icons/fi';

const getAmenityIcon = (name = "") => {
  const lower = String(name).toLowerCase();
  if (lower.includes("wifi") || lower.includes("wi-fi") || lower.includes("internet")) return <FiWifi size={22} />;
  if (lower.includes("park")) return <FiTruck size={22} />;
  if (lower.includes("kitchen") || lower.includes("cook") || lower.includes("restaurant") || lower.includes("food") || lower.includes("dining") || lower.includes("cafe") || lower.includes("bar")) return <FiCoffee size={22} />;
  if (lower.includes("garden") || lower.includes("lawn") || lower.includes("nature") || lower.includes("fire") || lower.includes("terrace")) return <FiSun size={22} />;
  if (lower.includes("power") || lower.includes("generator") || lower.includes("backup")) return <FiZap size={22} />;
  if (lower.includes("security") || lower.includes("cctv") || lower.includes("safe")) return <FiShield size={22} />;
  if (lower.includes("pool") || lower.includes("swim")) return <FiHeart size={22} />;
  if (lower.includes("gym") || lower.includes("fitness") || lower.includes("spa")) return <FiActivity size={22} />;
  if (lower.includes("air") || lower.includes("ac")) return <FiWind size={22} />;
  if (lower.includes("desk") || lower.includes("reception") || lower.includes("caretaker") || lower.includes("check-in") || lower.includes("housekeeping")) return <FiClock size={22} />;
  if (lower.includes("tv")) return <FiTv size={22} />;
  return <FiCheckCircle size={22} />;
};

const getAmenityDescription = (name = "") => {
  const lower = String(name).toLowerCase();
  if (lower.includes("wifi") || lower.includes("wi-fi")) return "Fast WiFi across every room & cottage";
  if (lower.includes("kitchen") || lower.includes("cook") || lower.includes("restaurant") || lower.includes("food")) return "Cook or dine at your own pace";
  if (lower.includes("park")) return "Free private parking for guests";
  if (lower.includes("garden") || lower.includes("lawn") || lower.includes("nature")) return "Outdoor green space to unwind";
  if (lower.includes("power") || lower.includes("generator") || lower.includes("backup")) return "24/7 uninterrupted power backup";
  if (lower.includes("security") || lower.includes("cctv")) return "Gated 24/7 safe & secure property";
  if (lower.includes("pool") || lower.includes("swim")) return "Refreshing swimming pool with scenic views";
  if (lower.includes("pet")) return "Well-behaved pets are welcome";
  if (lower.includes("check-in") || lower.includes("caretaker") || lower.includes("reception")) return "Seamless arrival on your schedule";
  if (lower.includes("air") || lower.includes("ac")) return "Climate controlled comfortable stay";
  return "Provided for guest comfort & convenience";
};

export default function StorefrontAmenities({ amenities, isEditor, onSectionClick }) {
  const hasAmenities = Array.isArray(amenities) && amenities.length > 0;
  if (!hasAmenities && !isEditor) return null;

  return (
    <section className="sf-amenities-minimal-section">
      <div className="sf-amenities-minimal-header">
        <span className="sf-amenities-minimal-subtitle">CULINARY & AMENITIES</span>
        <h2 className="sf-amenities-minimal-title">The world's greatest amenities, drawn here to share.</h2>
      </div>

      {!hasAmenities ? (
        <div className="sf-amenities-empty-placeholder" onClick={onSectionClick}>
          <p>No property amenities added yet.</p>
          <button type="button" className="sf-btn-add-amenities-hint">
            + Browse & Add Pre-Made Amenities
          </button>
        </div>
      ) : (
        <div className="sf-amenities-minimal-grid">
          {amenities.map((item, idx) => {
            const name = typeof item === 'string' ? item : (item?.name || String(item));
            if (!name) return null;

            return (
              <div key={idx} className="sf-amenity-minimal-card">
                <div className="sf-amenity-minimal-icon">
                  {getAmenityIcon(name)}
                </div>
                <h3 className="sf-amenity-minimal-card-title">{name}</h3>
                <p className="sf-amenity-minimal-card-desc">{getAmenityDescription(name)}</p>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}


