import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiHome, FiMapPin } from "react-icons/fi";
import { getPhotoUrl } from "../PropertyDetails";
import "./PropertyMapView.css";

// Approximate center of India for fallback
const INDIA_CENTER = [20.5937, 78.9629];

// City coordinate lookup for quick fallback if lat/lng is missing
const CITY_COORDINATES = {
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  coorg: [12.4244, 75.7382],
  madikeri: [12.4244, 75.7382],
  chikmagalur: [13.3161, 75.7720],
  chikkamagaluru: [13.3161, 75.7720],
  goa: [15.2993, 74.1240],
  panaji: [15.4909, 73.8278],
  wayanad: [11.6854, 76.1320],
  ooty: [11.4102, 76.6950],
  mumbai: [19.0760, 72.8777],
  delhi: [28.6139, 77.2090],
  jaipur: [26.9124, 75.7873],
  manali: [32.2432, 77.1892],
  shimla: [31.1048, 77.1734],
  kochi: [9.9312, 76.2673],
  pondicherry: [11.9416, 79.8083],
  puducherry: [11.9416, 79.8083],
};

const createPropertyPinIcon = (status, category) => {
  const isActive = status?.toLowerCase() === "active";
  const bgGradient = isActive
    ? "linear-gradient(135deg, #0D9488 0%, #0F766E 100%)"
    : "linear-gradient(135deg, #64748B 0%, #475569 100%)";

  return L.divIcon({
    className: "property-map-pin-icon",
    html: `
      <div class="pm-pin-wrapper">
        <div class="pm-pin-bubble" style="background: ${bgGradient};">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
        </div>
        <div class="pm-pin-shadow"></div>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36],
  });
};

const getPropertyThumbnail = (prop) => {
  if (!prop) return "";

  // 1. Direct propertyPhotos array
  if (Array.isArray(prop.propertyPhotos) && prop.propertyPhotos.length > 0) {
    return getPhotoUrl(prop.propertyPhotos[0]);
  }

  // 2. Direct photos or images array
  if (Array.isArray(prop.photos) && prop.photos.length > 0) {
    return getPhotoUrl(prop.photos[0]);
  }
  if (Array.isArray(prop.images) && prop.images.length > 0) {
    return getPhotoUrl(prop.images[0]);
  }

  // 3. Singular photo or image field
  if (prop.photo) return getPhotoUrl(prop.photo);
  if (prop.image) return getPhotoUrl(prop.image);

  // 4. Fall back to room category photos
  let rooms = [];
  if (Array.isArray(prop.roomTypes)) {
    rooms = prop.roomTypes;
  } else if (typeof prop.roomTypes === "string") {
    try {
      rooms = JSON.parse(prop.roomTypes);
    } catch (e) {
      rooms = [];
    }
  }

  if (Array.isArray(rooms)) {
    for (const room of rooms) {
      if (Array.isArray(room?.photos) && room.photos.length > 0) {
        return getPhotoUrl(room.photos[0]);
      }
    }
  }

  return "";
};

const PropertyMapView = ({ properties = [], onSelectProperty, onNewReservation }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapTileStyle, setMapTileStyle] = useState("streets"); // "streets" | "satellite"

  // Process properties to resolve valid lat/lng
  const propertiesWithCoords = useMemo(() => {
    return properties.map((prop, idx) => {
      let lat = prop.lat ? Number(prop.lat) : null;
      let lng = prop.lng ? Number(prop.lng) : null;

      // If lat/lng missing, lookup city or distribute around region
      if (!lat || !lng) {
        const cityKey = (prop.city || "").toLowerCase().trim();
        if (CITY_COORDINATES[cityKey]) {
          // slight random jitter so multiple properties in same city don't completely overlap
          const jitter = (idx % 5) * 0.008;
          lat = CITY_COORDINATES[cityKey][0] + jitter;
          lng = CITY_COORDINATES[cityKey][1] + jitter;
        } else {
          // Fallback to South India homestay belt
          lat = 12.9716 + (idx * 0.05);
          lng = 77.5946 + (idx * 0.05);
        }
      }

      return {
        ...prop,
        resolvedLat: lat,
        resolvedLng: lng,
      };
    });
  }, [properties]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: INDIA_CENTER,
      zoom: 5,
      zoomControl: false,
    });

    // Custom Zoom controls position
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // OpenStreetMap Tile Layer
    const tileLayer = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Observe container resizing to keep Leaflet tiles crisp and accurately fitted
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync Markers when properties change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    if (propertiesWithCoords.length === 0) return;

    const bounds = L.latLngBounds();

    propertiesWithCoords.forEach((prop) => {
      const { resolvedLat, resolvedLng, name, city, state, baseRate, status, type } = prop;
      const thumbnail = getPropertyThumbnail(prop);
      const marker = L.marker([resolvedLat, resolvedLng], {
        icon: createPropertyPinIcon(status, type),
      });

      marker.on("click", () => {
        setSelectedProperty(prop);
        if (onSelectProperty) onSelectProperty(prop);
      });

      // Clean native popup directly on the pin
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 13px; min-width: 170px; padding: 2px;">
          ${thumbnail ? `<img src="${thumbnail}" style="width: 100%; height: 85px; object-fit: cover; border-radius: 6px; margin-bottom: 6px; display: block;" alt="${name}" onerror="this.style.display='none'" />` : ''}
          <b style="font-size: 14px; color: #0F172A; display: block; margin-bottom: 2px;">${name}</b>
          <span style="color: #64748B; font-size: 12px; display: block; margin-bottom: 6px;">📍 ${city || "StayOps"}</span>
          <span style="color: #0D9488; font-weight: 700;">₹${baseRate || 0} / night</span>
        </div>
      `, {
        offset: [0, -32],
      });

      marker.addTo(markersLayer);
      bounds.extend([resolvedLat, resolvedLng]);
    });

    // Auto fit bounds to show all pins comfortably
    if (propertiesWithCoords.length === 1) {
      map.setView([propertiesWithCoords[0].resolvedLat, propertiesWithCoords[0].resolvedLng], 13);
    } else if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [propertiesWithCoords, onSelectProperty]);

  const handleFlyTo = (prop) => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([prop.resolvedLat, prop.resolvedLng], 15, { duration: 1.2 });
    setSelectedProperty(prop);
  };

  return (
    <div className="property-map-view-container">
      {/* Map Canvas */}
      <div ref={mapContainerRef} className="property-map-canvas" />

      {/* Floating Left Properties List Drawer */}
      <div className="pm-floating-sidebar">
        <div className="pm-sidebar-header">
          <div className="pm-sidebar-title">
            <FiMapPin color="#0D9488" size={18} />
            <span>Properties on Map</span>
          </div>
          <span className="pm-count-pill">{properties.length} Listings</span>
        </div>

        <div className="pm-sidebar-list">
          {propertiesWithCoords.map((prop) => {
            const isSelected = selectedProperty?.id === prop.id;
            const thumbnail = getPropertyThumbnail(prop);

            return (
              <div
                key={prop.id}
                className={`pm-list-item ${isSelected ? "selected" : ""}`}
                onClick={() => handleFlyTo(prop)}
              >
                <div className="pm-item-photo">
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt={prop.name}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                        const fallback = e.currentTarget.parentElement?.querySelector(".pm-item-no-photo");
                        if (fallback) fallback.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="pm-item-no-photo"
                    style={{ display: thumbnail ? "none" : "flex" }}
                  >
                    <FiHome size={18} />
                  </div>
                </div>
                <div className="pm-item-info">
                  <h4>{prop.name}</h4>
                  <p>{prop.city || prop.location || "Karnataka, India"}</p>
                  <div className="pm-item-meta">
                    <span className="pm-price-tag">₹{prop.baseRate || 0} / night</span>
                    <span className={`pm-status-pill ${prop.status?.toLowerCase() === "active" ? "active" : "draft"}`}>
                      {prop.status || "Active"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PropertyMapView;
