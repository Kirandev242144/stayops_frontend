/**
 * Payment Logs Utility functions for StayOps Settings
 */

/**
 * Sanitizes fields for CSV export to prevent CSV Formula Injection (CWE-1236)
 */
export const sanitizeCsvField = (value) => {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=\+\-@]/.test(str)) {
    str = "'" + str;
  }
  return `"${str.replace(/"/g, '""')}"`;
};

/**
 * Normalizes backend payment log records to strict frontend model
 * No reservation room status reinterpretation (CONFIRMED/CHECKED_IN are not converted).
 * No synthetic booking reference generation.
 */
export const normalizePaymentLog = (item, index) => {
  const pId = item.paymentId || item.gatewayPaymentId || item.razorpayPaymentId || "-";
  const rId = item.refundId || item.gatewayRefundId || item.razorpayRefundId || null;
  const oId = item.orderId || item.gatewayOrderId || item.razorpayOrderId || "-";

  // Infer Gateway if not explicitly provided in payment log record
  let gateway = (item.paymentGateway || item.gateway || item.gatewayName || "").toUpperCase();
  if (!gateway) {
    if (pId.startsWith("pay_") || oId.startsWith("order_") || (rId && rId.startsWith("rfnd_"))) {
      gateway = "RAZORPAY";
    } else if (pId.startsWith("cf_") || oId.startsWith("cf_")) {
      gateway = "CASHFREE";
    } else {
      gateway = "MANUAL";
    }
  }

  // Extract raw payment transaction status
  let rawStatus = String(item.paymentStatus || item.status || "CAPTURED").toUpperCase();

  // Normalize strictly to standard payment gateway status terms: CAPTURED, REFUNDED, PENDING, FAILED
  let normalizedStatus = rawStatus;
  if (["PAID", "SUCCESS", "COMPLETED", "CAPTURED"].includes(rawStatus)) {
    normalizedStatus = "CAPTURED";
  } else if (["REFUNDED", "PARTIAL REFUND", "PARTIAL_REFUND"].includes(rawStatus)) {
    normalizedStatus = "REFUNDED";
  } else if (["PENDING", "PROCESSING", "UNPAID", "CREATED"].includes(rawStatus)) {
    normalizedStatus = "PENDING";
  } else if (["FAILED", "ERROR"].includes(rawStatus)) {
    normalizedStatus = "FAILED";
  }

  const rawType = (item.type || item.transactionType || (normalizedStatus === "REFUNDED" ? "REFUND" : "PAYMENT")).toUpperCase();

  return {
    id: item.id ? String(item.id) : `LOG-${1000 + (index + 1)}`,
    timestamp: item.createdAt || item.timestamp || item.created_at || "-",
    bookingRef: item.bookingRef || item.booking_ref || "-",
    guestName: item.guestName || item.guest_name || "-",
    guestPhone: item.guestPhone || item.guest_phone || "-",
    type: rawType,
    amount: Number(item.amount || item.amountPaid || item.totalAmount || 0),
    paymentGateway: gateway,
    paymentMethod: item.paymentMethod || item.method || item.paymentMode || "Standard",
    refundMethod: item.refundMethod || null,
    orderId: oId,
    paymentId: pId,
    refundId: rId,
    referenceNumber: item.referenceNumber || item.rrn || null,
    status: normalizedStatus,
    notes: item.notes || item.reason || item.cancellationReason || "",
  };
};

/**
 * Calculates statistics for owner-facing summary cards
 */
export const calculatePaymentStats = (logs) => {
  let totalPayments = 0;
  let totalRefunds = 0;
  let pendingOrFailedCount = 0;

  logs.forEach((log) => {
    if (log.type === "PAYMENT" && (log.status === "CAPTURED" || log.status === "SUCCESS" || log.status === "PAID")) {
      totalPayments += Number(log.amount || 0);
    }
    if (log.type === "REFUND" || log.status === "REFUNDED") {
      totalRefunds += Number(log.amount || 0);
    }
    if (["PENDING", "FAILED", "PROCESSING"].includes(log.status)) {
      pendingOrFailedCount++;
    }
  });

  return {
    totalPayments,
    totalRefunds,
    totalCount: logs.length,
    pendingOrFailedCount,
  };
};

/**
 * Exports normalized logs to a CSV file securely
 */
export const exportPaymentLogsToCSV = (filteredLogs) => {
  if (!filteredLogs || filteredLogs.length === 0) return;

  const headers = [
    "Log ID",
    "Timestamp",
    "Booking Ref",
    "Guest Name",
    "Type",
    "Original Payment Gateway",
    "Payment Method",
    "Refund Settlement Method",
    "Amount (INR)",
    "Order ID",
    "Payment ID",
    "Refund ID",
    "Reference No",
    "Status",
    "Notes",
  ];

  const rows = filteredLogs.map((log) => [
    sanitizeCsvField(log.id),
    sanitizeCsvField(log.timestamp),
    sanitizeCsvField(log.bookingRef),
    sanitizeCsvField(log.guestName),
    sanitizeCsvField(log.type),
    sanitizeCsvField(log.paymentGateway),
    sanitizeCsvField(log.paymentMethod),
    sanitizeCsvField(log.refundMethod || "-"),
    sanitizeCsvField(log.amount),
    sanitizeCsvField(log.orderId),
    sanitizeCsvField(log.paymentId),
    sanitizeCsvField(log.refundId || "-"),
    sanitizeCsvField(log.referenceNumber || "-"),
    sanitizeCsvField(log.status),
    sanitizeCsvField(log.notes),
  ]);

  const csvContent =
    "data:text/csv;charset=utf-8," +
    [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `payment_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
