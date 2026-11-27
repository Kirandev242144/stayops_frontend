import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiTrash2, FiInfo, FiUploadCloud } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
import { normalizeImageUrl } from '../../Storefront/storefrontApi';

export default function StorefrontAboutModal({
  isOpen,
  onClose,
  formData,
  onSave,
  selectedPropertyId
}) {
  const [localHeading, setLocalHeading] = useState('');
  const [localText, setLocalText] = useState('');
  const [localImage, setLocalImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen && formData) {
      setLocalHeading(formData.aboutHeading || '');
      setLocalText(formData.aboutText || '');
      setLocalImage(formData.aboutImage || '');
    }
  }, [isOpen, formData]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.warning("File size exceeds 8MB limit. Please select a smaller image.");
      return;
    }

    setIsUploading(true);
    let uploadedUrl = "";
    if (selectedPropertyId) {
      try {
        const bodyData = new FormData();
        bodyData.append("file", file);
        const token = localStorage.getItem("token") || "";
        const authHeader = token ? (token.startsWith("Bearer ") ? token : `Bearer ${token}`) : "";

        // First attempt authenticated property owner upload
        let res = await fetch(`${API_BASE_URL}/properties/${selectedPropertyId}/storefront-settings/upload-image`, {
          method: "POST",
          headers: authHeader ? { Authorization: authHeader } : {},
          body: bodyData
        });

        // Fallback to public endpoint if unauthenticated
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
        console.warn("Backend photo upload failed, using Data URL fallback:", err);
      }
    }

    if (uploadedUrl) {
      setLocalImage(uploadedUrl);
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
    setIsUploading(false);
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      aboutHeading: localHeading,
      aboutText: localText,
      aboutImage: localImage
    });
    onClose();
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="sfs-modal-overlay" 
      onMouseDown={handleOverlayMouseDown}
      onClick={handleOverlayMouseDown}
    >
      <div className="sfs-modal-card" onClick={e => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="sfs-modal-header">
          <div className="sfs-modal-title-group">
            <FiInfo className="sfs-modal-header-icon" />
            <div>
              <h3 className="sfs-modal-title">Edit About Section & Property Story</h3>
              <p className="sfs-modal-subtitle">Configure custom SEO heading, story narrative, and dedicated image.</p>
            </div>
          </div>
          <button 
            type="button" 
            className="sfs-modal-close-btn" 
            onClick={onClose} 
            aria-label="Close modal"
          >
            <FiX />
          </button>
        </div>

        {/* MODAL BODY */}
        <form onSubmit={handleSubmit} className="sfs-modal-body">
          <div className="sfs-form-group">
            <label className="sfs-input-label">ABOUT SECTION HEADING</label>
            <input
              type="text"
              className="sfs-input-field"
              value={localHeading}
              onChange={e => setLocalHeading(e.target.value)}
              placeholder="e.g. Discover Sri Nature Resort"
            />
            <small className="sfs-help-text-sm">
              Custom heading displayed above the story text (defaults to "Discover [Property Name]").
            </small>
          </div>

          <div className="sfs-form-group">
            <label className="sfs-input-label">PROPERTY STORY / ABOUT NARRATIVE</label>
            <textarea
              rows={5}
              className="sfs-input-field"
              value={localText}
              onChange={e => setLocalText(e.target.value)}
              placeholder="Enter custom property story for SEO and guest engagement..."
            />
            <small className="sfs-help-text-sm">
              Custom description text describing your location, hospitality, and amenities.
            </small>
          </div>

          <div className="sfs-form-group">
            <label className="sfs-input-label">UPLOAD CUSTOM ABOUT IMAGE</label>
            <div className="sfs-file-upload-box">
              <input
                type="file"
                accept="image/*"
                className="sfs-file-input"
                id="about-image-upload"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label htmlFor="about-image-upload" className="sfs-file-label">
                <FiUploadCloud className="sfs-upload-icon" />
                <span>{isUploading ? 'Uploading Image...' : 'Choose Image File (max 8MB)'}</span>
              </label>
            </div>
          </div>

          <div className="sfs-form-group">
            <label className="sfs-input-label">OR IMAGE URL</label>
            <input
              type="text"
              className="sfs-input-field"
              value={localImage}
              onChange={e => setLocalImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
            <small className="sfs-help-text-sm">
              Leave empty to automatically fetch room/gallery photos.
            </small>
          </div>

          {localImage && (
            <div className="sfs-hero-preview-container">
              <label className="sfs-input-label">CURRENT IMAGE PREVIEW</label>
              <div className="sfs-hero-preview-box">
                <img src={normalizeImageUrl(localImage)} alt="About Section Preview" className="sfs-hero-preview-img" />
                <button
                  type="button"
                  className="sfs-btn-remove-hero"
                  onClick={() => setLocalImage('')}
                >
                  <FiTrash2 /> Revert to Auto Room Photo
                </button>
              </div>
            </div>
          )}

          {/* MODAL FOOTER ACTIONS */}
          <div className="sfs-modal-footer">
            <button type="button" className="sfs-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="sfs-btn-primary">
              <FiCheck /> Apply Story Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
