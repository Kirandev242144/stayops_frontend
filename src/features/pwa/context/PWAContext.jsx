import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { isStandalone, isIOS, isMobile, isOnline } from '../utils/platform';
import { registerServiceWorker, setupControllerChangeListener } from '../utils/pwaRegistration';

export const PWAContext = createContext(null);

export function PWAProvider({ children }) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isMobileDevice, setIsMobileDevice] = useState(false);
  const [onlineStatus, setOnlineStatus] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isBannerMinimized, setIsBannerMinimized] = useState(false);
  const [showAndroidTip, setShowAndroidTip] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const deferredPromptRef = useRef(null);
  const waitingWorkerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Synchronize initial platform states
    setIsInstalled(isStandalone());
    setIsAppleDevice(isIOS());
    setIsMobileDevice(isMobile());
    setOnlineStatus(isOnline());

    // Clear any obsolete localStorage lockout from previous testing
    try {
      localStorage.removeItem('stayops_pwa_dismiss_until');
    } catch {
      /* ignore */
    }

    // 2. Hook up network connectivity listeners
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 3. Check for early-captured beforeinstallprompt (captured in index.html head)
    if (window.__stayops_deferred_prompt) {
      deferredPromptRef.current = window.__stayops_deferred_prompt;
      setIsInstallable(true);
    }

    const handleEarlyPrompt = () => {
      if (window.__stayops_deferred_prompt) {
        deferredPromptRef.current = window.__stayops_deferred_prompt;
        setIsInstallable(true);
      }
    };
    window.addEventListener('stayops-prompt-captured', handleEarlyPrompt);

    // 4. Listen for runtime beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      // Calling e.preventDefault() is required per spec to capture and defer the install prompt
      e.preventDefault();
      deferredPromptRef.current = e;
      window.__stayops_deferred_prompt = e;
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 5. Listen for successful app installation
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      deferredPromptRef.current = null;
      window.__stayops_deferred_prompt = null;
      setInstallSuccess(true);
      setTimeout(() => setIsBannerMinimized(true), 2500);
    };
    window.addEventListener('appinstalled', handleAppInstalled);

    // 6. Register Service Worker & setup hot reload on skipWaiting
    registerServiceWorker({
      onUpdate: (worker) => {
        waitingWorkerRef.current = worker;
        setUpdateAvailable(true);
      }
    });
    setupControllerChangeListener();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('stayops-prompt-captured', handleEarlyPrompt);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Trigger browser install prompt
  const promptInstall = useCallback(async () => {
    const promptEvent = deferredPromptRef.current || (typeof window !== 'undefined' ? window.__stayops_deferred_prompt : null);
    if (!promptEvent) {
      setShowAndroidTip(true);
      return false;
    }

    try {
      await promptEvent.prompt();
      const choiceResult = await promptEvent.userChoice;
      deferredPromptRef.current = null;
      if (typeof window !== 'undefined') window.__stayops_deferred_prompt = null;
      setIsInstallable(false);
      if (choiceResult.outcome === 'accepted') {
        setInstallSuccess(true);
        setTimeout(() => setIsBannerMinimized(true), 2500);
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[StayOps PWA] Prompt install error:', err);
      setShowAndroidTip(true);
      return false;
    }
  }, []);

  // Apply new app version update
  const applyUpdate = useCallback(() => {
    if (waitingWorkerRef.current) {
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    }
  }, []);

  const minimizeBanner = useCallback(() => {
    setIsBannerMinimized(true);
  }, []);

  const restoreBanner = useCallback(() => {
    setIsBannerMinimized(false);
  }, []);

  const contextValue = {
    isInstallable,
    isInstalled,
    isIOS: isAppleDevice,
    isMobile: isMobileDevice,
    isOnline: onlineStatus,
    updateAvailable,
    isBannerMinimized,
    showAndroidTip,
    installSuccess,
    promptInstall,
    applyUpdate,
    minimizeBanner,
    restoreBanner,
    setShowAndroidTip
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  );
}

export function usePWAContext() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within a PWAProvider');
  }
  return context;
}
