import React, { useState } from 'react';
import { FiX } from 'react-icons/fi';
import { normalizeImageUrl } from '../storefrontApi';

export default function StorefrontHero({ property, onBrowseClick }) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!property) return null;

  const FALLBACK_HERO = "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

  const firstRoomPhoto = property.rooms && property.rooms.length > 0 
    ? property.rooms.find(r => Array.isArray(r.photos) && r.photos.length > 0)?.photos[0]
    : null;

  const customHero = normalizeImageUrl(property.themeConfig?.heroImage || property.heroImage);
  const cover = normalizeImageUrl(property.coverPhoto);
  const firstGallery = property.gallery && property.gallery.length > 0 ? normalizeImageUrl(property.gallery[0]) : null;

  const bgPhoto = (customHero && typeof customHero === 'string' && customHero.length > 5)
    ? customHero
    : ((cover && typeof cover === 'string' && cover.length > 5)
      ? cover
      : (firstGallery 
          ? firstGallery 
          : (normalizeImageUrl(firstRoomPhoto) || FALLBACK_HERO)));

  return (
    <>
      <div 
        className="sf-hero"
        style={{ backgroundImage: `url(${bgPhoto || FALLBACK_HERO})` }}
      >
        <div className="sf-hero-overlay" />
        <div className="sf-hero-content">
          <h1 className="sf-hero-title">{property.name}</h1>
          <p className="sf-hero-tagline">
            {property.themeConfig?.tagline || "Most of the resort rooms are specially designed with sea, garden and pool view."}
          </p>

          <div className="sf-hero-actions-row">
            <button 
              className="sf-hero-browse-btn" 
              onClick={onBrowseClick}
            >
              BOOK NOW
            </button>
          </div>
        </div>
      </div>

      {/* Photo Gallery Lightbox Modal */}
      {isGalleryOpen && (
        <div className="sf-modal-backdrop" onClick={() => setIsGalleryOpen(false)}>
          <div className="sf-modal-box sf-lightbox-modal" onClick={e => e.stopPropagation()}>
            <div className="sf-lightbox-header">
              <h3 className="sf-lightbox-title">{property.name} Photo Gallery</h3>
              <button onClick={() => setIsGalleryOpen(false)} className="sf-lightbox-close">
                <FiX />
              </button>
            </div>

            <div className="sf-lightbox-main-box">
              <img 
                src={property.gallery[activePhotoIdx]} 
                alt={`Property Photo ${activePhotoIdx + 1}`}
                className="sf-lightbox-main-img"
              />
            </div>

            <div className="sf-lightbox-thumbs-row">
              {property.gallery.map((imgUrl, idx) => (
                <img
                  key={idx}
                  src={imgUrl}
                  alt={`Thumbnail ${idx + 1}`}
                  onClick={() => setActivePhotoIdx(idx)}
                  className={`sf-lightbox-thumb ${activePhotoIdx === idx ? 'sf-lightbox-thumb-active' : ''}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
