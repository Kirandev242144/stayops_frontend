import React from 'react';
import { FiRefreshCw } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';
import './pwa.css';

export default function PWAUpdateToast() {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div className="stayops-pwa-banner-container" role="alert">
      <div className="stayops-pwa-update-pill" onClick={applyUpdate}>
        <FiRefreshCw size={14} className="spin" />
        <span>New StayOps version available</span>
        <button type="button" className="stayops-pwa-update-reload-btn">
          Update Now
        </button>
      </div>
    </div>
  );
}
