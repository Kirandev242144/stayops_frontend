import React from 'react';
import { FiMapPin } from 'react-icons/fi';
import { normalizeImageUrl } from '../storefrontApi';

export default function StorefrontAbout({ property }) {
  if (!property) return null;

  const FALLBACK_ABOUT_IMAGE = "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80";

  const customAboutImg = property.themeConfig?.aboutImage || property.aboutImage;
  const rawDefaultImg = property.gallery && property.gallery.length > 1
    ? property.gallery[1]
    : (property.gallery?.[0] || property.coverPhoto || property.photo || property.rooms?.[0]?.photos?.[0]);

  const aboutImage = (customAboutImg && customAboutImg.length > 5)
    ? normalizeImageUrl(customAboutImg)
    : (normalizeImageUrl(rawDefaultImg) || FALLBACK_ABOUT_IMAGE);

  const locationText = property.address || property.location || (property.city ? `${property.city}, ${property.state || ''}` : 'Prime Scenic Location');

  const defaultDescription = `Welcome to ${property.name}. Nestled in ${locationText}, our property offers an unforgettably tranquil escape combining authentic hospitality, modern comfort, and thoughtful amenities designed for relaxing getaways. Whether you are traveling for leisure or business, experience true relaxation in our thoughtfully curated rooms and spaces.`;

  const customText = property.themeConfig?.aboutText || property.aboutText;
  const propertyStory = (customText && customText.trim().length > 0)
    ? customText
    : ((property.description && property.description.trim().length > 10)
        ? property.description
        : defaultDescription);

  const customHeading = property.themeConfig?.aboutHeading || property.aboutHeading;
  const headingTitle = (customHeading && customHeading.trim().length > 0)
    ? customHeading
    : `Discover ${property.name}`;

  return (
    <section id="about" className="sf-about-section" aria-labelledby="sf-about-heading">
      <div className="sf-about-container">
        {/* LEFT COLUMN: TEXT CONTENT FOR SEO */}
        <div className="sf-about-text-col">
          <span className="sf-about-badge">
            <FiMapPin className="sf-about-badge-icon" /> ABOUT OUR PROPERTY
          </span>

          <h2 id="sf-about-heading" className="sf-about-title">
            {headingTitle}
          </h2>

          <p className="sf-about-location-tagline">
            Located in {locationText}
          </p>

          <div className="sf-about-description-body">
            <p className="sf-about-paragraph">{propertyStory}</p>
          </div>
        </div>

        {/* RIGHT COLUMN: SEO OPTIMIZED IMAGE FRAME */}
        <div className="sf-about-image-col">
          <div className="sf-about-image-wrapper">
            <img 
              src={aboutImage} 
              alt={`${property.name} - Luxury Property Experience in ${locationText}`}
              className="sf-about-img"
              loading="lazy"
            />
            <div className="sf-about-image-badge">
              <span className="sf-about-badge-title">{property.name}</span>
              <span className="sf-about-badge-sub">Bespoke Hospitality</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
