/**
 * Safely converts a value to a finite number.
 *
 * @param {*} value - Input value
 * @param {number} fallback - Fallback number if value is NaN or infinite
 * @returns {number} Valid finite number
 */
const safeNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

/**
 * Safely converts common boolean values.
 * Handles boolean types, boolean strings ("true"/"false"), and truthy values.
 *
 * @param {*} value - Input value
 * @returns {boolean} Parsed boolean
 */
const toBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return Boolean(value);
};

/**
 * Parses a JSON object when the backend or caller may return
 * either an object or a JSON string.
 *
 * @param {*} value - Object or JSON string
 * @returns {Object} Valid JS object
 */
const parseObject = (value) => {
  if (value && typeof value === 'object') {
    return value;
  }
  if (typeof value !== 'string') {
    return {};
  }
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

/**
 * Creates a consistent, fresh empty folio object.
 *
 * @returns {Object} Empty folio defaults
 */
const createEmptyFolio = () => ({
  roomTariff: 0,
  mealTotal: 0,
  serviceChargeAmount: 0,

  roomGstAmount: 0,
  mealGstAmount: 0,
  serviceChargeGstAmount: 0,

  totalGstAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,

  totalFolio: 0,

  rawPaidAmount: 0,
  refundAmount: 0,
  paidAmount: 0,
  balanceDue: 0,

  isBalancePending: false,
  isRefunded: false,
  isPartialRefund: false,

  resMeals: [],

  taxInclusive: false,

  roomTaxableValue: 0,
  mealTaxableValue: 0,

  roomGstRate: 0,
  mealGstRate: 0,

  nights: 1,
  nightlyTariff: 0
});

/**
 * Utility to calculate guest folio financial totals, GST tax breakdowns,
 * service charges, refunds, and pending balances for frontdesk & invoicing.
 *
 * Starts from the base room tariff (e.g. ₹3,500) rather than double-applying
 * service charges and GST on top of the already-calculated total amount.
 *
 * @param {Object} reservation - The reservation object
 * @param {Array} mealOrders - List of property meal orders
 * @param {Object|null} propertyTaxSettings - Property GST / tax settings
 * @returns {Object} Comprehensive calculated folio summary
 */
export function calculateFolio(
  reservation,
  mealOrders = [],
  propertyTaxSettings = null
) {
  if (!reservation || typeof reservation !== 'object') {
    return createEmptyFolio();
  }

  /* =====================================================
     1. TAX SETTINGS & NIGHTS
     ===================================================== */

  let activeTaxSettings =
    reservation.taxSettingsSnapshot ??
    reservation.taxSettings ??
    reservation.propertyTaxSettings;

  // SAFEGUARD: If this is an online booking marked "Paid in Full" without a taxSettingsSnapshot,
  // do not add post-hoc taxes/charges on top of the contracted price; treat totalAmount as settled.
  const isPaidInFullOnline =
    !reservation.taxSettingsSnapshot &&
    (
      String(reservation.paymentStatus || '').toLowerCase().includes('paid in full') ||
      String(reservation.notes || '').toLowerCase().includes('paid in full')
    ) &&
    safeNumber(reservation.amountPaid ?? reservation.paidAmount, 0) >= safeNumber(reservation.totalAmount ?? reservation.amount, 0);

  if (isPaidInFullOnline) {
    activeTaxSettings = { isGstRegistered: false, taxesEnabled: false, serviceChargeEnabled: false, taxInclusive: true };
  } else if (!activeTaxSettings) {
    if (propertyTaxSettings && typeof propertyTaxSettings === 'object') {
      const resPropId = String(reservation.propertyId || reservation.property?.id || '');
      if (resPropId && propertyTaxSettings[resPropId]) {
        activeTaxSettings = propertyTaxSettings[resPropId];
      } else if (propertyTaxSettings.propertyId && resPropId && String(propertyTaxSettings.propertyId) !== resPropId) {
        // Prevent cross-property tax leak if propertyTaxSettings belongs to a different property
        activeTaxSettings = { isGstRegistered: false, taxesEnabled: false, serviceChargeEnabled: false };
      } else {
        activeTaxSettings = propertyTaxSettings;
      }
    } else {
      activeTaxSettings = { isGstRegistered: false, taxesEnabled: false, serviceChargeEnabled: false };
    }
  }

  const parsedTaxSettings = parseObject(activeTaxSettings);

  const isGstRegistered = toBoolean(parsedTaxSettings.isGstRegistered);
  const taxesEnabled = toBoolean(parsedTaxSettings.taxesEnabled);
  const gstEnabled = isGstRegistered && taxesEnabled;

  const taxMode = parsedTaxSettings.taxMode || (gstEnabled ? 'SLAB_INDIA_GST' : 'EXEMPT');
  const fixedTaxRate = Math.max(
    0,
    safeNumber(parsedTaxSettings.fixedTaxRate, 0)
  );
  const taxInclusive = toBoolean(parsedTaxSettings.taxInclusive);

  const serviceChargeEnabled = toBoolean(parsedTaxSettings.serviceChargeEnabled);
  const serviceChargePercent = serviceChargeEnabled
    ? Math.max(0, safeNumber(parsedTaxSettings.serviceChargePercent, 0))
    : 0;

  const specifiedPremises = parsedTaxSettings.specifiedPremises || 'NOT_DECLARED';

  const checkin = reservation.checkin ?? reservation.checkIn;
  const checkout = reservation.checkout ?? reservation.checkOut;

  let nights = safeNumber(
    reservation.lengthDays ?? reservation.nights,
    1
  );

  nights = Math.max(1, Math.round(nights));

  if (checkin && checkout) {
    const start = new Date(checkin);
    const end = new Date(checkout);

    if (
      !Number.isNaN(start.getTime()) &&
      !Number.isNaN(end.getTime()) &&
      end > start
    ) {
      const diffDays = Math.ceil(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (diffDays > 0) {
        nights = diffDays;
      }
    }
  }

  /* =====================================================
     2. ROOM BASE TARIFF RESOLUTION
     ===================================================== */

  const roomTariff = Math.max(
    0,
    safeNumber(
      reservation.roomSubtotal ??
      reservation.roomBaseTotal ??
      reservation.roomBaseTariff ??
      reservation.totalAmount ??
      reservation.amount ??
      0
    )
  );

  const nightlyTariff = nights > 0 ? Math.round(roomTariff / nights) : roomTariff;

  /* =====================================================
     3. SERVICE CHARGE
     ===================================================== */

  const serviceChargeAmount =
    serviceChargeEnabled && serviceChargePercent > 0 && roomTariff > 0
      ? Math.round((roomTariff * serviceChargePercent) / 100)
      : 0;

  /* =====================================================
     4. ROOM TAX
     ===================================================== */

  let roomGstRate = 0;

  if (gstEnabled && taxMode !== 'EXEMPT') {
    if (taxMode === 'FIXED_PERCENT') {
      roomGstRate = fixedTaxRate;
    } else {
      if (nightlyTariff > 7500) {
        roomGstRate = 18;
      } else {
        roomGstRate = 5;
      }
    }
  }

  const roomTaxableBase = roomTariff + serviceChargeAmount;

  let roomTaxableValue = roomTariff;
  let roomGstAmount = 0;

  if (roomGstRate > 0) {
    if (taxInclusive) {
      roomTaxableValue = Math.round(
        roomTariff / (1 + roomGstRate / 100)
      );
      roomGstAmount = roomTariff - roomTaxableValue;
    } else {
      roomTaxableValue = roomTariff;
      roomGstAmount = Math.round(
        (roomTaxableBase * roomGstRate) / 100
      );
    }
  }

  /* =====================================================
     5. MATCH MEALS & MEAL TAX
     ===================================================== */

  const reservationIds = [
    reservation.dbId,
    reservation.id,
    reservation.bookingId,
    reservation.reservationId
  ]
    .filter(
      value =>
        value !== null &&
        value !== undefined &&
        String(value).trim() !== ''
    )
    .map(value =>
      String(value)
        .trim()
        .toLowerCase()
    );

  const resMeals = Array.isArray(mealOrders)
    ? mealOrders.filter(meal => {
        if (!meal || typeof meal !== 'object') {
          return false;
        }

        const mealReservationId =
          meal.resId ??
          meal.reservationId ??
          meal.bookingId;

        if (
          mealReservationId === null ||
          mealReservationId === undefined
        ) {
          return false;
        }

        const normalizedMealId =
          String(mealReservationId)
            .trim()
            .toLowerCase();

        return reservationIds.includes(normalizedMealId);
      })
    : [];

  const mealTotal = resMeals.reduce((total, meal) => {
    return total + Math.max(0, safeNumber(meal.amount, 0));
  }, 0);

  let mealGstRate = 0;

  if (gstEnabled && taxMode !== 'EXEMPT') {
    mealGstRate = specifiedPremises === 'YES' ? 18 : 5;
  }

  let mealTaxableValue = mealTotal;
  let mealGstAmount = 0;

  if (mealGstRate > 0 && mealTotal > 0) {
    if (taxInclusive) {
      mealTaxableValue = Math.round(
        mealTotal / (1 + mealGstRate / 100)
      );
      mealGstAmount = mealTotal - mealTaxableValue;
    } else {
      mealTaxableValue = mealTotal;
      mealGstAmount = Math.round(
        (mealTotal * mealGstRate) / 100
      );
    }
  }

  /* =====================================================
     6. TOTAL GST
     ===================================================== */

  const totalGstAmount = roomGstAmount + mealGstAmount;

  const cgstAmount = totalGstAmount / 2;
  const sgstAmount = totalGstAmount / 2;

  /* =====================================================
     7. TOTAL FOLIO
     ===================================================== */

  let totalFolio;

  if (taxInclusive) {
    totalFolio = roomTariff + mealTotal + serviceChargeAmount;
  } else {
    totalFolio =
      roomTariff +
      serviceChargeAmount +
      roomGstAmount +
      mealTotal +
      mealGstAmount;
  }

  /* =====================================================
     8. PAYMENTS
     ===================================================== */

  const rawPaidAmount = Math.max(
    0,
    safeNumber(
      reservation.amountPaid ?? reservation.paidAmount,
      0
    )
  );

  const refundAmount = Math.min(
    rawPaidAmount,
    Math.max(0, safeNumber(reservation.refundAmount, 0))
  );

  const paidAmount = rawPaidAmount - refundAmount;
  const balanceDue = Math.max(0, totalFolio - paidAmount);

  const isBalancePending = balanceDue > 0;
  const isRefunded = refundAmount > 0 && paidAmount === 0;
  const isPartialRefund = refundAmount > 0 && paidAmount > 0;

  /* =====================================================
     9. RESULT
     ===================================================== */

  return {
    roomTariff,
    mealTotal,
    serviceChargeAmount,
    serviceChargeGstAmount: 0,

    roomGstAmount,
    mealGstAmount,

    totalGstAmount,
    cgstAmount,
    sgstAmount,

    totalFolio,

    rawPaidAmount,
    refundAmount,
    paidAmount,
    balanceDue,

    isBalancePending,
    isRefunded,
    isPartialRefund,

    resMeals,

    taxInclusive,

    roomTaxableValue,
    mealTaxableValue,

    roomGstRate,
    mealGstRate,

    nights,
    nightlyTariff
  };
}
