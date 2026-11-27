import React, { useState } from "react";
import "./HelpFaq.css";
import Container from "../../../../components/common/Container/Container";
import { FiHelpCircle, FiChevronDown } from "react-icons/fi";

const FAQ_ITEMS = [
  {
    q: "How does StayOps prevent double-bookings between Airbnb and Booking.com?",
    a: "StayOps employs atomic database row-level locking combined with two-way channel synchronization. The moment a reservation or block is placed on Airbnb, Booking.com, or your direct storefront, the dates are locked instantaneously across all other connected platforms to ensure zero overbooking.",
    tag: "Channel Manager",
  },
  {
    q: "Can my caretakers use StayOps on budget Android smartphones?",
    a: "Absolutely. The Caretaker Portal is built as an ultra-fast Progressive Web App (PWA) optimized for 4G/3G connections and budget Android devices. It features large visual buttons, photo-evidence uploads for housekeeping, and vernacular-friendly flows.",
    tag: "Caretaker Ops",
  },
  {
    q: "How does payment collection work via the WhatsApp booking flow?",
    a: "When a guest inquires via your WhatsApp link or QR code, StayOps generates a secure Razorpay or Cashfree payment link. As soon as the guest completes UPI or card payment, webhook confirms the reservation, blocks the dates, and delivers an instant booking voucher.",
    tag: "WhatsApp & Direct",
  },
  {
    q: "Can I map my own custom domain to my direct booking website?",
    a: "Yes! On the Pro Growth and Multi-Property Hub tiers, you can map any custom domain (e.g. staycoorg.in or myluxuryvilla.com) directly to your auto-generated StayOps storefront with free, auto-renewing SSL encryption.",
    tag: "Direct Storefront",
  },
  {
    q: "Are GST tax invoices and guest folios automatically generated?",
    a: "Yes. StayOps features built-in GST rule sets for Indian hospitality slabs (5%, 12%, 18%). Invoices automatically compute CGST/SGST or IGST, incorporate your business GSTIN, and can be printed or shared with guests in 1 click.",
    tag: "Billing & Compliance",
  },
  {
    q: "Is my revenue and bank payout information kept private from staff?",
    a: "Yes. StayOps enforces strict Role-Based Access Control (RBAC). Caretakers and ground managers only see daily arrivals, cleaning task statuses, and meal entries. Financial folios, net revenues, and banking credentials are restricted strictly to Owner accounts.",
    tag: "Security & RBAC",
  },
];

function HelpFaq() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section className="hc-faq-section">
      <Container>
        <div className="hc-faq-header">
          <div className="hc-faq-badge">
            <FiHelpCircle className="hc-faq-badge-icon" />
            <span>Common Questions</span>
          </div>
          <h2 className="hc-faq-title">Frequently Asked Questions</h2>
          <p className="hc-faq-subtitle">
            Quick answers to the questions homestay hosts and villa managers ask most often.
          </p>
        </div>

        <div className="hc-faq-list">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`hc-faq-item ${isOpen ? "open" : ""}`}
                onClick={() => toggleAccordion(idx)}
              >
                <div className="hc-faq-question-row">
                  <div className="hc-faq-q-left">
                    <span className="hc-faq-pill">{item.tag}</span>
                    <h3 className="hc-faq-question">{item.q}</h3>
                  </div>
                  <button
                    type="button"
                    className="hc-faq-toggle-btn"
                    aria-label={isOpen ? "Collapse question" : "Expand question"}
                  >
                    <FiChevronDown className="hc-faq-chevron" />
                  </button>
                </div>

                {isOpen && (
                  <div className="hc-faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default HelpFaq;