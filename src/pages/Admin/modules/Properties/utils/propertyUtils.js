/**
 * Property management utility functions for StayOps Admin Console.
 * Directly interfaces with the Spring Boot backend database.
 */

import { API_BASE_URL } from "../../../../../config/api";

/**
 * Fetches all properties directly from the backend MySQL database across all owners.
 */
export async function fetchAdminProperties() {
  const res = await fetch(`${API_BASE_URL}/admin/properties`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load properties from database: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  if (!Array.isArray(data)) {
    throw new Error("Invalid response format from properties database API.");
  }

  return data.map(mapBackendPropertyToAdminRow);
}

/**
 * Updates a property's live status directly in the MySQL database.
 * @param {number|string} propertyId
 * @param {string} status "Active" | "Suspended" | "Review" | "Setup Pending"
 */
export async function updatePropertyStatus(propertyId, status) {
  const res = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}/status`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    throw new Error(`Failed to update property status in database: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  return mapBackendPropertyToAdminRow(data);
}

/**
 * Registers a new property directly into the backend database.
 */
export async function createAdminProperty(propertyPayload) {
  const res = await fetch(`${API_BASE_URL}/admin/properties`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(propertyPayload),
  });

  if (!res.ok) {
    throw new Error(`Failed to create property in database: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  return mapBackendPropertyToAdminRow(data);
}

/**
 * Deletes a property directly from the backend database.
 */
export async function deleteAdminProperty(propertyId) {
  const res = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    throw new Error(`Failed to delete property from database: ${res.statusText} (${res.status})`);
  }

  return true;
}

/**
 * Fetches single property detail directly from the backend MySQL database.
 */
export async function fetchPropertyDetail(propertyId) {
  const res = await fetch(`${API_BASE_URL}/admin/properties/${propertyId}`, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to load property details: ${res.statusText} (${res.status})`);
  }

  const data = await res.json();
  return mapBackendPropertyToAdminRow(data);
}

/**
 * Normalizes backend database entity attributes into the standardized Admin table schema.
 */
export function mapBackendPropertyToAdminRow(p) {
  let parsedRooms = [];
  if (p.roomTypes) {
    try {
      parsedRooms = typeof p.roomTypes === "string" ? JSON.parse(p.roomTypes) : p.roomTypes;
    } catch {
      parsedRooms = [];
    }
  }

  let parsedAmenities = [];
  if (p.propertyAmenities) {
    try {
      parsedAmenities = typeof p.propertyAmenities === "string" ? JSON.parse(p.propertyAmenities) : p.propertyAmenities;
    } catch {
      parsedAmenities = [];
    }
  }

  let parsedOps = {};
  if (p.operations) {
    try {
      parsedOps = typeof p.operations === "string" ? JSON.parse(p.operations) : p.operations;
    } catch {
      parsedOps = {};
    }
  }

  // If amenities were stored inside operations JSON, merge them
  if ((!parsedAmenities || parsedAmenities.length === 0) && Array.isArray(parsedOps.amenities)) {
    parsedAmenities = parsedOps.amenities;
  }

  const rawStatus = (p.status || "Active").trim();
  const lowerStatus = rawStatus.toLowerCase();
  
  // Normalize status key for admin filter tabs and badges
  let normalizedStatus = "active";
  if (lowerStatus.includes("suspend")) {
    normalizedStatus = "suspended";
  } else if (lowerStatus.includes("review") || lowerStatus.includes("setup") || lowerStatus.includes("pending")) {
    normalizedStatus = "review";
  } else {
    normalizedStatus = "active";
  }

  // Format creation / joined date
  let joinedDate = "Recent";
  if (p.createdAt) {
    try {
      const d = new Date(p.createdAt);
      if (!isNaN(d.getTime())) {
        joinedDate = d.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        });
      }
    } catch {
      joinedDate = "Recent";
    }
  }

  // Total room count calculation
  let totalRooms = p.rooms || 1;
  if (Array.isArray(parsedRooms) && parsedRooms.length > 0) {
    const sumCount = parsedRooms.reduce((acc, r) => acc + Number(r.count || r.quantity || 1), 0);
    if (sumCount > 0) totalRooms = sumCount;
  }

  // Max guests calculation
  let calculatedMaxGuests = totalRooms * 2;
  if (Array.isArray(parsedRooms) && parsedRooms.length > 0) {
    const sumGuests = parsedRooms.reduce((acc, r) => acc + Number(r.maxGuests || r.maxAdults || 2), 0);
    if (sumGuests > 0) calculatedMaxGuests = sumGuests;
  }

  return {
    id: p.id,
    code: p.code || `PROP-${p.id}`,
    name: p.name || `Property #${p.id}`,
    category: p.category || p.type || "Homestay",
    type: p.type || "Homestay",
    city: p.city || "Karnataka",
    state: p.state || "India",
    pincode: p.postalCode || "",
    address: p.address || "",
    permitId: p.permitId || "PERM-KAR-2026",
    contactEmail: p.contactEmail || p.ownerEmail || "owner@stayops.in",
    contactPhone: p.contactPhone || p.ownerPhone || "+91 98765 43210",
    rooms: totalRooms,
    maxGuests: calculatedMaxGuests,
    ownerId: p.ownerId || 1,
    ownerName: p.ownerName || "Owner",
    ownerEmail: p.ownerEmail || p.contactEmail || "owner@stayops.in",
    ownerPhone: p.ownerPhone || p.contactPhone || "+91 98765 43210",
    subscriptionPlan: p.subscriptionPlan || "Multi-Property Hub",
    slug: p.slug || (p.name ? p.name.toLowerCase().replace(/[^a-z0-9]/g, "") : `property-${p.id}`),
    status: normalizedStatus, // "active", "review", "suspended"
    rawStatus: rawStatus,
    storefrontEnabled: normalizedStatus === "active",
    baseRate: p.baseRate || 3500,
    joinedDate: joinedDate,
    amenities: Array.isArray(parsedAmenities) ? parsedAmenities : [],
    roomTypes: Array.isArray(parsedRooms) ? parsedRooms : [],
    propertyPhotos: Array.isArray(p.propertyPhotos) ? p.propertyPhotos : [],
    description: p.description || "Registered stay on StayOps platform.",
    operations: parsedOps,
    auditLog: Array.isArray(p.auditLog) ? p.auditLog : [],
  };
}

/**
 * Generates an accurate, accessible storefront URL whether running in localhost or production.
 */
export function getStorefrontUrl(slug) {
  if (!slug) return "#";
  if (typeof window === "undefined") return `https://${slug}.stayops.in`;

  const hostname = window.location.hostname;
  const port = window.location.port ? `:${window.location.port}` : "";

  // If local development (supporting both admin.localhost and standard localhost)
  if (hostname.includes("localhost") || hostname.includes("127.0.0.1")) {
    return `http://localhost${port}/p/${slug}`;
  }

  // In production
  return `https://${slug}.stayops.in`;
}

/**
 * Exports current properties data into a downloadable CSV file.
 */
export function exportPropertiesToCSV(properties) {
  if (!Array.isArray(properties) || properties.length === 0) return;

  const headers = [
    "Property Code",
    "Property Name",
    "Category",
    "City",
    "State",
    "Room Units",
    "Owner Name",
    "Owner Email",
    "Owner Phone",
    "Subscription Plan",
    "Storefront Slug",
    "Base Rate (INR)",
    "Status",
    "Registration Date",
  ];

  const rows = properties.map((p) => [
    `"${p.code || ""}"`,
    `"${p.name || ""}"`,
    `"${p.category || ""}"`,
    `"${p.city || ""}"`,
    `"${p.state || ""}"`,
    p.rooms || 0,
    `"${p.ownerName || ""}"`,
    `"${p.ownerEmail || ""}"`,
    `"${p.ownerPhone || ""}"`,
    `"${p.subscriptionPlan || ""}"`,
    `"${p.slug || ""}"`,
    p.baseRate || 0,
    `"${p.status || ""}"`,
    `"${p.joinedDate || ""}"`,
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `stayops_properties_master_${new Date().toISOString().slice(0, 10)}.csv`
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
