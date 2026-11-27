import React from 'react';
import { FiX, FiShare, FiPlusSquare } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';
import './pwa.css';

export default function PWAIosGuideModal() {
  const { minimizeBanner } = usePWA();

  return (
    <div className="stayops-pwa-banner-container" role="region" aria-label="iOS Installation Guide">
      <div className="stayops-pwa-card">
        <div className="stayops-pwa-card-row">
          <div className="stayops-pwa-left">
            <img
              src="/icons/apple-touch-icon.png"
              alt="StayOps"
              className="stayops-pwa-app-icon"
            />
            <div className="stayops-pwa-info">
              <span className="stayops-pwa-title">Install StayOps on iPhone</span>
              <span className="stayops-pwa-sub">Run as a fullscreen app without browser bars</span>
            </div>
          </div>
          <button
            type="button"
            className="stayops-pwa-btn-close"
            onClick={minimizeBanner}
            title="Minimize"
            aria-label="Minimize install banner"
          >
            <FiX size={16} />
          </button>
        </div>

        <div className="stayops-pwa-step-box">
          Tap Safari&apos;s <FiShare size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> <strong>Share button</strong> below, then select <FiPlusSquare size={12} style={{ display: 'inline', verticalAlign: '-1px' }} /> <strong>Add to Home Screen</strong>.
        </div>
      </div>
    </div>
  );
}
