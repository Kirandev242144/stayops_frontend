import React from 'react';
import { FiSmartphone, FiDownload } from 'react-icons/fi';
import { usePWA } from '../hooks/usePWA';
import './pwa.css';

export default function PWAInstallButton({
  variant = 'nav',
  label = 'Install App',
  showIcon = true,
  className = '',
  style = {}
}) {
  const { isInstalled, isInstallable, promptInstall } = usePWA();

  // Only render if app is not installed AND browser has deemed it installable (prompt is ready)
  if (isInstalled || !isInstallable) return null;

  const handleClick = (e) => {
    e.stopPropagation();
    promptInstall();
  };

  const Icon = variant === 'chip' ? FiDownload : FiSmartphone;
  const variantClass = variant === 'nav' ? 'stayops-pwa-btn-nav' : (variant === 'chip' ? 'stayops-pwa-btn-chip' : 'stayops-pwa-btn-install');

  return (
    <button
      type="button"
      className={`${variantClass} ${className}`.trim()}
      onClick={handleClick}
      style={style}
      title="Install StayOps App on your phone or desktop"
      aria-label="Install StayOps App"
    >
      {showIcon && <Icon size={14} />}
      <span>{label}</span>
    </button>
  );
}
