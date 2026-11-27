import React, { useState, useEffect, useRef } from 'react';
import { 
  FiMonitor, 
  FiSmartphone, 
  FiTablet, 
  FiExternalLink, 
  FiCopy, 
  FiCheck, 
  FiSave, 
  FiLock,
  FiChevronDown,
  FiChevronUp,
  FiLayers,
  FiDroplet,
  FiGlobe,
  FiUploadCloud,
  FiTrash2,
  FiImage
} from 'react-icons/fi';
import { fetchProperties } from '../Reservations/propertyApi';
import { API_BASE_URL } from '../../../config/api';
import { getStorefrontUrl, fetchOwnerStorefrontSettings, saveOwnerStorefrontSettings, normalizeImageUrl } from '../../Storefront/storefrontApi';
import StorefrontHeroModal from './StorefrontHeroModal';
import StorefrontAboutModal from './StorefrontAboutModal';
import StorefrontAmenitiesModal from './StorefrontAmenitiesModal';
import { toast } from 'react-toastify';
import './StorefrontStudio.css';

const DEFAULT_TEMPLATE = 'minimalist';
const DEFAULT_PRESET = 'slate';
const DEFAULT_PRIMARY_COLOR = '#111827';
const DEFAULT_SECONDARY_COLOR = '#C5A059';
const MAX_HERO_IMAGE_SIZE = 8 * 1024 * 1024;

const DEFAULT_FORM_DATA = {
  subdomain: '',
  template: DEFAULT_TEMPLATE,
  preset: DEFAULT_PRESET,
  primaryColor: DEFAULT_PRIMARY_COLOR,
  secondaryColor: DEFAULT_SECONDARY_COLOR,
  tagline: '',
  heroImage: '',
  aboutHeading: '',
  aboutText: '',
  aboutImage: '',
  amenities: [],
  logoImage: '',
  navbarStyle: 'auto'
};

const DEFAULT_OPEN_SECTIONS = {
  branding: false,
  header: true,
  colors: false,
  domain: false,
  content: false
};

const PRESET_COLORS = {
  slate: {
    primaryColor: DEFAULT_PRIMARY_COLOR,
    secondaryColor: DEFAULT_SECONDARY_COLOR
  },
  emerald: {
    primaryColor: '#2C533F',
    secondaryColor: '#D4AF37'
  },
  burgundy: {
    primaryColor: '#6B1D2F',
    secondaryColor: DEFAULT_SECONDARY_COLOR
  },
  azure: {
    primaryColor: '#0F4C81',
    secondaryColor: '#F0A500'
  }
};

function createSubdomain(propertyName) {
  return String(propertyName || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function pickString(...values) {
  const value = values.find(
    item => typeof item === 'string' && item.trim().length > 0
  );

  return value ? value.trim() : '';
}

function parseOperationsTheme(operations) {
  if (!operations?.themeConfig) {
    return {};
  }

  try {
    return typeof operations.themeConfig === 'string'
      ? JSON.parse(operations.themeConfig)
      : operations.themeConfig;
  } catch {
    return {};
  }
}

function buildFormData(property, operationsTheme = {}, storefrontSettings = {}) {
  return {
    ...DEFAULT_FORM_DATA,
    subdomain: pickString(
      storefrontSettings.subdomain,
      operationsTheme.subdomain,
      createSubdomain(property?.name)
    ),
    template: pickString(
      storefrontSettings.template,
      operationsTheme.template
    ) || DEFAULT_TEMPLATE,
    preset: pickString(
      storefrontSettings.preset,
      operationsTheme.preset
    ) || DEFAULT_PRESET,
    primaryColor: pickString(
      storefrontSettings.primaryColor,
      operationsTheme.primaryColor
    ) || DEFAULT_PRIMARY_COLOR,
    secondaryColor: pickString(
      storefrontSettings.secondaryColor,
      operationsTheme.secondaryColor
    ) || DEFAULT_SECONDARY_COLOR,
    tagline: pickString(
      storefrontSettings.tagline,
      operationsTheme.tagline
    ),
    heroImage: pickString(
      storefrontSettings.heroImage,
      storefrontSettings.heroBackground,
      operationsTheme.heroImage,
      property?.coverPhoto
    ),
    aboutHeading: pickString(
      storefrontSettings.aboutHeading,
      operationsTheme.aboutHeading
    ),
    aboutText: pickString(
      storefrontSettings.aboutText,
      operationsTheme.aboutText
    ),
    aboutImage: pickString(
      storefrontSettings.aboutImage,
      operationsTheme.aboutImage
    ),
    logoImage: pickString(
      storefrontSettings.logoImage,
      operationsTheme.logoImage,
      property?.logoImage
    ),
    navbarStyle: pickString(
      storefrontSettings.navbarStyle,
      operationsTheme.navbarStyle
    ) || 'auto',
    amenities: Array.isArray(storefrontSettings.amenities)
      ? storefrontSettings.amenities
      : (Array.isArray(operationsTheme.amenities)
          ? operationsTheme.amenities
          : (Array.isArray(property?.amenities) ? property.amenities : []))
  };
}

export default function StorefrontStudio() {
  const iframeRef = useRef(null);
  const [properties, setProperties] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Modals State
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const [isAmenitiesModalOpen, setIsAmenitiesModalOpen] = useState(false);

  // Device Mode: 'desktop', 'tablet', 'mobile'
  const [deviceMode, setDeviceMode] = useState('desktop');

  // Customizer State
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Accordion Section Toggle State
  const [openSections, setOpenSections] = useState(DEFAULT_OPEN_SECTIONS);

  // Automatically sync live customizer changes with iframe preview
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'STOREFRONT_PREVIEW_UPDATE',
        themeConfig: formData
      }, window.location.origin);
    }
  }, [formData]);

  // Listen for visual click-to-edit interactions from the live canvas iframe (Wix-style)
  useEffect(() => {
    const handleIframeMessage = (event) => {
      // Validate origin to reject cross-origin spoofing
      if (event.origin !== window.location.origin) return;

      if (event.data && event.data.type === 'STOREFRONT_SECTION_SELECTED') {
        const { section } = event.data;
        if (section === 'amenities') {
          setIsAmenitiesModalOpen(true);
        } else if (section === 'about') {
          setIsAboutModalOpen(true);
        } else if (section === 'hero') {
          setIsHeroModalOpen(true);
        } else if (section === 'navbar') {
          setOpenSections(prev => ({ ...prev, header: true }));
          const el = document.getElementById('sfs-section-header');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    window.addEventListener('message', handleIframeMessage);
    return () => window.removeEventListener('message', handleIframeMessage);
  }, []);

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Load user properties on mount
  useEffect(() => {
    setIsLoading(true);
    fetchProperties().then(propsList => {
      setProperties(propsList || []);
      if (propsList && propsList.length > 0) {
        setSelectedPropertyId(String(propsList[0].id));
        loadPropertyTheme(propsList[0]);
      }
      setIsLoading(false);
    }).catch(err => {
      console.error("Storefront Studio properties load error:", err);
      setIsLoading(false);
    });
  }, []);

  const handlePropertySelect = (propId) => {
    setSelectedPropertyId(propId);
    const targetProp = properties.find(p => String(p.id) === String(propId));
    if (targetProp) {
      loadPropertyTheme(targetProp);
    }
  };

  const loadPropertyTheme = async (prop) => {
    if (!prop?.id) return;

    const operations =
      typeof prop.operations === 'string'
        ? (() => {
            try {
              return JSON.parse(prop.operations);
            } catch {
              return {};
            }
          })()
        : prop.operations || {};

    const operationsTheme = parseOperationsTheme(operations);

    try {
      const storefrontSettings = await fetchOwnerStorefrontSettings(prop.id);

      setFormData(
        buildFormData(prop, operationsTheme, storefrontSettings || {})
      );

      return;
    } catch (error) {
      console.warn(
        'Could not load dedicated storefront settings:',
        error
      );
    }

    setFormData(buildFormData(prop, operationsTheme));
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePresetSelect = (presetKey) => {
    const colors = PRESET_COLORS[presetKey] || PRESET_COLORS[DEFAULT_PRESET];
    setFormData(prev => ({
      ...prev,
      preset: presetKey,
      ...colors
    }));
  };

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Logo file size exceeds 5MB limit. Please select a smaller image.");
      return;
    }

    setIsUploadingLogo(true);
    let uploadedUrl = "";

    if (selectedPropertyId) {
      try {
        const bodyData = new FormData();
        bodyData.append("file", file);
        const token = localStorage.getItem("token") || "";

        let res = await fetch(`${API_BASE_URL}/properties/${selectedPropertyId}/storefront-settings/upload-image`, {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: bodyData
        });

        if (!res.ok) {
          res = await fetch(`${API_BASE_URL}/public/storefront-settings/upload-image`, {
            method: "POST",
            body: bodyData
          });
        }

        if (res.ok) {
          const data = await res.json();
          if (data && data.url) {
            uploadedUrl = data.url;
          }
        }
      } catch (err) {
        console.warn("Backend logo upload failed, using Data URL fallback:", err);
      }
    }

    if (uploadedUrl) {
      handleChange("logoImage", uploadedUrl);
      toast.success("Logo uploaded successfully!");
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleChange("logoImage", reader.result);
        toast.success("Logo uploaded!");
      };
      reader.readAsDataURL(file);
    }

    setIsUploadingLogo(false);
  };

  const handleLogoRemove = () => {
    handleChange("logoImage", "");
    toast.info("Logo removed. Using default property name symbol.");
  };

  const handleSaveConfig = async () => {
    if (!selectedPropertyId) return;
    setIsSaving(true);
    try {
      await saveOwnerStorefrontSettings(selectedPropertyId, {
        propertyId: selectedPropertyId,
        subdomain: formData.subdomain,
        template: formData.template,
        preset: formData.preset,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        tagline: formData.tagline,
        heroImage: formData.heroImage,
        aboutHeading: formData.aboutHeading,
        aboutText: formData.aboutText,
        aboutImage: formData.aboutImage,
        amenities: formData.amenities,
        logoImage: formData.logoImage,
        navbarStyle: formData.navbarStyle || 'auto'
      });

      toast.success("Storefront settings published successfully to database!");
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to publish storefront settings: " + (err.message || "Unknown error"));
    } finally {
      setIsSaving(false);
    }
  };

  const publicStorefrontUrl = formData.subdomain
    ? getStorefrontUrl(formData.subdomain)
    : '';

  const copyStorefrontLink = async () => {
    if (!publicStorefrontUrl) return;

    try {
      await navigator.clipboard.writeText(publicStorefrontUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.warn('Could not copy storefront URL:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="sfs-wrapper sfs-loading-wrapper">
  <div className="sfs-loading-text">
    <span className="sfs-loading-spinner"></span>
    <span>Loading Storefront Studio...</span>
  </div>
</div>
    );
  }

  const getFrameClass = () => {
    if (deviceMode === 'mobile') return 'sfs-browser-frame-mobile';
    if (deviceMode === 'tablet') return 'sfs-browser-frame-tablet';
    return 'sfs-browser-frame-desktop';
  };

  return (
    <div className="sfs-wrapper">
      {/* SHOPIFY STUDIO TOP BAR */}
      <div className="sfs-top-bar">
        <div className="sfs-brand-info">
          <select
            className="sfs-property-dropdown"
            value={selectedPropertyId}
            onChange={e => handlePropertySelect(e.target.value)}
          >
            {properties.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {publicStorefrontUrl && (
            <span className="sfs-status-dot">
              ● {publicStorefrontUrl.replace(/^https?:\/\//, '')}
            </span>
          )}
        </div>

        {/* DEVICE MODE SWITCHER */}
        <div className="sfs-device-switcher">
          <button
            className={`sfs-device-tab ${deviceMode === 'desktop' ? 'active' : ''}`}
            onClick={() => setDeviceMode('desktop')}
          >
            <FiMonitor /> Desktop
          </button>
          <button
            className={`sfs-device-tab ${deviceMode === 'tablet' ? 'active' : ''}`}
            onClick={() => setDeviceMode('tablet')}
          >
            <FiTablet /> Tablet
          </button>
          <button
            className={`sfs-device-tab ${deviceMode === 'mobile' ? 'active' : ''}`}
            onClick={() => setDeviceMode('mobile')}
          >
            <FiSmartphone /> Mobile
          </button>
        </div>

        {/* ACTIONS */}
        <div className="sfs-top-actions">
          <button className="sfs-btn-ghost" onClick={copyStorefrontLink}>
            {copiedLink ? <FiCheck className="sfs-icon-success" /> : <FiCopy />}
            {copiedLink ? 'Copied!' : 'Copy URL'}
          </button>
          <button
            className="sfs-btn-ghost"
            onClick={() => publicStorefrontUrl && window.open(publicStorefrontUrl, '_blank')}
            disabled={!publicStorefrontUrl}
          >
            <FiExternalLink /> View Website
          </button>
          <button className="sfs-btn-primary" onClick={handleSaveConfig} disabled={isSaving}>
            <FiSave /> {isSaving ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>

      {/* SHOPIFY STUDIO WORKSPACE BODY */}
      <div className="sfs-studio-body">
        {/* LEFT SIDEBAR EDITOR PANEL (SHOPIFY POLARIS MINIMALIST) */}
        <div className="sfs-sidebar-panel">
          <div className="sfs-panel-header">
            <div>
              <h3 className="sfs-panel-title">Theme Customizer</h3>
              <p className="sfs-panel-subtitle">Layout, branding & custom domain</p>
            </div>
            <span className="sfs-version-tag">V2.0</span>
          </div>

          <div className="sfs-panel-scrollable">
            {/* ACCORDION 1: THEME TEMPLATE */}
            <div className={`sfs-accordion-section ${openSections.branding ? 'open' : ''}`}>
              <div className="sfs-accordion-head" onClick={() => toggleSection('branding')}>
                <span className="sfs-accordion-title">
                  <FiLayers className="sfs-acc-icon" /> Theme Template &amp; Style
                </span>
                {openSections.branding ? <FiChevronUp className="sfs-chevron-icon" /> : <FiChevronDown className="sfs-chevron-icon" />}
              </div>

              {openSections.branding && (
                <div className="sfs-accordion-body">
                  <div className="sfs-field-group">
                    <label className="sfs-input-label">Layout &amp; Typography</label>
                    <select
                      className="sfs-input-field"
                      value={formData.template}
                      onChange={e => handleChange('template', e.target.value)}
                    >
                      <option value="minimalist">Minimalist Poster (Playfair 700, 0px Sharp Borders)</option>
                      <option value="resort">Resort &amp; Villa (Cormorant Garamond, 12px Soft Rounded)</option>
                      <option value="luxury">Classic Luxury (Playfair Display, Gold Accents, 4px Borders)</option>
                      <option value="modern">Modern Urban (Inter Bold, Geometric Grid, 6px Radius)</option>
                    </select>
                    <small className="sfs-help-text-sm">
                      Select layout geometry, typography pairing, and corner radius.
                    </small>
                  </div>
                </div>
              )}
            </div>

            {/* ACCORDION 2: HEADER & BRAND LOGO */}
            <div className={`sfs-accordion-section ${openSections.header ? 'open' : ''}`} id="sfs-section-header">
              <div className="sfs-accordion-head" onClick={() => toggleSection('header')}>
                <span className="sfs-accordion-title">
                  <FiImage className="sfs-acc-icon" /> Header &amp; Brand Logo
                </span>
                {openSections.header ? <FiChevronUp className="sfs-chevron-icon" /> : <FiChevronDown className="sfs-chevron-icon" />}
              </div>

              {openSections.header && (
                <div className="sfs-accordion-body">
                  {/* BRAND LOGO UPLOAD */}
                  <div className="sfs-field-group">
                    <label className="sfs-input-label">Property Brand Logo</label>
                    {formData.logoImage ? (
                      <div className="sfs-logo-preview-card">
                        <img 
                          src={normalizeImageUrl(formData.logoImage)} 
                          alt="Brand Logo" 
                          className="sfs-logo-preview-img" 
                        />
                        <button 
                          type="button" 
                          className="sfs-logo-remove-btn" 
                          onClick={handleLogoRemove}
                        >
                          <FiTrash2 /> Remove
                        </button>
                      </div>
                    ) : (
                      <div className="sfs-file-upload-box">
                        <input
                          type="file"
                          accept="image/*"
                          className="sfs-file-input"
                          id="logo-upload-input"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo}
                        />
                        <label htmlFor="logo-upload-input" className="sfs-file-label">
                          <FiUploadCloud className="sfs-upload-icon" />
                          <span>{isUploadingLogo ? 'Uploading Logo...' : 'Upload Brand Logo (PNG, SVG, JPG)'}</span>
                        </label>
                      </div>
                    )}
                    <small className="sfs-help-text-sm">
                      {formData.logoImage 
                        ? 'Logo active. Smart Logic automatically matches it with a clean white header.' 
                        : 'Upload your own logo, or leave empty to use the default name and letter badge.'}
                    </small>
                  </div>

                  {/* HEADER STYLE / LOGIC MACHINE */}
                  <div className="sfs-field-group" style={{ marginTop: '8px' }}>
                    <label className="sfs-input-label">Website Header Style (Logic Machine)</label>
                    <select
                      className="sfs-input-field"
                      value={formData.navbarStyle || 'auto'}
                      onChange={e => handleChange('navbarStyle', e.target.value)}
                    >
                      <option value="auto">Smart Auto Match (White if logo uploaded, Transparent if text)</option>
                      <option value="transparent">Clean Transparent Background (Floats over hero, white texts &amp; logo)</option>
                      <option value="solid_white">White Complete Background (Black texts &amp; theme button)</option>
                    </select>
                    <small className="sfs-help-text-sm">
                      In Smart Auto mode, custom logos get a crisp white background with black menu texts and theme-colored button. Default text badges get clean seamless transparency over the hero image.
                    </small>
                  </div>
                </div>
              )}
            </div>

            {/* ACCORDION 2: BRAND THEME COLORS */}
            <div className={`sfs-accordion-section ${openSections.colors ? 'open' : ''}`} id="sfs-section-colors">
              <div className="sfs-accordion-head" onClick={() => toggleSection('colors')}>
                <span className="sfs-accordion-title">
                  <FiDroplet className="sfs-acc-icon" /> Brand Colors
                </span>
                {openSections.colors ? <FiChevronUp className="sfs-chevron-icon" /> : <FiChevronDown className="sfs-chevron-icon" />}
              </div>

              {openSections.colors && (
                <div className="sfs-accordion-body">
                  <div className="sfs-field-group">
                    <label className="sfs-input-label">Color Presets</label>
                    <div className="sfs-preset-grid">
                      {Object.keys(PRESET_COLORS).map(k => {
                        const presetData = PRESET_COLORS[k];
                        const isSelected = formData.preset === k;
                        const label = k.charAt(0).toUpperCase() + k.slice(1);
                        return (
                          <button
                            key={k}
                            type="button"
                            className={`sfs-color-preset-pill ${isSelected ? 'active' : ''}`}
                            onClick={() => handlePresetSelect(k)}
                          >
                            <div className="sfs-preset-dots-pair">
                              <span className="sfs-preset-dot" style={{ backgroundColor: presetData.primaryColor }} />
                              <span className="sfs-preset-dot accent" style={{ backgroundColor: presetData.secondaryColor }} />
                            </div>
                            <span className="sfs-preset-name">{label}</span>
                            {isSelected && <FiCheck className="sfs-preset-check" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="sfs-field-group">
                    <label className="sfs-input-label">Primary Brand Color</label>
                    <div className="sfs-color-picker-group">
                      <label className="sfs-color-swatch-btn" style={{ backgroundColor: formData.primaryColor }}>
                        <input
                          type="color"
                          className="sfs-color-input-hidden"
                          value={formData.primaryColor}
                          onChange={e => handleChange('primaryColor', e.target.value)}
                        />
                      </label>
                      <input
                        type="text"
                        className="sfs-color-hex-input"
                        value={formData.primaryColor}
                        onChange={e => handleChange('primaryColor', e.target.value)}
                        placeholder="#111827"
                        maxLength={7}
                      />
                    </div>
                  </div>

                  <div className="sfs-field-group">
                    <label className="sfs-input-label">Secondary Accent Color</label>
                    <div className="sfs-color-picker-group">
                      <label className="sfs-color-swatch-btn" style={{ backgroundColor: formData.secondaryColor }}>
                        <input
                          type="color"
                          className="sfs-color-input-hidden"
                          value={formData.secondaryColor}
                          onChange={e => handleChange('secondaryColor', e.target.value)}
                        />
                      </label>
                      <input
                        type="text"
                        className="sfs-color-hex-input"
                        value={formData.secondaryColor}
                        onChange={e => handleChange('secondaryColor', e.target.value)}
                        placeholder="#C5A059"
                        maxLength={7}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ACCORDION 3: SUBDOMAIN & SLUG */}
            <div className={`sfs-accordion-section ${openSections.domain ? 'open' : ''}`} id="sfs-section-domain">
              <div className="sfs-accordion-head" onClick={() => toggleSection('domain')}>
                <span className="sfs-accordion-title">
                  <FiGlobe className="sfs-acc-icon" /> Custom Subdomain
                </span>
                {openSections.domain ? <FiChevronUp className="sfs-chevron-icon" /> : <FiChevronDown className="sfs-chevron-icon" />}
              </div>

              {openSections.domain && (
                <div className="sfs-accordion-body">
                  <div className="sfs-field-group">
                    <label className="sfs-input-label">Subdomain Slug</label>
                    <div className="sfs-subdomain-input-group">
                      <input
                        type="text"
                        className="sfs-subdomain-field"
                        value={formData.subdomain}
                        onChange={e => handleChange('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        placeholder="srinature"
                      />
                      <span className="sfs-subdomain-addon">.stayops.in</span>
                    </div>
                    <small className="sfs-help-text-sm">
                      Public store URL: <span className="sfs-subdomain-highlight">{formData.subdomain || 'property'}.stayops.in</span>
                    </small>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PINNED BOTTOM FOOTER ACTION (NEVER CUT OFF) */}
          <div className="sfs-panel-footer">
            <button
              onClick={handleSaveConfig}
              disabled={isSaving}
              className="sfs-btn-save-primary"
            >
              <FiSave /> {isSaving ? 'Saving changes...' : 'Save & publish'}
            </button>
          </div>
        </div>

        {/* RIGHT LIVE WORKSPACE CANVAS */}
        <div className="sfs-canvas-workspace">
          <div className={`sfs-browser-frame ${getFrameClass()}`}>
            {/* BROWSER CHROME BAR */}
            <div className="sfs-browser-header">
              <div className="sfs-browser-dots">
                <div className="sfs-dot sfs-dot-red" />
                <div className="sfs-dot sfs-dot-yellow" />
                <div className="sfs-dot sfs-dot-green" />
              </div>
              <div className="sfs-browser-url-bar">
                <FiLock className="sfs-lock-icon" /> https://{formData.subdomain || 'property'}.stayops.in
              </div>
            </div>

            {/* BROWSER CANVAS CONTENT */}
            <div className="sfs-browser-content">
              <iframe
                ref={iframeRef}
                src={selectedPropertyId ? `/storefront/${selectedPropertyId}?editor=true` : 'about:blank'}
                title="Storefront Live Preview"
                className="sfs-preview-iframe"
                onLoad={() => {
                  if (iframeRef.current && iframeRef.current.contentWindow) {
                    iframeRef.current.contentWindow.postMessage({
                      type: 'STOREFRONT_PREVIEW_UPDATE',
                      themeConfig: formData
                    }, window.location.origin);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
      {/* HERO SECTION EDIT MODAL */}
      <StorefrontHeroModal
        isOpen={isHeroModalOpen}
        onClose={() => setIsHeroModalOpen(false)}
        formData={formData}
        onSave={(updated) => setFormData(prev => ({ ...prev, ...updated }))}
        selectedPropertyId={selectedPropertyId}
      />

      {/* ABOUT SECTION EDIT MODAL */}
      <StorefrontAboutModal
        isOpen={isAboutModalOpen}
        onClose={() => setIsAboutModalOpen(false)}
        formData={formData}
        onSave={(updated) => setFormData(prev => ({ ...prev, ...updated }))}
        selectedPropertyId={selectedPropertyId}
      />

      {/* AMENITIES LIBRARY MODAL */}
      <StorefrontAmenitiesModal
        isOpen={isAmenitiesModalOpen}
        onClose={() => setIsAmenitiesModalOpen(false)}
        selectedAmenities={formData.amenities || []}
        onSave={(newAmenities) => handleChange('amenities', newAmenities)}
      />
    </div>
  );
}
