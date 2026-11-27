/**
 * Financial & GST Calculations Engine for StayOps Reports
 * Complies with Indian Hospitality GST Regulations (5% Accommodation GST up to ₹7,500/day, 18% Luxury)
 */

export const DATE_PRESETS = [
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_quarter', label: 'This Quarter' },
  { id: 'this_year', label: 'Financial Year (2026-27)' },
  { id: 'all_time', label: 'All Time' },
  { id: 'custom', label: 'Custom Range' }
];

/**
 * Returns formatted INR string, showing 2 decimals if fraction exists
 */
export function formatInr(val = 0, forceDecimals = false) {
  const num = Number(val) || 0;
  const hasDecimals = Math.abs(num % 1) > 0.001;
  if (hasDecimals || forceDecimals) {
    return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  return `₹${num.toLocaleString('en-IN')}`;
}

/**
 * Returns { start: Date|null, end: Date|null } for a given preset
 */
export function getPresetDateRange(presetId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  if (presetId === 'this_month') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (presetId === 'last_month') {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (presetId === 'this_quarter') {
    const qMonth = Math.floor(month / 3) * 3;
    const start = new Date(year, qMonth, 1);
    const end = new Date(year, qMonth + 3, 0, 23, 59, 59, 999);
    return { start, end };
  }

  if (presetId === 'this_year') {
    // Indian Financial Year: April 1 to March 31
    const fyStartYear = month >= 3 ? year : year - 1;
    const start = new Date(fyStartYear, 3, 1);
    const end = new Date(fyStartYear + 1, 2, 31, 23, 59, 59, 999);
    return { start, end };
  }

  return { start: null, end: null };
}

/**
 * Calculate nights between check-in and check-out
 */
export function calculateNights(checkInStr, checkOutStr) {
  if (!checkInStr || !checkOutStr) return 1;
  const start = new Date(checkInStr);
  const end = new Date(checkOutStr);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays);
}

/**
 * Filter reservations by date range and property
 */
export function filterReservations(reservations = [], { propertyId, startDate, endDate }) {
  return reservations.filter((r) => {
    // Property scope
    if (propertyId && propertyId !== 'all') {
      if (String(r.propertyId) !== String(propertyId)) return false;
    }

    // Exclude cancelled bookings from financial revenue
    const status = (r.status || '').toLowerCase();
    if (status === 'cancelled' || status === 'canceled') return false;

    // Date range filter based on checkIn
    if (!r.checkIn) return true;
    const checkInDate = new Date(r.checkIn);

    if (startDate && checkInDate < startDate) return false;
    if (endDate && checkInDate > endDate) return false;

    return true;
  });
}

/**
 * Filter petty cash transactions by date range and property
 */
export function filterPettyCash(transactions = [], { propertyId, startDate, endDate }) {
  return transactions.filter((t) => {
    if (propertyId && propertyId !== 'all') {
      if (String(t.propertyId) !== String(propertyId)) return false;
    }

    if (!t.date && !t.createdAt) return true;
    const tDate = new Date(t.date || t.createdAt);

    if (startDate && tDate < startDate) return false;
    if (endDate && tDate > endDate) return false;

    return true;
  });
}

/**
 * Aggregates all financial, tax, and operational metrics
 */
export function calculateFinancialMetrics(filteredReservations = [], filteredPettyCash = [], totalAvailableRooms = 5) {
  let totalNetRevenue = 0;
  let totalGstCollected = 0;
  let totalGrossTotal = 0;
  let totalGuestCollections = 0;
  let totalBalanceDue = 0;
  let totalRoomNightsSold = 0;

  // 5% Accommodation GST Slab (Tariff <= ₹7,500/day)
  let slab5Taxable = 0;
  let slab5Gst = 0;

  // 18% Luxury GST Slab (Tariff > ₹7,500/day)
  let slab18Taxable = 0;
  let slab18Gst = 0;

  // Channel breakdown { [channel]: amount }
  const channelBreakdown = {};

  // Payment Status / Mode breakdown
  const paymentBreakdown = {
    paid: 0,
    partial: 0,
    pending: 0
  };

  filteredReservations.forEach((r) => {
    const gross = Number(r.totalAmount) || 0;

    // Resilient amount paid: if marked 'Paid', ensure collected amount equals gross
    let paid = Number(r.amountPaid);
    const pStatus = (r.paymentStatus || 'Pending').toLowerCase();
    if (isNaN(paid) || paid <= 0) {
      if (pStatus === 'paid') {
        paid = gross;
      } else {
        paid = 0;
      }
    } else if (pStatus === 'paid' && paid < gross) {
      paid = gross;
    }

    const balance = Math.max(0, gross - paid);

    // GST Calculation: 5% accommodation GST for standard homestays/hotels
    let gst = r.roomGstAmount !== undefined && r.roomGstAmount !== null
      ? Number(r.roomGstAmount)
      : (gross * (5 / 105)); // 5% inclusive fallback
    
    // Net revenue = subtotal or (gross - gst)
    let net = r.roomSubtotal !== undefined && r.roomSubtotal !== null && r.roomSubtotal > 0
      ? Number(r.roomSubtotal)
      : Math.max(0, gross - gst);

    const nights = calculateNights(r.checkIn, r.checkOut);
    const nightlyTariff = net / nights;

    // Indian GST Slabs: <= ₹7,500 is 5% GST; > ₹7,500 is 18% GST
    if (nightlyTariff > 7500) {
      slab18Taxable += net;
      slab18Gst += gst;
    } else {
      slab5Taxable += net;
      slab5Gst += gst;
    }

    totalNetRevenue += net;
    totalGstCollected += gst;
    totalGrossTotal += gross;
    totalGuestCollections += paid;
    totalBalanceDue += balance;
    totalRoomNightsSold += nights;

    // Channel share
    const source = r.bookingSource || 'Direct / Walk-In';
    channelBreakdown[source] = (channelBreakdown[source] || 0) + net;

    // Payment tracking
    if (pStatus === 'paid') {
      paymentBreakdown.paid += paid;
    } else if (pStatus === 'partial') {
      paymentBreakdown.partial += paid;
      paymentBreakdown.pending += balance;
    } else {
      paymentBreakdown.pending += balance;
    }
  });

  // Calculate Caretaker Petty Cash Expenses
  let totalExpenses = 0;
  const expenseCategoryBreakdown = {};

  filteredPettyCash.forEach((t) => {
    const isExpense = t.type === 'EXPENSE' || t.type === 'DEBIT' || (!t.type && Number(t.amount) > 0);
    if (isExpense) {
      const amt = Math.abs(Number(t.amount) || 0);
      totalExpenses += amt;
      const cat = t.category || 'General Operations';
      expenseCategoryBreakdown[cat] = (expenseCategoryBreakdown[cat] || 0) + amt;
    }
  });

  // Net Cash Movement = Real Guest Collections − Caretaker Petty Cash Expenses
  const netCashMovement = totalGuestCollections - totalExpenses;

  // Average Daily Rate (ADR)
  const adr = totalRoomNightsSold > 0 ? (totalNetRevenue / totalRoomNightsSold) : 0;

  // Approximate Occupancy (assuming 30 days period)
  const daysInPeriod = 30;
  const roomCapacity = Math.max(1, totalAvailableRooms * daysInPeriod);
  const occupancyPercentage = Math.min(100, Math.round((totalRoomNightsSold / roomCapacity) * 100));

  // CGST and SGST splits (exactly 50% each for intra-state supply, no round-off distortion)
  const totalCgst = totalGstCollected / 2;
  const totalSgst = totalGstCollected / 2;

  return {
    totalNetRevenue,
    totalGstCollected,
    totalGrossTotal,
    totalGuestCollections,
    totalBalanceDue,
    totalRoomNightsSold,
    adr,
    occupancyPercentage,
    totalExpenses,
    netCashMovement,
    expenseCategoryBreakdown,
    channelBreakdown,
    paymentBreakdown,
    gstSlabs: {
      slab5: {
        rate: '5%',
        label: '5% Accommodation GST',
        subtext: 'Tariffs up to ₹7,500/day (CGST 2.5% + SGST 2.5%)',
        taxable: slab5Taxable,
        cgst: slab5Gst / 2,
        sgst: slab5Gst / 2,
        totalGst: slab5Gst
      },
      slab18: {
        rate: '18%',
        label: '18% Luxury GST',
        subtext: 'Tariffs above ₹7,500/day (CGST 9% + SGST 9%)',
        taxable: slab18Taxable,
        cgst: slab18Gst / 2,
        sgst: slab18Gst / 2,
        totalGst: slab18Gst
      },
      totalTaxable: slab5Taxable + slab18Taxable,
      totalCgst,
      totalSgst,
      totalGst: totalGstCollected
    }
  };
}

/**
 * Generates and triggers download of a GSTR-1 compliant CSV file
 */
export function exportGstr1Csv(reservations = [], dateLabel = 'Report') {
  const headers = [
    'Invoice / Booking Ref',
    'Booking Date',
    'Check-In',
    'Check-Out',
    'Guest Name',
    'Guest Mobile',
    'Guest State (Place of Supply)',
    'Property',
    'Taxable Value (INR)',
    'Applicable GST Rate',
    'CGST (INR)',
    'SGST (INR)',
    'Total GST (INR)',
    'Invoice Total (INR)',
    'Amount Collected (INR)',
    'Payment Status'
  ];

  const rows = reservations.map((r) => {
    const gross = Number(r.totalAmount) || 0;
    let paid = Number(r.amountPaid);
    const pStatus = (r.paymentStatus || 'Pending').toLowerCase();
    if (isNaN(paid) || paid <= 0) {
      paid = pStatus === 'paid' ? gross : 0;
    } else if (pStatus === 'paid' && paid < gross) {
      paid = gross;
    }

    const gst = r.roomGstAmount !== undefined && r.roomGstAmount !== null
      ? Number(r.roomGstAmount)
      : (gross * (5 / 105));
    const net = Math.max(0, gross - gst);

    const nights = calculateNights(r.checkIn, r.checkOut);
    const nightlyTariff = net / nights;
    const gstRate = nightlyTariff > 7500 ? '18%' : '5%';

    const cgst = gst / 2;
    const sgst = gst / 2;

    return [
      `"${r.id || ''}"`,
      `"${r.createdAt ? r.createdAt.substring(0, 10) : ''}"`,
      `"${r.checkIn || ''}"`,
      `"${r.checkOut || ''}"`,
      `"${(r.guestName || '').replace(/"/g, '""')}"`,
      `"${r.guestPhone || ''}"`,
      `"${(r.guestState || 'Karnataka (29)').replace(/"/g, '""')}"`,
      `"${(r.propertyName || 'Property').replace(/"/g, '""')}"`,
      net.toFixed(2),
      `"${gstRate}"`,
      cgst.toFixed(2),
      sgst.toFixed(2),
      gst.toFixed(2),
      gross.toFixed(2),
      paid.toFixed(2),
      `"${r.paymentStatus || 'Pending'}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `StayOps_GSTR1_${dateLabel.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
