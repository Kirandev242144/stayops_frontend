import React, { useState } from 'react';
import { 
  FiCheck, 
  FiTrash2, 
  FiChevronDown, 
  FiChevronUp, 
  FiAlertTriangle, 
  FiChevronLeft, 
  FiChevronRight 
} from 'react-icons/fi';

const FALLBACK_ROOM_IMAGE = "https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80";

function getEffectiveAvailableUnits(room, availability, checkIn, checkOut) {
  const totalBaseQty = Number(room.availableCount !== undefined ? room.availableCount : 1);
  if (!checkIn || !checkOut || !availability) return totalBaseQty;

  const searchIn = new Date(checkIn);
  const searchOut = new Date(checkOut);

  let bookedCount = 0;

  // 1. Check booked ranges
  if (Array.isArray(availability.bookedRanges)) {
    availability.bookedRanges.forEach(b => {
      if (!b.checkIn || !b.checkOut) return;
      const bIn = new Date(b.checkIn);
      const bOut = new Date(b.checkOut);

      // Overlap condition: searchIn < bOut && searchOut > bIn
      if (searchIn < bOut && searchOut > bIn) {
        const roomName = (room.name || '').toLowerCase().trim();
        const bUnit = (b.roomUnit || '').toLowerCase().trim();

        if (bUnit === roomName || bUnit === String(room.id).toLowerCase() || bUnit.includes(roomName) || roomName.includes(bUnit)) {
          bookedCount++;
        }
      }
    });
  }

  // 2. Check blocked ranges
  if (Array.isArray(availability.blockedRanges)) {
    availability.blockedRanges.forEach(b => {
      if (!b.startDate || !b.endDate) return;
      const bIn = new Date(b.startDate);
      const bOut = new Date(b.endDate);

      if (searchIn < bOut && searchOut > bIn) {
        const roomName = (room.name || '').toLowerCase().trim();
        const bId = (b.roomId || '').toLowerCase().trim();

        if (bId === 'all' || bId === roomName || bId === String(room.id).toLowerCase() || bId.includes(roomName) || roomName.includes(bId)) {
          bookedCount++;
        }
      }
    });
  }

  return Math.max(0, totalBaseQty - bookedCount);
}

export default function StorefrontRoomList({
  rooms,
  availability,
  checkIn,
  checkOut,
  selectedCart,
  totalGuests,
  nightCount,
  onAddToCart,
  onUpdateCartQty,
  onRemoveFromCart,
  onProceedToCheckout
}) {
  const [expandedInclusions, setExpandedInclusions] = useState({});
  const [photoIndices, setPhotoIndices] = useState({});

  const toggleInclusions = (roomId) => {
    setExpandedInclusions(prev => ({ ...prev, [roomId]: !prev[roomId] }));
  };

  const handlePrevPhoto = (roomId, photoCount) => {
    setPhotoIndices(prev => {
      const curr = prev[roomId] || 0;
      return { ...prev, [roomId]: curr === 0 ? photoCount - 1 : curr - 1 };
    });
  };

  const handleNextPhoto = (roomId, photoCount) => {
    setPhotoIndices(prev => {
      const curr = prev[roomId] || 0;
      return { ...prev, [roomId]: (curr + 1) % photoCount };
    });
  };

  // Calculate cart metrics
  const totalSelectedRooms = Object.values(selectedCart).reduce((sum, item) => sum + item.quantity, 0);
  const totalCapacityCovered = Object.values(selectedCart).reduce((sum, item) => sum + (item.room.maxGuests * item.quantity), 0);
  const totalEstCost = Object.values(selectedCart).reduce((sum, item) => sum + (item.room.ratePerNight * item.quantity * nightCount), 0);

  const hasCapacityShortfall = totalSelectedRooms > 0 && totalCapacityCovered < totalGuests;

  return (
    <div className="sf-rooms-section">
      <div className="sf-section-header">
        <div className="sf-section-subtitle">ROOMS AND SUITES</div>
        <h2 className="sf-section-title">The Art of meeting your highest expectations</h2>
        <div className="sf-section-help-text">
          Add rooms to cover {totalGuests} guest{totalGuests > 1 ? 's' : ''} — {rooms.length} room type{rooms.length !== 1 ? 's' : ''} available.
        </div>
      </div>

      <div className="sf-grid-layout">
        {/* LEFT COLUMN: ROOM CARDS */}
        <div>
          {rooms.map((rm) => {
            const cartItem = selectedCart[rm.id];
            const isSelected = cartItem && cartItem.quantity > 0;
            const currentPhotoIdx = photoIndices[rm.id] || 0;
            const photos = (rm.photos && rm.photos.length > 0) ? rm.photos : [FALLBACK_ROOM_IMAGE];
            
            const effectiveAvailable = getEffectiveAvailableUnits(rm, availability, checkIn, checkOut);
            const isSoldOut = effectiveAvailable <= 0;

            return (
              <div key={rm.id} className="sf-room-card">
                {/* Photo Carousel */}
                <div className="sf-room-photo-carousel">
                  <img 
                    src={photos[currentPhotoIdx] || photos[0] || FALLBACK_ROOM_IMAGE} 
                    alt={rm.name}
                    className="sf-room-photo"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_ROOM_IMAGE;
                    }}
                  />
                  {photos.length > 1 && (
                    <>
                      <button 
                        onClick={() => handlePrevPhoto(rm.id, photos.length)}
                        className="sf-room-carousel-btn sf-room-carousel-btn-prev"
                      >
                        <FiChevronLeft />
                      </button>
                      <button 
                        onClick={() => handleNextPhoto(rm.id, photos.length)}
                        className="sf-room-carousel-btn sf-room-carousel-btn-next"
                      >
                        <FiChevronRight />
                      </button>
                    </>
                  )}
                </div>

                {/* Card Body */}
                <div className="sf-room-card-content">
                  <div>
                    <div className="sf-room-header-row">
                      <div>
                        <h3 className="sf-room-title">{rm.name}</h3>
                        {isSelected && (
                          <span className="sf-room-badge-selected">
                            {cartItem.quantity} SELECTED
                          </span>
                        )}
                        {isSoldOut && (
                          <span className="sf-room-badge-selected" style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5' }}>
                            SOLD OUT FOR SELECTED DATES
                          </span>
                        )}
                      </div>

                      <div className="sf-room-price-box">
                        <div className="sf-price-label">FROM</div>
                        <div className="sf-price-val">₹{rm.ratePerNight.toLocaleString()}</div>
                        <div className="sf-price-unit">/ night</div>
                      </div>
                    </div>

                    <div className="sf-room-metrics">
                      {rm.beds} bed{rm.beds > 1 ? 's' : ''} · Sleeps up to {rm.maxGuests} · {isSoldOut ? '0 units available for selected dates' : effectiveAvailable > 1 ? `${effectiveAvailable} units available` : '1 unit available'}
                    </div>

                    <p className="sf-room-desc-text">
                      {rm.description}
                    </p>

                    {/* Room Amenities */}
                    {Array.isArray(rm.amenities) && rm.amenities.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '8px 0 12px 0' }}>
                        {rm.amenities.map((am, aIdx) => (
                          <span 
                            key={aIdx} 
                            style={{ 
                              background: '#F4F4F5', 
                              color: '#18181B', 
                              border: '1px solid #E4E4E7',
                              padding: '3px 10px', 
                              borderRadius: '9999px', 
                              fontSize: '0.74rem', 
                              fontWeight: 500,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <FiCheck size={11} style={{ color: '#18181B' }} /> {am}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* What's included Accordion */}
                    <div>
                      <button 
                        onClick={() => toggleInclusions(rm.id)}
                        className="sf-inclusions-toggle-btn"
                      >
                        What's included {expandedInclusions[rm.id] ? <FiChevronUp /> : <FiChevronDown />}
                      </button>

                      {expandedInclusions[rm.id] && (
                        <div className="sf-inclusions-chips">
                          {rm.inclusions.map((inc, i) => (
                            <span key={i} className="sf-chip">
                              <FiCheck className="sf-chip-icon" /> {inc}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="sf-room-actions">
                    {!isSelected ? (
                      <button 
                        className="sf-add-room-btn"
                        disabled={isSoldOut}
                        style={isSoldOut ? { opacity: 0.5, cursor: 'not-allowed', background: '#94a3b8' } : {}}
                        onClick={() => !isSoldOut && onAddToCart(rm)}
                      >
                        {isSoldOut ? 'SOLD OUT' : 'ADD'}
                      </button>
                    ) : (
                      <div className="sf-qty-stepper">
                        <span className="sf-qty-label">ROOMS</span>
                        <button 
                          type="button"
                          className="sf-stepper-btn"
                          onClick={() => onUpdateCartQty(rm.id, cartItem.quantity - 1)}
                        >
                          -
                        </button>
                        <span>{cartItem.quantity}</span>
                        <button 
                          type="button"
                          className="sf-stepper-btn"
                          disabled={cartItem.quantity >= effectiveAvailable}
                          onClick={() => onUpdateCartQty(rm.id, Math.min(effectiveAvailable, cartItem.quantity + 1))}
                        >
                          +
                        </button>
                      </div>
                    )}

                    <span className="sf-room-pricing-detail-link">
                      Pricing details
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: STICKY SELECTION CART SIDEBAR */}
        <div className="sf-cart-sidebar">
          <div className="sf-cart-title">YOUR SELECTION</div>
          
          {totalSelectedRooms === 0 ? (
            <div className="sf-cart-empty">
              <div className="sf-cart-empty-title">No rooms yet</div>
              <div className="sf-cart-empty-text">Add rooms from the list to build your stay.</div>
            </div>
          ) : (
            <>
              <div className="sf-cart-count-heading">
                {totalSelectedRooms} room{totalSelectedRooms > 1 ? 's' : ''}
              </div>

              {/* Cart Items */}
              {Object.values(selectedCart).map(({ room, quantity }) => (
                <div key={room.id} className="sf-cart-item">
                  <div className="sf-cart-item-header">
                    <span className="sf-cart-item-title">{room.name}</span>
                    <button 
                      onClick={() => onRemoveFromCart(room.id)}
                      className="sf-cart-item-delete-btn"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                  <div className="sf-cart-item-sub">
                    Sleeps {room.maxGuests} each · ₹{room.ratePerNight.toLocaleString()} / night
                  </div>

                  <div className="sf-cart-item-stepper-row">
                    <button 
                      className="sf-stepper-btn"
                      onClick={() => onUpdateCartQty(room.id, quantity - 1)}
                    >
                      -
                    </button>
                    <span className="sf-cart-item-qty-text">{quantity}</span>
                    <button 
                      className="sf-stepper-btn"
                      disabled={quantity >= room.availableCount}
                      onClick={() => onUpdateCartQty(room.id, Math.min(room.availableCount, quantity + 1))}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}

              {/* Capacity Indicator & Smart Alert */}
              <div className="sf-cart-pricing-summary">
                <div className="sf-cart-pricing-row">
                  <span className="sf-cart-pricing-label">Sleeps up to</span>
                  <span className="sf-cart-pricing-val">{totalCapacityCovered} guests</span>
                </div>
                <div className="sf-cart-pricing-row">
                  <span className="sf-cart-pricing-label">Est. {nightCount} night{nightCount > 1 ? 's' : ''}</span>
                  <span className="sf-cart-pricing-val-primary">₹{totalEstCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Smart Capacity Shortfall Alert */}
              {hasCapacityShortfall && (
                <div className="sf-capacity-warning-banner">
                  <div className="sf-cart-alert-header">
                    <FiAlertTriangle /> Guest Capacity Alert
                  </div>
                  Your selection ({totalSelectedRooms} room{totalSelectedRooms > 1 ? 's' : ''}) sleeps up to {totalCapacityCovered} guests, but you have {totalGuests}. Add another room or choose a larger type.
                </div>
              )}

              {/* CONTINUE TO REQUEST CTA BUTTON */}
              <button 
                className="sf-checkout-btn"
                onClick={onProceedToCheckout}
              >
                CONTINUE TO REQUEST
              </button>
            </>
          )}
        </div>
      </div>

      {/* MOBILE STICKY FLOATING BOTTOM CART BAR */}
      {totalSelectedRooms > 0 && (
        <div className="sf-mobile-floating-cart-bar">
          <div className="sf-mobile-cart-info">
            <span className="sf-mobile-cart-count">{totalSelectedRooms} Room{totalSelectedRooms > 1 ? 's' : ''} Selected</span>
            <span className="sf-mobile-cart-price">₹{totalEstCost.toLocaleString()} ({nightCount} night{nightCount > 1 ? 's' : ''})</span>
          </div>

          <button className="sf-mobile-cart-checkout-btn" onClick={onProceedToCheckout}>
            CHECKOUT ({totalSelectedRooms})
          </button>
        </div>
      )}
    </div>
  );
}
