import React, { useState, useRef } from "react";
import { API_BASE_URL } from "../../../config/api";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiCalendar,
  FiEdit2,
  FiMoreVertical,
  FiMapPin,
  FiHome,
  FiLink,
  FiShare2,
  FiFileText,
  FiActivity,
  FiMessageCircle,
  FiPlus,
  FiUsers,
  FiGrid,
  FiX,
  FiCheck,
  FiAlertTriangle,
  FiCamera,
  FiCheckCircle,
  FiClock,
  FiTrash2,
  FiUpload,
  FiWifi,
} from "react-icons/fi";

import "./PropertyDetails.css";
import EditPropertyModal from "./EditPropertyModal";
import { formatTime12Hr } from "../../../utils/timeFormat";
import { fetchPropertyPolicy } from "../../../utils/policyEvaluator";
import { getStorefrontUrl } from "../../Storefront/storefrontApi";
import { parseAmenitiesList } from "../../../constants/amenities";

export const getPhotoUrl = (url) => {
  if (!url) return "";
  if (typeof url === "object" && url.url) url = url.url;
  if (typeof url !== "string") return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:") || url.startsWith("data:")) {
    return url;
  }
  const baseUrl = API_BASE_URL.replace(/\/api\/?$/, "");
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
};

export const parseOps = (ops) => {
  if (!ops) return {};
  if (typeof ops === "object") return ops;
  try {
    return JSON.parse(ops);
  } catch (e) {
    return {};
  }
};

export const getPropertyThumbnailUrl = (property) => {
  if (!property) return "";

  if (Array.isArray(property.propertyPhotos) && property.propertyPhotos.length > 0) {
    return getPhotoUrl(property.propertyPhotos[0]);
  }

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

const PropertyDetails = ({ property: initialProperty, onBack, onUpdateProperty }) => {
  const [property, setProperty] = useState(initialProperty);
  const [initialPropertyState, setInitialPropertyState] = useState(initialProperty);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddRoomType, setShowAddRoomType] = useState(false);
  const [editingRoomTypeId, setEditingRoomTypeId] = useState(null);
  const [showEditPropertyModal, setShowEditPropertyModal] = useState(false);
  const [editModalTab, setEditModalTab] = useState("general");
  const [isSavingAll, setIsSavingAll] = useState(false);

  const [propertyPolicy, setPropertyPolicy] = useState(null);

  React.useEffect(() => {
    if (property?.id) {
      fetchPropertyPolicy(property.id).then(data => {
        if (data) setPropertyPolicy(data);
      });
    }
  }, [property?.id, activeTab]);

  const openEditModal = (tab = "general") => {
    setEditModalTab(tab);
    setShowEditPropertyModal(true);
  };

  const [editingRateRoomId, setEditingRateRoomId] = useState(null);
  const [editingRatesMap, setEditingRatesMap] = useState({ baseRate: "", weekendRate: "" });

  const handleStartEditRate = (room) => {
    setEditingRateRoomId(room.id);
    setEditingRatesMap({
      baseRate: room.baseRate ?? "",
      weekendRate: room.weekendRate ?? ""
    });
  };

  const handleCancelEditRate = () => {
    setEditingRateRoomId(null);
    setEditingRatesMap({ baseRate: "", weekendRate: "" });
  };

  const handleSaveSingleRoomRate = (roomId) => {
    const updatedRoomTypes = roomTypes.map((r) => {
      if (r.id === roomId) {
        return {
          ...r,
          baseRate: editingRatesMap.baseRate !== "" ? Number(editingRatesMap.baseRate) : "",
          weekendRate: editingRatesMap.weekendRate !== "" ? Number(editingRatesMap.weekendRate) : ""
        };
      }
      return r;
    });
    setRoomTypes(updatedRoomTypes);
    saveRoomTypesToBackend(updatedRoomTypes);
    setEditingRateRoomId(null);
    setEditingRatesMap({ baseRate: "", weekendRate: "" });
  };

  const defaultRoomTypes = [];

  const parseRoomTypes = (roomTypesData) => {
    if (!roomTypesData) return defaultRoomTypes;
    if (typeof roomTypesData === "string") {
      try {
        return JSON.parse(roomTypesData);
      } catch (e) {
        return defaultRoomTypes;
      }
    }
    return roomTypesData;
  };

  const [roomTypes, setRoomTypes] = useState(() => parseRoomTypes(property?.roomTypes));
  const [initialRoomTypesState, setInitialRoomTypesState] = useState(() => parseRoomTypes(initialProperty?.roomTypes));

  const isPropertyDirty = JSON.stringify(property) !== JSON.stringify(initialPropertyState);
  const isRoomTypesDirty = JSON.stringify(roomTypes) !== JSON.stringify(initialRoomTypesState);
  const isDirty = isPropertyDirty || isRoomTypesDirty;

  const handleDiscardAllChanges = () => {
    setProperty(initialPropertyState);
    setRoomTypes(initialRoomTypesState);
    toast.info("Unsaved changes discarded.");
  };

  const handleSaveAllChanges = async () => {
    setIsSavingAll(true);
    try {
      if (isPropertyDirty) {
        const opsPayload = typeof property.operations === "string" ? property.operations : JSON.stringify(property.operations || {});
        await fetch(`${API_BASE_URL}/properties/${property.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            name: property.name,
            type: property.type,
            status: property.status,
            baseRate: Number(property.baseRate) || 0,
            address: property.address,
            city: property.city,
            state: property.state,
            postalCode: property.postalCode,
            location: property.location,
            contactPhone: property.contactPhone,
            contactEmail: property.contactEmail,
            description: property.description,
            operations: opsPayload
          }),
        });
      }

      if (isRoomTypesDirty) {
        const totalRoomsCount = roomTypes.reduce((acc, room) => acc + (Number(room.quantity) || 0), 0);
        await fetch(`${API_BASE_URL}/properties/${property.id}/room-types`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${localStorage.getItem("token")}`
          },
          body: JSON.stringify({
            roomTypesJson: JSON.stringify(roomTypes),
            totalRoomsCount
          }),
        });
      }

      setInitialPropertyState(property);
      setInitialRoomTypesState(roomTypes);
      if (onUpdateProperty) {
        onUpdateProperty(property);
      }
      toast.success("All changes saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save changes.");
    } finally {
      setIsSavingAll(false);
    }
  };

  const updateOperationsField = (field, value) => {
    const parseOps = (ops) => {
      if (!ops) return {};
      if (typeof ops === "object") return ops;
      try { return JSON.parse(ops); } catch { return {}; }
    };
    const currentOps = parseOps(property.operations);
    const updatedOps = { ...currentOps, [field]: value };
    setProperty(prev => ({
      ...prev,
      operations: updatedOps
    }));
  };

  const handleUpdateProperty = async (updatePayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/properties/${property.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to update property details");
      }

      const updatedProperty = await response.json();
      const newMerged = {
        ...property,
        ...updatedProperty,
        operations: updatedProperty.operations || updatePayload.operations
      };
      setProperty(newMerged);
      setInitialPropertyState(newMerged);

      if (onUpdateProperty) {
        onUpdateProperty(newMerged);
      }

      toast.success("Property updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update property.");
      throw err;
    }
  };

  const emptyRoomState = {
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
    baseRate: "",
    weekendRate: "",
    wifiName: "",
    wifiPassword: "",
    amenities: [],
    status: "Active",
    unitCategory: "standard",
    linkedRoomIds: [],
    photos: [],
  };

  const [newRoomType, setNewRoomType] = useState(emptyRoomState);

  const openEditRoomType = (room) => {
    setEditingRoomTypeId(room.id);
    setNewRoomType({
      name: room.name,
      description: room.description,
      guests: room.guests || 2,
      maxAdults: room.maxAdults || room.guests || 2,
      maxChildren: room.maxChildren || 0,
      bedrooms: room.bedrooms || 1,
      beds: room.beds || 1,
      bedType: room.bedType || "King",
      bathrooms: room.bathrooms || 1,
      bathroomType: room.bathroomType || "Private",
      quantity: room.quantity || 1,
      unitNumbers: room.unitNumbers || "",
      wifiName: room.wifiName || "",
      wifiPassword: room.wifiPassword || "",
      amenities: room.amenities || [],
      baseRate:
        room.baseRate ??
        property.baseRate ??
        "",
      weekendRate:
        room.weekendRate ??
        room.baseRate ??
        property.baseRate ??
        "",
      status: room.status || "Active",
      unitCategory: room.unitCategory || "standard",
      linkedRoomIds: room.linkedRoomIds || [],
      photos: room.photos || [],
    });
    setShowAddRoomType(true);
  };

  const closeRoomTypeModal = () => {
    setShowAddRoomType(false);
    setEditingRoomTypeId(null);
    setNewRoomType(emptyRoomState);
  };

  const toggleLinkedRoom = (roomId) => {
    setNewRoomType((current) => {
      const exists = current.linkedRoomIds.includes(roomId);
      return {
        ...current,
        linkedRoomIds: exists
          ? current.linkedRoomIds.filter((id) => id !== roomId)
          : [...current.linkedRoomIds, roomId],
      };
    });
  };

  const handleSaveRoomType = (event) => {
    event.preventDefault();
    const name = newRoomType.name.trim();

    if (!name) return;

    const roomData = {
      name,
      description: newRoomType.description?.trim() || "Accommodation type.",
      guests: Number(newRoomType.guests) || 2,
      maxAdults: Number(newRoomType.maxAdults) || Number(newRoomType.guests) || 2,
      maxChildren: Number(newRoomType.maxChildren) || 0,
      bedrooms: Number(newRoomType.bedrooms) || 1,
      beds: Number(newRoomType.beds) || 1,
      bedType: newRoomType.bedType,
      bathrooms: Number(newRoomType.bathrooms) || 1,
      bathroomType: newRoomType.bathroomType || "Private",
      quantity: Math.max(1, Number(newRoomType.quantity) || 1),
      unitNumbers: newRoomType.unitNumbers?.trim() || "",
      wifiName: newRoomType.wifiName?.trim() || "",
      wifiPassword: newRoomType.wifiPassword?.trim() || "",
      amenities: newRoomType.amenities || [],
      baseRate:
        Number(newRoomType.baseRate) > 0
          ? Number(newRoomType.baseRate)
          : Number(property.baseRate) || 0,

      weekendRate:
        Number(newRoomType.weekendRate) > 0
          ? Number(newRoomType.weekendRate)
          : (
              Number(newRoomType.baseRate) > 0
                ? Number(newRoomType.baseRate)
                : Number(property.baseRate) || 0
            ),

      status: newRoomType.status,
      unitCategory: newRoomType.unitCategory,
      linkedRoomIds:
        newRoomType.unitCategory === "composite"
          ? newRoomType.linkedRoomIds
          : [],
      photos: newRoomType.photos || [],
    };

    const updatedRoomTypes = editingRoomTypeId
      ? roomTypes.map((room) => (room.id === editingRoomTypeId ? { ...room, ...roomData } : room))
      : [...roomTypes, { id: Date.now(), ...roomData }];

    setRoomTypes(updatedRoomTypes);
    saveRoomTypesToBackend(updatedRoomTypes);

    closeRoomTypeModal();
  };

  const saveRoomTypesToBackend = async (typesArray) => {
    try {
      const totalRoomsCount = typesArray.reduce((acc, room) => acc + (Number(room.quantity) || 0), 0);
      const response = await fetch(`${API_BASE_URL}/properties/${property.id}/room-types`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({
          roomTypesJson: JSON.stringify(typesArray),
          totalRoomsCount
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save room types");
      }
      toast.success("Room types saved successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save room types to server.");
    }
  };

  const fileInputRef = useRef(null);
  const roomFileInputRef = useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingRoomPhoto, setIsUploadingRoomPhoto] = useState(false);

  const handlePropertyPhotoUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingPhoto(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        let fileUrl = "";
        try {
          const formData = new FormData();
          formData.append("file", files[i]);

          const response = await fetch(`${API_BASE_URL}/properties/${property.id}/photos`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
            },
            body: formData,
          });

          if (response.ok) {
            fileUrl = await response.text();
            if (fileUrl.startsWith('"') && fileUrl.endsWith('"')) {
              try { fileUrl = JSON.parse(fileUrl); } catch (e) {}
            }
          }
        } catch (err) {
          console.warn("Backend photo upload failed, using local Data URL fallback:", err);
        }

        if (!fileUrl) {
          fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(files[i]);
          });
        }

        if (fileUrl) {
          uploadedUrls.push(fileUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setProperty((prev) => ({
          ...prev,
          propertyPhotos: [...(prev.propertyPhotos || []), ...uploadedUrls]
        }));
        toast.success(`${uploadedUrls.length} photo(s) added successfully!`);
      } else {
        toast.error("Failed to process photo(s).");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload photo(s).");
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeletePropertyPhoto = async (photoUrl, event) => {
    if (event) event.stopPropagation();
    try {
      const cleanPath = typeof photoUrl === "object" ? photoUrl.url : photoUrl;
      const response = await fetch(`${API_BASE_URL}/properties/${property.id}/photos?url=${encodeURIComponent(cleanPath)}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
        }
      });

      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }

      setProperty((prev) => ({
        ...prev,
        propertyPhotos: (prev.propertyPhotos || []).filter((p) => p !== photoUrl)
      }));

      toast.success("Photo deleted successfully!");
    } catch (err) {
      console.error(err);
      // Remove locally regardless
      setProperty((prev) => ({
        ...prev,
        propertyPhotos: (prev.propertyPhotos || []).filter((p) => p !== photoUrl)
      }));
      toast.success("Photo removed!");
    }
  };

  const handleRoomPhotoUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingRoomPhoto(true);
    const uploadedUrls = [];

    try {
      for (let i = 0; i < files.length; i++) {
        let fileUrl = "";
        try {
          const formData = new FormData();
          formData.append("file", files[i]);

          const response = await fetch(`${API_BASE_URL}/properties/${property.id}/photos`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("token") || ""}`
            },
            body: formData,
          });

          if (response.ok) {
            fileUrl = await response.text();
            if (fileUrl.startsWith('"') && fileUrl.endsWith('"')) {
              try { fileUrl = JSON.parse(fileUrl); } catch (e) {}
            }
          }
        } catch (err) {
          console.warn("Backend room photo upload failed, using local Data URL fallback:", err);
        }

        if (!fileUrl) {
          fileUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => resolve("");
            reader.readAsDataURL(files[i]);
          });
        }

        if (fileUrl) {
          uploadedUrls.push(fileUrl);
        }
      }

      if (uploadedUrls.length > 0) {
        setNewRoomType((prev) => ({
          ...prev,
          photos: [...(prev.photos || []), ...uploadedUrls]
        }));
        toast.success(`${uploadedUrls.length} room photo(s) added!`);
      } else {
        toast.error("Failed to process room photo(s).");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload room photo(s).");
    } finally {
      setIsUploadingRoomPhoto(false);
      if (roomFileInputRef.current) {
        roomFileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveRoomPhoto = (index) => {
    setNewRoomType(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="property-details-page">
      {/* BACK BUTTON */}
      <button
        type="button"
        className="property-back-button"
        onClick={onBack}
      >
        <FiArrowLeft />
        Back to Properties
      </button>

      {/* PROPERTY HEADER */}
      <section className="property-details-header">
        <div className="property-details-main">
          <div className="property-details-photo">
            {getPropertyThumbnailUrl(property) ? (
              <img src={getPropertyThumbnailUrl(property)} alt={property.name} />
            ) : (
              <div className="property-details-no-photo">No Photo</div>
            )}
          </div>

          <div className="property-details-info">
            <div className="property-details-title-row">
              <h1>{property.name}</h1>
              <span className="property-active-badge">• Active</span>
            </div>

            <div className="property-details-meta">
              <span>
                <FiMapPin />
                {property.location}
              </span>
              <span>
                <FiHome />
                {property.type}
              </span>
              <span>
                {property.rooms} {property.rooms === 1 ? "Room" : "Rooms"}
              </span>
              <span className="property-rating-detail">
                <span className="property-star">★</span>
                {property.rating || 0}
                <small>({property.reviews || 0} reviews)</small>
              </span>
            </div>

            <div className="property-details-channels">
              {(property.channels || []).map((channel, index) => (
                <span key={index} className="detail-channel-badge">
                  {typeof channel === "string" ? channel : channel?.name}
                </span>
              ))}

              {property.storefront && (
                <span className="detail-storefront-badge">
                  <FiLink />
                  {property.storefront}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="property-details-actions">
          <button 
            type="button" 
            className="property-calendar-button"
            style={{ background: '#111827', color: '#ffffff' }}
            onClick={() => {
              const opsObj = parseOps(property.operations);
              const themeConfig = parseOps(opsObj.themeConfig);
              const subdomain = themeConfig.subdomain || (property.name || 'property').toLowerCase().replace(/[^a-z0-9]/g, '');
              window.open(getStorefrontUrl(subdomain), '_blank');
            }}
          >
            <FiLink />
            Preview Storefront
          </button>
          <button type="button" className="property-calendar-button">
            <FiCalendar />
            View Calendar
          </button>
          <button 
            type="button" 
            className="property-edit-button"
            onClick={() => openEditModal("general")}
          >
            <FiEdit2 />
            Edit Property
          </button>
          <button 
            type="button" 
            className="property-more-button"
            onClick={() => openEditModal("general")}
            title="More Options"
          >
            <FiMoreVertical />
          </button>
        </div>
      </section>

      {/* METRICS */}
      <section className="property-detail-metrics">
        <div className="property-detail-metric">
          <div className="metric-icon revenue">↗</div>
          <div>
            <strong>{property.revenue || "₹0"}</strong>
            <span>Revenue ({new Date().toLocaleDateString('en-IN', { month: 'short' })})</span>
          </div>
        </div>

        <div className="property-detail-metric">
          <div className="metric-icon occupancy">
            <FiActivity />
          </div>
          <div>
            <strong>{property.occupancy || 0}%</strong>
            <span>Occupancy</span>
          </div>
        </div>

        <div className="property-detail-metric">
          <div className="metric-icon rate">&#8377;</div>
          <div>
            <strong>
              &#8377;{Number(
                property.baseRate ||
                (roomTypes && roomTypes[0] && roomTypes[0].baseRate) ||
                0
              ).toLocaleString('en-IN')}
            </strong>
            <span>Base Nightly Rate</span>
          </div>
        </div>

        <div className="property-detail-metric">
          <div className="metric-icon bookings">
            <FiFileText />
          </div>
          <div>
            <strong>{property.totalBookings ?? property.bookingsCount ?? 0}</strong>
            <span>Total Bookings</span>
          </div>
        </div>
      </section>

      {/* PROPERTY TABS */}
      <div className="property-detail-tabs">
        <button
          type="button"
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>

        <button
          type="button"
          className={activeTab === "rooms" ? "active" : ""}
          onClick={() => setActiveTab("rooms")}
        >
          <FiHome />
          Rooms & Units
        </button>

        <button
          type="button"
          className={activeTab === "photos" ? "active" : ""}
          onClick={() => setActiveTab("photos")}
        >
          Photos
        </button>

        <button
          type="button"
          className={activeTab === "pricing" ? "active" : ""}
          onClick={() => setActiveTab("pricing")}
        >
          Pricing & Rates
        </button>

        <button
          type="button"
          className={activeTab === "operations" ? "active" : ""}
          onClick={() => setActiveTab("operations")}
        >
          Operations
        </button>

        <button
          type="button"
          className={activeTab === "channels" ? "active" : ""}
          onClick={() => setActiveTab("channels")}
        >
          OTA Channels
        </button>
      </div>

      {/* TAB CONTENTS */}
      {activeTab === "rooms" && (
        <section className="rooms-units-section">
          <div className="rooms-units-header">
            <div>
              <h2>Rooms & Units</h2>
              <p>
                Define individual room types or entire villa units that guests can book.
              </p>
            </div>

            <button
              type="button"
              className="rooms-add-button"
              onClick={() => {
                setEditingRoomTypeId(null);
                setNewRoomType(emptyRoomState);
                setShowAddRoomType(true);
              }}
            >
              <FiPlus />
              Add Room
            </button>
          </div>

          <div className="room-types-list">
            {roomTypes.map((room) => {
              return (
                <article
                  className="room-type-card"
                  key={room.id}
                >
                  <div className="room-type-card-top">
                    <div className="room-type-title">
                      <div className="room-type-icon">
                        <FiHome />
                      </div>

                      <div>
                        <div className="room-type-name-row">
                          <h3>{room.name}</h3>

                          <span className="room-status-badge">
                            <span>●</span>
                            {room.status || "Active"}
                          </span>
                        </div>

                        <p>{room.description}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="room-more-button"
                      onClick={() => openEditRoomType(room)}
                      title="Edit room type"
                    >
                      <FiMoreVertical />
                    </button>
                  </div>

                  <div className="room-type-specs">
                    <span>
                      <FiUsers />
                      {room.guests} Guests Max ({room.maxAdults || room.guests} Adults
                      {room.maxChildren ? `, ${room.maxChildren} Children` : ""})
                    </span>

                    <span>
                      <FiGrid />
                      {room.bedrooms || 1} Bedroom{room.bedrooms === 1 ? "" : "s"} · {room.beds} {room.beds === 1 ? "Bed" : "Beds"} ({room.bedType})
                    </span>

                    <span>
                      {room.bathrooms}{" "}
                      {room.bathrooms === 1 ? "Bathroom" : "Bathrooms"} ({room.bathroomType || "Private"})
                    </span>

                    {room.unitNumbers && (
                      <span className="room-unit-numbers-badge">
                        Units: {room.unitNumbers}
                      </span>
                    )}
                  </div>

                  {/* Room Amenities Badges */}
                  {room.amenities && room.amenities.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 6px 0" }}>
                      {room.amenities.map((a, aIdx) => (
                        <span key={aIdx} style={{ background: "#F1F5F9", color: "#475569", border: "1px solid #E2E8F0", padding: "3px 9px", borderRadius: 12, fontSize: 11.5, fontWeight: 600 }}>
                          {a}
                        </span>
                      ))}
                    </div>
                  )}

                  {room.photos?.length > 0 && (
                    <div className="room-card-photos-strip">
                      {room.photos.map((photoUrl, pIdx) => (
                        <div key={pIdx} className="room-card-photo-thumb">
                          <img src={getPhotoUrl(photoUrl)} alt={`${room.name} ${pIdx + 1}`} />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="room-inventory-row">
                    <div>
                      <strong>
                        {room.quantity}{" "}
                        {room.quantity === 1 ? "Unit" : "Units"}
                      </strong>
                      <span>Sellable inventory</span>
                    </div>

                    <div className="room-inventory-availability">
                      <span>Current availability</span>
                      <strong>{room.quantity} available</strong>
                    </div>
                  </div>

                  <div className="room-type-card-footer">
                    <button
                      type="button"
                      className="room-secondary-button"
                      onClick={() => openEditRoomType(room)}
                    >
                      <FiEdit2 />
                      Edit Room Type
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {activeTab === "photos" && (
        <section className="property-detail-content property-detail-content-full">
          <div className="property-detail-card">
            <div className="property-detail-card-header">
              <h2>Property & Room Photos</h2>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden-file-input"
                accept="image/*" 
                multiple
                onChange={handlePropertyPhotoUpload} 
              />
              <button 
                type="button" 
                className="rooms-add-button" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? "Uploading..." : <><FiPlus /> Upload Photos</>}
              </button>
            </div>
            <p className="property-description">
              Upload high quality photos for your overall property and individual room types. These photos are shared automatically with connected OTAs.
            </p>
            <div className="detail-photo-gallery">
              {property.propertyPhotos?.length > 0 ? (
                property.propertyPhotos.map((photoUrl, i) => (
                  <div key={i} className="detail-photo-card detail-photo-card-filled">
                    <img 
                      src={getPhotoUrl(photoUrl)} 
                      alt={`Property ${i}`} 
                      className="detail-photo-img"
                    />
                    <button
                      type="button"
                      className="detail-photo-delete-btn"
                      onClick={(e) => handleDeletePropertyPhoto(photoUrl, e)}
                      title="Delete photo"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                ))
              ) : (
                [1, 2, 3].map((_, i) => (
                  <div key={i} className="detail-photo-card">
                    <div className="detail-photo-placeholder">
                      <span>Exterior / Common Area Photo #{i + 1}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      )}

      {activeTab === "pricing" && (
        <section className="property-detail-content property-detail-content-full">
          <div className="property-detail-card">
            <div className="property-detail-card-header">
              <div>
                <h2>Room Nightly Rates</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                  Base rates set here are the core StayOps selling prices. Reservations calculate rates automatically based on these values.
                </p>
              </div>
              <button 
                type="button" 
                className="rooms-add-button"
                onClick={() => {
                  saveRoomTypesToBackend(roomTypes);
                }}
              >
                <FiCheck /> Save All Rates
              </button>
            </div>

            <div className="detail-pricing-table">
              {roomTypes.map((room) => {
                const isEditing = editingRateRoomId === room.id;
                const baseVal = room.baseRate ?? property.baseRate ?? 0;
                const wkndVal = room.weekendRate ?? room.baseRate ?? property.baseRate ?? 0;

                return (
                  <div key={room.id} className="detail-pricing-row">
                    <div className="detail-pricing-info">
                      <strong>{room.name}</strong>
                      <span>{room.quantity} unit{room.quantity === 1 ? '' : 's'} · max {room.guests} guests</span>
                    </div>

                    {isEditing ? (
                      <div className="detail-rate-inputs">
                        <div className="detail-rate-input-field">
                          <span>Base Rate (&#8377; / night)</span>
                          <input
                            type="number"
                            min="0"
                            className="pricing-inline-input"
                            value={editingRatesMap.baseRate}
                            onChange={(e) => setEditingRatesMap(prev => ({ ...prev, baseRate: e.target.value }))}
                            placeholder="5000"
                          />
                        </div>

                        <div className="detail-rate-input-field">
                          <span>Weekend Rate (&#8377; / night)</span>
                          <input
                            type="number"
                            min="0"
                            className="pricing-inline-input"
                            value={editingRatesMap.weekendRate}
                            onChange={(e) => setEditingRatesMap(prev => ({ ...prev, weekendRate: e.target.value }))}
                            placeholder="6000"
                          />
                        </div>

                        <div className="detail-rate-actions">
                          <button
                            type="button"
                            className="detail-btn-edit-rate"
                            onClick={handleCancelEditRate}
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            className="detail-btn-save-rate"
                            onClick={() => handleSaveSingleRoomRate(room.id)}
                          >
                            <FiCheck size={14} /> Save Rate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="detail-rate-display-group">
                        <div className="detail-rate-badge">
                          <span>Base Rate</span>
                          <strong>&#8377;{Number(baseVal).toLocaleString('en-IN')} / night</strong>
                        </div>

                        <div className="detail-rate-badge weekend">
                          <span>Weekend Rate</span>
                          <strong>&#8377;{Number(wkndVal).toLocaleString('en-IN')} / night</strong>
                        </div>

                        <button
                          type="button"
                          className="detail-btn-edit-rate"
                          onClick={() => handleStartEditRate(room)}
                        >
                          <FiEdit2 size={13} /> Edit Rates
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {activeTab === "operations" && (
        <section className="property-detail-content property-detail-content-full">
          {/* GUEST & OPERATIONAL RULES */}
          <div className="property-detail-card operations-rules-card">
            <div className="property-detail-card-header">
              <div>
                <h2>Guest & Operational Rules</h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748B' }}>
                  Check-in windows, key access instructions, cancellation policies, and guest house rules.
                </p>
              </div>
              <button
                type="button"
                className="rooms-add-button"
                onClick={() => openEditModal("operations")}
              >
                <FiEdit2 /> Edit Operations
              </button>
            </div>
            {(() => {
              const parseOps = (ops) => {
                if (!ops) return {};
                if (typeof ops === "object") return ops;
                try { return JSON.parse(ops); } catch { return {}; }
              };
              const ops = parseOps(property.operations);
              return (
                <>
                  <div className="property-summary-details" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    <div>
                      <span>CHECK-IN TIME</span>
                      <strong>{formatTime12Hr(ops.checkIn || "14:00")}</strong>
                    </div>
                    <div>
                      <span>CHECK-OUT TIME</span>
                      <strong>{formatTime12Hr(ops.checkOut || "11:00")}</strong>
                    </div>
                    <div>
                      <span>CHECK-IN METHOD</span>
                      <strong>{ops.checkInMethod || "Host check-in"}</strong>
                    </div>
                  </div>
                  <div className="house-rules-section" style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #E2E8F0' }}>
                    <h3 className="house-rules-title" style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                      House Rules
                    </h3>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 8, padding: '12px 16px', fontSize: 13.5, color: '#334155', lineHeight: 1.6 }}>
                      {ops.houseRules || "Standard house rules apply. Quiet hours after 10 PM. No smoking indoors."}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </section>
      )}

      {activeTab === "channels" && (
        <section className="property-detail-content property-detail-content-full">
          <div className="property-detail-card">
            <div className="property-detail-card-header">
              <h2>Channel Manager Status</h2>
            </div>
            <p className="property-description">
              StayOps acts as your property's master source of truth. Connect OTAs in Channel Manager to map listings and synchronize availability.
            </p>
            <div className="channel-preview-card">
              <div className="channel-preview-badge">⚡ Source of Truth Ready</div>
              <p>Your rooms, rates, amenities, and stay rules are saved. When you're ready, open <strong>Channel Manager</strong> to connect Airbnb, Booking.com, and Expedia.</p>
            </div>
          </div>
        </section>
      )}

      {activeTab === "overview" && (
        <section className="property-detail-content">
          <div className="property-detail-card property-summary-card">
            <div className="property-detail-card-header">
              <h2>
                <FiFileText />
                Property Summary
              </h2>
              <button type="button" onClick={() => openEditModal("general")}>
                <FiEdit2 /> Edit
              </button>
            </div>

            <p className="property-description">
              {property.description || "A stunning property managed with StayOps. Features modern amenities and dedicated hospitality service."}
            </p>

            {(() => {
              const overviewOps = parseOps(property.operations);
              return (
                <div className="property-summary-details">
                  <div>
                    <span>PROPERTY ID</span>
                    <strong>PROP-{String(property.id).padStart(3, "0")}</strong>
                  </div>
                  <div>
                    <span>PROPERTY TYPE</span>
                    <strong>{property.type || "Homestay"}</strong>
                  </div>
                  <div>
                    <span>TOTAL ROOMS</span>
                    <strong>{property.rooms || roomTypes?.length || 1} {(property.rooms || roomTypes?.length || 1) === 1 ? "Room" : "Rooms"}</strong>
                  </div>
                  <div>
                    <span>CHECK-IN</span>
                    <strong>{formatTime12Hr(overviewOps.checkIn || "14:00")}</strong>
                  </div>
                  <div>
                    <span>CHECK-OUT</span>
                    <strong>{formatTime12Hr(overviewOps.checkOut || "11:00")}</strong>
                  </div>
                  {property.contactEmail && (
                    <div>
                      <span>CONTACT EMAIL</span>
                      <strong>{property.contactEmail}</strong>
                    </div>
                  )}
                  {property.contactPhone && (
                    <div>
                      <span>CONTACT PHONE</span>
                      <strong>{property.contactPhone}</strong>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* PROPERTY AMENITIES CARD */}
          {(() => {
            const parsePropertyAmenitiesList = (prop) => {
              if (!prop) return [];
              const list = parseAmenitiesList(prop.propertyAmenities);
              if (list.length > 0) return list;
              const ops = parseOps(prop.operations);
              return parseAmenitiesList(ops.amenities);
            };

            const propertyAmenitiesList = parsePropertyAmenitiesList(property);
            return (
              <div className="property-detail-card" style={{ marginTop: 20 }}>
                <div className="property-detail-card-header">
                  <h2>
                    <FiWifi /> Property Amenities & Facilities
                  </h2>
                  <button type="button" onClick={() => openEditModal("amenities")}>
                    <FiEdit2 /> Edit Amenities
                  </button>
                </div>

                {propertyAmenitiesList.length === 0 ? (
                  <div style={{ padding: "16px", background: "#F8FAFC", borderRadius: 8, color: "#64748B", fontSize: 13, border: "1px dashed #CBD5E1" }}>
                    No property-level amenities configured. Click <strong>"Edit Amenities"</strong> to select WiFi, Swimming Pool, Parking, Security, etc.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 12 }}>
                    {propertyAmenitiesList.map((item, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "#EFF6FF",
                          color: "#1E40AF",
                          border: "1px solid #BFDBFE",
                          padding: "6px 14px",
                          borderRadius: 20,
                          fontSize: 12.5,
                          fontWeight: 600,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 6
                        }}
                      >
                        <span style={{ color: "#2563EB" }}>✓</span> {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          <div className="property-detail-card direct-booking-card">
            <div className="property-detail-card-header">
              <h2>
                <FiLink /> Direct Booking
              </h2>
            </div>

            <div className="booking-url-box">
              <span>🔗 {property.storefront || "No storefront available"}</span>
              <button type="button">Copy</button>
            </div>

            <div className="booking-actions">
              <button type="button" className="open-storefront-button">
                <FiLink /> Open Storefront
              </button>
              <button type="button" className="share-storefront-button">
                <FiShare2 /> Share
              </button>
            </div>
          </div>

          <div className="property-detail-card staff-card">
            <div className="property-detail-card-header">
              <h2>
                <FiUsers /> Assigned Staff
              </h2>
            </div>
            <div className="staff-member">
              <div className="staff-avatar">A</div>
              <div className="staff-info">
                <strong>Arjun Menon</strong>
                <span>Head Caretaker</span>
              </div>
              <button type="button" className="staff-whatsapp-button">
                <FiMessageCircle /> WhatsApp
              </button>
            </div>
          </div>

          <div className="property-detail-card activity-card">
            <div className="property-detail-card-header">
              <h2>
                <FiActivity /> Recent Activity
              </h2>
            </div>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-dot"></span>
                <div>
                  <strong>New booking from Direct Storefront — Priya Sharma (Aug 5–8)</strong>
                  <small>2h ago</small>
                </div>
              </div>
              <div className="activity-item">
                <span className="activity-dot"></span>
                <div>
                  <strong>Rate updated: Base rate ₹7,500 set</strong>
                  <small>5h ago</small>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ADD / EDIT ROOM TYPE MODAL */}
      {showAddRoomType && (
        <div
          className="room-modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeRoomTypeModal();
          }}
        >
          <div className="room-modal">
            <div className="room-modal-header">
              <div>
                <h2>
                  {editingRoomTypeId ? "Edit Room" : "Add Room"}
                </h2>
              </div>

              <button
                type="button"
                className="room-modal-close"
                onClick={closeRoomTypeModal}
              >
                <FiX />
              </button>
            </div>

            <form className="room-form" onSubmit={handleSaveRoomType}>
              <label>
                Room Name *
                <input
                  required
                  value={newRoomType.name}
                  onChange={(e) =>
                    setNewRoomType({ ...newRoomType, name: e.target.value })
                  }
                  placeholder="e.g. Couple Room, Deluxe Room"
                />
              </label>

              <label>
                Description
                <textarea
                  value={newRoomType.description}
                  onChange={(e) =>
                    setNewRoomType({
                      ...newRoomType,
                      description: e.target.value,
                    })
                  }
                  placeholder="Describe this accommodation type"
                  rows="3"
                />
              </label>

              <div className="room-form-grid">
                <label>
                  Total Guests Max *
                  <input
                    type="number"
                    min="1"
                    value={newRoomType.guests}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        guests: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Max Adults
                  <input
                    type="number"
                    min="1"
                    value={newRoomType.maxAdults}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        maxAdults: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Max Children
                  <input
                    type="number"
                    min="0"
                    value={newRoomType.maxChildren}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        maxChildren: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Bedrooms
                  <input
                    type="number"
                    min="1"
                    value={newRoomType.bedrooms}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        bedrooms: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Total Beds
                  <input
                    type="number"
                    min="1"
                    value={newRoomType.beds}
                    onChange={(e) =>
                      setNewRoomType({ ...newRoomType, beds: e.target.value })
                    }
                  />
                </label>

                <label>
                  Bed Configuration
                  <select
                    value={newRoomType.bedType}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        bedType: e.target.value,
                      })
                    }
                  >
                    <option>King</option>
                    <option>Queen</option>
                    <option>Twin</option>
                    <option>Single</option>
                    <option>King + Single</option>
                    <option>Multiple Beds</option>
                  </select>
                </label>

                <label>
                  Bathrooms
                  <input
                    type="number"
                    min="1"
                    value={newRoomType.bathrooms}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        bathrooms: e.target.value,
                      })
                    }
                  />
                </label>

                <label>
                  Bathroom Type
                  <select
                    value={newRoomType.bathroomType}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        bathroomType: e.target.value,
                      })
                    }
                  >
                    <option>Private</option>
                    <option>Shared</option>
                    <option>Mix of private and shared</option>
                  </select>
                </label>

                <label>
                  How many rooms do you have? *
                  <input
                    type="number"
                    min="1"
                    value={newRoomType.quantity}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        quantity: e.target.value,
                      })
                    }
                    placeholder="e.g. 3"
                  />
                </label>

                <label>
                  Room Numbers / Names (Optional)
                  <input
                    value={newRoomType.unitNumbers}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        unitNumbers: e.target.value,
                      })
                    }
                    placeholder="e.g. 101, 102, 103"
                  />
                </label>

                <label>
                  Base Rate (₹ / night)
                  <input
                    type="number"
                    min="0"
                    value={newRoomType.baseRate}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        baseRate: e.target.value,
                      })
                    }
                    placeholder={
                      Number(property.baseRate) > 0
                        ? String(property.baseRate)
                        : "e.g. 7500"
                    }
                  />
                  <small>
                    Default property rate will be used if left empty.
                  </small>
                </label>

                <label>
                  Weekend Rate (₹ / night)
                  <input
                    type="number"
                    min="0"
                    value={newRoomType.weekendRate}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        weekendRate: e.target.value,
                      })
                    }
                    placeholder={
                      Number(newRoomType.baseRate) > 0
                        ? String(newRoomType.baseRate)
                        : Number(property.baseRate) > 0
                        ? String(property.baseRate)
                        : "e.g. 8500"
                    }
                  />
                  <small>
                    Used on Saturday and Sunday.
                  </small>
                </label>

                <label>
                  Status
                  <select
                    value={newRoomType.status}
                    onChange={(e) =>
                      setNewRoomType({
                        ...newRoomType,
                        status: e.target.value,
                      })
                    }
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </label>
              </div>

              <div className="room-modal-section-block">
                <div className="room-photos-header">
                  <strong>Room Photos</strong>
                  <span>Upload high-quality photos specific to this room category</span>
                </div>

                <input
                  type="file"
                  ref={roomFileInputRef}
                  className="hidden-file-input"
                  accept="image/*"
                  multiple
                  onChange={handleRoomPhotoUpload}
                />

                <button
                  type="button"
                  className="room-secondary-button room-upload-btn"
                  onClick={() => roomFileInputRef.current?.click()}
                  disabled={isUploadingRoomPhoto}
                >
                  <FiUpload />
                  {isUploadingRoomPhoto ? "Uploading..." : "Add Room Photos"}
                </button>

                {newRoomType.photos?.length > 0 && (
                  <div className="room-modal-photos-grid">
                    {newRoomType.photos.map((photoUrl, idx) => (
                      <div key={idx} className="room-modal-photo-card">
                        <img src={getPhotoUrl(photoUrl)} alt={`Room ${idx + 1}`} />
                        <button
                          type="button"
                          className="room-modal-photo-remove"
                          onClick={() => handleRemoveRoomPhoto(idx)}
                          title="Remove photo"
                        >
                          <FiX />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="room-modal-footer">
                <button
                  type="button"
                  className="room-secondary-button"
                  onClick={closeRoomTypeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="rooms-add-button">
                  {editingRoomTypeId ? "Save Changes" : "Save Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROPERTY MODAL */}
      <EditPropertyModal
        isOpen={showEditPropertyModal}
        property={property}
        onClose={() => setShowEditPropertyModal(false)}
        onSave={handleUpdateProperty}
        initialTab={editModalTab}
      />

      {/* FLOATING UNSAVED CHANGES BAR */}
      {isDirty && (
        <div className="floating-save-bar">
          <div className="floating-save-bar-info">
            <FiAlertTriangle size={18} color="#F59E0B" />
            <span>You have unsaved changes to <strong>{property.name}</strong></span>
          </div>
          <div className="floating-save-bar-actions">
            <button
              type="button"
              className="floating-btn-discard"
              onClick={handleDiscardAllChanges}
              disabled={isSavingAll}
            >
              Discard
            </button>
            <button
              type="button"
              className="floating-btn-save"
              onClick={handleSaveAllChanges}
              disabled={isSavingAll}
            >
              {isSavingAll ? "Saving..." : <><FiCheck size={16} /> Save Changes</>}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default PropertyDetails;