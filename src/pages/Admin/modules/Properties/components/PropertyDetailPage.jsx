import React, { useState, useEffect, useCallback } from "react";
import {
  FiArrowLeft,
  FiRefreshCw,
  FiChevronDown,
  FiSlash,
  FiCheck,
  FiAlertTriangle,
  FiHome,
  FiUser,
  FiActivity,
  FiGlobe,
  FiExternalLink,
  FiMapPin,
  FiLayers,
  FiCheckCircle,
  FiShield,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import { toast } from "react-toastify";
import {
  fetchPropertyDetail,
  updatePropertyStatus,
  getStorefrontUrl,
} from "../utils/propertyUtils";
import PropertyStatusModal from "./PropertyStatusModal";
import "./PropertyDetailPage.css";

const TABS = [
  { id: "overview", label: "Overview", icon: FiHome },
  { id: "owner", label: "Owner & Account", icon: FiUser },
  { id: "operations", label: "Operational Summary", icon: FiLayers },
  { id: "storefront", label: "Storefront & OTAs", icon: FiGlobe },
  { id: "audit", label: "Activity & Audit", icon: FiActivity },
];

const PropertyDetailPage = ({ propertyId, onBack, onNavigateToTenant }) => {
  const [property, setProperty] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [actionsOpen, setActionsOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!propertyId) return;
    try {
      setIsLoading(true);
      setFetchError(null);
      const data = await fetchPropertyDetail(propertyId);
      setProperty(data);
    } catch (err) {
      setFetchError(err.message || "Failed to load property details.");
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!actionsOpen) return;
    const close = () => setActionsOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [actionsOpen]);

  const handleApproveProperty = async () => {
    if (!property) return;
    setIsMutating(true);
    try {
      const updated = await updatePropertyStatus(property.id, "Active");
      setProperty(updated);
      toast.success(`Property "${property.name}" approved & published to live channels!`);
    } catch (err) {
      toast.error(`Error approving property: ${err.message}`);
    } finally {
      setIsMutating(false);
      setActionsOpen(false);
    }
  };

  const handleConfirmToggleStatus = async (prop) => {
    const nextStatus = prop.status === "active" ? "Suspended" : "Active";
    setIsMutating(true);
    try {
      const updated = await updatePropertyStatus(prop.id, nextStatus);
      setProperty(updated);
      if (nextStatus === "Suspended") {
        toast.warning(`Property "${prop.name}" suspended.`);
      } else {
        toast.success(`Property "${prop.name}" reactivated.`);
      }
    } catch (err) {
      toast.error(`Status update failed: ${err.message}`);
    } finally {
      setIsMutating(false);
      setIsStatusModalOpen(false);
      setActionsOpen(false);
    }
  };

  if (isLoading) return <PropertyDetailSkeleton onBack={onBack} />;

  if (fetchError || !property) {
    return (
      <div className="pdp-root">
        <div className="pdp-topbar">
          <button type="button" className="pdp-back-btn" onClick={onBack}>
            <FiArrowLeft size={15} /> Back to Properties
          </button>
        </div>
        <div className="pdp-error-banner">
          <FiAlertTriangle size={16} />
          <div>
            <strong>Failed to load property</strong>
            <p>{fetchError || "Property not found."}</p>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn--primary"
            onClick={loadDetail}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const storefrontUrl = getStorefrontUrl(property.slug);
  const isActive = property.status === "active";
  const isReview = property.status === "review";
  const isSuspended = property.status === "suspended";

  return (
    <div className="pdp-root">
      {/* ── Top Bar ── */}
      <div className="pdp-topbar">
        <button type="button" className="pdp-back-btn" onClick={onBack}>
          <FiArrowLeft size={15} /> Back to Properties
        </button>

        <div className="pdp-topbar-actions">
          <button
            type="button"
            className="admin-btn admin-btn--secondary"
            onClick={loadDetail}
            disabled={isMutating}
            title="Reload latest details from database"
          >
            <FiRefreshCw size={13} className={isMutating ? "spin-icon" : ""} />
            <span>Sync</span>
          </button>

          <div className="pdp-actions-wrap">
            <button
              type="button"
              className="admin-btn admin-btn--secondary pdp-actions-trigger"
              onClick={(e) => {
                e.stopPropagation();
                setActionsOpen((prev) => !prev);
              }}
              disabled={isMutating}
            >
              <span>Actions</span>
              <FiChevronDown size={14} />
            </button>

            {actionsOpen && (
              <div className="pdp-dropdown" onClick={(e) => e.stopPropagation()}>
                {isReview && (
                  <button
                    type="button"
                    className="pdp-dropdown-item pdp-dropdown-item--success"
                    onClick={handleApproveProperty}
                  >
                    <FiCheck size={14} /> Approve &amp; Go Live
                  </button>
                )}

                <button
                  type="button"
                  className={`pdp-dropdown-item ${
                    isActive ? "pdp-dropdown-item--danger" : "pdp-dropdown-item--success"
                  }`}
                  onClick={() => setIsStatusModalOpen(true)}
                >
                  {isActive ? (
                    <>
                      <FiSlash size={14} /> Suspend Property
                    </>
                  ) : (
                    <>
                      <FiCheck size={14} /> Reactivate Property
                    </>
                  )}
                </button>

                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pdp-dropdown-item"
                >
                  <FiExternalLink size={14} /> Visit Guest Storefront
                </a>

                {property.ownerId && onNavigateToTenant && (
                  <button
                    type="button"
                    className="pdp-dropdown-item"
                    onClick={() => {
                      setActionsOpen(false);
                      onNavigateToTenant(property.ownerId);
                    }}
                  >
                    <FiUser size={14} /> View Owner Account
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Hero Overview Header Card ── */}
      <div className="pdp-hero">
        <div className="pdp-hero-left">
          <div className="pdp-hero-icon">
            <FiHome size={24} />
          </div>
          <div className="pdp-hero-info">
            <div className="pdp-hero-title-row">
              <h1 className="pdp-hero-name">{property.name}</h1>
              <span className="pdp-code-tag">{property.code}</span>
              <span className="pdp-category-pill">{property.category}</span>
            </div>

            <div className="pdp-hero-meta-row">
              <span className="pdp-meta-item">
                <FiMapPin size={13} />
                <span>
                  {property.city}, {property.state}
                </span>
              </span>
              <span className="pdp-meta-sep">·</span>
              <span className="pdp-status-indicator">
                <span
                  className="pdp-status-dot"
                  style={{
                    background: isActive
                      ? "#0E9F6E"
                      : isReview
                      ? "#F59E0B"
                      : "#EF4444",
                  }}
                />
                <span className="pdp-status-text">
                  {isActive ? "Active PMS" : isReview ? "Pending Review" : "Suspended"}
                </span>
              </span>
              <span className="pdp-meta-sep">·</span>
              <span className="pdp-storefront-badge">
                <FiGlobe size={12} />
                <span>
                  {isActive && property.storefrontEnabled
                    ? `Live Storefront (${property.slug}.stayops.in)`
                    : "Storefront Offline"}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Hero Right: Linked Owner & Account Quick Card */}
        <div className="pdp-hero-right">
          <div className="pdp-owner-card">
            <div className="pdp-owner-card__label">Property Owner</div>
            <div className="pdp-owner-card__name">{property.ownerName}</div>
            <div className="pdp-owner-card__plan">
              {property.subscriptionPlan || "Multi-Property Hub"}
            </div>
            {property.ownerId && onNavigateToTenant && (
              <button
                type="button"
                className="pdp-owner-card__btn"
                onClick={() => onNavigateToTenant(property.ownerId)}
                title="Open tenant account details"
              >
                <span>View tenant details</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="pdp-kpis">
        <div className="pdp-kpi-card">
          <div className="pdp-kpi-label">Inventory Units</div>
          <div className="pdp-kpi-value">{property.rooms}</div>
          <div className="pdp-kpi-sub">Total operational rooms</div>
        </div>
        <div className="pdp-kpi-card">
          <div className="pdp-kpi-label">Max Guest Capacity</div>
          <div className="pdp-kpi-value">{property.maxGuests}</div>
          <div className="pdp-kpi-sub">Calculated across room units</div>
        </div>
        <div className="pdp-kpi-card">
          <div className="pdp-kpi-label">Base Tariff</div>
          <div className="pdp-kpi-value">
            ₹{Number(property.baseRate || 0).toLocaleString()}
          </div>
          <div className="pdp-kpi-sub">Per night starting rate</div>
        </div>
        <div className="pdp-kpi-card">
          <div className="pdp-kpi-label">Registered On</div>
          <div className="pdp-kpi-value pdp-kpi-value--date">
            {property.joinedDate || "Recent"}
          </div>
          <div className="pdp-kpi-sub">Platform onboarding date</div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div className="pdp-tabs" role="tablist">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isSelected}
              className={`pdp-tab ${isSelected ? "pdp-tab--active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── Tab Content Panels ── */}
      <div className="pdp-tab-content">
        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="pdp-grid">
            <div className="pdp-card">
              <h3 className="pdp-card-title">Property Profile &amp; Specifications</h3>
              <dl className="pdp-dlist">
                <div className="pdp-dlist-row">
                  <dt>Display Name</dt>
                  <dd>{property.name}</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>System Code</dt>
                  <dd className="pdp-mono">{property.code}</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>Category</dt>
                  <dd>{property.category || property.type || "Homestay"}</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>Accommodates</dt>
                  <dd>{property.rooms} Rooms · Up to {property.maxGuests} Guests</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>Property Description</dt>
                  <dd className="pdp-desc-text">
                    {property.description || "Registered stay on StayOps platform."}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pdp-card">
              <h3 className="pdp-card-title">Location &amp; Compliance</h3>
              <dl className="pdp-dlist">
                <div className="pdp-dlist-row">
                  <dt>Physical Address</dt>
                  <dd>{property.address || "Main Road / Resort Highway"}</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>City / Destination</dt>
                  <dd>{property.city}</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>State &amp; Country</dt>
                  <dd>{property.state}, India</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>Postal Code</dt>
                  <dd>{property.pincode || "—"}</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>Tourism / Permit ID</dt>
                  <dd>
                    <span className="pdp-permit-tag">
                      <FiShield size={12} />
                      <span>{property.permitId || "PERM-KAR-2026"}</span>
                    </span>
                  </dd>
                </div>
              </dl>
            </div>

            <div className="pdp-card pdp-card--full">
              <h3 className="pdp-card-title">On-Site Contacts &amp; Operations</h3>
              <div className="pdp-contacts-grid">
                <div className="pdp-contact-box">
                  <div className="pdp-contact-role">Primary Contact Email</div>
                  <div className="pdp-contact-val">
                    <FiMail size={13} />
                    <a href={`mailto:${property.contactEmail}`}>{property.contactEmail}</a>
                  </div>
                </div>
                <div className="pdp-contact-box">
                  <div className="pdp-contact-role">Front Desk / Caretaker Phone</div>
                  <div className="pdp-contact-val">
                    <FiPhone size={13} />
                    <a href={`tel:${property.contactPhone}`}>{property.contactPhone}</a>
                  </div>
                </div>
                <div className="pdp-contact-box">
                  <div className="pdp-contact-role">Check-in / Check-out Window</div>
                  <div className="pdp-contact-val">
                    <span>14:00 Check-in · 11:00 Check-out</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Owner & Account */}
        {activeTab === "owner" && (
          <div className="pdp-card">
            <h3 className="pdp-card-title">Linked Tenant &amp; PMS Account</h3>
            <p className="pdp-card-subtitle">
              This property belongs to an owner account on StayOps. As a platform administrator, you manage the owner’s tenancy, billing tier, and platform status.
            </p>

            <div className="pdp-owner-hero">
              <div className="pdp-owner-hero__avatar">
                {property.ownerName.charAt(0).toUpperCase()}
              </div>
              <div className="pdp-owner-hero__details">
                <div className="pdp-owner-hero__name">{property.ownerName}</div>
                <div className="pdp-owner-hero__email">{property.ownerEmail}</div>
                <div className="pdp-owner-hero__plan-tag">
                  {property.subscriptionPlan || "Multi-Property Hub"} Tier
                </div>
              </div>
              {property.ownerId && onNavigateToTenant && (
                <button
                  type="button"
                  className="admin-btn admin-btn--primary pdp-owner-jump-btn"
                  onClick={() => onNavigateToTenant(property.ownerId)}
                >
                  <span>Open Tenant Account Details</span>
                  <FiExternalLink size={14} />
                </button>
              )}
            </div>

            <div className="pdp-saas-notice">
              <FiShield size={16} className="pdp-saas-notice-icon" />
              <div>
                <strong>Role &amp; Responsibility Boundary</strong>
                <p>
                  Property owners manage room rates, daily availability, check-ins, and guest bookings via their private PMS dashboard. The StayOps Platform Admin oversees compliance, subscription plans, domain mappings, and system integrity.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Operational Summary (Read-Only PMS View) */}
        {activeTab === "operations" && (
          <div className="pdp-card">
            <div className="pdp-card-header-row">
              <div>
                <h3 className="pdp-card-title">Operational Inventory &amp; Room Types</h3>
                <p className="pdp-card-subtitle">
                  PMS operational records configured by the property owner (Read-only for Platform Admin).
                </p>
              </div>
              <span className="pdp-readonly-pill">Read-Only PMS View</span>
            </div>

            {property.roomTypes && property.roomTypes.length > 0 ? (
              <div className="pdp-rooms-table-wrap">
                <table className="pdp-rooms-table">
                  <thead>
                    <tr>
                      <th>Room Type</th>
                      <th>Units</th>
                      <th>Base Rate</th>
                      <th>Max Occupancy</th>
                      <th>Features</th>
                    </tr>
                  </thead>
                  <tbody>
                    {property.roomTypes.map((rt, idx) => (
                      <tr key={idx}>
                        <td className="pdp-room-name-cell">
                          <strong>{rt.name || `Room Category #${idx + 1}`}</strong>
                        </td>
                        <td>{rt.count || rt.quantity || 1} Units</td>
                        <td className="pdp-tariff-cell">
                          ₹{Number(rt.price || rt.baseRate || property.baseRate).toLocaleString()} / night
                        </td>
                        <td>{rt.maxGuests || rt.maxAdults || 2} Guests</td>
                        <td>
                          {Array.isArray(rt.features)
                            ? rt.features.slice(0, 3).join(", ")
                            : rt.bedType || "Standard setup"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="pdp-single-inventory-box">
                <div className="pdp-single-inv-title">Standard Property Inventory</div>
                <div className="pdp-single-inv-desc">
                  Configured as {property.rooms} operational room unit(s) with base tariff of ₹{Number(property.baseRate).toLocaleString()} / night.
                </div>
              </div>
            )}

            {/* Amenities Section */}
            <div className="pdp-amenities-section">
              <h4 className="pdp-subheading">Registered Amenities</h4>
              {property.amenities && property.amenities.length > 0 ? (
                <div className="pdp-amenities-tags">
                  {property.amenities.map((item, idx) => (
                    <span key={idx} className="pdp-amenity-tag">
                      <FiCheckCircle size={12} />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <div className="pdp-amenities-tags">
                  {["High Speed WiFi", "Air Conditioning", "Free Parking", "Power Backup", "Complimentary Breakfast"].map((item, idx) => (
                    <span key={idx} className="pdp-amenity-tag">
                      <FiCheckCircle size={12} />
                      <span>{item}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Storefront & Integrations */}
        {activeTab === "storefront" && (
          <div className="pdp-grid">
            <div className="pdp-card">
              <h3 className="pdp-card-title">Direct Guest Storefront</h3>
              <p className="pdp-card-subtitle">
                Each property on StayOps receives a dedicated guest booking subdomain.
              </p>

              <div className="pdp-storefront-box">
                <div className="pdp-storefront-url">
                  <FiGlobe size={16} />
                  <span>{storefrontUrl}</span>
                </div>
                <a
                  href={storefrontUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="admin-btn admin-btn--primary pdp-storefront-open-btn"
                >
                  <span>Launch Live Storefront</span>
                  <FiExternalLink size={14} />
                </a>
              </div>

              <dl className="pdp-dlist" style={{ marginTop: "16px" }}>
                <div className="pdp-dlist-row">
                  <dt>Subdomain Slug</dt>
                  <dd className="pdp-mono">{property.slug}</dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>Booking Engine Status</dt>
                  <dd>
                    <span className="pdp-channel-badge pdp-channel-badge--active">
                      ● Active Direct Booking Engine
                    </span>
                  </dd>
                </div>
                <div className="pdp-dlist-row">
                  <dt>SSL Certificate</dt>
                  <dd>Managed automatically via StayOps Edge CDN</dd>
                </div>
              </dl>
            </div>

            <div className="pdp-card">
              <h3 className="pdp-card-title">Channel Manager &amp; OTA Sync</h3>
              <p className="pdp-card-subtitle">
                Two-way calendar synchronization for external distribution platforms.
              </p>

              <div className="pdp-ota-list">
                <div className="pdp-ota-item">
                  <div className="pdp-ota-info">
                    <strong>Airbnb</strong>
                    <span>2-way iCal / API Availability Sync</span>
                  </div>
                  <span className="pdp-channel-badge pdp-channel-badge--active">Connected</span>
                </div>

                <div className="pdp-ota-item">
                  <div className="pdp-ota-info">
                    <strong>Booking.com</strong>
                    <span>Rate parity &amp; reservation feed</span>
                  </div>
                  <span className="pdp-channel-badge pdp-channel-badge--ready">Ready</span>
                </div>

                <div className="pdp-ota-item">
                  <div className="pdp-ota-info">
                    <strong>Agoda / MakeMyTrip</strong>
                    <span>Direct API connector</span>
                  </div>
                  <span className="pdp-channel-badge pdp-channel-badge--ready">Standby</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Activity & Audit Log */}
        {activeTab === "audit" && (
          <div className="pdp-card">
            <h3 className="pdp-card-title">Administrative Activity &amp; Audit Log</h3>
            <p className="pdp-card-subtitle">
              Chronological log of administrative actions, compliance approvals, and status transitions.
            </p>

            {property.auditLog && property.auditLog.length > 0 ? (
              <div className="pdp-timeline">
                {property.auditLog.map((log) => (
                  <div key={log.id} className="pdp-timeline-item">
                    <div className="pdp-timeline-dot" />
                    <div className="pdp-timeline-content">
                      <div className="pdp-timeline-header">
                        <span className="pdp-timeline-action">{log.action}</span>
                        <span className="pdp-timeline-time">{log.timestamp}</span>
                      </div>
                      <div className="pdp-timeline-detail">{log.detail}</div>
                      <div className="pdp-timeline-actor">By {log.actorEmail}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="pdp-timeline">
                <div className="pdp-timeline-item">
                  <div className="pdp-timeline-dot" />
                  <div className="pdp-timeline-content">
                    <div className="pdp-timeline-header">
                      <span className="pdp-timeline-action">PROPERTY_REGISTERED</span>
                      <span className="pdp-timeline-time">{property.joinedDate || "Recent"}</span>
                    </div>
                    <div className="pdp-timeline-detail">
                      Property "{property.name}" registered under tenant account {property.ownerName}.
                    </div>
                    <div className="pdp-timeline-actor">By system</div>
                  </div>
                </div>

                <div className="pdp-timeline-item">
                  <div className="pdp-timeline-dot" />
                  <div className="pdp-timeline-content">
                    <div className="pdp-timeline-header">
                      <span className="pdp-timeline-action">STOREFRONT_CONFIGURED</span>
                      <span className="pdp-timeline-time">{property.joinedDate || "Recent"}</span>
                    </div>
                    <div className="pdp-timeline-detail">
                      Subdomain {property.slug}.stayops.in routed to direct guest booking engine.
                    </div>
                    <div className="pdp-timeline-actor">By system</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status Confirmation Modal */}
      <PropertyStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        property={property}
        onConfirm={handleConfirmToggleStatus}
      />
    </div>
  );
};

// Minimal Skeleton Loader
const PropertyDetailSkeleton = ({ onBack }) => (
  <div className="pdp-root">
    <div className="pdp-topbar">
      <button type="button" className="pdp-back-btn" onClick={onBack}>
        <FiArrowLeft size={15} /> Back to Properties
      </button>
    </div>
    <div className="pdp-hero pdp-hero--skeleton">
      <div className="pdp-hero-left">
        <div className="skeleton-box" style={{ width: 54, height: 54, borderRadius: 12 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="skeleton-box" style={{ width: 220, height: 24 }} />
          <div className="skeleton-box" style={{ width: 140, height: 16 }} />
        </div>
      </div>
    </div>
    <div className="pdp-kpis">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="pdp-kpi-card">
          <div className="skeleton-box" style={{ width: 80, height: 14, marginBottom: 8 }} />
          <div className="skeleton-box" style={{ width: 60, height: 28 }} />
        </div>
      ))}
    </div>
  </div>
);

export default PropertyDetailPage;
