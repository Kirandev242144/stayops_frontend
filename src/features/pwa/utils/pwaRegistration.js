/**
 * Validates that the web manifest is linked, reachable via HTTP 200,
 * and contains all required W3C/Chromium fields for installability.
 */
export async function verifyManifest() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return { valid: false, reason: 'SSR environment' };
  }

  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (!manifestLink) {
    console.warn('[StayOps PWA] Missing <link rel="manifest"> in document head.');
    return { valid: false, reason: 'No manifest link found in DOM' };
  }

  const manifestUrl = manifestLink.getAttribute('href') || '/manifest.webmanifest';

  try {
    const res = await fetch(manifestUrl, { cache: 'no-cache' });
    if (!res.ok) {
      console.warn(`[StayOps PWA] Manifest fetch returned HTTP ${res.status}`);
      return { valid: false, reason: `HTTP ${res.status}` };
    }

    const json = await res.json();
    const hasName = Boolean(json.name || json.short_name);
    const hasIcons = Array.isArray(json.icons) && json.icons.length > 0;
    const hasStartUrl = Boolean(json.start_url);
    const hasDisplay = ['standalone', 'fullscreen', 'minimal-ui'].includes(json.display);

    const isValid = hasName && hasIcons && hasStartUrl && hasDisplay;
    if (!isValid) {
      console.warn('[StayOps PWA] Manifest missing required installability properties:', {
        hasName,
        hasIcons,
        hasStartUrl,
        hasDisplay
      });
      return { valid: false, reason: 'Missing required manifest fields', manifest: json };
    }

    return { valid: true, manifest: json };
  } catch (err) {
    console.warn('[StayOps PWA] Could not verify manifest:', err);
    return { valid: false, reason: err.message };
  }
}

/**
 * Standard native service worker registration without virtual plugin dependencies.
 * Works seamlessly in both Vite dev server and production builds.
 */
export function registerServiceWorker({ onUpdate, onInstall } = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  // Check manifest validity in background
  verifyManifest().then((result) => {
    if (!result.valid) {
      console.warn('[StayOps PWA] Installability warning: Manifest validation failed:', result.reason);
    }
  });

  try {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  if (onUpdate) onUpdate();
                } else {
                  if (onInstall) onInstall();
                }
              }
            });
          }
        });
      })
      .catch((err) => {
        // Non-blocking in dev mode or local environment
        console.info('[StayOps PWA] Service worker registration note:', err.message);
      });
  } catch (e) {
    console.warn('[StayOps PWA] Service worker register exception:', e);
  }

  return (reloadPage = true) => {
    if (reloadPage) window.location.reload();
  };
}

export function setupControllerChangeListener() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}
