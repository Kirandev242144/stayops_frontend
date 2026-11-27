import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { 
  fetchPublicPropertyDetails, 
  extractSubdomainOrSlug, 
  createDirectGuestBooking,
  fetchPropertyAvailability,
  normalizeImageUrl
} from './storefrontApi';
import StorefrontHero from './components/StorefrontHero';
import StorefrontAbout from './components/StorefrontAbout';
import StorefrontSearchWidget from './components/StorefrontSearchWidget';
import StorefrontRoomList from './components/StorefrontRoomList';
import StorefrontAmenities from './components/StorefrontAmenities';
import StorefrontPolicies from './components/StorefrontPolicies';
import StorefrontGallery from './components/StorefrontGallery';
import StorefrontCheckoutModal from './components/StorefrontCheckoutModal';
import StorefrontCheckoutPage from './components/StorefrontCheckoutPage';
import StorefrontVoucherModal from './components/StorefrontVoucherModal';
import { TEMPLATE_MAP } from './templates';
import './Storefront.css';

export default function Storefront() {
  const { propertyId, slug } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [property, setProperty] = useState(null);
  const [availability, setAvailability] = useState({ bookedRanges: [], blockedRanges: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Active tab: 'home' or 'rooms'
  const [activeTab, setActiveTab] = useState(() => {
    return location.pathname.endsWith('/rooms') ? 'rooms' : 'home';
  });

  // Date & Guest State
  const [checkIn, setCheckIn] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [checkOut, setCheckOut] = useState(() => {
    const tmr = new Date();
    tmr.setDate(tmr.getDate() + 1);
    return tmr.toISOString().split('T')[0];
  });
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);

  // Cart & Modal State
  const [selectedCart, setSelectedCart] = useState({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const roomsSectionRef = useRef(null);

  // Track scroll position for transparent navbar (switches to solid white on scroll)
  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY || document.documentElement.scrollTop || window.pageYOffset || 0;
      setIsScrolled(scrollPos > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync activeTab with route path
  useEffect(() => {
    setActiveTab(location.pathname.endsWith('/rooms') ? 'rooms' : 'home');
  }, [location.pathname]);

  // Load property details based on route parameter or subdomain
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const targetSlugOrId =
      propertyId ||
      slug ||
      queryParams.get('property') ||
      queryParams.get('propertyId') ||
      queryParams.get('id') ||
      queryParams.get('slug') ||
      extractSubdomainOrSlug() ||
      '33';

    console.log("[Storefront] Loading target:", targetSlugOrId);

    setIsLoading(true);
    fetchPublicPropertyDetails(targetSlugOrId).then(data => {
      console.log("[Storefront] Loaded data:", data?.id, data?.name);
      setProperty(data);
      setIsLoading(false);
      if (data?.id) {
        fetchPropertyAvailability(data.id).then(setAvailability).catch(console.warn);
      }
    }).catch(err => {
      console.error("Failed to load storefront property:", err);
      setIsLoading(false);
    });
  }, [propertyId, slug, location.search]);

  const queryParams = new URLSearchParams(location.search);
  const isEditor = queryParams.get('editor') === 'true' || queryParams.get('preview') === 'true' || (typeof window !== 'undefined' && window.self !== window.top);

  const handleSectionClick = (sectionName) => {
    if (isEditor && window.parent && window.parent !== window) {
      window.parent.postMessage({
        type: 'STOREFRONT_SECTION_SELECTED',
        section: sectionName
      }, window.location.origin);
    }
  };

  // Listen for live theme preview updates from Storefront Studio editor
  useEffect(() => {
    const handlePreviewMessage = (event) => {
      // Verify origin to prevent unauthorized external cross-origin message injection
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'STOREFRONT_PREVIEW_UPDATE') {
        const { themeConfig } = event.data;
        if (themeConfig) {
          setProperty(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              amenities: themeConfig.amenities !== undefined ? themeConfig.amenities : prev.amenities,
              themeConfig: {
                ...prev.themeConfig,
                ...themeConfig
              }
            };
          });
        }
      }
    };
    window.addEventListener('message', handlePreviewMessage);
    return () => window.removeEventListener('message', handlePreviewMessage);
  }, []);

  // Refetch availability when check-in/out dates or property changes
  useEffect(() => {
    if (property?.id) {
      fetchPropertyAvailability(property.id).then(setAvailability).catch(console.warn);
    }
  }, [property?.id, checkIn, checkOut]);

  // Sync route path changes (/rooms vs /)
  useEffect(() => {
    if (location.pathname.endsWith('/rooms')) {
      setActiveTab('rooms');
    } else {
      setActiveTab('home');
    }
  }, [location.pathname]);

  // Calculate nights
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.max(0, end - start);
  const nightCount = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Navigation handlers
  const navigateToHome = () => {
    setActiveTab('home');
    const currentPath = location.pathname;
    if (currentPath.endsWith('/rooms')) {
      const base = currentPath.replace(/\/rooms$/, '') || '/';
      navigate(base);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToRooms = () => {
    setActiveTab('rooms');
    const currentPath = location.pathname;
    if (!currentPath.endsWith('/rooms')) {
      const base = currentPath === '/' ? '/rooms' : `${currentPath.replace(/\/$/, '')}/rooms`;
      navigate(base);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cart actions
  const handleAddToCart = (room) => {
    setSelectedCart(prev => ({
      ...prev,
      [room.id]: {
        room,
        quantity: 1
      }
    }));
  };

  const handleUpdateCartQty = (roomId, newQty) => {
    if (newQty <= 0) {
      handleRemoveFromCart(roomId);
      return;
    }
    setSelectedCart(prev => ({
      ...prev,
      [roomId]: {
        ...prev[roomId],
        quantity: newQty
      }
    }));
  };

  const handleRemoveFromCart = (roomId) => {
    setSelectedCart(prev => {
      const copy = { ...prev };
      delete copy[roomId];
      return copy;
    });
  };

  const handleCreateBooking = async (bookingData) => {
    const result = await createDirectGuestBooking(bookingData);
    setIsCheckoutOpen(false);
    setSelectedCart({});
    setConfirmedBooking({
      ...bookingData,
      id: result.id || Math.floor(1000 + Math.random() * 9000)
    });
  };

  if (isLoading) {
    return (
      <div className="sf-loading-wrapper">
        <div className="sf-spinner" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="sf-not-found-wrapper">
        <div className="sf-not-found-card">
          <h2 className="sf-not-found-title">Property Storefront Not Found</h2>
          <p className="sf-not-found-subtitle">Please check the property address or subdomain.</p>
        </div>
      </div>
    );
  }

  // Inject primary & secondary theme colors dynamically via CSS variables
  const primaryColor = property.themeConfig?.primaryColor || '#111827';
  const secondaryColor = property.themeConfig?.secondaryColor || '#C5A059';
  const activeTemplateKey = property.themeConfig?.template || 'minimalist';
  const TemplateComponent = TEMPLATE_MAP[activeTemplateKey] || TEMPLATE_MAP.minimalist;

  return (
    <TemplateComponent primaryColor={primaryColor} secondaryColor={secondaryColor}>
      {/* FLOATING HEADER NAVBAR (SMART LOGIC MACHINE: AUTO / TRANSPARENT / SOLID WHITE) */}
      {!isCheckoutOpen && (() => {
        const customLogo = normalizeImageUrl(property?.themeConfig?.logoImage || property?.logoImage);
        const configuredStyle = property?.themeConfig?.navbarStyle || 'auto';

        // LOGIC MACHINE:
        // 1. When scrolled down (scrollY > 30) -> Always Solid White background with black text
        // 2. When at top:
        //    - Explicit 'solid_white' -> Solid White background
        //    - Explicit 'transparent' -> Clean Transparent floating header
        //    - 'auto' (Smart Mode) -> Solid White if custom logo uploaded, Clean Transparent if default symbol
        const isWhiteHeader = 
          isScrolled || 
          configuredStyle === 'solid_white' || 
          (configuredStyle === 'auto' && Boolean(customLogo));

        return (
          <nav 
            className={`sf-navbar ${isWhiteHeader ? 'sf-navbar-scrolled' : 'sf-navbar-transparent'} ${isEditor ? 'sf-editable-section' : ''}`}
            onClick={isEditor ? (e) => { e.stopPropagation(); handleSectionClick('navbar'); } : undefined}
          >
            {isEditor && (
              <div className="sf-editor-badge">
                <span>Edit Brand &amp; Colors</span>
              </div>
            )}
            <div className="sf-navbar-container">
              <div className="sf-logo-group" onClick={navigateToHome} style={{ cursor: 'pointer' }}>
                {customLogo ? (
                  <img 
                    src={customLogo} 
                    alt={property.name} 
                    className="sf-custom-logo-img" 
                  />
                ) : (
                  <div className="sf-logo-badge">{property.name.charAt(0)}</div>
                )}
                <span className="sf-logo-title">{property.name}</span>
              </div>

              <ul className="sf-nav-links sf-desktop-nav">
                <li 
                  className={`sf-nav-link ${activeTab === 'home' ? 'active' : ''}`}
                  onClick={navigateToHome}
                >
                  HOME
                </li>
                <li 
                  className={`sf-nav-link ${activeTab === 'rooms' ? 'active' : ''}`}
                  onClick={navigateToRooms}
                >
                  ROOMS &amp; COTTAGES
                </li>
                <li className="sf-nav-link" onClick={() => {
                  const polEl = document.querySelector('.sf-policies-section');
                  if (polEl) polEl.scrollIntoView({ behavior: 'smooth' });
                }}>
                  POLICIES
                </li>
              </ul>

              <div className="sf-nav-actions-group sf-desktop-nav">
                <button className="sf-nav-btn" onClick={navigateToRooms}>
                  BROWSE ROOMS
                </button>
                <button className="sf-nav-admin-btn" onClick={() => navigate('/login')}>
                  ADMIN LOGIN
                </button>
              </div>

              {/* Mobile Hamburger Toggle Button */}
              <button 
                className="sf-mobile-hamburger-btn" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle Navigation Menu"
              >
                {isMobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>

            {/* Mobile Navigation Drawer / Dropdown */}
            {isMobileMenuOpen && (
              <div className="sf-mobile-menu-drawer">
                <ul className="sf-mobile-nav-list">
                  <li 
                    className={`sf-mobile-nav-item ${activeTab === 'home' ? 'active' : ''}`}
                    onClick={() => { navigateToHome(); setIsMobileMenuOpen(false); }}
                  >
                    HOME
                  </li>
                  <li 
                    className={`sf-mobile-nav-item ${activeTab === 'rooms' ? 'active' : ''}`}
                    onClick={() => { navigateToRooms(); setIsMobileMenuOpen(false); }}
                  >
                    ROOMS &amp; COTTAGES
                  </li>
                  <li 
                    className="sf-mobile-nav-item" 
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      const polEl = document.querySelector('.sf-policies-section');
                      if (polEl) polEl.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    POLICIES
                  </li>
                </ul>

                <div className="sf-mobile-menu-actions">
                  <button 
                    className="sf-nav-btn sf-mobile-action-btn" 
                    onClick={() => { navigateToRooms(); setIsMobileMenuOpen(false); }}
                  >
                    BROWSE ROOMS
                  </button>
                  <button 
                    className="sf-nav-admin-btn sf-mobile-admin-btn" 
                    onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }}
                  >
                    ADMIN LOGIN
                  </button>
                </div>
              </div>
            )}
          </nav>
        );
      })()}

      {/* INNER CHECKOUT PAGE VIEW (2-STEP BACK & NEXT) */}
      {isCheckoutOpen ? (
        <StorefrontCheckoutPage 
          property={property}
          selectedCart={selectedCart}
          checkIn={checkIn}
          checkOut={checkOut}
          nightCount={nightCount}
          adults={adults}
          childrenCount={childrenCount}
          onBack={() => setIsCheckoutOpen(false)}
          onSubmitBooking={handleCreateBooking}
        />
      ) : (
        <>
          {/* HOME PAGE VIEW (/) */}
          {activeTab === 'home' && (
            <>
              <div 
                className={isEditor ? 'sf-editable-section' : ''}
                onClick={isEditor ? (e) => { e.stopPropagation(); handleSectionClick('hero'); } : undefined}
              >
                {isEditor && (
                  <div className="sf-editor-badge">
                    <span>✏️ Edit Headline & Hero Photo</span>
                  </div>
                )}
                <StorefrontHero 
                  property={property} 
                  onBrowseClick={navigateToRooms} 
                />
              </div>

              {/* PROPERTY ABOUT & STORY SECTION (SEO OPTIMIZED) */}
              <div 
                className={isEditor ? 'sf-editable-section' : ''}
                onClick={isEditor ? (e) => { e.stopPropagation(); handleSectionClick('about'); } : undefined}
              >
                {isEditor && (
                  <div className="sf-editor-badge">
                    <span>✏️ Edit Story & Description</span>
                  </div>
                )}
                <StorefrontAbout property={property} />
              </div>

              {/* PROPERTY PHOTO GALLERY */}
              <StorefrontGallery 
                gallery={property.gallery} 
                propertyName={property.name} 
              />

              {/* PROPERTY AMENITIES */}
              <div 
                className={isEditor ? 'sf-editable-section' : ''}
                onClick={isEditor ? (e) => { e.stopPropagation(); handleSectionClick('amenities'); } : undefined}
              >
                {isEditor && (
                  <div className="sf-editor-badge">
                    <span>✏️ Edit Amenities ({property.amenities?.length || 0})</span>
                  </div>
                )}
                <StorefrontAmenities 
                  amenities={property.amenities} 
                  isEditor={isEditor}
                  onSectionClick={() => handleSectionClick('amenities')}
                />
              </div>

              {/* HOUSE POLICIES */}
              <div 
                className={isEditor ? 'sf-editable-section' : ''}
                onClick={isEditor ? (e) => { e.stopPropagation(); handleSectionClick('policies'); } : undefined}
              >
                {isEditor && (
                  <div className="sf-editor-badge">
                    <span>✏️ House Policies</span>
                  </div>
                )}
                <StorefrontPolicies property={property} />
              </div>
            </>
          )}

          {/* ROOMS & COTTAGES PAGE VIEW (/rooms) */}
          {activeTab === 'rooms' && (
            <>
              <div className="sf-rooms-header-banner">
                <div className="sf-rooms-header-container">
                  <span className="sf-rooms-banner-subtitle">ACCOMMODATIONS & AVAILABILITY</span>
                  <h1 className="sf-rooms-banner-title">Choose Your Stay</h1>
                  <p className="sf-rooms-banner-desc">Select your dates, guests, and explore available rooms & cottages at {property.name}</p>
                </div>
              </div>

              {/* FLOATING SEARCH WIDGET / EDIT STAY */}
              <div style={{ marginTop: '-40px', position: 'relative', zIndex: 10 }}>
                <StorefrontSearchWidget 
                  checkIn={checkIn}
                  checkOut={checkOut}
                  adults={adults}
                  childrenCount={childrenCount}
                  onCheckInChange={setCheckIn}
                  onCheckOutChange={setCheckOut}
                  onAdultsChange={setAdults}
                  onChildrenChange={setChildrenCount}
                  onSearchSubmit={() => {
                    if (roomsSectionRef.current) {
                      roomsSectionRef.current.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                />
              </div>

              {/* 2-COLUMN ROOM SELECTION GRID */}
              <div ref={roomsSectionRef}>
                <StorefrontRoomList 
                  rooms={property.rooms}
                  availability={availability}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  selectedCart={selectedCart}
                  totalGuests={adults + childrenCount}
                  nightCount={nightCount}
                  onAddToCart={handleAddToCart}
                  onUpdateCartQty={handleUpdateCartQty}
                  onRemoveFromCart={handleRemoveFromCart}
                  onProceedToCheckout={() => {
                    setIsCheckoutOpen(true);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>

              {/* HOUSE POLICIES */}
              <StorefrontPolicies property={property} />
            </>
          )}
        </>
      )}

      {/* VOUCHER CONFIRMATION MODAL */}
      {confirmedBooking && (
        <StorefrontVoucherModal 
          booking={confirmedBooking}
          property={property}
          onClose={() => setConfirmedBooking(null)}
        />
      )}
    </TemplateComponent>
  );
}

