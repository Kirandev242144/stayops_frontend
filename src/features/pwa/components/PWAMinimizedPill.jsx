import React from 'react';
import { FiSmartphone } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';
import './pwa.css';

export default function PWAMinimizedPill() {
  const { restoreBanner, isInstalled, isInstallable, isIOS } = usePWA();

  // Only render if app is not installed AND browser supports installation (prompt ready or iOS)
  if (isInstalled || (!isInstallable && !isIOS)) return null;

  return (
    <button
      type="button"
      className="stayops-pwa-minimized-pill"
      onClick={restoreBanner}
      title="Install StayOps App"
      aria-label="Install StayOps App"
    >
      <FiSmartphone size={15} />
      <span>Install App</span>
    </button>
  );
}
