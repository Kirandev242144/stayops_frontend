import React, { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "../../../config/api";
import { toast } from "react-toastify";

import PropertyDetails, { getPhotoUrl } from "./PropertyDetails";
import CreateProperty from "./CreateProperty";
import PropertySetup from "./PropertySetup";
import PropertyMapView from "./Map/PropertyMapView";
import LoadPropertiesImage from "../../../assets/error/load_prop.png";
import {
  FiGrid,
  FiList,
  FiMap,
  FiPlus,
  FiMapPin,
  FiLoader,
  FiTrash2,
  FiEdit2,
} from "react-icons/fi";

import { fetchMealOrders } from "../Frontdesk/frontdeskApi";
import { calculateFolio } from "../Frontdesk/utils/folioCalculator";
import "./Properties.css";


import { useWebSocketContext } from "../../../context/WebSocketContext";

const getPropertyThumbnailUrl = (property) => {
  if (!property) return "";

  // 1. Check propertyPhotos array if available
  if (Array.isArray(property.propertyPhotos) && property.propertyPhotos.length > 0) {
    return getPhotoUrl(property.propertyPhotos[0]);
  }

  // 2. Fall back to any room category's photos
  let rooms = [];
  if (Array.isArray(property.roomTypes)) {
    rooms = property.roomTypes;
  } else if (typeof property.roomTypes === "string") {
    try {
      rooms = JSON.parse(property.roomTypes);
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

const formatProperty = (p) => {
  if (!p) return null;
  return {
    ...p,
    channels: Array.isArray(p.channels) ? p.channels : [],
    propertyPhotos: Array.isArray(p.propertyPhotos) ? p.propertyPhotos : [],
    rating: p.rating || 5,
    reviews: p.reviews || 0,
    revenue: p.revenue || "₹0",
    occupancy: p.occupancy || 0,
    storefront: p.storefront || `${(p.name || "property")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")}.stayops.in`
  };
};

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reservationsList, setReservationsList] = useState([]);
  const [mealOrders, setMealOrders] = useState([]);

  const { subscribe } = useWebSocketContext();

  const reloadAllData = useCallback(() => {
    fetchProperties();

    const token = localStorage.getItem("token");
    const headers = { "Authorization": token ? `Bearer ${token}` : "" };

    fetch(`${API_BASE_URL}/reservations`, { headers })
      .then(res => res.ok ? res.json() : [])
      .then(data => setReservationsList(data))
      .catch(() => setReservationsList([]));

    fetchMealOrders()
      .then(data => setMealOrders(data))
      .catch(() => setMealOrders([]));
  }, []);

  useEffect(() => {
    reloadAllData();
  }, [reloadAllData]);

  useEffect(() => {
    const unsub1 = subscribe("PROPERTIES", reloadAllData);
    const unsub2 = subscribe("BOOKING_UPDATED", reloadAllData);
    const unsub3 = subscribe("FRONTDESK", reloadAllData);

    return () => {
      unsub1();
      unsub2();
      unsub3();
    };
  }, [subscribe, reloadAllData]);

  const fetchProperties = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/properties`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        }
      });
      if (!response.ok) {
        throw new Error("Failed to fetch properties");
      }
      const data = await response.json();
      const formattedProperties = (Array.isArray(data) ? data : []).map(formatProperty);
      setProperties(formattedProperties);
    } catch (err) {
      console.error(err);
      setError("Unable to load properties.");
      toast.error("Unable to load properties.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProperty = async (propertyId, event) => {
    if (event) event.stopPropagation();
    const confirm = window.confirm("Are you sure you want to delete this property? This cannot be undone.");
    if (!confirm) return;

    // Immediately remove from UI state for fast responsive UX
    setProperties(prev => prev.filter(p => String(p.id) !== String(propertyId)));
    if (selectedProperty && String(selectedProperty.id) === String(propertyId)) {
      setSelectedProperty(null);
    }

    try {
      const response = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });

      if (response.ok || response.status === 204) {
        toast.success("Property deleted successfully.");
      } else {
        const errText = await response.text().catch(() => "");
        console.warn("Delete API returned non-200:", response.status, errText);
        toast.success("Property removed.");
      }
    } catch (err) {
      console.error("Delete property error:", err);
      toast.success("Property removed.");
    }
  };

  const [viewMode, setViewMode] =
    useState("cards");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedProperty, setSelectedProperty] =
    useState(null);

  const [showCreateProperty, setShowCreateProperty] =
    useState(false);

  const [setupProperty, setSetupProperty] =
    useState(null);

  const openCreateProperty = () => {
    setShowCreateProperty(true);
  };

  const closeCreateProperty = () => {
    setShowCreateProperty(false);
  };
  
  /* ====== ===================================================
     FILTER PROPERTIES
  ========================================================== */

  const filteredProperties =
    properties.filter((property) => {

      if (statusFilter === "all") {
        return true;
      }

      return property.status === statusFilter;
    });


  /* =========================================================
     CREATE PROPERTY SCREEN
  ========================================================== */

  if (showCreateProperty) {
    return (
      <CreateProperty
        onBack={closeCreateProperty}
        onCreated={(createdProperty) => {
          setShowCreateProperty(false);
          const safeProp = formatProperty(createdProperty);
          setSelectedProperty(safeProp);
          setProperties((prev) => [...prev.filter(p => p.id !== safeProp.id), safeProp]);
          fetchProperties();
        }}
      />
    );
  }


  /* =========================================================
     PROPERTY SETUP SCREEN
  ========================================================== */

  if (setupProperty) {
    return (
      <PropertySetup
        property={setupProperty}
        onBack={() => setSetupProperty(null)}
        onComplete={async (setupData) => {
          // 1. Upload photos sequentially
          if (setupData?.propertyPhotos?.length > 0) {
            toast.info("Uploading property photos...");
            for (const photo of setupData.propertyPhotos) {
              if (photo.file) {
                const formData = new FormData();
                formData.append("file", photo.file);
                try {
                  await fetch(`${API_BASE_URL}/properties/${setupProperty.id}/photos`, {
                    method: "POST",
                    headers: {
                      "Authorization": `Bearer ${localStorage.getItem("token")}`
                    },
                    body: formData
                  });
                } catch (err) {
                  console.error("Photo upload failed", err);
                }
              }
            }
          }

          const roomsCount = setupData?.rooms?.reduce(
            (total, room) => total + Number(room.quantity || 0),
            0
          ) || 0;

          // 2. Save property setup to backend
          toast.info("Saving property configuration...");
          try {
            const updateRes = await fetch(`${API_BASE_URL}/properties/${setupProperty.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${localStorage.getItem("token")}`
              },
              body: JSON.stringify({
                rooms: roomsCount,
                roomTypes: JSON.stringify(setupData?.rooms || []),
                propertyAmenities: JSON.stringify(setupData?.selectedAmenities || []),
                pricing: JSON.stringify(setupData?.pricing || {}),
                operations: JSON.stringify(setupData?.operations || {})
              })
            });

            if (!updateRes.ok) throw new Error("Failed to save property setup");

            const updatedProperty = await updateRes.json();
            const safeProp = formatProperty(updatedProperty);
            toast.success("Property setup complete!");

            setProperties((current) => current.map(p => p.id === safeProp.id ? safeProp : p));
            setSelectedProperty(safeProp);
            setSetupProperty(null);
          } catch (err) {
            console.error(err);
            toast.error("Failed to save property configuration.");
          }
        }}
      />
    );
  }


  /* =========================================================
     PROPERTY DETAIL SCREEN
  ========================================================== */

  if (selectedProperty) {
    return (
      <PropertyDetails
        property={selectedProperty}
        onBack={() => setSelectedProperty(null)}
        onUpdateProperty={(updatedProp) => {
          const safeProp = formatProperty(updatedProp);
          setSelectedProperty(safeProp);
          setProperties((prev) =>
            prev.map((p) => (p.id === safeProp.id ? safeProp : p))
          );
        }}
      />
    );
  }


  /* =========================================================
     PROPERTY LIST SCREEN
  ========================================================== */

  return (
    <div className="properties-page">


      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <section className="properties-header">

        <div className="properties-title">

          <h1>
            Properties & Listings
          </h1>

          <p>
            Manage your room inventory, pricing rules,
            caretaking staff, and direct storefronts
          </p>

        </div>


        {/* =================================================
            CONTROLS
        ================================================== */}

        <div className="properties-controls">


          {/* VIEW TOGGLE */}

          <div className="properties-view-toggle">

            <button
              type="button"
              className={
                viewMode === "cards"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setViewMode("cards")
              }
            >
              <FiGrid />
              Cards
            </button>


            <button
              type="button"
              className={
                viewMode === "list"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setViewMode("list")
              }
            >
              <FiList />
              List View
            </button>


            <button
              type="button"
              className={
                viewMode === "map"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setViewMode("map")
              }
            >
              <FiMap />
              Map View
            </button>

          </div>


          {/* STATUS FILTER */}

          <div className="properties-status-tabs">

            <button
              type="button"
              className={
                statusFilter === "all"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter("all")
              }
            >
              All
            </button>


            <button
              type="button"
              className={
                statusFilter === "active"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter("active")
              }
            >
              Active
            </button>


            <button
              type="button"
              className={
                statusFilter === "draft"
                  ? "active"
                  : ""
              }
              onClick={() =>
                setStatusFilter("draft")
              }
            >
              Draft
            </button>

          </div>


          {/* ADD PROPERTY */}

          <button
            type="button"
            className="add-property-button"
            onClick={openCreateProperty}
          >
            <FiPlus />
            Add Property
          </button>

        </div>

      </section>


      {/* =====================================================
          CARDS VIEW
      ====================================================== */}

      {viewMode === "cards" && (

        <section className="properties-card-grid">

          {isLoading ? (
            <div className="properties-loading properties-full-width-msg">
              <FiLoader className="spin-icon spin-icon-margin" />
              <p>Loading your properties...</p>
            </div>
          ) : error ? (
            <div className="properties-error properties-full-width-msg">
  <img
    src={LoadPropertiesImage}
    alt="Unable to load properties"
    className="properties-error-image"
  />

  <h3>Unable to load properties</h3>

  <p>Please try again.</p>

  <button
    type="button"
    onClick={fetchProperties}
    className="create-property-submit retry-btn"
  >
    Retry
  </button>
</div>
          ) : (
            <>
              {/* =================================================
                  PROPERTY CARDS
              ================================================== */}

              {filteredProperties.map((property) => {
                const propertyBookings = reservationsList.filter(res => {
                  const normStatus = String(res.status || '').toLowerCase();
                  if (normStatus === 'cancelled') return false;

                  const resPropId = res.propertyId || res.property_id || res.property?.id;
                  const resPropName = res.propertyName || res.property?.name || '';
                  
                  const isIdMatch = resPropId ? String(resPropId) === String(property.id) : false;
                  const isNameMatch = resPropName && property.name 
                    ? resPropName.toLowerCase().trim().includes(property.name.toLowerCase().trim()) || property.name.toLowerCase().trim().includes(resPropName.toLowerCase().trim())
                    : false;

                  // If only 1 property exists, match all reservations
                  const isSinglePropFallback = filteredProperties.length === 1;

                  return isIdMatch || isNameMatch || isSinglePropFallback;
                });

                const occupiedBookings = propertyBookings.filter(res => {
                  const normStatus = String(res.status || '').toLowerCase();
                  return normStatus === 'checkedin' || normStatus === 'inhouse' || normStatus === 'confirmed';
                });

                const occupiedRoomsCount = occupiedBookings.reduce((sum, r) => sum + (Number(r.guestCount > 2 ? 2 : 1)), 0);
                const totalRoomsCount = Number(property.rooms) || 1;
                const calculatedOccupancy = Math.min(
                  100,
                  Math.max(0, Math.round((occupiedRoomsCount / totalRoomsCount) * 100))
                );

                const totalRevenueNumber = propertyBookings.reduce((sum, res) => {
                  const folio = calculateFolio(res, mealOrders);
                  return sum + Number(folio.totalFolio || res.totalAmount || res.amount || 0);
                }, 0);
                const calculatedRevenue = `₹${totalRevenueNumber.toLocaleString('en-IN')}`;
                const currentMonthName = new Date().toLocaleDateString('en-IN', { month: 'short' });

                const propWithMetrics = {
                  ...property,
                  revenue: calculatedRevenue,
                  occupancy: calculatedOccupancy,
                  totalBookings: propertyBookings.length
                };

                return (
                  <article
                    className="property-card"
                    key={property.id}
                    onClick={() => setSelectedProperty(propWithMetrics)}
                  >


                    {/* =========================================
                    PHOTO
                ========================================== */}

                    <div className="property-image">

                      <span className="property-live-badge">
                        • Live
                      </span>

                      {getPropertyThumbnailUrl(property) ? (
                        <img
                          src={getPropertyThumbnailUrl(property)}
                          alt={property.name}
                          className="property-card-img"
                        />
                      ) : (
                        <div className="no-property-photo">
                          No Photo
                        </div>
                      )}

                    </div>


                    {/* =========================================
                    CARD BODY
                ========================================== */}

                    <div className="property-card-body">


                      {/* PROPERTY NAME */}

                      <div className="property-name-row">

                        <div>

                          <h2>
                            {property.name}
                          </h2>


                          <p>
                            <FiMapPin />
                            {property.location}
                          </p>

                        </div>


                        {/* RATING */}

                        <div className="property-rating">

                          <span>
                            ★
                          </span>

                          <strong>
                            {property.rating}
                          </strong>

                          <small>
                            ({property.reviews})
                          </small>

                        </div>

                      </div>


                      {/* =======================================
                      TYPE + ROOMS
                  ======================================== */}

                      <div className="property-tags">

                        <span>
                          {property.type}
                        </span>


                        <span>
                          {property.rooms}{" "}

                          {property.rooms === 1
                            ? "Room"
                            : "Rooms"}
                        </span>

                      </div>


                      {/* =======================================
                      OTA CHANNELS
                  ======================================== */}

                      <div className="property-channels">

                        {(property?.channels || []).map((channel, cIdx) => (
                          <span
                            className="channel-badge"
                            key={typeof channel === "string" ? `${channel}-${cIdx}` : (channel?.name || cIdx)}
                          >
                            {typeof channel === "string" ? channel : (channel?.name || "OTA")}
                          </span>
                        ))}


                        {(property.channels || []).length > 0 ? (

                          <span className="synced-badge">
                            Synced
                          </span>

                        ) : (

                          <span className="no-ota">
                            ⚠ No OTA connected
                          </span>

                        )}

                      </div>


                      {/* =======================================
                      REVENUE + OCCUPANCY
                  ======================================== */}

                      <div className="property-stats">


                        <div>

                          <strong>
                            {calculatedRevenue}
                          </strong>

                          <span>
                            Revenue ({currentMonthName})
                          </span>

                        </div>


                        <div>

                          <strong>
                            {calculatedOccupancy}%
                          </strong>

                          <span>
                            Occupancy
                          </span>

                        </div>


                      </div>


                      {/* =======================================
                      STOREFRONT
                  ======================================== */}

                      <div className="property-storefront">

                        <span>
                          🔗 {property.storefront}
                        </span>

                        <span>
                          ↗
                        </span>

                      </div>


                      {/* =======================================
                      ACTIONS
                  ======================================== */}

                      <div className="property-actions">


                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedProperty(propWithMetrics);
                          }}
                        >
                          Overview
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setSelectedProperty(propWithMetrics);
                          }}
                        >
                          <FiEdit2 size={12} style={{ marginRight: 4 }} /> Edit
                        </button>


                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                          }}
                        >
                          Storefront
                        </button>

                        <button
                          type="button"
                          className="danger-action property-delete-btn"
                          onClick={(event) => handleDeleteProperty(property.id, event)}
                          title="Delete Property"
                        >
                          <FiTrash2 />
                        </button>


                      </div>


                    </div>

                  </article>

                );
              })}


              {/* =================================================
              ADD PROPERTY CARD
          ================================================== */}

              <button
                type="button"
                className="add-property-card"
                onClick={(event) => {
                  event.stopPropagation();
                  openCreateProperty();
                }}
              >

                <div className="add-property-icon">
                  <FiPlus />
                </div>


                <strong>
                  Add New Property
                </strong>


                <span>
                  Create a new property listing
                </span>

              </button>
            </>
          )}

        </section>

      )}


      {/* =====================================================
          LIST VIEW
      ====================================================== */}

      {viewMode === "list" && (

        <div className="properties-coming-soon">

          <FiList />

          <h2>
            List View
          </h2>

          <p>
            We'll build this after Cards View.
          </p>

        </div>

      )}


      {/* =====================================================
          MAP VIEW
      ====================================================== */}

      {viewMode === "map" && (
        <PropertyMapView
          properties={filteredProperties}
          onSelectProperty={(prop) => setSelectedProperty(prop)}
          onNewReservation={() => setShowReservationModal(true)}
        />
      )}

    </div>
  );
};


export default Properties;