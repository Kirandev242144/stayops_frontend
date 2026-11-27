import React from 'react';
import { FiDownload, FiX, FiMoreVertical, FiCheckCircle } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';
import PWAMinimizedPill from './PWAMinimizedPill';
import PWAIosGuideModal from './PWAIosGuideModal';
import PWAUpdateToast from './PWAUpdateToast';
import './pwa.css';

export default function PWAInstallBanner() {
  const {
    isInstalled,
    isInstallable,
    isIOS,
    updateAvailable,
    isBannerMinimized,
    showAndroidTip,
    installSuccess,
    promptInstall,
    minimizeBanner
  } = usePWA();

  // 1. Version Update Notification
  if (updateAvailable) {
    return <PWAUpdateToast />;
  }

  // 2. Hide completely if app is ALREADY running as an installed standalone PWA
  if (isInstalled) {
    return null;
  }

  // 3. Minimized floating pill (if user minimized it earlier)
  if (isBannerMinimized) {
    return <PWAMinimizedPill />;
  }

  // 4. iOS Safari Guidance (iOS does not fire beforeinstallprompt; uses manual Share -> Add to Home Screen)
  if (isIOS) {
    return <PWAIosGuideModal />;
  }

  // 5. Success state
  if (installSuccess) {
    return (
      <div className="stayops-pwa-banner-container" role="status">
        <div className="stayops-pwa-card" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
          <div className="stayops-pwa-left">
            <FiCheckCircle size={22} color="#16a34a" />
            <div className="stayops-pwa-info">
              <span className="stayops-pwa-title" style={{ color: '#15803d' }}>Installing StayOps...</span>
              <span className="stayops-pwa-sub">Check your phone home screen or app drawer!</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 6. Android / Chrome / Desktop Card - ONLY display when browser has fired beforeinstallprompt
  if (!isInstallable) {
    return null;
  }

  return (
    <div className="stayops-pwa-banner-container" role="region" aria-label="App Installation Prompt">
      <div className="stayops-pwa-card">
        <div className="stayops-pwa-card-row">
          <div className="stayops-pwa-left">
            <img
              src="/icons/icon-192.png"
              alt="StayOps App"
              className="stayops-pwa-app-icon"
            />
            <div className="stayops-pwa-info">
              <span className="stayops-pwa-title">Install StayOps App</span>
              <span className="stayops-pwa-sub">1-tap fullscreen app for property owners</span>
            </div>
          </div>

          <div className="stayops-pwa-actions">
            <button
              type="button"
              className="stayops-pwa-btn-install"
              onClick={promptInstall}
            >
              <FiDownload size={13} />
              <span>Install</span>
            </button>
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
        </div>

        {/* Fallback tip if Chrome requires user to select manual install */}
        {showAndroidTip && (
          <div className="stayops-pwa-step-box">
            <div style={{ fontWeight: 600, marginBottom: 4, color: '#0f172a' }}>To install right now in Chrome:</div>
            <div>1. Tap Chrome&apos;s <FiMoreVertical size={13} style={{ display: 'inline', verticalAlign: '-2px' }} /> <strong>3-dot menu</strong> at top-right</div>
            <div>2. Select <strong>Install app</strong> or <strong>Add to Home screen</strong></div>
          </div>
        )}
      </div>
    </div>
  );
}
