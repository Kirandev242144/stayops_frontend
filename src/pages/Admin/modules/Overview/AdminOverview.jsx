import React from "react";
import AdminStatCard from "../../components/common/AdminStatCard";
import AdminBadge from "../../components/common/AdminBadge";
import {
  FiTrendingUp,
  FiHome,
  FiUsers,
  FiCreditCard,
  FiCheckCircle,
  FiClock,
  FiDownload,
  FiArrowUpRight,
} from "react-icons/fi";
import "./AdminOverview.css";

const recentActivityData = [
  {
    id: 1,
    type: "new_tenant",
    badge: "New Tenant",
    status: "verified",
    title: "The Tamara Coorg registered",
    detail: "Owner: Rajesh Kumar (rajesh@tamaracoorg.in) • Plan: Pro Growth",
    time: "8 mins ago",
  },
  {
    id: 2,
    type: "subscription_renew",
    badge: "MRR Paid",
    status: "active",
    title: "Wayanad Wild Retreat renewed annual plan",
    detail: "Razorpay Invoice #INV-2026-089 • ₹32,389 settled",
    time: "24 mins ago",
  },
  {
    id: 3,
    type: "property_verified",
    badge: "Property Live",
    status: "active",
    title: "Ooty Mist Heritage Villa approved",
    detail: "6 Luxury Rooms inventory published to Direct Storefront",
    time: "1 hour ago",
  },
  {
    id: 4,
    type: "ota_sync",
    badge: "OTA Sync",
    status: "info",
    title: "MakeMyTrip 2-way sync triggered",
    detail: "18 room rates and block dates updated for Kabini River Lodge",
    time: "2 hours ago",
  },
  {
    id: 5,
    type: "trial_ending",
    badge: "Trial Alert",
    status: "warning",
    title: "Evolve Back Hampi trial expires in 2 days",
    detail: "Automated WhatsApp conversion sequence dispatched via Meta Cloud API",
    time: "4 hours ago",
  },
];

const AdminOverview = ({ onNavigate }) => {
  return (
    <div className="admin-overview">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <span className="admin-page-badge">SUPERADMIN CONSOLE</span>
          <h1 className="admin-page-title">Platform Command Center</h1>
          <p className="admin-page-subtitle">
            Real-time platform metrics, SaaS revenue, and operational pulse across all StayOps hotel properties.
          </p>
        </div>

        <div className="admin-page-actions">
          <span className="admin-timeframe-tag">
            <FiClock size={13} />
            <span>Updated live • Oct 2026</span>
          </span>
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={() => window.print()}
          >
            <FiDownload size={14} />
            <span>Export Snapshot</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="admin-stats-grid">
        <AdminStatCard
          title="Platform GMV (Total Volume)"
          value="₹24,85,600"
          change="+18.4% vs last mo"
          isPositive={true}
          icon={<FiTrendingUp />}
          subtitle="Direct guest & OTA booking volume"
          accent="teal"
        />

        <AdminStatCard
          title="Active Properties"
          value="142"
          change="+8 this month"
          isPositive={true}
          icon={<FiHome />}
          subtitle="Homestays, luxury villas & resorts"
          accent="emerald"
        />

        <AdminStatCard
          title="Total Tenant Accounts"
          value="108"
          change="94 Active • 14 In Trial"
          isPositive={true}
          icon={<FiUsers />}
          subtitle="Property owners, managers & staff"
          accent="blue"
        />

        <AdminStatCard
          title="Monthly Recurring Revenue (MRR)"
          value="₹2,48,500"
          change="+12.6% growth pace"
          isPositive={true}
          icon={<FiCreditCard />}
          subtitle="ARR run-rate: ₹29.82 Lakhs"
          accent="purple"
        />
      </div>

      {/* Two-Column Middle Section */}
      <div className="admin-overview-grid">
        {/* Left: Subscription Plan Breakdown */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2 className="admin-card__title">Active Subscription Tiers</h2>
              <p className="admin-card__subtitle">Distribution across 108 registered properties</p>
            </div>
            {onNavigate && (
              <button
                type="button"
                className="admin-card__action-link"
                onClick={() => onNavigate("subscriptions")}
              >
                <span>View Plans</span>
                <FiArrowUpRight size={14} />
              </button>
            )}
          </div>

          <div className="admin-plans-breakdown">
            {/* Pro Growth */}
            <div className="plan-progress-item">
              <div className="plan-progress-item__header">
                <div className="plan-progress-name">
                  <AdminBadge status="pro" label="Pro Growth" />
                  <span className="plan-price-tag">₹2,999 / mo</span>
                </div>
                <span className="plan-count">56 properties (52%)</span>
              </div>
              <div className="plan-progress-bar">
                <div
                  className="plan-progress-bar__fill fill-pro"
                  style={{ width: "52%" }}
                />
              </div>
            </div>

            {/* Lite */}
            <div className="plan-progress-item">
              <div className="plan-progress-item__header">
                <div className="plan-progress-name">
                  <AdminBadge status="lite" label="Lite Starter" />
                  <span className="plan-price-tag">₹1,499 / mo</span>
                </div>
                <span className="plan-count">34 properties (31%)</span>
              </div>
              <div className="plan-progress-bar">
                <div
                  className="plan-progress-bar__fill fill-lite"
                  style={{ width: "31%" }}
                />
              </div>
            </div>

            {/* Multi-Property Hub */}
            <div className="plan-progress-item">
              <div className="plan-progress-item__header">
                <div className="plan-progress-name">
                  <AdminBadge status="hub" label="Multi-Property Hub" />
                  <span className="plan-price-tag">₹5,999 / mo</span>
                </div>
                <span className="plan-count">18 properties (17%)</span>
              </div>
              <div className="plan-progress-bar">
                <div
                  className="plan-progress-bar__fill fill-hub"
                  style={{ width: "17%" }}
                />
              </div>
            </div>
          </div>

          <div className="admin-card__footer-metric">
            <div className="footer-metric-pill">
              <span className="metric-label">Average Revenue Per Property (ARPU):</span>
              <span className="metric-value">₹2,300 / mo</span>
            </div>
            <div className="footer-metric-pill">
              <span className="metric-label">Trial to Paid Conversion:</span>
              <span className="metric-value text-emerald">78.4%</span>
            </div>
          </div>
        </div>

        {/* Right: Infrastructure & Webhook Pulse */}
        <div className="admin-card">
          <div className="admin-card__header">
            <div>
              <h2 className="admin-card__title">Platform Infrastructure Health</h2>
              <p className="admin-card__subtitle">Core microservices & cloud gateways status</p>
            </div>
            {onNavigate && (
              <button
                type="button"
                className="admin-card__action-link"
                onClick={() => onNavigate("system")}
              >
                <span>Full Diagnostics</span>
                <FiArrowUpRight size={14} />
              </button>
            )}
          </div>

          <div className="admin-health-list">
            <div className="admin-health-row">
              <div className="admin-health-row__left">
                <div className="health-status-icon is-healthy">
                  <FiCheckCircle size={15} />
                </div>
                <div>
                  <span className="health-service-title">StayOps Spring Boot Core API</span>
                  <span className="health-service-desc">REST Controllers & Security Filters • Latency 24ms</span>
                </div>
              </div>
              <AdminBadge status="operational" label="Healthy" dot={true} />
            </div>

            <div className="admin-health-row">
              <div className="admin-health-row__left">
                <div className="health-status-icon is-healthy">
                  <FiCheckCircle size={15} />
                </div>
                <div>
                  <span className="health-service-title">MySQL 8.0 Master Cluster</span>
                  <span className="health-service-desc">JPA Hibernate multi-tenant persistence layer</span>
                </div>
              </div>
              <AdminBadge status="operational" label="Healthy" dot={true} />
            </div>

            <div className="admin-health-row">
              <div className="admin-health-row__left">
                <div className="health-status-icon is-healthy">
                  <FiCheckCircle size={15} />
                </div>
                <div>
                  <span className="health-service-title">WhatsApp Meta Cloud API</span>
                  <span className="health-service-desc">Direct booking inquiries & automated guest folios</span>
                </div>
              </div>
              <AdminBadge status="operational" label="Active" dot={true} />
            </div>

            <div className="admin-health-row">
              <div className="admin-health-row__left">
                <div className="health-status-icon is-healthy">
                  <FiCheckCircle size={15} />
                </div>
                <div>
                  <span className="health-service-title">OTA Channel Synchronization</span>
                  <span className="health-service-desc">Two-way sync: MakeMyTrip, Booking.com, Airbnb</span>
                </div>
              </div>
              <AdminBadge status="operational" label="Synced" dot={true} />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Recent Platform Activity Stream */}
      <div className="admin-card" style={{ marginTop: "24px" }}>
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Recent Platform Activity & Audit Trail</h2>
            <p className="admin-card__subtitle">
              Live operational event stream across tenants, bookings, and billing
            </p>
          </div>
        </div>

        <div className="admin-activity-stream">
          {recentActivityData.map((event) => (
            <div key={event.id} className="admin-activity-item">
              <div className="admin-activity-item__left">
                <AdminBadge status={event.status} label={event.badge} />
                <div className="admin-activity-item__details">
                  <span className="admin-activity-item__title">{event.title}</span>
                  <span className="admin-activity-item__desc">{event.detail}</span>
                </div>
              </div>
              <span className="admin-activity-item__time">{event.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
