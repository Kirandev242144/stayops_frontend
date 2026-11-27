/**
 * StayOps PWA Feature Module
 * Central exports for Context, Hooks, and UI components.
 */

export { PWAContext, PWAProvider, usePWAContext } from './context/PWAContext';
export { usePWA } from './hooks/usePWA';
export { default as PWAInstallBanner } from './components/PWAInstallBanner';
export { default as PWAInstallButton } from './components/PWAInstallButton';
export { default as PWAMinimizedPill } from './components/PWAMinimizedPill';
export { default as PWAIosGuideModal } from './components/PWAIosGuideModal';
export { default as PWAUpdateToast } from './components/PWAUpdateToast';
export { isStandalone, isIOS, isMobile, isOnline } from './utils/platform';
