import React, { useEffect, useRef, useState, useCallback } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FiMapPin, FiSearch, FiRefreshCw, FiCheck, FiInfo } from "react-icons/fi";
import "./PropertyLocationPicker.css";

// Fix standard Leaflet default icon paths in bundler environments
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Custom SVG marker pin
const customPinIcon = L.divIcon({
  className: "custom-map-pin",
  html: `
    <div class="pin-marker-wrapper">
      <div class="pin-marker-bubble">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div class="pin-marker-pulse"></div>
    </div>
  `,
  iconSize: [36, 44],
  iconAnchor: [18, 42],
  popupAnchor: [0, -38],
});

const DEFAULT_CENTER = [12.9716, 77.5946]; // Bangalore, India default

const PropertyLocationPicker = ({
  address = "",
  city = "",
  state = "",
  postalCode = "",
  lat = null,
  lng = null,
  onChange = () => {},
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [isSearching, setIsSearching] = useState(false);
  const [searchStatus, setSearchStatus] = useState("");
  const [coordinates, setCoordinates] = useState({
    lat: lat ? Number(lat) : null,
    lng: lng ? Number(lng) : null,
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = lat ? Number(lat) : DEFAULT_CENTER[0];
    const initialLng = lng ? Number(lng) : DEFAULT_CENTER[1];
    const initialZoom = lat && lng ? 14 : 7;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: initialZoom,
      scrollWheelZoom: true,
    });

    // OpenStreetMap free tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Initial marker if coordinates exist
    if (lat && lng) {
      const marker = L.marker([Number(lat), Number(lng)], {
        draggable: true,
        icon: customPinIcon,
      }).addTo(map);

      marker.bindPopup("<b>Property Location</b><br/>Drag to fine-tune exact gate location").openPopup();

      marker.on("dragend", (e) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        updatePosition(newLat, newLng);
      });

      markerRef.current = marker;
    }

    // Click anywhere on map to reposition pin
    map.on("click", (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      setOrMoveMarker(clickLat, clickLng, map);
      updatePosition(clickLat, clickLng);
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const setOrMoveMarker = useCallback((targetLat, targetLng, mapInstance) => {
    const map = mapInstance || mapInstanceRef.current;
    if (!map) return;

    if (markerRef.current) {
      markerRef.current.setLatLng([targetLat, targetLng]);
    } else {
      const marker = L.marker([targetLat, targetLng], {
        draggable: true,
        icon: customPinIcon,
      }).addTo(map);

      marker.bindPopup("<b>Property Location</b><br/>Drag to fine-tune exact gate location");

      marker.on("dragend", (e) => {
        const { lat: newLat, lng: newLng } = e.target.getLatLng();
        updatePosition(newLat, newLng);
      });

      markerRef.current = marker;
    }

    map.flyTo([targetLat, targetLng], 15, { duration: 1.2 });
  }, []);

  const updatePosition = (newLat, newLng) => {
    const cleanLat = Number(newLat.toFixed(6));
    const cleanLng = Number(newLng.toFixed(6));
    setCoordinates({ lat: cleanLat, lng: cleanLng });
    onChange({ lat: cleanLat, lng: cleanLng });
    setSearchStatus("Location pinned accurately!");
  };

  // Perform geocode lookup with Nominatim
  const geocodeAddress = useCallback(
    async (query) => {
      if (!query || query.trim().length < 3) return;

      setIsSearching(true);
      setSearchStatus("Searching location coordinates...");

      try {
        const cleanQuery = query.replace(/[#,/\\-]/g, " ").trim();
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          cleanQuery
        )}&limit=1&countrycodes=in`;

        const res = await fetch(url, {
          headers: {
            "Accept-Language": "en",
          },
        });
        const data = await res.json();

        if (data && data.length > 0) {
          const foundLat = parseFloat(data[0].lat);
          const foundLng = parseFloat(data[0].lon);

          setOrMoveMarker(foundLat, foundLng);
          updatePosition(foundLat, foundLng);
          setSearchStatus(`Found: ${data[0].display_name.split(",").slice(0, 3).join(",")}`);
        } else {
          // Fallback to City + State
          const fallbackQuery = [city, state].filter(Boolean).join(", ");
          if (fallbackQuery && fallbackQuery !== cleanQuery) {
            const fallbackRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                fallbackQuery
              )}&limit=1&countrycodes=in`
            );
            const fallbackData = await fallbackRes.json();
            if (fallbackData && fallbackData.length > 0) {
              const fLat = parseFloat(fallbackData[0].lat);
              const fLng = parseFloat(fallbackData[0].lon);
              setOrMoveMarker(fLat, fLng);
              updatePosition(fLat, fLng);
              setSearchStatus(`Approximate location found for ${fallbackQuery}`);
              return;
            }
          }
          setSearchStatus("Address not found on map. Tap on map to drop pin manually.");
        }
      } catch (err) {
        console.error("Geocoding lookup error:", err);
        setSearchStatus("Could not auto-locate. Tap on the map to drop pin.");
      } finally {
        setIsSearching(false);
      }
    },
    [city, state, setOrMoveMarker]
  );

  // Auto-search when Address or City/State changes (Debounced 800ms)
  useEffect(() => {
    const fullQuery = [address, city, state, postalCode].filter(Boolean).join(", ");
    if (!fullQuery || fullQuery.length < 4) return;

    const timer = setTimeout(() => {
      geocodeAddress(fullQuery);
    }, 800);

    return () => clearTimeout(timer);
  }, [address, city, state, postalCode, geocodeAddress]);

  const handleManualSearch = () => {
    const fullQuery = [address, city, state, postalCode].filter(Boolean).join(", ");
    if (fullQuery) {
      geocodeAddress(fullQuery);
    }
  };

  return (
    <div className="property-location-picker">
      <div className="location-picker-header">
        <div className="picker-title-group">
          <FiMapPin className="picker-header-icon" />
          <div>
            <h4>Interactive Property Map Pin</h4>
            <p>Automatically pins as you type your address. Drag the pin or click on the map to pinpoint your exact gate or reception.</p>
          </div>
        </div>

        <button
          type="button"
          className="picker-locate-btn"
          onClick={handleManualSearch}
          disabled={isSearching}
        >
          {isSearching ? <FiRefreshCw className="picker-spinner" /> : <FiSearch />}
          <span>{isSearching ? "Locating..." : "Locate Address"}</span>
        </button>
      </div>

      {/* Map Canvas Container */}
      <div className="location-picker-canvas-wrap">
        <div ref={mapContainerRef} className="location-picker-canvas" />

        {/* Live Coordinates Overlay Badge */}
        <div className="location-picker-coords-badge">
          {coordinates.lat && coordinates.lng ? (
            <>
              <FiCheck className="coords-success-icon" />
              <span>GPS: <b>{coordinates.lat}</b>, <b>{coordinates.lng}</b></span>
            </>
          ) : (
            <>
              <FiInfo className="coords-info-icon" />
              <span>Type your address above or tap map to drop pin</span>
            </>
          )}
        </div>
      </div>

      {/* Search Status Help Text */}
      {searchStatus && (
        <div className="location-picker-status-bar">
          <span>{searchStatus}</span>
        </div>
      )}
    </div>
  );
};

export default PropertyLocationPicker;
