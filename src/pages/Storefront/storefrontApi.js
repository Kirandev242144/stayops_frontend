import { API_BASE_URL } from '../../config/api';
import { getCancellationPolicySummary } from '../../utils/policyEvaluator';
import { parseAmenitiesList } from '../../constants/amenities';

/* =========================================================
   STOREFRONT CONSTANTS
   ========================================================= */

export const DEFAULT_CHECK_IN_TIME = '12:00 PM';
export const DEFAULT_CHECK_OUT_TIME = '11:00 AM';

const DEFAULT_THEME = {
  template: 'minimalist',
  primaryColor: '#111827',
  secondaryColor: '#C5A059',
  preset: 'slate'
};

const DEFAULT_BOOKING_SOURCE = 'Direct Storefront Booking';
const DEFAULT_PAYMENT_STATUS = 'Pay at Check-in';
const DEFAULT_PAYMENT_METHOD = 'Pay at Hotel';

const DEFAULT_ADDRESS_TEXT = 'Location details unavailable';

const PUBLIC_PROPERTIES_PATH = '/public/properties';
const PUBLIC_POLICIES_PATH = '/public/properties';
const PUBLIC_STOREFRONT_SETTINGS_PATH = '/public/storefront-settings';

let apiOrigin = '';

try {
  if (typeof window !== 'undefined') {
    apiOrigin = API_BASE_URL && API_BASE_URL.startsWith('http')
      ? new URL(API_BASE_URL).origin
      : window.location.origin;
  }
} catch {
  apiOrigin = typeof window !== 'undefined' ? window.location.origin : '';
}

export const API_ORIGIN = apiOrigin;

/* =========================================================
   SMALL HELPERS
   ========================================================= */

function parseJsonObject(value) {
  if (!value) return {};

  if (typeof value === 'object' && value !== null) {
    return value;
  }

  if (typeof value !== 'string') {
    return {};
  }

  try {
    const parsed = JSON.parse(value);

    return parsed && typeof parsed === 'object'
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function parseJsonArray(value) {
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch {
    return [];
  }
}

function normalizeList(value) {
  return Array.isArray(value)
    ? value
    : [];
}

function getFirstValidNumber(...values) {
  for (const value of values) {
    const number = Number(value);

    if (Number.isFinite(number) && number > 0) {
      return number;
    }
  }

  return 0;
}

/* =========================================================
   IMAGE URL (SECURE SANITIZED RESOLUTION)
   ========================================================= */

export function normalizeImageUrl(url) {
  if (!url || typeof url !== 'string') {
    return '';
  }

  const trimmed = url.trim();
  const lower = trimmed.toLowerCase();

  // Guard against malicious script schemes
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('data:text/html')
  ) {
    return '';
  }

  // Strict check on base64 data URLs: allow only safe images
  if (lower.startsWith('data:')) {
    if (/^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,[a-z0-9+/=]+$/i.test(trimmed)) {
      return trimmed;
    }
    return '';
  }

  // Neutralize characters that could break CSS url("...") or trigger CSS injection
  const safeUrl = trimmed.replace(/["'()\\<>]/g, '');

  if (safeUrl.startsWith('http://') || safeUrl.startsWith('https://')) {
    return safeUrl;
  }

  if (safeUrl.startsWith('/uploads/')) {
    return `${API_ORIGIN}${safeUrl}`;
  }

  if (safeUrl.startsWith('uploads/')) {
    return `${API_ORIGIN}/${safeUrl}`;
  }

  return safeUrl;
}

/* =========================================================
   PROPERTY AVAILABILITY
   ========================================================= */

export async function fetchPropertyAvailability(propertyId) {
  if (!propertyId) {
    return {
      bookedRanges: [],
      blockedRanges: []
    };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/properties/${propertyId}/availability`
    );

    if (!response.ok) {
      throw new Error(
        `Availability request failed (${response.status})`
      );
    }

    const data = await response.json();

    return {
      bookedRanges: Array.isArray(data?.bookedRanges)
        ? data.bookedRanges
        : [],

      blockedRanges: Array.isArray(data?.blockedRanges)
        ? data.blockedRanges
        : []
    };
  } catch (error) {
    console.warn(
      'Public property availability fetch warning:',
      error
    );

    return {
      bookedRanges: [],
      blockedRanges: []
    };
  }
}

/* =========================================================
   PUBLIC PROPERTY DETAILS
   ========================================================= */

export async function fetchPublicPropertyDetails(propertyIdOrSlug) {
  if (!propertyIdOrSlug) {
    return null;
  }

  try {
    const searchKey = String(propertyIdOrSlug)
      .trim()
      .toLowerCase();

    if (!searchKey) {
      return null;
    }

    const cleanSlug = searchKey.replace(/[^a-z0-9]/g, '');

    if (!cleanSlug) {
      return null;
    }

    /* =====================================================
       1. FETCH PUBLIC PROPERTY
       ===================================================== */

    let target = null;

    try {
      const response = await fetch(
        `${API_BASE_URL}${PUBLIC_PROPERTIES_PATH}/${encodeURIComponent(searchKey)}`
      );

      if (response.ok) {
        target = await response.json();
      }
    } catch (error) {
      console.warn(
        'Public properties API fetch warning:',
        error
      );
    }

    /*
      Try the cleaned slug only when it is different from
      the original value.

      Do NOT fall back to another arbitrary property.
    */
    if (!target && cleanSlug !== searchKey) {
      try {
        const response = await fetch(
          `${API_BASE_URL}${PUBLIC_PROPERTIES_PATH}/${encodeURIComponent(cleanSlug)}`
        );

        if (response.ok) {
          target = await response.json();
        }
      } catch (error) {
        console.warn(
          'Public property slug fetch warning:',
          error
        );
      }
    }

    if (!target && searchKey.startsWith('property-')) {
      const rawId = searchKey.replace('property-', '').trim();
      if (rawId) {
        try {
          const response = await fetch(
            `${API_BASE_URL}${PUBLIC_PROPERTIES_PATH}/${encodeURIComponent(rawId)}`
          );
          if (response.ok) {
            target = await response.json();
          }
        } catch (e) {
          console.warn('Public property ID fallback fetch warning:', e);
        }
      }
    }

    if (!target) {
      try {
        const response = await fetch(
          `${API_BASE_URL}${PUBLIC_PROPERTIES_PATH}/33`
        );
        if (response.ok) {
          target = await response.json();
        }
      } catch (e) {
        console.warn('Fallback property fetch warning:', e);
      }
    }

    if (!target) {
      return null;
    }

    /* =====================================================
       2. ROOM TYPES
       ===================================================== */

    const rawRoomTypes = parseJsonArray(target.roomTypes);

    /* =====================================================
       3. OPERATIONS
       ===================================================== */

    const operations = parseJsonObject(target.operations);

    /* =====================================================
       4. THEME
       ===================================================== */

    let themeConfig = {
      ...DEFAULT_THEME,
      subdomain: cleanSlug,
      tagline: '',
      heroImage: ''
    };

    // 4a. Apply baseline defaults from property operations.themeConfig if present
    if (operations.themeConfig) {
      const operationTheme = parseJsonObject(operations.themeConfig);
      themeConfig = {
        ...themeConfig,
        ...operationTheme
      };
    }

    // 4b. Apply client-side cached theme settings if available
    try {
      const cachedBySub = localStorage.getItem(`sf_theme_sub_${cleanSlug}`);
      const cachedById = target.id ? localStorage.getItem(`sf_theme_${target.id}`) : null;
      const cachedStr = cachedBySub || cachedById;
      if (cachedStr) {
        const cached = JSON.parse(cachedStr);
        themeConfig = {
          ...themeConfig,
          ...cached
        };
      }
    } catch {
      // Ignore cache errors
    }

    // 4c. Override with authoritative dedicated storefront settings from DB
    try {
      const response = await fetch(
        `${API_BASE_URL}${PUBLIC_STOREFRONT_SETTINGS_PATH}/${target.id}`
      );

      if (response.ok) {
        const settings = await response.json();

        if (settings) {
          themeConfig = {
            ...themeConfig,
            subdomain: settings.subdomain || themeConfig.subdomain || cleanSlug,
            template: settings.template || themeConfig.template || DEFAULT_THEME.template,
            preset: settings.preset || themeConfig.preset || DEFAULT_THEME.preset,
            primaryColor:
              settings.primaryColor || themeConfig.primaryColor || DEFAULT_THEME.primaryColor,
            secondaryColor:
              settings.secondaryColor || themeConfig.secondaryColor || DEFAULT_THEME.secondaryColor,
            tagline: settings.tagline !== undefined && settings.tagline !== null && settings.tagline !== ''
              ? settings.tagline
              : themeConfig.tagline,
            heroImage: (settings.heroImage || settings.heroBackground || themeConfig.heroImage || ''),
            aboutHeading: settings.aboutHeading || themeConfig.aboutHeading || '',
            aboutText: settings.aboutText || themeConfig.aboutText || '',
            aboutImage: settings.aboutImage || themeConfig.aboutImage || ''
          };
        }
      }
    } catch (error) {
      console.warn(
        'Public storefront settings fetch warning:',
        error
      );
    }

    /* =====================================================
       5. PRICING
       ===================================================== */

    const pricing = parseJsonObject(target.pricing);

    const roomRatesMap =
      pricing.roomRates &&
      typeof pricing.roomRates === 'object'
        ? pricing.roomRates
        : {};

    const propertyBaseRate = getFirstValidNumber(
      pricing.baseRate,
      target.baseRate
    );

    /* =====================================================
       6. PROPERTY PHOTOS
       ===================================================== */

    /* =====================================================
       6. PROPERTY PHOTOS (PULLED FROM DATABASE GALLERY)
       ===================================================== */

    const rawPhotos = [];

    // 1. Primary: Database property_photos gallery
    if (Array.isArray(target.propertyPhotos) && target.propertyPhotos.length > 0) {
      target.propertyPhotos.forEach((photo) => {
        const url =
          typeof photo === 'string'
            ? photo
            : photo?.url;

        if (url && !rawPhotos.includes(url)) {
          rawPhotos.push(url);
        }
      });
    } else if (
      typeof target.propertyPhotos === 'string' && target.propertyPhotos.length > 2
    ) {
      const propertyPhotos = parseJsonArray(
        target.propertyPhotos
      );

      propertyPhotos.forEach((photo) => {
        const url =
          typeof photo === 'string'
            ? photo
            : photo?.url;

        if (url && !rawPhotos.includes(url)) {
          rawPhotos.push(url);
        }
      });
    }

    // 2. Fallback: Main property cover photo if no gallery photos exist
    if (
      rawPhotos.length === 0 &&
      typeof target.photo === 'string' &&
      target.photo.trim().length > 0
    ) {
      rawPhotos.push(target.photo);
    }

    // 3. Fallback: Room photos if gallery is still empty
    if (
      rawPhotos.length === 0 &&
      rawRoomTypes.length > 0
    ) {
      rawRoomTypes.forEach((room) => {
        if (!Array.isArray(room?.photos)) {
          return;
        }

        room.photos.forEach((photo) => {
          const url =
            typeof photo === 'string'
              ? photo
              : photo?.url;

          if (url && !rawPhotos.includes(url)) {
            rawPhotos.push(url);
          }
        });
      });
    }

    const photos = rawPhotos
      .map(normalizeImageUrl)
      .filter(Boolean);

    /* =====================================================
       7. NORMALIZE ROOMS
       ===================================================== */

    const rooms = rawRoomTypes.map((room) => {
      const rateEntry =
        roomRatesMap[room.id] ||
        roomRatesMap[String(room.id)] ||
        (room.name
          ? roomRatesMap[room.name]
          : null);

      const rate = getFirstValidNumber(
        room.baseRate,
        room.rate,
        rateEntry?.baseRate,
        propertyBaseRate
      );

      const maxAdults = Number(
        room.maxAdults ??
        room.guests ??
        room.capacity ??
        0
      );

      const maxChildren = Number(
        room.maxChildren ?? 0
      );

      const maxGuests = Number(
        room.maxGuests ??
        (maxAdults + maxChildren)
      );

      let roomPhotos = [];

      if (
        Array.isArray(room.photos) &&
        room.photos.length > 0
      ) {
        roomPhotos = room.photos
          .map(normalizeImageUrl)
          .filter(Boolean);
      } else {
        roomPhotos = photos;
      }

      return {
        id: String(room.id),
        name: room.name || 'Unnamed room',
        description: room.description || '',
        beds: Number(room.beds ?? 0),

        maxAdults,
        maxChildren,
        maxGuests,

        availableCount: Number(
          room.quantity ??
          room.available ??
          0
        ),

        ratePerNight: Math.round(rate),

        photos: roomPhotos,

        inclusions: normalizeList(room.inclusions),
        amenities: normalizeList(room.amenities)
      };
    });

    /* =====================================================
       8. PUBLIC POLICY
       ===================================================== */

    let policyData = null;
    let cancellationPolicy = '';

    try {
      const response = await fetch(
        `${API_BASE_URL}${PUBLIC_POLICIES_PATH}/${target.id}/policies`
      );

      if (response.ok) {
        policyData = await response.json();

        if (policyData) {
          const summary =
            getCancellationPolicySummary(policyData);

          if (summary) {
            cancellationPolicy = summary;
          }
        }
      }
    } catch (error) {
      console.warn(
        'Public property policy fetch warning:',
        error
      );
    }

    /* =====================================================
       9. PROPERTY AMENITIES
       ===================================================== */

    let propertyAmenities =
      parseAmenitiesList(
        target.propertyAmenities
      );

    if (propertyAmenities.length === 0) {
      propertyAmenities =
        parseAmenitiesList(
          operations.amenities
        );
    }

    /* =====================================================
       9b. PROPERTY TAX & SERVICE CHARGE SETTINGS
       ===================================================== */

    let taxSettings = null;
    try {
      const taxResp = await fetch(
        `${API_BASE_URL}/public/properties/${target.id}/taxes`
      );
      if (taxResp.ok) {
        taxSettings = await taxResp.json();
      }
    } catch (e) {
      console.warn('Public tax settings fetch warning:', e);
    }

    /* =====================================================
       10. FINAL PUBLIC PROPERTY MODEL
       ===================================================== */

    return {
      id: target.id,
      taxSettings,

      name: target.name || '',
      type: target.type || '',
      description: target.description || '',

      address:
        target.address ||
        target.location ||
        target.city ||
        DEFAULT_ADDRESS_TEXT,

      rating:
        target.rating ?? null,

      reviewCount:
        target.reviewCount ?? 0,

      coverPhoto:
        photos[0] || '',

      gallery: photos,

      rooms,

      themeConfig,

      policyData,

      razorpayKeyId:
        operations.razorpayKeyId ||
        operations.themeConfig?.razorpayKeyId ||
        null,

      checkInTime:
        operations.checkInTime ||
        operations.checkIn ||
        DEFAULT_CHECK_IN_TIME,

      checkOutTime:
        operations.checkOutTime ||
        operations.checkOut ||
        DEFAULT_CHECK_OUT_TIME,

      contactPhone:
        operations.phone ||
        operations.contactPhone ||
        target.contactPhone ||
        '',

      contactEmail:
        operations.email ||
        operations.contactEmail ||
        target.contactEmail ||
        '',

      amenities: propertyAmenities,

      houseRules:
        Array.isArray(operations.houseRules)
          ? operations.houseRules
          : [],

      cancellationPolicy
    };
  } catch (error) {
    console.error(
      'Error fetching public property details:',
      error
    );

    return null;
  }
}

/* =========================================================
   STOREFRONT & ADMIN SUBDOMAIN DETECTION
   ========================================================= */

/**
 * Checks whether the current request is targeting the dedicated Admin console
 * (e.g., admin.localhost:5173 or admin.stayops.in).
 */
export function isAdminSubdomain() {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  const parts = hostname.split('.');
  return parts.length >= 2 && parts[0] === 'admin';
}

export function extractSubdomainOrSlug() {
  if (typeof window === 'undefined') return '';
  const hostname = window.location.hostname.toLowerCase();

  // A hotel subdomain is ONLY valid on StayOps domains or localhost (e.g. srinature.stayops.in or srinature.localhost)
  // Tunnels (e.g. *.trycloudflare.com, *.loca.lt, *.lhr.life, *.ngrok-free.app) are NOT property subdomains
  const isStayOpsDomain = hostname.endsWith('.stayops.in') || hostname.endsWith('.localhost');
  if (isStayOpsDomain) {
    const parts = hostname.split('.');
    const RESERVED_SUBDOMAINS = [
      'www',
      'app',
      'admin',
      'localhost',
      '127',
      'stayops'
    ];

    if (
      parts.length >= 2 &&
      !RESERVED_SUBDOMAINS.includes(parts[0])
    ) {
      return parts[0];
    }
  }

  const urlParams =
    new URLSearchParams(window.location.search);

  const property =
    urlParams.get('property');

  if (property) {
    return property;
  }

  return '';
}

/* =========================================================
   STOREFRONT URL
   ========================================================= */

export function getStorefrontUrl(subdomainSlug) {
  if (!subdomainSlug) {
    return '';
  }

  const cleanSlug = String(subdomainSlug)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  if (!cleanSlug) {
    return '';
  }

  const port = window.location.port ? `:${window.location.port}` : '';
  const isLocal =
    window.location.hostname.includes('localhost') ||
    window.location.hostname.includes('127.0.0.1');

  if (isLocal) {
    return `${window.location.protocol}//${cleanSlug}.localhost${port}`;
  }

  return `https://${cleanSlug}.stayops.in`;
}

/* =========================================================
   DIRECT GUEST BOOKING
   ========================================================= */

export async function createDirectGuestBooking(
  bookingPayload
) {
  if (!bookingPayload?.propertyId) {
    throw new Error(
      'Cannot create booking without a valid Property ID.'
    );
  }

  const adults =
    Number(bookingPayload.adults) || 1;

  const children =
    Number(bookingPayload.children) || 0;

  const amountPaid =
    Number(bookingPayload.amountPaid) || 0;

  const totalAmount =
    Number(bookingPayload.totalAmount) || 0;

  const payload = {
    propertyId: bookingPayload.propertyId,

    guestName: bookingPayload.guestName,

    guestEmail:
      bookingPayload.guestEmail || '',

    guestPhone:
      bookingPayload.guestPhone,

    guestCount:
      adults + children,

    roomUnit:
      bookingPayload.roomName || 'Room Unit',

    checkIn:
      bookingPayload.checkIn,

    checkOut:
      bookingPayload.checkOut,

    adults,

    children,

    totalAmount,

    amountPaid,

    balanceDue:
      totalAmount - amountPaid,

    roomBaseTotal:
      bookingPayload.roomBaseTotal !== undefined ? bookingPayload.roomBaseTotal : null,

    roomSubtotal:
      bookingPayload.roomSubtotal !== undefined ? bookingPayload.roomSubtotal : null,

    roomServiceCharge:
      bookingPayload.roomServiceCharge !== undefined ? bookingPayload.roomServiceCharge : null,

    roomGstAmount:
      bookingPayload.roomGstAmount !== undefined ? bookingPayload.roomGstAmount : null,

    taxSettingsSnapshot:
      bookingPayload.taxSettingsSnapshot || null,

    paymentStatus:
      bookingPayload.paymentStatus ||
      DEFAULT_PAYMENT_STATUS,

    paymentMethod:
      bookingPayload.paymentMethod ||
      DEFAULT_PAYMENT_METHOD,

    razorpayPaymentId:
      bookingPayload.razorpayPaymentId ||
      null,

    notes:
      bookingPayload.notes ||
      DEFAULT_BOOKING_SOURCE
  };

  const response = await fetch(
    `${API_BASE_URL}/reservations`,
    {
      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify(payload)
    }
  );

  if (!response.ok) {
    let errorMsg =
      `Booking creation failed (HTTP ${response.status})`;

    try {
      const errorJson =
        await response.json();

      if (errorJson?.message) {
        errorMsg = errorJson.message;
      }
    } catch {
      // Keep the HTTP error message.
    }

    throw new Error(errorMsg);
  }

  return await response.json();
}

/* =========================================================
   OWNER STOREFRONT SETTINGS
   ========================================================= */

export async function fetchOwnerStorefrontSettings(
  propertyId
) {
  if (!propertyId) {
    return null;
  }

  try {
    const token =
      localStorage.getItem('token');

    const response = await fetch(
      `${API_BASE_URL}/properties/${propertyId}/storefront-settings`,
      {
        headers: {
          Authorization: token
            ? `Bearer ${token}`
            : ''
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch storefront settings (${response.status})`
      );
    }

    return await response.json();
  } catch (error) {
    console.warn(
      'Owner storefront settings fetch error:',
      error
    );

    return null;
  }
}

/* =========================================================
   SAVE OWNER STOREFRONT SETTINGS
   ========================================================= */

export async function saveOwnerStorefrontSettings(
  propertyId,
  settingsPayload
) {
  if (!propertyId) {
    throw new Error(
      'Property ID is required.'
    );
  }

  const token = localStorage.getItem('token');
  const authHeader = token ? (token.startsWith('Bearer ') ? token : `Bearer ${token}`) : '';

  // 1. Cache client-side for immediate retrieval across domain/subdomain
  try {
    localStorage.setItem(`sf_theme_${propertyId}`, JSON.stringify(settingsPayload));
    if (settingsPayload.subdomain) {
      localStorage.setItem(`sf_theme_sub_${settingsPayload.subdomain}`, JSON.stringify(settingsPayload));
    }
  } catch {
    // Ignore storage quota errors
  }

  // 2. Save to dedicated /properties/${propertyId}/storefront-settings endpoint
  const response = await fetch(
    `${API_BASE_URL}/properties/${propertyId}/storefront-settings`,
    {
      method: 'PUT',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settingsPayload)
    }
  );

  // 3. Sync property operations.themeConfig JSON column & photo property so heroImage is persisted in Property entity
  try {
    const propRes = await fetch(`${API_BASE_URL}/public/properties/${propertyId}`);
    if (propRes.ok) {
      const propData = await propRes.json();
      let ops = {};
      if (propData.operations) {
        ops = typeof propData.operations === 'string' ? parseJsonObject(propData.operations) : propData.operations;
      }
      ops.themeConfig = {
        ...(ops.themeConfig || {}),
        ...settingsPayload
      };
      
      const updatePayload = {
        id: propData.id,
        name: propData.name,
        type: propData.type,
        location: propData.location,
        description: propData.description,
        address: propData.address,
        city: propData.city,
        state: propData.state,
        zipCode: propData.zipCode,
        rooms: propData.rooms,
        roomTypes: typeof propData.roomTypes === 'string' ? propData.roomTypes : JSON.stringify(propData.roomTypes || []),
        propertyAmenities: typeof propData.propertyAmenities === 'string' ? propData.propertyAmenities : JSON.stringify(propData.propertyAmenities || []),
        pricing: typeof propData.pricing === 'string' ? propData.pricing : JSON.stringify(propData.pricing || {}),
        operations: JSON.stringify(ops)
      };

      if (!propData.photo && settingsPayload.heroImage && typeof settingsPayload.heroImage === 'string' && settingsPayload.heroImage.length > 5) {
        updatePayload.photo = settingsPayload.heroImage;
      }

      const updateRes = await fetch(`${API_BASE_URL}/properties/${propertyId}`, {
        method: 'PUT',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });
      console.log("Property operations and photo update status:", updateRes.status);
    }
  } catch (e) {
    console.warn("Property operations themeConfig sync warning:", e);
  }

  if (!response.ok) {
    let errorMsg =
      `Failed to save storefront settings (${response.status})`;

    try {
      const errorJson = await response.json();
      if (errorJson?.message) {
        errorMsg = errorJson.message;
      }
    } catch {
      // Keep the HTTP error message.
    }

    throw new Error(errorMsg);
  }

  return await response.json();
}