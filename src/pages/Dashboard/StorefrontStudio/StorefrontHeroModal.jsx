import React, { useState, useEffect } from 'react';
import { FiX, FiCheck, FiTrash2, FiImage, FiUploadCloud, FiType } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../../config/api';
import { normalizeImageUrl } from '../../Storefront/storefrontApi';

export default function StorefrontHeroModal({
  isOpen,
  onClose,
  formData,
  onSave,
  selectedPropertyId
}) {
  const [localTagline, setLocalTagline] = useState('');
  const [localImage, setLocalImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (isOpen && formData) {
      setLocalTagline(formData.tagline || '');
      setLocalImage(formData.heroImage || '');
    }
  }, [isOpen, formData]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      tagline: localTagline,
      heroImage: localImage
    });
    onClose();
  };

  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

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
            <FiImage className="sfs-modal-header-icon" />
            <div>
              <h3 className="sfs-modal-title">Edit Hero Banner & Headline</h3>
              <p className="sfs-modal-subtitle">Customize your property tagline and main full-width cover photo.</p>
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
            <label className="sfs-input-label">
              <FiType style={{ marginRight: 6 }} /> PROPERTY TAGLINE / HEADLINE
            </label>
            <textarea
              rows={2}
              className="sfs-input-field"
              value={localTagline}
              onChange={e => setLocalTagline(e.target.value)}
              placeholder="e.g. Several Cottages — One Host, Many Places to Stay"
            />
            <small className="sfs-help-text-sm">
              Displays prominently on the hero banner right below your property name.
            </small>
          </div>

          <div className="sfs-form-group">
            <label className="sfs-input-label">HERO COVER PHOTO</label>
            <div className="sfs-file-upload-box">
              <input
                type="file"
                accept="image/*"
                className="sfs-file-input"
                id="hero-image-upload"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label htmlFor="hero-image-upload" className="sfs-file-label">
                <FiUploadCloud className="sfs-upload-icon" />
                <span>{isUploading ? 'Uploading Image...' : 'Choose Cover Photo (max 8MB)'}</span>
              </label>
            </div>
          </div>

          <div className="sfs-form-group">
            <label className="sfs-input-label">OR PASTE EXTERNAL IMAGE URL</label>
            <input
              type="text"
              className="sfs-input-field"
              value={localImage}
              onChange={e => setLocalImage(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          {localImage && (
            <div className="sfs-hero-preview-container">
              <label className="sfs-input-label">CURRENT COVER PHOTO PREVIEW</label>
              <div className="sfs-hero-preview-box">
                <img
                  src={normalizeImageUrl(localImage)}
                  alt="Hero Preview"
                  className="sfs-hero-preview-img"
                />
                <button
                  type="button"
                  className="sfs-btn-remove-hero"
                  onClick={() => setLocalImage('')}
                >
                  <FiTrash2 /> Remove Photo
                </button>
              </div>
            </div>
          )}

          {/* MODAL FOOTER ACTIONS */}
          <div className="sfs-modal-footer">
            <button
              type="button"
              className="sfs-btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="sfs-btn-primary"
              disabled={isUploading}
            >
              <FiCheck /> Apply Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
