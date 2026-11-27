import React from "react";
import "./QuickAccess.css";
import Container from "../../../../components/common/Container/Container";
import { Link } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiSmartphone, FiRefreshCw, FiMessageSquare } from "react-icons/fi";

const quickCards = [
  {
    id: "getting-started",
    badge: "Fast Track",
    title: "15-Min Property Setup",
    description: "Define room categories, configure base tariffs, upload hero photos, and publish your direct link.",
    icon: FiCheckCircle,
    color: "#04B3C0",
    bgGradient: "linear-gradient(135deg, rgba(4, 179, 192, 0.12) 0%, rgba(4, 179, 192, 0.02) 100%)",
    link: "/help/category/getting-started",
    stepCount: "3 Steps",
  },
  {
    id: "caretaker-ops",
    badge: "Mobile First",
    title: "Caretaker Operations",
    description: "Low-text mobile checklists, photo cleaning verification, guest check-in, and petty cash logging.",
    icon: FiSmartphone,
    color: "#FF6B35",
    bgGradient: "linear-gradient(135deg, rgba(255, 107, 53, 0.12) 0%, rgba(255, 107, 53, 0.02) 100%)",
    link: "/help/category/caretaker-ops",
    stepCount: "4 Workflows",
  },
  {
    id: "channel-manager",
    badge: "Zero Overbooking",
    title: "OTA Channel Sync",
    description: "Two-way live synchronization with Airbnb, Booking.com, and Agoda with atomic inventory locking.",
    icon: FiRefreshCw,
    color: "#8B5CF6",
    bgGradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.12) 0%, rgba(139, 92, 246, 0.02) 100%)",
    link: "/help/category/channel-manager",
    stepCount: "2-Way Sync",
  },
  {
    id: "whatsapp-storefront",
    badge: "Direct Sales",
    title: "WhatsApp Booking Bot",
    description: "Meta Cloud API automated guest inquiries, instant Razorpay payment links, and booking vouchers.",
    icon: FiMessageSquare,
    color: "#10B981",
    bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.02) 100%)",
    link: "/help/category/whatsapp-storefront",
    stepCount: "1-Tap Book",
  },
];

function QuickAccess() {
  return (
    <section className="hc-quick-section">
      <Container>
        <div className="hc-quick-header">
          <div className="hc-quick-badge">🚀 Essential Workflows</div>
          <h2 className="hc-quick-title">Quick Start Guides</h2>
          <p className="hc-quick-sub">
            The most essential workflows to get your property live and accepting guest reservations today.
          </p>
        </div>

        <div className="hc-quick-grid">
          {quickCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.id}
                to={card.link}
                className="hc-quick-card"
                style={{ "--card-accent": card.color }}
              >
                <div
                  className="hc-quick-card-ambient"
                  style={{ background: card.bgGradient }}
                ></div>

                <div className="hc-quick-top">
                  <div
                    className="hc-quick-icon-box"
                    style={{
                      color: card.color,
                      backgroundColor: `${card.color}18`,
                      borderColor: `${card.color}35`,
                    }}
                  >
                    <Icon />
                  </div>
                  <div className="hc-quick-pill">{card.badge}</div>
                </div>

                <div className="hc-quick-body">
                  <h3 className="hc-quick-card-title">{card.title}</h3>
                  <p className="hc-quick-card-desc">{card.description}</p>
                </div>

                <div className="hc-quick-footer">
                  <span className="hc-quick-steps">{card.stepCount}</span>
                  <div className="hc-quick-action">
                    <span>Explore</span>
                    <FiArrowRight className="hc-quick-arrow" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}

export default QuickAccess;