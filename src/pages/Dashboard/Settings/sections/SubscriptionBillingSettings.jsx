import React, { useState, useEffect, useCallback } from "react";
import {
  FiCheck,
  FiZap,
  FiShield,
  FiFileText,
  FiPrinter,
  FiArrowRight,
  FiChevronRight,
  FiExternalLink,
} from "react-icons/fi";
import { toast } from "react-toastify";
import { API_BASE_URL } from "../../../../config/api";
import InvoiceModal from "../../../Admin/modules/Subscriptions/components/InvoiceModal";
import "./SubscriptionBillingSettings.css";

const DEFAULT_PLANS = [
  {
    key: "lite",
    name: "Lite Starter",
    category: "Single apartment / small homestay",
    maxProperties: 1,
    maxRooms: 3,
    monthlyPrice: 1499,
    yearlyPrice: 14990,
    annualSavings: 2998,
    highlights: [
      "1 property, up to 3 rooms",
      "Core PMS & availability calendar",
      "Subdomain website (name.stayops.in)",
      "Standard WhatsApp alerts & iCal sync",
      "Basic revenue dashboard",
    ],
  },
  {
    key: "pro",
    name: "Pro Growth",
    category: "Standalone villa / premium homestay",
    isRecommended: true,
    maxProperties: 1,
    maxRooms: "Unlimited",
    monthlyPrice: 2999,
    yearlyPrice: 29990,
    annualSavings: 5998,
    highlights: [
      "1 property, unlimited rooms",
      "Custom domain mapping (myvilla.com)",
      "WhatsApp booking bot & payment gateway",
      "Real-time 2-way OTA channel sync",
      "Petty cash, expense & food/meal ledger",
      "Advanced profit & occupancy dashboard",
    ],
  },
  {
    key: "hub",
    name: "Multi-Property Hub",
    category: "Property manager / portfolio operator",
    maxProperties: 5,
    maxRooms: "Unlimited",
    monthlyPrice: 5999,
    yearlyPrice: 59990,
    annualSavings: 11998,
    highlights: [
      "Up to 5 properties, unlimited rooms",
      "Everything in Pro Growth included",
      "Portfolio roll-up dashboard & centralized controls",
      "Multi-user staff permissions & audit trail",
      "Flat add-on fee for additional properties (>5)",
    ],
  },
];

// Dynamically load Razorpay Checkout SDK
function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const SubscriptionBillingSettings = () => {
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [subData, setSubData] = useState(null);
  const [plans, setPlans] = useState(DEFAULT_PLANS);
  const [isLoading, setIsLoading] = useState(true);
  const [showPlans, setShowPlans] = useState(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState(null);
  const [billingGstin, setBillingGstin] = useState("");
  const [billingName, setBillingName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Authenticated user from local storage
  const currentUser = (() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })();

  const token = localStorage.getItem("token");

  // Fetch dynamic plans from platform backend (single source of truth)
  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/platform/subscriptions/plans`, {
      headers: { Accept: "application/json" },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          const normalized = data.map((p) => ({
            ...p,
            category: p.category || p.target || "StayOps Plan Tier",
            maxProperties: p.maxProperties === -1 ? "Unlimited" : p.maxProperties,
            maxRooms: p.maxRooms === -1 ? "Unlimited" : p.maxRooms,
            annualSavings:
              p.annualSavings ||
              Math.max(0, Math.round(Number(p.monthlyPrice) * 12 - Number(p.yearlyPrice))),
          }));
          setPlans(normalized);
        }
      })
      .catch((err) => console.warn("Could not fetch platform subscription plans", err));

    return () => {
      isMounted = false;
    };
  }, []);

  const loadSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const tenantParam = currentUser?.id ? `?tenantId=${currentUser.id}` : "";
      const res = await fetch(`${API_BASE_URL}/platform/subscriptions/my-subscription${tenantParam}`, {
        headers: {
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (res.ok) {
        const data = await res.json();
        setSubData(data);
        if (data.currentBillingCycle) {
          setBillingCycle(data.currentBillingCycle);
        }
        if (data.tenantName && !billingName) setBillingName(data.tenantName);
        if (data.tenantEmail && !billingEmail) setBillingEmail(data.tenantEmail);
      }
    } catch (err) {
      console.warn("Could not load subscription data", err);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser?.id, token, billingName, billingEmail]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  const currentPlanKey = (subData?.planKey || currentUser?.plan || "pro").toLowerCase();
  const isTrial = subData?.isTrial || subData?.status?.toLowerCase() === "trial";

  const currentPlanSpec = plans.find((p) => p.key === currentPlanKey) || plans[0] || DEFAULT_PLANS[0];

  const handleSelectPlan = (plan) => {
    setSelectedPlanForCheckout(plan);
    if (!billingName) setBillingName(subData?.tenantName || currentUser?.name || "");
    if (!billingEmail) setBillingEmail(subData?.tenantEmail || currentUser?.email || "");
  };

  const calculateAmounts = (plan) => {
    if (!plan) return { subtotal: 0, tax: 0, total: 0 };
    const subtotal = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
    const tax = Math.round(subtotal * 0.18 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;
    return { subtotal, tax, total };
  };

  const handleProceedRazorpay = async () => {
    if (!selectedPlanForCheckout) return;

    setIsProcessingCheckout(true);

    try {
      const orderPayload = {
        tenantId: subData?.tenantId || currentUser?.id,
        planKey: selectedPlanForCheckout.key,
        billingCycle,
        billingName: billingName || subData?.tenantName || "Property Owner",
        billingEmail: billingEmail || subData?.tenantEmail || "owner@stayops.com",
        billingGstin: billingGstin.trim(),
      };

      const orderRes = await fetch(`${API_BASE_URL}/platform/subscriptions/create-checkout-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(orderPayload),
      });

      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to initiate Razorpay checkout order.");
      }

      const orderData = await orderRes.json();
      const scriptLoaded = await loadRazorpayScript();

      if (scriptLoaded && window.Razorpay && orderData.keyId) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amountPaise,
          currency: orderData.currency || "INR",
          name: "StayOps",
          description: `${selectedPlanForCheckout.name} (${billingCycle}) Subscription`,
          order_id: orderData.orderId,
          prefill: {
            name: orderPayload.billingName,
            email: orderPayload.billingEmail,
          },
          notes: {
            invoiceNumber: orderData.invoiceNumber,
            planKey: selectedPlanForCheckout.key,
            gstin: billingGstin,
          },
          theme: {
            color: "#0F172A",
          },
          handler: async function (response) {
            await verifyAndFinalize({
              tenantId: orderPayload.tenantId,
              planKey: selectedPlanForCheckout.key,
              billingCycle,
              razorpayOrderId: response.razorpay_order_id || orderData.orderId,
              razorpayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpaySignature: response.razorpay_signature || "verified_sig",
              billingName: orderPayload.billingName,
              billingEmail: orderPayload.billingEmail,
              billingGstin,
            });
          },
          modal: {
            ondismiss: function () {
              setIsProcessingCheckout(false);
              toast.info("Payment checkout cancelled.");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.on("payment.failed", function (response) {
          toast.error(response.error?.description || "Payment transaction failed.");
          setIsProcessingCheckout(false);
        });
        rzp.open();
      } else {
        // Direct sandbox fallback
        await verifyAndFinalize({
          tenantId: orderPayload.tenantId,
          planKey: selectedPlanForCheckout.key,
          billingCycle,
          razorpayOrderId: orderData.orderId || `order_${Date.now()}`,
          razorpayPaymentId: `pay_test_${Date.now()}`,
          razorpaySignature: "sandbox_test_signature",
          billingName: orderPayload.billingName,
          billingEmail: orderPayload.billingEmail,
          billingGstin,
        });
      }
    } catch (err) {
      toast.error(err.message || "Checkout failed. Please try again.");
      setIsProcessingCheckout(false);
    }
  };

  const verifyAndFinalize = async (verifyPayload) => {
    try {
      const verifyRes = await fetch(`${API_BASE_URL}/platform/subscriptions/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(verifyPayload),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || "Payment verification failed.");
      }

      toast.success(verifyData.message || "Subscription activated successfully.");

      if (currentUser) {
        const updatedUser = { ...currentUser, plan: verifyData.planKey, status: "Active" };
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      setSelectedPlanForCheckout(null);
      setShowPlans(false);
      await loadSubscription();
    } catch (err) {
      toast.error(err.message || "Failed to verify transaction.");
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const { subtotal, tax, total } = calculateAmounts(selectedPlanForCheckout);

  const getCoverageEndDate = (cycle) => {
    const d = new Date();
    if (cycle === "yearly") {
      d.setFullYear(d.getFullYear() + 1);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  // Format pricing
  const currentPriceFormatted =
    billingCycle === "yearly"
      ? `₹${currentPlanSpec.yearlyPrice.toLocaleString("en-IN")} / year`
      : `₹${currentPlanSpec.monthlyPrice.toLocaleString("en-IN")} / month`;

  const propertiesUsed = subData?.propertiesCount ?? 1;
  const propertiesLimit = currentPlanSpec.maxProperties;
  const roomsUsed = subData?.roomsCount ?? 0;
  const roomsLimit = currentPlanSpec.maxRooms;

  const isBilledAnnually = subData?.currentBillingCycle === "yearly";

  return (
    <div className="sub-settings-root">
      {/* ── Section Header ── */}
      <div className="sub-section-header">
        <div>
          <h2 className="sub-heading-title">Subscription & Billing</h2>
          <p className="sub-heading-subtitle">
            Manage your StayOps SaaS plan, review usage quotas, and download GST tax invoices.
          </p>
        </div>
      </div>

      {/* ── Current Plan Overview Card ── */}
      <div className="sub-card sub-overview-card">
        <div className="sub-overview-top">
          <div className="sub-overview-left">
            <div className="sub-plan-badge-line">
              <h3 className="sub-plan-name">{subData?.planName || currentPlanSpec.name}</h3>
              <span className={`sub-status-dot-pill ${isTrial ? "sub-status--trial" : "sub-status--active"}`}>
                <span className="sub-status-dot" />
                {isTrial ? `Trial (${subData?.trialDaysLeft ?? 14} days left)` : isBilledAnnually ? "Active · Annual" : "Active · Monthly"}
              </span>
            </div>
            <p className="sub-plan-meta">
              {isTrial
                ? "Your account is on a free trial. Upgrade anytime to preserve settings and ensure uninterrupted service."
                : `${currentPriceFormatted} · ${isBilledAnnually ? "Billed annually (17% savings active)" : "Billed monthly"} ${
                    subData?.renewalDate ? `· Renews on ${subData.renewalDate}` : ""
                  }`}
            </p>
          </div>

          <div className="sub-overview-actions">
            {!isBilledAnnually && !isTrial && (
              <button
                type="button"
                className="sub-btn sub-btn--subtle"
                onClick={() => {
                  setBillingCycle("yearly");
                  setShowPlans(true);
                }}
              >
                Switch to Annual (Save 17%)
              </button>
            )}
            <button
              type="button"
              className="sub-btn sub-btn--primary"
              onClick={() => setShowPlans((prev) => !prev)}
            >
              {showPlans ? "Hide Plans" : "Change Plan"}
            </button>
          </div>
        </div>

        {/* Quotas & Capacity Grid */}
        <div className="sub-quotas-grid">
          <div className="sub-quota-item">
            <span className="sub-quota-label">Properties</span>
            <div className="sub-quota-val">
              <span className="sub-quota-current">{propertiesUsed}</span>
              <span className="sub-quota-max">
                {" "}
                / {propertiesLimit === "Unlimited" ? "Unlimited" : propertiesLimit}
              </span>
            </div>
          </div>

          <div className="sub-quota-item">
            <span className="sub-quota-label">Room Capacity</span>
            <div className="sub-quota-val">
              <span className="sub-quota-current">{roomsUsed > 0 ? roomsUsed : "—"}</span>
              <span className="sub-quota-max">
                {" "}
                / {roomsLimit === "Unlimited" ? "Unlimited" : `${roomsLimit} rooms`}
              </span>
            </div>
          </div>

          <div className="sub-quota-item">
            <span className="sub-quota-label">Payment Gateway</span>
            <div className="sub-quota-val">
              <span className="sub-quota-gateway">Razorpay Master</span>
            </div>
          </div>

          <div className="sub-quota-item">
            <span className="sub-quota-label">Tax Specification</span>
            <div className="sub-quota-val">
              <span className="sub-quota-gst">SAC 998314 (18% GST)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Plan Switcher / Available Plans ── */}
      {showPlans && (
        <div className="sub-card sub-plans-card">
          <div className="sub-plans-header">
            <div>
              <h3 className="sub-plans-title">Select a Plan</h3>
              <p className="sub-plans-desc">
                Plan changes are prorated and take effect immediately.
              </p>
            </div>

            {/* Segmented cycle toggle */}
            <div className="sub-cycle-toggle">
              <button
                type="button"
                className={`sub-cycle-opt ${billingCycle === "monthly" ? "sub-cycle-opt--active" : ""}`}
                onClick={() => setBillingCycle("monthly")}
              >
                Monthly
              </button>
              <button
                type="button"
                className={`sub-cycle-opt ${billingCycle === "yearly" ? "sub-cycle-opt--active" : ""}`}
                onClick={() => setBillingCycle("yearly")}
              >
                Annual <span className="sub-cycle-badge">Save 17%</span>
              </button>
            </div>
          </div>

          {/* 3 Compact, Typography-driven Plan Cards */}
          <div className="sub-plans-grid">
            {plans.map((plan) => {
              const isCurrent = currentPlanKey === plan.key && !isTrial;
              const price = billingCycle === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
              const cycleText = billingCycle === "yearly" ? "/year" : "/month";

              return (
                <div
                  key={plan.key}
                  className={`sub-plan-card ${isCurrent ? "sub-plan-card--current" : ""} ${
                    plan.isRecommended ? "sub-plan-card--recommended" : ""
                  }`}
                >
                  <div className="sub-plan-top">
                    <div className="sub-plan-row">
                      <span className="sub-plan-card-name">{plan.name}</span>
                      {plan.isRecommended && (
                        <span className="sub-recommended-tag">Recommended</span>
                      )}
                    </div>
                    <span className="sub-plan-category">{plan.category}</span>
                  </div>

                  <div className="sub-plan-pricing">
                    <span className="sub-plan-amount">₹{price.toLocaleString("en-IN")}</span>
                    <span className="sub-plan-cycle">{cycleText}</span>
                    <span className="sub-plan-tax-note">+ 18% GST</span>
                  </div>

                  <div className="sub-plan-limit-chip">
                    {plan.maxProperties === "Unlimited"
                      ? "Unlimited properties & rooms"
                      : `${plan.maxProperties} ${plan.maxProperties === 1 ? "property" : "properties"} · up to ${plan.maxRooms} rooms`}
                  </div>

                  <ul className="sub-plan-highlights">
                    {plan.highlights.map((item, idx) => (
                      <li key={idx}>
                        <FiCheck size={13} className="sub-plan-check" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="sub-plan-footer">
                    {isCurrent ? (
                      <div className="sub-btn-current">Current Plan</div>
                    ) : (
                      <button
                        type="button"
                        className={`sub-btn ${
                          plan.isRecommended ? "sub-btn--primary" : "sub-btn--secondary"
                        } sub-btn--full`}
                        onClick={() => handleSelectPlan(plan)}
                      >
                        {isTrial ? "Upgrade" : "Select Plan"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Tax Invoices & Receipts ── */}
      <div className="sub-card sub-invoices-card">
        <div className="sub-invoices-header">
          <div>
            <h3 className="sub-invoices-title">Invoices & Receipts</h3>
            <p className="sub-invoices-desc">
              Download official GST tax invoices for business expense and tax filing.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="sub-invoices-state">Loading billing records...</div>
        ) : !subData?.invoices || subData.invoices.length === 0 ? (
          <div className="sub-invoices-state sub-invoices-state--empty">
            <FiFileText size={22} className="sub-empty-icon" />
            <p>No billing invoices on file. Invoices will appear here immediately after your first payment.</p>
          </div>
        ) : (
          <div className="sub-table-wrapper">
            <table className="sub-table">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Billing Date</th>
                  <th>Plan Tier</th>
                  <th>Billing Cycle</th>
                  <th>Total Billed</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {subData.invoices.map((inv) => (
                  <tr key={inv.id || inv.invoiceNumber}>
                    <td className="sub-td-inv-num">{inv.invoiceNumber}</td>
                    <td className="sub-td-muted">{inv.date}</td>
                    <td className="sub-td-strong">{inv.planName}</td>
                    <td className="sub-td-capitalize">{inv.billingCycle}</td>
                    <td className="sub-td-amount">
                      ₹{Number(inv.totalAmount).toLocaleString("en-IN")}
                      <span className="sub-amount-sub">
                        (₹{Number(inv.subtotalAmount).toLocaleString("en-IN")} + 18% GST)
                      </span>
                    </td>
                    <td>
                      <span className="sub-status-pill sub-status-pill--paid">
                        {inv.status || "Paid"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="sub-btn-view"
                        onClick={() => {
                          setSelectedInvoice(inv);
                          setIsInvoiceModalOpen(true);
                        }}
                      >
                        <FiPrinter size={12} />
                        <span>View Invoice</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Clean Checkout Modal ── */}
      {selectedPlanForCheckout && (
        <div className="sub-modal-overlay" onClick={() => setSelectedPlanForCheckout(null)}>
          <div className="sub-checkout-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="sub-sheet-header">
              <div>
                <h3 className="sub-sheet-title">Confirm Plan Upgrade</h3>
                <p className="sub-sheet-subtitle">
                  Review your subscription details and proceed to secure checkout.
                </p>
              </div>
              <button
                type="button"
                className="sub-sheet-close"
                onClick={() => setSelectedPlanForCheckout(null)}
              >
                &times;
              </button>
            </div>

            <div className="sub-sheet-body">
              {/* Order Breakdown */}
              <div className="sub-sheet-summary">
                <div className="sub-summary-row">
                  <span>Selected Plan</span>
                  <strong>{selectedPlanForCheckout.name}</strong>
                </div>
                <div className="sub-summary-row">
                  <span>Billing Frequency</span>
                  <strong>{billingCycle === "yearly" ? "Annual (365 days · 17% savings)" : "Monthly (30 days)"}</strong>
                </div>
                <div className="sub-summary-row">
                  <span>Coverage Period</span>
                  <span>Today until {getCoverageEndDate(billingCycle)}</span>
                </div>
                <div className="sub-summary-line" />
                <div className="sub-summary-row">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="sub-summary-row">
                  <span>GST (18% · SAC 998314)</span>
                  <span>₹{tax.toLocaleString("en-IN")}</span>
                </div>
                <div className="sub-summary-line" />
                <div className="sub-summary-row sub-summary-row--total">
                  <span>Total Payable</span>
                  <span>₹{total.toLocaleString("en-IN")}</span>
                </div>
              </div>

              {/* Tax Invoice Details Form */}
              <div className="sub-form-group">
                <label className="sub-form-label">Billing Name / Business</label>
                <input
                  type="text"
                  className="sub-form-input"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="e.g. Grand Horizon Resorts"
                />
              </div>

              <div className="sub-form-group">
                <label className="sub-form-label">Billing Email</label>
                <input
                  type="email"
                  className="sub-form-input"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  placeholder="e.g. accounts@horizon.com"
                />
              </div>

              <div className="sub-form-group">
                <label className="sub-form-label">
                  GSTIN <span className="sub-label-optional">(Optional · for tax credit)</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  className="sub-form-input"
                  value={billingGstin}
                  onChange={(e) => setBillingGstin(e.target.value.toUpperCase())}
                  placeholder="29AAAAA0000A1Z5"
                />
                <span className="sub-form-hint">
                  Your GSTIN will be printed on the official tax invoice.
                </span>
              </div>

              <div className="sub-security-note">
                <FiShield size={14} />
                <span>Processed securely via StayOps Master Payment Gateway.</span>
              </div>
            </div>

            <div className="sub-sheet-footer">
              <button
                type="button"
                className="sub-btn sub-btn--subtle"
                onClick={() => setSelectedPlanForCheckout(null)}
                disabled={isProcessingCheckout}
              >
                Cancel
              </button>
              <button
                type="button"
                className="sub-btn sub-btn--primary"
                onClick={handleProceedRazorpay}
                disabled={isProcessingCheckout}
              >
                {isProcessingCheckout ? (
                  "Processing Checkout..."
                ) : (
                  <>
                    <FiZap size={13} />
                    <span>Pay ₹{total.toLocaleString("en-IN")} via Razorpay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tax Invoice Modal ── */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => {
          setIsInvoiceModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </div>
  );
};

export default SubscriptionBillingSettings;
