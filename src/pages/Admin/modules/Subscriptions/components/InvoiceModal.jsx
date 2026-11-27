import React from "react";
import { FiX, FiPrinter, FiCheckCircle, FiShield, FiFileText } from "react-icons/fi";
import "./InvoiceModal.css";

const InvoiceModal = ({ isOpen, onClose, invoice }) => {
  if (!isOpen || !invoice) return null;

  return (
    <div className="inv-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="inv-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Controls */}
        <div className="inv-modal-controls no-print">
          <div className="inv-controls-left">
            <FiFileText size={16} />
            <span>Tax Invoice Preview</span>
          </div>
          <div className="inv-controls-right">
            <button
              type="button"
              className="admin-btn admin-btn--secondary"
              onClick={() => window.print()}
            >
              <FiPrinter size={14} />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              className="inv-close-btn"
              onClick={onClose}
              aria-label="Close invoice"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        {/* Printable Tax Invoice Paper */}
        <div className="inv-paper">
          {/* Invoice Header */}
          <div className="inv-paper-header">
            <div>
              <div className="inv-logo-title">StayOps</div>
              <div className="inv-company-name">StayOps Hospitality Technologies Pvt. Ltd.</div>
              <div className="inv-company-sub">
                Level 4, Brigade Tech Gardens, Whitefield, Bengaluru, KA 560066<br />
                <strong>GSTIN:</strong> 29AAACS9482F1ZV &nbsp;|&nbsp; <strong>PAN:</strong> AAACS9482F<br />
                <strong>SAC Code:</strong> 998314 (Information Technology Software SaaS Services)
              </div>
            </div>

            <div className="inv-title-box">
              <span className="inv-tax-badge">TAX INVOICE</span>
              <div className="inv-ref-num">{invoice.invoiceNumber}</div>
              <div className="inv-date-text">Date: {invoice.date || "Today"}</div>
              <div className="inv-status-pill">
                <FiCheckCircle size={12} />
                <span>{invoice.status || "PAID IN FULL"}</span>
              </div>
            </div>
          </div>

          <hr className="inv-divider" />

          {/* Billed To / Customer Details */}
          <div className="inv-parties-grid">
            <div className="inv-party-col">
              <span className="inv-party-label">BILLED TO (TENANT / OWNER):</span>
              <div className="inv-party-name">{invoice.tenantName}</div>
              <div className="inv-party-text">
                {invoice.tenantEmail}<br />
                {invoice.propertyName && (
                  <><strong>Registered Property:</strong> {invoice.propertyName}<br /></>
                )}
                <strong>GSTIN / UIN:</strong> {invoice.billingGstin || "Unregistered Consumer"}
              </div>
            </div>

            <div className="inv-party-col inv-party-col--right">
              <span className="inv-party-label">PAYMENT &amp; BILLING DETAILS:</span>
              <div className="inv-party-text">
                <strong>Gateway:</strong> {invoice.paymentGateway || "Razorpay Subscriptions"}<br />
                <strong>Payment Mode:</strong> {invoice.paymentMethod || "Razorpay UPI AutoPay"}<br />
                {invoice.razorpayPaymentId && (
                  <><strong>Payment ID:</strong> <span className="inv-mono">{invoice.razorpayPaymentId}</span><br /></>
                )}
                <strong>Billing Cycle:</strong> {invoice.billingCycle === "yearly" ? "Annual Pre-paid" : "Monthly Recurring"}
              </div>
            </div>
          </div>

          {/* Line Items Table */}
          <table className="inv-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>SAC</th>
                <th>Cycle</th>
                <th style={{ textAlign: "right" }}>Base Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>StayOps PMS — {invoice.planName}</strong>
                  <div className="inv-line-sub">
                    Multi-calendar PMS core, booking engine storefront, housekeeping, staff management, and OTA sync.
                  </div>
                </td>
                <td>998314</td>
                <td>{invoice.billingCycle || "Monthly"}</td>
                <td style={{ textAlign: "right" }}>
                  ₹{Number(invoice.subtotalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Calculations & Tax Summary */}
          <div className="inv-totals-wrap">
            <div className="inv-totals-box">
              <div className="inv-total-row">
                <span>Taxable Amount</span>
                <span>₹{Number(invoice.subtotalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="inv-total-row">
                <span>CGST (9.0%)</span>
                <span>₹{(Number(invoice.taxAmount || 0) / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="inv-total-row">
                <span>SGST (9.0%)</span>
                <span>₹{(Number(invoice.taxAmount || 0) / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="inv-total-row inv-total-row--grand">
                <span>Total Amount Billed</span>
                <span>₹{Number(invoice.totalAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          {/* Footer & Compliance Note */}
          <div className="inv-footer-note">
            <div className="inv-compliance-badge">
              <FiShield size={13} />
              <span>Electronically generated tax invoice under Rule 46 of the CGST Rules, 2017. Zero physical signature required.</span>
            </div>
            <p>Thank you for partnering with StayOps. For billing queries, write to <strong>billing@stayops.in</strong>.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
