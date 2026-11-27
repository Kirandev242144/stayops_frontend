import React from "react";
import AdminModal from "../../../components/common/AdminModal";
import AdminBadge from "../../../components/common/AdminBadge";
import { getStorefrontUrl } from "../utils/propertyUtils";
import {
  FiExternalLink,
  FiMapPin,
  FiPhone,
  FiMail,
  FiUser,
  FiHome,
  FiCheck,
  FiSlash,
  FiTag,
} from "react-icons/fi";
import "./PropertyDetailsModal.css";

const PropertyDetailsModal = ({
  isOpen,
  onClose,
  property,
  onApprove,
  onToggleStatus,
}) => {
  if (!property) return null;

  const publicUrl = getStorefrontUrl(property.slug);

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={property.name}
      subtitle={`Registry ID: ${property.code} • Registered on ${property.joinedDate}`}
      maxWidth="680px"
      footer={
        <div className="property-details-footer">
          <div className="details-footer-left">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="admin-btn admin-btn--secondary"
            >
              <span>View Public Storefront</span>
              <FiExternalLink size={14} />
            </a>
          </div>

          <div className="details-footer-right">
            {property.status === "review" && (
              <button
                type="button"
                className="admin-btn admin-btn--success"
                onClick={() => {
                  onApprove(property);
                  onClose();
                }}
              >
                <FiCheck size={15} />
                <span>Approve & Publish</span>
              </button>
            )}

            {property.status === "active" && (
              <button
                type="button"
                className="admin-btn admin-btn--danger"
                onClick={() => {
                  onToggleStatus(property);
                  onClose();
                }}
              >
                <FiSlash size={14} />
                <span>Suspend Property</span>
              </button>
            )}

            {property.status === "suspended" && (
              <button
                type="button"
                className="admin-btn admin-btn--primary"
                onClick={() => {
                  onToggleStatus(property);
                  onClose();
                }}
              >
                <FiCheck size={14} />
                <span>Reactivate Property</span>
              </button>
            )}

            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      }
    >
      <div className="prop-details-body">
        {/* Top Summary Banner */}
        <div className="prop-details-banner">
          <div className="prop-details-banner__info">
            <span className="prop-details-category">{property.category}</span>
            <div className="prop-details-loc">
              <FiMapPin size={14} className="text-muted" />
              <span>
                {property.city}, {property.state} - {property.pincode || "570001"}
              </span>
            </div>
          </div>
          <div className="prop-details-banner__status">
            <AdminBadge status={property.status} dot={true} />
          </div>
        </div>

        {/* 2-Column Key Metrics */}
        <div className="prop-metrics-grid">
          <div className="prop-metric-box">
            <span className="prop-metric-label">Room Inventory</span>
            <span className="prop-metric-val">{property.rooms} Room Units</span>
          </div>
          <div className="prop-metric-box">
            <span className="prop-metric-label">Base Nightly Tariff</span>
            <span className="prop-metric-val">₹{property.baseRate?.toLocaleString() || "3,500"}</span>
          </div>
          <div className="prop-metric-box">
            <span className="prop-metric-label">Max Guest Capacity</span>
            <span className="prop-metric-val">{property.maxGuests || property.rooms * 2} Guests</span>
          </div>
          <div className="prop-metric-box">
            <span className="prop-metric-label">Direct Subdomain</span>
            <span className="prop-metric-val text-teal">{property.slug}.stayops.in</span>
          </div>
        </div>

        {/* Owner Information Card */}
        <div className="prop-owner-card">
          <div className="prop-owner-card__header">
            <FiUser size={15} className="text-teal" />
            <span>Assigned Property Owner</span>
          </div>
          <div className="prop-owner-card__grid">
            <div>
              <span className="sub-label">Full Name:</span>
              <span className="sub-value">{property.ownerName}</span>
            </div>
            <div>
              <span className="sub-label">Work Email:</span>
              <a href={`mailto:${property.ownerEmail}`} className="sub-link">
                <FiMail size={12} />
                <span>{property.ownerEmail}</span>
              </a>
            </div>
            <div>
              <span className="sub-label">Contact Phone:</span>
              <a href={`tel:${property.ownerPhone}`} className="sub-link">
                <FiPhone size={12} />
                <span>{property.ownerPhone}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Room Types Breakdown */}
        {Array.isArray(property.roomTypes) && property.roomTypes.length > 0 && (
          <div className="prop-section">
            <h4 className="prop-section-title">
              <FiHome size={15} />
              <span>Configured Room Inventory</span>
            </h4>
            <div className="prop-room-types-list">
              {property.roomTypes.map((room, idx) => {
                const roomRate = room.rate ?? room.baseRate ?? property.baseRate ?? 0;
                const roomUnits = room.count ?? room.quantity ?? 1;
                const maxAdults = room.maxAdults ?? room.maxGuests ?? 2;

                return (
                  <div key={idx} className="prop-room-type-row">
                    <div className="prop-room-type-info">
                      <span className="room-type-name">{room.name}</span>
                      <span className="room-type-meta">
                        Max {maxAdults} Adults • {roomUnits} Units Available
                      </span>
                    </div>
                    <span className="room-type-rate">
                      ₹{Number(roomRate).toLocaleString()} <small>/ night</small>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Amenities List */}
        {Array.isArray(property.amenities) && property.amenities.length > 0 && (
          <div className="prop-section">
            <h4 className="prop-section-title">
              <FiTag size={15} />
              <span>Published Amenities</span>
            </h4>
            <div className="prop-amenities-tags">
              {property.amenities.map((item, idx) => (
                <span key={idx} className="prop-amenity-chip">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
};

export default PropertyDetailsModal;
