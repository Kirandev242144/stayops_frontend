import React, { useEffect, useMemo, useState } from "react";
import {
  FiFileText,
  FiPrinter,
  FiSend,
  FiX,
} from "react-icons/fi";
import { API_BASE_URL } from "../../config/api";
import { calculateFolio } from "../../pages/Dashboard/Frontdesk/utils/folioCalculator";
import "./TaxInvoiceModal.css";

const ROOM_SAC_CODE = "996311";
const MEAL_SAC_CODE = "996332";
const SERVICE_SAC_CODE = "9996";

const isServiceItem = (meal) => {
  const type = String(meal?.mealType || "").toLowerCase();
  const item = String(meal?.item || meal?.items || meal?.itemName || "").toLowerCase();
  return (
    type === "service" ||
    item.startsWith("service:") ||
    type.includes("activity") ||
    type.includes("experience") ||
    type.includes("rental") ||
    item.includes("package") ||
    item.includes("bonfire") ||
    item.includes("jeep") ||
    item.includes("camping")
  );
};


const TAX_MODES = {
  EXEMPT: "EXEMPT",
  FIXED_PERCENT: "FIXED_PERCENT",
  SLAB_INDIA_GST: "SLAB_INDIA_GST",
};

const INDIAN_STATES = {
  "01": "Jammu & Kashmir",
  "02": "Himachal Pradesh",
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman & Diu",
  "26": "Dadra & Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman & Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh",
  "38": "Ladakh",
};

/* -------------------------------------------------------------------------- */
/* Formatting                                                                 */
/* -------------------------------------------------------------------------- */

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const formatCurrency = (amount, forceDecimals = false) => {
  const num = toNumber(amount);
  const hasDecimals = Math.abs(num % 1) > 0.001;
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: hasDecimals || forceDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getInvoiceNumber = (id) => {
  const numericId = String(id || "").replace(/[^0-9]/g, "");

  return numericId
    ? `INV-2026-${numericId.padStart(4, "0")}`
    : `INV-2026-${String(Date.now()).slice(-4)}`;
};

const getInvoiceDate = () =>
  new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* -------------------------------------------------------------------------- */
/* Reservation helpers                                                        */
/* -------------------------------------------------------------------------- */

const getCheckin = (reservation) =>
  reservation?.checkin || reservation?.checkIn || "";

const getCheckout = (reservation) =>
  reservation?.checkout || reservation?.checkOut || "";

const getPropertyId = (reservation) =>
  reservation?.propertyId ||
  reservation?.property_id ||
  reservation?.property?.id ||
  null;

const getStayNights = (reservation) => {
  const checkin = getCheckin(reservation);
  const checkout = getCheckout(reservation);

  if (checkin && checkout) {
    const start = new Date(checkin);
    const end = new Date(checkout);

    if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      const difference = Math.ceil(
        (end - start) / (1000 * 60 * 60 * 24)
      );

      if (difference > 0) {
        return difference;
      }
    }
  }

  return (
    toNumber(
      reservation?.lengthDays ?? reservation?.nights,
      1
    ) || 1
  );
};

/* -------------------------------------------------------------------------- */
/* Tax calculations                                                           */
/* -------------------------------------------------------------------------- */

const calculateTaxableValue = (
  amountValue,
  gstRate,
  isInclusive = false
) => {
  const amount = toNumber(amountValue);
  const rate = toNumber(gstRate);

  if (amount === 0) return 0;
  if (rate === 0) return Math.round(amount);

  return isInclusive
    ? Math.round(amount / (1 + rate / 100))
    : Math.round(amount);
};



/* -------------------------------------------------------------------------- */
/* API                                                                        */
/* -------------------------------------------------------------------------- */

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: token ? `Bearer ${token}` : "",
  };
};

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
};

/* ==========================================================================
   Main component
   ========================================================================== */

export default function TaxInvoiceModal({
  res,
  onClose,
  taxSettings,
  mealOrders = [],
}) {
  const [propertyTaxSettings, setPropertyTaxSettings] = useState(null);
  const [propertyDetails, setPropertyDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  /* ------------------------------------------------------------------------
     Property data
     ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!res) {
      setPropertyTaxSettings(null);
      setPropertyDetails(null);
      setLoadError("");
      return undefined;
    }

    let cancelled = false;

    const loadPropertyData = async () => {
      setIsLoading(true);
      setLoadError("");

      try {
        const headers = getAuthHeaders();
        let propertyId = getPropertyId(res);

        if (!propertyId) {
          try {
            const properties = await fetchJson(
              `${API_BASE_URL}/properties`,
              { headers }
            );

            if (Array.isArray(properties) && properties.length) {
              propertyId = properties[0]?.id;
            }
          } catch (error) {
            console.error("Unable to load properties:", error);
          }
        }

        if (!propertyId || cancelled) return;

        const [taxResult, propertyResult] = await Promise.allSettled([
          fetchJson(
            `${API_BASE_URL}/properties/${propertyId}/taxes`,
            { headers }
          ),
          fetchJson(
            `${API_BASE_URL}/properties/${propertyId}`,
            { headers }
          ),
        ]);

        if (cancelled) return;

        if (taxResult.status === "fulfilled") {
          setPropertyTaxSettings(taxResult.value);
        }

        if (propertyResult.status === "fulfilled") {
          setPropertyDetails(propertyResult.value);
        }

        if (
          taxResult.status === "rejected" &&
          propertyResult.status === "rejected"
        ) {
          throw new Error("Property information could not be loaded.");
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Error loading invoice property data:",
            error
          );
          setLoadError(
            "Some property information could not be loaded."
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadPropertyData();

    return () => {
      cancelled = true;
    };
  }, [res]);

  /* ------------------------------------------------------------------------
     Derived invoice model
     ------------------------------------------------------------------------ */

  const invoice = useMemo(() => {
    if (!res) return null;

    const settings = propertyTaxSettings || taxSettings || {};

    const isGstRegistered =
      settings.isGstRegistered ?? false;

    const taxesEnabled =
      settings.taxesEnabled ?? false;

    const gstEnabled =
      isGstRegistered && taxesEnabled;

    const gstin = settings.gstin || "";

    const taxMode =
      settings.taxMode || (gstEnabled ? TAX_MODES.SLAB_INDIA_GST : TAX_MODES.EXEMPT);

    const fixedTaxRate = toNumber(settings.fixedTaxRate, 0);

    const taxInclusive =
      settings.taxInclusive ?? false;

    const serviceChargeEnabled =
      settings.serviceChargeEnabled ?? false;

    const serviceChargePercent = serviceChargeEnabled
      ? toNumber(settings.serviceChargePercent, 0)
      : 0;

    const specifiedPremises =
      settings.specifiedPremises || "NOT_DECLARED";

    const stateCode =
      gstin.match(/^(\d{2})/)?.[1] || "";

    const stateName =
      INDIAN_STATES[stateCode] || "Karnataka";

    const guestGstinPrefix =
      res?.guestGstin?.substring(0, 2);

    const isInterState = Boolean(
      guestGstinPrefix &&
        guestGstinPrefix !== stateCode
    );

    const placeOfSupply =
      `${stateCode} - ${stateName} (${
        isInterState
          ? "Inter-State IGST"
          : "Intra-State CGST+SGST"
      })`;

    const legalName =
      propertyDetails?.name ||
      res?.propertyName ||
      res?.property ||
      "StayOps Hospitality Services";

    const address =
      propertyDetails?.address ||
      propertyDetails?.location ||
      res?.location ||
      res?.address ||
      "";

    const folio = calculateFolio(res, mealOrders, settings);

    const roomAmount = toNumber(folio.roomTariff);
    const mealAmount = toNumber(folio.mealTotal);
    const guestMeals = folio.resMeals || [];

    const mealsOnly = guestMeals.filter((m) => !isServiceItem(m));
    const servicesOnly = guestMeals.filter((m) => isServiceItem(m));

    const mealsSubtotal = mealsOnly.reduce(
      (sum, m) => sum + toNumber(m.amount),
      0
    );
    const servicesSubtotal = servicesOnly.reduce(
      (sum, m) => sum + toNumber(m.amount),
      0
    );

    const serviceChargeAmount = toNumber(folio.serviceChargeAmount);

    const checkinDate = getCheckin(res);
    const checkoutDate = getCheckout(res);
    const nights = folio.nights || getStayNights(res);
    const nightlyTariff = folio.nightlyTariff;

    const roomTax = {
      gstRate: folio.roomGstRate,
      taxableValue: folio.roomTaxableValue,
      gstAmount: folio.roomGstAmount,
    };

    const mealTax = {
      gstRate: folio.mealGstRate,
      taxableValue: folio.mealTaxableValue,
      gstAmount: folio.mealGstAmount,
    };

    const totalGstAmount = folio.totalGstAmount;
    const totalInvoiceAmount = toNumber(folio.totalFolio);

    const advancePaid = toNumber(folio.rawPaidAmount || folio.paidAmount);
    const refundAmount = toNumber(folio.refundAmount || 0);
    const netAdvance = Math.max(0, advancePaid - refundAmount);

    const balanceDue = Math.max(
      0,
      totalInvoiceAmount - netAdvance
    );

    const cgst = folio.cgstAmount;
    const sgst = folio.sgstAmount;

    return {
      settings,
      gstEnabled,
      gstin,
      taxMode,
      fixedTaxRate,
      taxInclusive,
      serviceChargeEnabled,
      serviceChargePercent,
      serviceChargeAmount,
      specifiedPremises,

      stateCode,
      stateName,
      isInterState,
      placeOfSupply,

      legalName,
      address,

      folio,
      roomAmount,
      mealAmount,
      guestMeals,
      mealsOnly,
      servicesOnly,
      mealsSubtotal,
      servicesSubtotal,

      checkinDate,
      checkoutDate,
      nights,
      nightlyTariff,

      roomTax,
      mealTax,
      totalGstAmount,

      roomTaxableValue: roomTax.taxableValue,
      mealTaxableValue: mealTax.taxableValue,

      totalInvoiceAmount,
      advancePaid,
      refundAmount,
      balanceDue,

      cgstAmount: cgst,
      sgstAmount: sgst,
      cgstPercentage: roomTax.gstRate / 2,
      sgstPercentage: roomTax.gstRate / 2,

      invoiceNo: getInvoiceNumber(res.id),
      invoiceDate: getInvoiceDate(),

      guestName: res.guest || "Guest",
      propertyName:
        res.propertyName ||
        res.property ||
        "Property",
      roomName:
        res.unit ||
        res.roomType ||
        "Room",
      phone: res.phone || "",
      channelSource: res.ota || "Walk-In",
      guestCount: toNumber(res.guests),
      roomCount: toNumber(res.rooms, 1) || 1,
    };
  }, [
    res,
    taxSettings,
    mealOrders,
    propertyTaxSettings,
    propertyDetails,
  ]);

  /* ------------------------------------------------------------------------
     Actions
     ------------------------------------------------------------------------ */

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsApp = () => {
    if (!invoice) return;

    const {
      gstEnabled,
      legalName,
      invoiceNo,
      guestName,
      propertyName,
      checkinDate,
      checkoutDate,
      nights,
      roomAmount,
      mealAmount,
      mealsSubtotal,
      servicesSubtotal,
      serviceChargeEnabled,
      serviceChargeAmount,
      serviceChargePercent,
      totalInvoiceAmount,
      totalGstAmount,
      roomTax,
      advancePaid,
      balanceDue,
      phone,
    } = invoice;

    const lines = [
      `🧾 *${
        gstEnabled ? "TAX INVOICE" : "BOOKING RECEIPT"
      } - ${legalName}*`,
      "",
      `*Invoice No:* ${invoiceNo}`,
      `*Guest:* ${guestName}`,
      `*Property:* ${propertyName}`,
      `*Dates:* ${formatDate(checkinDate)} – ${formatDate(
        checkoutDate
      )} (${nights} Nights)`,
      "",
      `*Room Tariff:* ${formatCurrency(roomAmount)}`,
    ];

    if (mealsSubtotal > 0) {
      lines.push(
        `*Meal Add-ons:* ${formatCurrency(mealsSubtotal)}`
      );
    }

    if (servicesSubtotal > 0) {
      lines.push(
        `*In-Stay Services:* ${formatCurrency(servicesSubtotal)}`
      );
    }

    if (serviceChargeEnabled && serviceChargeAmount > 0) {
      lines.push(
        `*Service Charge (${serviceChargePercent}%):* ${formatCurrency(
          serviceChargeAmount
        )}`
      );
    }

    lines.push(
      `*Total Invoice Amount:* ${formatCurrency(
        totalInvoiceAmount
      )}`
    );

    if (gstEnabled && totalGstAmount > 0) {
      lines.push(
        `*GST (${roomTax.gstRate}% - SAC ${ROOM_SAC_CODE}):* ${formatCurrency(
          totalGstAmount
        )}`
      );
    }

    lines.push(
      `*Amount Received:* ${formatCurrency(advancePaid)}`,
      `*Balance Due at Checkout:* ${formatCurrency(balanceDue)}`,
      "",
      "Thank you for staying with us!"
    );

    const cleanPhone = String(phone).replace(/[^0-9]/g, "");

    if (!cleanPhone) {
      window.alert("No valid phone number available.");
      return;
    }

    const whatsappPhone = cleanPhone.startsWith("91")
      ? cleanPhone
      : `91${cleanPhone.slice(-10)}`;

    const url =
      `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        lines.join("\n")
      )}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /* ------------------------------------------------------------------------
     Modal behaviour
     ------------------------------------------------------------------------ */

  useEffect(() => {
    if (!res) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [res, onClose]);

  if (!res || !invoice) return null;

  return (
    <div
      className="tax-inv-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="tax-inv-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tax-invoice-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="tax-inv-action-bar no-print">
          <div className="tax-inv-action-title">
            <FiFileText
              className="tax-inv-action-icon"
              aria-hidden="true"
            />

            <div>
              <h3 id="tax-invoice-title">
                {invoice.gstEnabled
                  ? "Official GST Tax Invoice"
                  : "Guest Booking Voucher"}
              </h3>

              {isLoading && (
                <span className="tax-inv-loading">
                  Loading property details…
                </span>
              )}
            </div>
          </div>

          <div className="tax-inv-actions">
            <button
              type="button"
              className="tax-inv-btn tax-btn-print"
              onClick={handlePrint}
            >
              <FiPrinter aria-hidden="true" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              className="tax-inv-btn tax-btn-wa"
              onClick={handleWhatsApp}
            >
              <FiSend aria-hidden="true" />
              <span>Share via WhatsApp</span>
            </button>

            <button
              type="button"
              className="tax-inv-close-btn"
              onClick={onClose}
              aria-label="Close invoice"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>
        </header>

        <div
          className="tax-inv-paper"
          id="printable-tax-invoice"
        >
          {loadError && (
            <div className="tax-inv-data-warning no-print">
              {loadError}
            </div>
          )}

          <InvoiceHeader
            invoice={invoice}
            bookingId={res.id}
          />

          <hr className="tax-divider" />

          <div className="tax-grid-2">
            <InvoiceInfoBox
              icon="👤"
              title="Guest & B2B Billing Details"
            >
              <InvoiceDetailRow
                label="Guest Name"
                value={invoice.guestName}
                strong
              />

              <InvoiceDetailRow
                label="Phone Number"
                value={invoice.phone || "-"}
              />

              <InvoiceDetailRow
                label="Place of Supply"
                value={invoice.placeOfSupply}
              />

              {res.guestGstin && (
                <InvoiceDetailRow
                  label="Guest GSTIN (B2B)"
                  value={res.guestGstin}
                  valueClassName="tax-gstin-value"
                />
              )}
            </InvoiceInfoBox>

            <InvoiceInfoBox
              icon="🏡"
              title="Stay & Room Information"
            >
              <InvoiceDetailRow
                label="Property Name"
                value={invoice.propertyName}
                strong
              />

              <InvoiceDetailRow
                label="Stay Dates"
                value={`${formatDate(
                  invoice.checkinDate
                )} → ${formatDate(
                  invoice.checkoutDate
                )} (${invoice.nights} Nights)`}
              />

              <InvoiceDetailRow
                label="Occupancy"
                value={`${invoice.guestCount} Guests · ${
                  invoice.roomCount
                } Room${invoice.roomCount !== 1 ? "s" : ""}`}
              />

              <InvoiceDetailRow
                label="Channel Source"
                value={invoice.channelSource}
              />
            </InvoiceInfoBox>
          </div>

          <ServicesTable invoice={invoice} />

          <div className="tax-summary-wrap">
            <TaxTerms invoice={invoice} />
            <InvoiceSummary invoice={invoice} />
          </div>

          <hr className="tax-divider tax-footer-divider" />

          <footer className="tax-footer">
            <div>
              <div className="tax-footer-title">
                This is a computer-generated tax invoice.
                No signature required.
              </div>

              <div className="tax-footer-sub">
                Thank you for choosing {invoice.legalName}!
              </div>
            </div>

            <div className="tax-footer-powered">
              Powered by <strong>StayOps India PMS</strong>
              <span> · </span>
              <span>www.stayops.in</span>
            </div>
          </footer>
        </div>
      </section>
    </div>
  );
}

/* ==========================================================================
   Invoice header
   ========================================================================== */

function InvoiceHeader({ invoice, bookingId }) {
  return (
    <div className="tax-inv-header">
      <div className="tax-company-info">
        <div className="tax-inv-badge">
          {invoice.gstEnabled ? "TAX INVOICE" : "BILL OF SUPPLY"}
        </div>

        <h2 className="tax-company-name">
          {invoice.legalName}
        </h2>

        <div className="tax-company-sub">
          {invoice.address}
        </div>

        {invoice.gstEnabled && invoice.gstin && (
          <div className="tax-gstin-tag">
            <strong>GSTIN:</strong> {invoice.gstin}
            <span> | </span>
            <strong>State Code:</strong> {invoice.stateCode}
            <span> | </span>
            <strong>SAC:</strong> {ROOM_SAC_CODE}
          </div>
        )}
      </div>

      <div className="tax-invoice-meta">
        <div className="tax-brand-name">STAYOPS</div>

        <MetaRow label="Invoice #" value={invoice.invoiceNo} />
        <MetaRow label="Date" value={invoice.invoiceDate} />
        <MetaRow label="Booking Ref" value={bookingId || "-"} />
      </div>
    </div>
  );
}

/* ==========================================================================
   Services
   ========================================================================== */

function ServicesTable({ invoice }) {
  return (
    <table className="tax-table">
      <thead>
        <tr>
          <th className="tax-align-left">SERVICE DESCRIPTION</th>
          <th className="tax-align-center">SAC CODE</th>
          <th className="tax-align-center">QTY / DURATION</th>
          <th className="tax-align-right">
            {invoice.gstEnabled
              ? invoice.taxInclusive
                ? "UNIT PRICE (INCL. GST)"
                : "UNIT PRICE (EXCL. GST)"
              : "UNIT PRICE"}
          </th>
          <th className="tax-align-right">
            {invoice.gstEnabled ? "TAXABLE VALUE" : "AMOUNT"}
          </th>
        </tr>
      </thead>

      <tbody>
        <tr>
          <td>
            <strong className="tax-service-name">
              Room Accommodation Services
            </strong>

            <div className="tax-service-description">
              {invoice.propertyName} ({invoice.roomName}) ·{" "}
              {formatDate(invoice.checkinDate)} to{" "}
              {formatDate(invoice.checkoutDate)}
            </div>
          </td>

          <td className="tax-align-center tax-monospace">
            {ROOM_SAC_CODE}
          </td>

          <td className="tax-align-center">
            {invoice.nights} Night{invoice.nights > 1 ? "s" : ""}
          </td>

          <td className="tax-align-right">
            {formatCurrency(Math.round(invoice.roomTaxableValue / (invoice.nights || 1)))}
          </td>

          <td className="tax-align-right tax-value-strong">
            {formatCurrency(invoice.roomTaxableValue)}
          </td>
        </tr>

        {invoice.guestMeals.map((meal, index) => (
          <MealRow
            key={
              meal.id ??
              `${meal.item || meal.mealType || "meal"}-${index}`
            }
            meal={meal}
            gstRate={invoice.mealTax.gstRate}
            taxInclusive={invoice.taxInclusive}
          />
        ))}
      </tbody>
    </table>
  );
}

function MealRow({ meal, gstRate, taxInclusive }) {
  const isService = isServiceItem(meal);
  const amount = toNumber(meal?.amount);
  const quantity =
    toNumber(meal?.quantity ?? meal?.qty, 1) || 1;

  const unitPrice =
    quantity > 0
      ? Math.round(amount / quantity)
      : amount;

  const taxableValue = calculateTaxableValue(
    amount,
    gstRate,
    taxInclusive
  );

  const rawName =
    meal?.item ||
    meal?.items ||
    meal?.itemName ||
    (isService ? "Guest Service" : "Meal order");

  const cleanName = rawName.replace(/^(Service|Meal|Dinner|Breakfast|Lunch|Snacks\s*&\s*Tea):\s*/i, "");

  const category = !isService && meal?.mealType
    ? `${meal.mealType} · `
    : "";

  const loggedBy =
    meal?.staff ||
    meal?.loggedBy ||
    "Caretaker";

  return (
    <tr className="tax-meal-row">
      <td>
        <strong className="tax-service-name">
          {isService ? "In-Stay Service / Activity" : "Food & Beverage / Meal Add-on"}
        </strong>

        <div className="tax-service-description">
          {category}
          {cleanName} (Logged by {loggedBy})
        </div>
      </td>

      <td className="tax-align-center tax-monospace">
        {isService ? SERVICE_SAC_CODE : MEAL_SAC_CODE}
      </td>

      <td className="tax-align-center">
        Qty: {quantity}
      </td>

      <td className="tax-align-right">
        {formatCurrency(unitPrice)}
      </td>

      <td className="tax-align-right tax-value-strong">
        {formatCurrency(taxableValue)}
      </td>
    </tr>
  );
}

/* ==========================================================================
   Summary / terms
   ========================================================================== */

function TaxTerms({ invoice }) {
  if (!invoice.gstEnabled) {
    return (
      <div className="tax-terms">
        <strong>Billing Terms &amp; Conditions:</strong>
        <div>• Tax Status: Taxes Disabled / Not Applicable (Non-GST Billing)</div>
        {invoice.serviceChargeEnabled && invoice.serviceChargeAmount > 0 && (
          <div>
            • Service Charge: {invoice.serviceChargePercent}% property charge included
          </div>
        )}
        <div>• Computer-generated booking receipt without tax.</div>
      </div>
    );
  }

  const exempt = invoice.taxMode === TAX_MODES.EXEMPT;

  return (
    <div className="tax-terms">
      <strong>
        Tax Terms &amp; Rules (CBIC SAC {ROOM_SAC_CODE}
        {invoice.mealsSubtotal > 0 ? ` & ${MEAL_SAC_CODE}` : ""}
        {invoice.servicesSubtotal > 0 ? ` & ${SERVICE_SAC_CODE}` : ""}):
      </strong>

      {exempt ? (
        <div>• Tax Status: Exempt (0% Tax)</div>
      ) : invoice.taxMode === TAX_MODES.FIXED_PERCENT ? (
        <div>
          • Tax Mode: Fixed Rate ({invoice.fixedTaxRate}% GST applied)
        </div>
      ) : (
        <>
          <div>
            • Accommodation value up to ₹7,500/night: 5% GST (2.5% CGST + 2.5% SGST) without ITC
          </div>

          <div>
            • Accommodation value above ₹7,500/night: 18% GST (9% CGST + 9% SGST)
          </div>

          {invoice.mealsSubtotal > 0 && (
            <div>
              • Food &amp; Beverage Add-ons: SAC {MEAL_SAC_CODE} (
              {invoice.specifiedPremises === "YES"
                ? "18% GST with ITC"
                : "5% GST"}
              )
            </div>
          )}

          {invoice.servicesSubtotal > 0 && (
            <div>
              • In-Stay Guest Services: SAC {SERVICE_SAC_CODE}
            </div>
          )}
        </>
      )}

      {invoice.serviceChargeEnabled &&
        invoice.serviceChargeAmount > 0 && (
          <div>
            • Service Charge: {invoice.serviceChargePercent}%
            property charge included
          </div>
        )}

      <div>
        • Electronic Invoice generated under Rule 46 of CGST Rules 2017.
      </div>
    </div>
  );
}

function InvoiceSummary({ invoice }) {
  const showGst =
    invoice.gstEnabled &&
    invoice.taxMode !== TAX_MODES.EXEMPT &&
    invoice.totalGstAmount > 0;

  return (
    <div className="tax-summary-box">
      <SummaryRow
        label={invoice.gstEnabled ? "Taxable Value:" : "Subtotal Amount:"}
        value={formatCurrency(invoice.roomTaxableValue)}
        strong
      />

      {invoice.mealsSubtotal > 0 && (
        <SummaryRow
          label="Meal Add-ons Subtotal:"
          value={`+ ${formatCurrency(invoice.mealsSubtotal)}`}
          valueClassName="tax-meal-total"
        />
      )}

      {invoice.servicesSubtotal > 0 && (
        <SummaryRow
          label="In-Stay Services Subtotal:"
          value={`+ ${formatCurrency(invoice.servicesSubtotal)}`}
          valueClassName="tax-meal-total"
        />
      )}

      {invoice.serviceChargeEnabled &&
        invoice.serviceChargeAmount > 0 && (
          <SummaryRow
            label={`Service Charge (${invoice.serviceChargePercent}%):`}
            value={`+ ${formatCurrency(
              invoice.serviceChargeAmount
            )}`}
            valueClassName="tax-meal-total"
          />
        )}

      {showGst && (
        <>
          <SummaryRow
            label={`CGST (${invoice.cgstPercentage}%):`}
            value={formatCurrency(invoice.cgstAmount, true)}
          />

          <SummaryRow
            label={`SGST (${invoice.sgstPercentage}%):`}
            value={formatCurrency(invoice.sgstAmount, true)}
          />
        </>
      )}

      {invoice.gstEnabled && !showGst && invoice.taxMode === TAX_MODES.EXEMPT && (
        <div className="tax-calc-row" style={{ color: "#059669" }}>
          <span>GST Status:</span>
          <span>Exempt (0%)</span>
        </div>
      )}

      <SummaryRow
        label="Grand Total:"
        value={formatCurrency(invoice.totalInvoiceAmount)}
        rowClassName="total"
      />

      <SummaryRow
        label="Amount Received:"
        value={`- ${formatCurrency(invoice.advancePaid)}`}
        rowClassName="advance"
      />

      {invoice.refundAmount > 0 && (
        <div className="tax-calc-row" style={{ color: "#DC2626", fontWeight: 600 }}>
          <span>Refund Credit Note:</span>
          <span>+ {formatCurrency(invoice.refundAmount)}</span>
        </div>
      )}

      <SummaryRow
        label="Balance Due at Checkout:"
        value={formatCurrency(invoice.balanceDue)}
        rowClassName="balance"
      />
    </div>
  );
}

/* ==========================================================================
   Small reusable UI components
   ========================================================================== */

function MetaRow({ label, value }) {
  return (
    <div className="tax-meta-row">
      <strong>{label}:</strong>
      <span>{value}</span>
    </div>
  );
}

function InvoiceInfoBox({ icon, title, children }) {
  return (
    <div className="tax-box">
      <div className="tax-box-title">
        <span className="tax-box-title-icon">{icon}</span>
        {title}
      </div>

      {children}
    </div>
  );
}

function InvoiceDetailRow({
  label,
  value,
  strong = false,
  valueClassName = "",
}) {
  return (
    <div className="tax-detail-row">
      <span className="lbl">{label}:</span>

      {strong ? (
        <strong className={`val ${valueClassName}`}>
          {value}
        </strong>
      ) : (
        <span className={`val ${valueClassName}`}>
          {value}
        </span>
      )}
    </div>
  );
}

function SummaryRow({
  label,
  value,
  strong = false,
  rowClassName = "",
  valueClassName = "",
}) {
  return (
    <div className={`tax-calc-row ${rowClassName}`}>
      <span>{label}</span>

      {strong ? (
        <strong className={valueClassName}>{value}</strong>
      ) : (
        <span className={valueClassName}>{value}</span>
      )}
    </div>
  );
}
