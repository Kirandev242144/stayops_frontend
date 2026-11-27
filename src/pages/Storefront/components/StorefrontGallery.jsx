import React, { useState } from 'react';
import { FiImage, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

export default function StorefrontGallery({ gallery = [], propertyName = "Property" }) {
  const photos = Array.isArray(gallery) && gallery.length > 0 ? gallery : [FALLBACK_PHOTO];
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(null);

  const prevPhoto = (e) => {
    e.stopPropagation();
    setLightboxIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const nextPhoto = (e) => {
    e.stopPropagation();
    setLightboxIndex(prev => (prev + 1) % photos.length);
  };

  return (
    <section className="sf-gallery-section" style={{ padding: '60px 24px', background: '#FAFAFA' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div className="sf-section-header" style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div className="sf-section-subtitle" style={{ letterSpacing: '1px', textTransform: 'uppercase', fontSize: '0.8rem', color: '#64748B', fontWeight: 700 }}>
            EXPLORE THE PROPERTY
          </div>
          <h2 className="sf-section-title" style={{ fontSize: '2rem', fontFamily: 'serif', color: '#111827', margin: '6px 0 0' }}>
            Photo Gallery
          </h2>
        </div>

        {/* GALLERY GRID */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: photos.length > 1 ? 'repeat(auto-fit, minmax(280px, 1fr))' : '1fr',
            gap: '16px',
            borderRadius: '16px',
            overflow: 'hidden'
          }}
        >
          {photos.slice(0, 6).map((imgUrl, idx) => (
            <div 
              key={idx}
              onClick={() => openLightbox(idx)}
              style={{
                position: 'relative',
                height: photos.length === 1 ? '420px' : '260px',
                borderRadius: '12px',
                overflow: 'hidden',
                cursor: 'pointer',
                background: '#1E293B'
              }}
              className="sf-gallery-card"
            >
              <img 
                src={imgUrl || FALLBACK_PHOTO} 
                alt={`${propertyName} photo ${idx + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.4s ease'
                }}
                onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_PHOTO; }}
              />
              
              {/* Overlay on hover */}
              <div 
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(0,0,0,0.25)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF'
                }}
                className="sf-gallery-overlay"
              >
                <FiImage size={24} />
              </div>

              {/* More photos badge on last image if total > 6 */}
              {idx === 5 && photos.length > 6 && (
                <div 
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(17, 24, 39, 0.75)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1.2rem'
                  }}
                >
                  <FiImage size={28} style={{ marginBottom: 6 }} />
                  +{photos.length - 6} More Photos
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxIndex !== null && (
        <div 
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(11, 15, 25, 0.95)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px'
          }}
        >
          <button
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '24px',
              right: '24px',
              background: 'rgba(255,255,255,0.15)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: '20px'
            }}
          >
            <FiX />
          </button>

          {photos.length > 1 && (
            <>
              <button
                onClick={prevPhoto}
                style={{
                  position: 'absolute',
                  left: '24px',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <FiChevronLeft size={24} />
              </button>

              <button
                onClick={nextPhoto}
                style={{
                  position: 'absolute',
                  right: '24px',
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#FFFFFF',
                  borderRadius: '50%',
                  width: '48px',
                  height: '48px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer'
                }}
              >
                <FiChevronRight size={24} />
              </button>
            </>
          )}

          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', textAlign: 'center' }}>
            <img 
              src={photos[lightboxIndex] || FALLBACK_PHOTO} 
              alt={`${propertyName} slide`}
              style={{
                maxWidth: '100%',
                maxHeight: '80vh',
                borderRadius: '8px',
                objectFit: 'contain',
                boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
              }}
              onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_PHOTO; }}
            />
            <div style={{ color: '#94A3B8', marginTop: '12px', fontSize: '0.9rem', fontWeight: 600 }}>
              {propertyName} — {lightboxIndex + 1} of {photos.length}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
