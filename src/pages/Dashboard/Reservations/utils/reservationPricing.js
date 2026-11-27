import { getRoomCapacity } from './roomCapacity.js';

/**
 * Helper to safely evaluate boolean values, preventing string "false" from resolving to true.
 */
function toBoolean(val, fallback = false) {
  if (val === undefined || val === null) return fallback;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  if (typeof val === 'string') {
    const s = val.trim().toLowerCase();
    if (s === 'true' || s === '1' || s === 'yes') return true;
    if (s === 'false' || s === '0' || s === 'no') return false;
  }
  return fallback;
}

/**
 * Helper to safely extract a number with fallback.
 */
function safeNumber(val, fallback = 0) {
  if (val === undefined || val === null || val === '') return fallback;
  const num = Number(val);
  return !isNaN(num) ? num : fallback;
}

export function calculateNights(checkIn, checkOut) {
  if (!checkIn || !checkOut) return 0;
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  const diffTime = outDate - inDate;
  if (isNaN(diffTime) || diffTime <= 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getRoomEffectiveRate(rm, selectedProperty) {
  if (!rm) return safeNumber(selectedProperty?.baseRate, 0);
  const candidates = [rm.pricePerNight, rm.rate, rm.baseRate, rm.price];
  for (const c of candidates) {
    const num = Number(c);
    if (!isNaN(num) && num > 0) return num;
  }
  return safeNumber(selectedProperty?.baseRate, 0);
}

export function calculateReservationTotal({
  checkIn,
  checkOut,
  selectedRooms = [],
  selectedRoom,
  selectedProperty,
  adultsCount: _adultsCount = 1,
  childrenCount = 0,
  childPolicy = null,
  taxSettings = null,
  manualTotalAmount,
  paymentStatus,
  paidAmount,
  customRates = {},
  availableRooms = []
}) {
  const roomsList = (Array.isArray(selectedRooms) && selectedRooms.length > 0)
    ? selectedRooms
    : (selectedRoom ? [selectedRoom] : []);

  let roomCap = 0;
  let maxAdultsCapacity = 0;
  let maxChildrenCapacity = 0;
  let defaultRatePerNight = 0;

  if (roomsList.length > 0) {
    roomsList.forEach(rm => {
      const cap = getRoomCapacity(rm);
      roomCap += cap.total;
      maxAdultsCapacity += cap.adults;
      maxChildrenCapacity += cap.children;
      defaultRatePerNight += getRoomEffectiveRate(rm, selectedProperty);
    });
  } else {
    const propCap = safeNumber(selectedProperty?.capacity, 0);
    maxAdultsCapacity = propCap;
    maxChildrenCapacity = safeNumber(selectedProperty?.maxChildren, 0);
    defaultRatePerNight = safeNumber(selectedProperty?.baseRate, 0);
  }

  const maxGuestCapacity = roomCap > 0 ? roomCap : (maxAdultsCapacity + maxChildrenCapacity);
  const totalNights = calculateNights(checkIn, checkOut);

  // Compute room tariff per night across stay duration for all selected rooms
  let roomBaseTotal = 0;
  if (checkIn && totalNights > 0 && roomsList.length > 0) {
    try {
      roomsList.forEach(rm => {
        let current;
        if (typeof checkIn === 'string' && checkIn.includes('-')) {
          const [y, m, d] = checkIn.split('T')[0].split('-').map(Number);
          current = new Date(y, m - 1, d);
        } else {
          current = new Date(checkIn);
        }

        const rmDefaultRate = getRoomEffectiveRate(rm, selectedProperty);
        const propId = selectedProperty?.id !== undefined ? String(selectedProperty.id).trim() : '';
        const roomName = rm?.name ? String(rm.name).trim() : '';
        const roomId = rm?.id !== undefined ? String(rm.id).trim() : '';
        const roomRawId = rm?.rawId !== undefined ? String(rm.rawId).trim() : '';
        const roomIdx = availableRooms.findIndex(r => r.name === rm?.name);

        for (let i = 0; i < totalNights; i++) {
          const yr = current.getFullYear();
          const mo = String(current.getMonth() + 1).padStart(2, '0');
          const dy = String(current.getDate()).padStart(2, '0');
          const dateKey = `${yr}-${mo}-${dy}`;

          const candidateKeys = [
            roomId ? `${roomId}_${dateKey}` : null,
            propId && roomId ? `${propId}-${roomId}_${dateKey}` : null,
            propId && roomRawId ? `${propId}-${roomRawId}_${dateKey}` : null,
            propId && roomIdx >= 0 ? `${propId}-${roomIdx}_${dateKey}` : null,
            roomIdx >= 0 ? `${roomIdx}_${dateKey}` : null,
            propId && roomName ? `${propId}-${roomName}_${dateKey}` : null,
            propId && roomName ? `${propId}-${roomName.toLowerCase()}_${dateKey}` : null,
            roomName ? `${roomName}_${dateKey}` : null,
            roomName ? `${roomName.toLowerCase()}_${dateKey}` : null,
            roomRawId ? `${roomRawId}_${dateKey}` : null,
            `all_${dateKey}`
          ].filter(Boolean);

          let overrideVal = undefined;
          for (const k of candidateKeys) {
            if (customRates[k] !== undefined && customRates[k] !== null) {
              overrideVal = customRates[k];
              break;
            }
          }

          const nightRate = (overrideVal !== undefined && overrideVal !== null && !isNaN(Number(overrideVal)))
            ? Number(overrideVal)
            : rmDefaultRate;

          roomBaseTotal += nightRate;
          current.setDate(current.getDate() + 1);
        }
      });
    } catch {
      roomBaseTotal = totalNights * defaultRatePerNight;
    }
  } else {
    roomBaseTotal = totalNights * defaultRatePerNight;
  }

  const ratePerNight = totalNights > 0 ? Math.round(roomBaseTotal / totalNights) : defaultRatePerNight;

  // Child pricing logic: Room-level extraChildRate overrides property-level policy default
  let childChargePerNight = 0;
  let freeChildMaxAge = null;
  let childAgeMax = null;

  if (childPolicy) {
    if (childPolicy.childExtraCharge !== undefined && childPolicy.childExtraCharge !== null) {
      const parsedFee = Number(childPolicy.childExtraCharge);
      childChargePerNight = !isNaN(parsedFee) && parsedFee >= 0 ? parsedFee : 0;
    }
    if (childPolicy.freeChildMaxAge !== undefined && childPolicy.freeChildMaxAge !== null) {
      const parsedAge = Number(childPolicy.freeChildMaxAge);
      freeChildMaxAge = !isNaN(parsedAge) ? parsedAge : null;
    }
    if (childPolicy.childAgeMax !== undefined && childPolicy.childAgeMax !== null) {
      const parsedMax = Number(childPolicy.childAgeMax);
      childAgeMax = !isNaN(parsedMax) ? parsedMax : null;
    }
  }

  // Room category specific extraChildRate override if configured
  if (selectedRoom && selectedRoom.extraChildRate !== undefined && selectedRoom.extraChildRate !== null && selectedRoom.extraChildRate !== "") {
    const roomChildFee = Number(selectedRoom.extraChildRate);
    if (!isNaN(roomChildFee) && roomChildFee >= 0) {
      childChargePerNight = roomChildFee;
    }
  }

  const totalChildFeePerNight = (Number(childrenCount) || 0) * childChargePerNight;
  const childTotalFee = totalNights * totalChildFeePerNight;
  const roomSubtotal = roomBaseTotal + childTotalFee;

  // Property Tax & GST Settings Calculation
  const activeTaxSettings = taxSettings || {};
  const isGstRegistered = toBoolean(activeTaxSettings.isGstRegistered, false);
  const taxesEnabled = toBoolean(activeTaxSettings.taxesEnabled, false);
  const gstEnabled = isGstRegistered && taxesEnabled;
  const taxMode = activeTaxSettings.taxMode || (gstEnabled ? 'SLAB_INDIA_GST' : 'EXEMPT');
  const fixedTaxRate = safeNumber(activeTaxSettings.fixedTaxRate, 0);
  const taxInclusive = toBoolean(activeTaxSettings.taxInclusive, false);
  const serviceChargeEnabled = toBoolean(activeTaxSettings.serviceChargeEnabled, false);
  const serviceChargePercent = serviceChargeEnabled ? safeNumber(activeTaxSettings.serviceChargePercent, 0) : 0;

  const nightlyTariff = totalNights > 0 ? Math.round(roomBaseTotal / totalNights) : roomBaseTotal;

  let gstRate = 0;
  if (gstEnabled && taxMode !== 'EXEMPT') {
    if (taxMode === 'FIXED_PERCENT') {
      gstRate = fixedTaxRate;
    } else {
      if (nightlyTariff > 7500) gstRate = 18;
      else gstRate = 5;
    }
  }

  const serviceChargeAmount = (serviceChargeEnabled && serviceChargePercent > 0)
    ? Math.round(roomSubtotal * (serviceChargePercent / 100))
    : 0;

  let roomGstAmount = 0;
  let serviceChargeGstAmount = 0;

  if (gstRate > 0) {
    if (taxInclusive) {
      const taxable = Math.round(roomSubtotal / (1 + gstRate / 100));
      roomGstAmount = roomSubtotal - taxable;
    } else {
      roomGstAmount = Math.round((roomSubtotal * gstRate) / 100);
      if (serviceChargeAmount > 0) {
        serviceChargeGstAmount = Math.round((serviceChargeAmount * gstRate) / 100);
      }
    }
  }

  const gstAmount = roomGstAmount + serviceChargeGstAmount;

  const calculatedTotalAmount = taxInclusive
    ? roomSubtotal + serviceChargeAmount
    : roomSubtotal + serviceChargeAmount + gstAmount;

  const effectiveTotalAmount = (manualTotalAmount !== null && manualTotalAmount !== undefined && manualTotalAmount !== '' && !isNaN(Number(manualTotalAmount)))
    ? Number(manualTotalAmount)
    : calculatedTotalAmount;

  // Normalize paymentStatus for safe payment calculation
  const statusLower = String(paymentStatus || '').toLowerCase().trim();
  let calculatedPaidAmount = 0;

  if (['paid', 'paid in full', 'paid online', 'paid online via razorpay', 'full paid'].includes(statusLower)) {
    const parsedPaid = Number(paidAmount);
    calculatedPaidAmount = (!isNaN(parsedPaid) && parsedPaid > 0)
      ? Math.min(effectiveTotalAmount, parsedPaid)
      : effectiveTotalAmount;
  } else if (['unpaid', 'pay at checkout', 'collect at checkout'].includes(statusLower)) {
    // Unpaid reservation: ₹0 collected now, full balance due at checkout
    calculatedPaidAmount = 0;
  } else if (['pending', 'link', 'pay at check-in'].includes(statusLower)) {
    const parsedPaid = Number(paidAmount);
    calculatedPaidAmount = (!isNaN(parsedPaid) && parsedPaid > 0)
      ? Math.min(effectiveTotalAmount, parsedPaid)
      : 0;
  } else {
    // 'cash', 'online', 'partial', or custom payment option
    const parsedPaid = Number(paidAmount);
    if (!isNaN(parsedPaid) && parsedPaid >= 0) {
      calculatedPaidAmount = Math.min(effectiveTotalAmount, Math.max(0, parsedPaid));
    } else {
      calculatedPaidAmount = 0;
    }
  }

  const calculatedBalanceDue = Math.max(0, effectiveTotalAmount - calculatedPaidAmount);

  return {
    maxAdultsCapacity,
    maxChildrenCapacity,
    maxGuestCapacity,
    ratePerNight,
    childChargePerNight,
    freeChildMaxAge,
    childAgeMax,
    totalChildFeePerNight,
    roomBaseTotal,
    childTotalFee,
    roomSubtotal,
    gstRate,
    gstAmount,
    serviceChargePercent,
    serviceChargeAmount,
    taxInclusive,
    gstEnabled,
    totalNights,
    calculatedTotalAmount,
    effectiveTotalAmount,
    calculatedPaidAmount,
    calculatedBalanceDue
  };
}

export function buildReservationPayload(form, selectedProperty, pricing, taxSettings = null) {
  const isUnpaid = String(form.paymentStatus || '').toLowerCase().trim() === 'unpaid';
  const effectivePaidAmount = isUnpaid ? 0 : pricing.calculatedPaidAmount;
  const isFullPaid = effectivePaidAmount >= pricing.effectiveTotalAmount && pricing.effectiveTotalAmount > 0;
  const adults = Number(form.adultsCount) || 1;
  const children = Number(form.childrenCount) || 0;
  const totalGuests = adults + children;

  let formattedPaymentStatus = form.paymentStatus || "Unpaid";
  if (isUnpaid) {
    formattedPaymentStatus = "Unpaid";
  } else if (isFullPaid) {
    formattedPaymentStatus = "Paid in Full";
  } else if (effectivePaidAmount > 0) {
    formattedPaymentStatus = `Partial: \u20B9${effectivePaidAmount.toLocaleString('en-IN')} paid`;
  } else {
    formattedPaymentStatus = "Unpaid";
  }

  const activeTaxObj = taxSettings && typeof taxSettings === 'object'
    ? taxSettings
    : { isGstRegistered: false, taxesEnabled: false, serviceChargeEnabled: false, serviceChargePercent: 0, fixedTaxRate: 0 };

  const snapshotString = typeof activeTaxObj === 'string' ? activeTaxObj : JSON.stringify(activeTaxObj);

  let allocatedRooms = [];
  if (Array.isArray(form.allocatedRooms) && form.allocatedRooms.length > 0) {
    allocatedRooms = form.allocatedRooms;
  } else if (Array.isArray(form.selectedRooms) && form.selectedRooms.length > 0) {
    allocatedRooms = form.selectedRooms.map(r => ({
      roomUnit: r.name || r.roomUnit || "",
      roomTypeId: r.id || r.roomTypeId || null,
      roomTypeName: r.category || r.roomTypeName || r.name || "",
      nightlyRate: r.rate ?? r.baseRate ?? r.pricePerNight ?? 0,
      capacity: getRoomCapacity(r).total
    }));
  }

  const roomUnitStr = form.roomUnit || (allocatedRooms.length > 0 ? allocatedRooms.map(r => r.roomUnit).filter(Boolean).join(', ') : '');

  return {
    propertyId: selectedProperty ? selectedProperty.id : null,
    guestName: form.guestName ? form.guestName.trim() : "",
    guestPhone: form.guestPhone ? form.guestPhone.trim() : "",
    guestEmail: form.guestEmail ? form.guestEmail.trim() : "",
    roomUnit: roomUnitStr,
    allocatedRooms: allocatedRooms.length > 0 ? allocatedRooms : undefined,
    checkIn: form.checkIn || "",
    checkInTime: form.checkInTime || selectedProperty?.checkInTime || "",
    isLateArrival: Boolean(form.isLateArrival),
    checkOut: form.checkOut || "",
    checkOutTime: form.checkOutTime || selectedProperty?.checkOutTime || "",

    guestCount: totalGuests,
    adultsCount: adults,
    childrenCount: children,
    guestCity: form.guestCity ? form.guestCity.trim() : "",
    guestState: form.guestState ? form.guestState.trim() : "",
    idType: form.idType || (Array.isArray(form.idDocuments) && form.idDocuments[0]?.idType) || "",
    idNumber: form.idNumber || (Array.isArray(form.idDocuments) && form.idDocuments[0]?.idNumber) || "",
    idDocumentUrl: form.idDocumentUrl || (Array.isArray(form.idDocuments) && form.idDocuments[0]?.documentUrl) || "",
    idDocuments: Array.isArray(form.idDocuments) ? JSON.stringify(form.idDocuments) : (form.idDocuments || ""),
    roomBaseTotal: pricing.roomBaseTotal,
    roomSubtotal: pricing.roomSubtotal,
    roomServiceCharge: pricing.serviceChargeAmount,
    roomGstAmount: pricing.gstAmount,
    totalAmount: pricing.effectiveTotalAmount,
    amountPaid: effectivePaidAmount,
    paymentStatus: formattedPaymentStatus,
    bookingSource: form.bookingSource || "",
    notes: form.notes ? form.notes.trim() : "",
    razorpayPaymentId: form.razorpayPaymentId || null,
    taxSettingsSnapshot: snapshotString
  };
}

